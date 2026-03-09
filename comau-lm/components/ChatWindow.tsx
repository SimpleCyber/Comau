"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { chatService, Message, Chat } from "@/lib/chatService";

// Import modular components
import { ChatHeader } from "./chat/ChatHeader";
import { MessageList } from "./chat/MessageList";
import { ChatInput } from "./chat/ChatInput";
import { NewChatSplash } from "./chat/NewChatSplash";
import { ShareModal } from "./chat/ShareModal";

interface ChatWindowProps {
    chatId: string | null;
    onChatCreated: (chatId: string) => void;
}

export function ChatWindow({ chatId, onChatCreated }: ChatWindowProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);

    // Share modal state
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatId) {
            loadChatData(chatId);
        } else {
            setMessages([]);
            setChat(null);
        }
    }, [chatId]);

    const loadChatData = async (id: string) => {
        try {
            const activeChat = await chatService.getChat(id);
            const chatMessages = await chatService.getChatMessages(id);
            setChat(activeChat);
            setMessages(chatMessages);
        } catch (error) {
            console.error("Error loading chat data:", error);
        }
    };

    const scrollToBottom = () => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading || !user) return;

        const currentInput = input;
        setInput("");

        let currentChatId = chatId;

        // If chat exists, check if it's a group chat based on members, else default to false.
        const isGroup = chat ? (chat.members && chat.members.length > 1) : false;

        try {
            // 1. Create chat if it doesn't exist
            if (!currentChatId) {
                setLoading(true);
                // Creating inherently as personal until someone joins via link
                currentChatId = await chatService.createChat(user.uid, currentInput, "personal");
                onChatCreated(currentChatId);
                setChat({ id: currentChatId, type: "personal" } as any);
            }

            // 2. Add user message
            const userMessage: Message = {
                role: "user",
                content: currentInput,
                senderId: user.uid,
                senderName: user.displayName || "User",
                senderPhotoURL: user.photoURL || undefined
            };
            setMessages(prev => [...prev, userMessage]);
            await chatService.addMessage(currentChatId, "user", currentInput, user.uid, user.displayName || "User", user.photoURL || undefined);

            // 3. AI Invocation Logic
            // If it's a group chat, AI only responds if `@ai` is mentioned. If personal, always responds.
            const invokesAI = isGroup ? currentInput.toLowerCase().includes("@ai") : true;

            if (invokesAI) {
                setLoading(true);

                let requestMessages = [...messages, userMessage].map(m => ({
                    role: m.role,
                    content: m.role === "user" && m.senderName ? `[${m.senderName}]: ${m.content}` : m.content
                }));

                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: requestMessages,
                    }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to generate response");

                // 4. Add AI response
                const aiMessage: Message = { role: "model", content: data.text };
                setMessages(prev => [...prev, aiMessage]);
                await chatService.addMessage(currentChatId!, "model", data.text);
            }

        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                role: "model",
                content: `Error: ${error.message}. Please try again.`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyInviteLink = () => {
        if (!chatId) return;
        const link = `${window.location.origin}/?joinGroup=${chatId}`;
        navigator.clipboard.writeText(link);
        setCopiedLink(true);

        if (chat?.type === "personal") {
            chatService.joinGroupChat(chatId, user!.uid).catch(console.error);
        }

        setTimeout(() => setCopiedLink(false), 2000);
    };

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden h-screen font-sans">
            <ChatHeader
                chatId={chatId}
                onShare={() => setIsShareModalOpen(true)}
            />

            <main className="flex-1 overflow-y-auto w-full relative">
                {messages.length === 0 ? (
                    <NewChatSplash
                        input={input}
                        setInput={setInput}
                        onSend={handleSend}
                        loading={loading}
                    />
                ) : (
                    <MessageList
                        messages={messages}
                        loading={loading}
                        user={user}
                        chat={chat}
                        messagesEndRef={messagesEndRef}
                    />
                )}
            </main>

            {messages.length > 0 && (
                <footer className="p-4 md:px-6 md:pb-6 bg-white shrink-0">
                    <ChatInput
                        input={input}
                        setInput={setInput}
                        onSend={handleSend}
                        loading={loading}
                    />
                </footer>
            )}

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                chatId={chatId}
                onCopyLink={handleCopyInviteLink}
                copiedLink={copiedLink}
            />
        </div>
    );
}
