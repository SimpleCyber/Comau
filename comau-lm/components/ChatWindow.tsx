"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Send, User, Loader2, Share, MoreHorizontal, ChevronDown, Mic, AudioLines, Copy, Check, Users, X, Link, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chatService, Message, Chat } from "@/lib/chatService";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatWindowProps {
    chatId: string | null;
    onChatCreated: (chatId: string) => void;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const [copied, setCopied] = useState(false);
    const language = match ? match[1] : "";

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!inline && match) {
        return (
            <div className="rounded-xl overflow-hidden my-4 border border-gray-200">
                <div className="flex items-center justify-between px-4 py-2 bg-[#f9f9f9] border-b border-gray-200 text-gray-500 text-xs font-sans">
                    <div className="flex items-center gap-2 font-semibold">
                        <span className="opacity-70">{"< />"}</span>
                        {language.charAt(0).toUpperCase() + language.slice(1)}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 hover:text-gray-800 transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3" />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3" />
                                <span>Copy code</span>
                            </>
                        )}
                    </button>
                </div>
                <div className="overflow-x-auto p-4 bg-[#f9f9f9] text-sm font-mono text-gray-800">
                    <pre {...props}>{children}</pre>
                </div>
            </div>
        );
    }
    return (
        <code className="bg-gray-100 text-gray-800 rounded px-1.5 py-0.5 text-[13.5px] font-mono border border-gray-200" {...props}>
            {children}
        </code>
    );
};


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
                senderName: user.displayName || "User"
            };
            setMessages(prev => [...prev, userMessage]);
            await chatService.addMessage(currentChatId, "user", currentInput, user.uid, user.displayName || "User");

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

        // If it was personal, opening the share modal implicitly changes intent to group, 
        // but the DB handles it when someone actually joins. We don't strictly need to update 
        // type to 'group' immediately unless we want the UI indicator.
        if (chat?.type === "personal") {
            // Optional: immediately upgrade to group chat in DB so "Group chats" sidebar works instantly
            chatService.joinGroupChat(chatId, user!.uid).catch(console.error);
        }

        setTimeout(() => setCopiedLink(false), 2000);
    };

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden h-screen font-sans">
            {/* Header */}
            <header className="h-[60px] flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors gap-2">
                    <span className="text-lg font-bold text-gray-800 tracking-tight">
                        COMAU
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center gap-2">
                    {chatId && (
                        <button
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors mr-2 border border-blue-200"
                        >
                            <Share className="w-3.5 h-3.5" />
                            Share
                        </button>
                    )}
                </div>
            </header>

            {/* Messages or New Chat Splash */}
            <main className="flex-1 overflow-y-auto w-full relative">
                {messages.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center -mt-20 px-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-8">
                            <Image src="/logo.png" alt="COMAU Logo" width={40} height={40} className="object-contain" />
                        </div>
                        <h1 className="text-3xl md:text-4xl text-gray-900 font-bold mb-3 tracking-tight text-center">How can I help you today?</h1>
                        <p className="text-gray-500 text-base md:text-lg max-w-md text-center leading-relaxed">
                            Start a new conversation, drop some files, or ask COMAU a question below.
                        </p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex flex-col gap-1 items-start group ${message.role === "user" ? "items-end" : ""}`}
                            >
                                {message.role === "user" && chat?.members && chat.members.length > 1 && (
                                    <span className={`text-[11px] font-semibold text-gray-400 ${message.senderId === user?.uid ? "pr-1" : "pl-1"}`}>
                                        {message.senderName || "Unknown User"}
                                    </span>
                                )}

                                <div className={`flex gap-4 md:gap-5 items-start w-full ${message.role === "user" ? "justify-end" : ""}`}>
                                    {message.role === "model" && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden mt-0.5 text-[#10A37F]">
                                            <div className="flex flex-col items-center">
                                                <div className="w-6 h-6 border-[1.5px] border-current rounded-full flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-current rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className={`flex flex-col space-y-1.5 overflow-hidden max-w-[85%] ${message.role === "user" ? "items-end" : ""}`}>
                                        {message.role === "model" && (
                                            <span className="font-semibold text-[15px] text-gray-800 ml-1">Assistant</span>
                                        )}
                                        <div className={`prose prose-base max-w-none leading-relaxed text-[15.5px] ${message.role === "user"
                                            ? "bg-[#F3F4F6] text-gray-900 px-5 py-2.5 rounded-[22px]"
                                            : "text-gray-800"
                                            }`}>
                                            {message.role === "user" ? (
                                                <p className="whitespace-pre-wrap m-0 font-medium">{message.content}</p>
                                            ) : (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        code: CodeBlock,
                                                        p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                                                        li: ({ node, ...props }) => <li className="marker:text-gray-500" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 mt-5" {...props} />,
                                                        h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 mt-4" {...props} />,
                                                    }}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>
                                            )}
                                        </div>
                                    </div>

                                    {message.role === "user" && (
                                        <div className="flex-shrink-0 mt-0.5 ml-2">
                                            {user?.photoURL ? (
                                                <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full shadow-sm" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center shadow-sm bg-gray-100 text-gray-600">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-4 md:gap-5 items-start animate-fade-in w-full">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden mt-0.5 text-[#10A37F]">
                                    <div className="flex flex-col items-center">
                                        <div className="w-6 h-6 border-[1.5px] border-current rounded-full flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-current rounded-full" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-1.5 flex-1">
                                    <span className="font-semibold text-[15px] text-gray-800 ml-1">Assistant</span>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mt-2 ml-1" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-6" />
                    </div>
                )}
            </main>

            {/* Input Area */}
            <footer className={`p-4 md:px-6 md:pb-6 bg-white ${messages.length === 0 ? "absolute bottom-[40%] w-full" : ""}`}>
                <div className="max-w-[760px] mx-auto relative group">
                    <form
                        onSubmit={handleSend}
                        className="flex items-center gap-2 bg-[#F4F4F4] border border-transparent focus-within:border-gray-200 focus-within:bg-white focus-within:shadow-[0_0_15px_rgba(0,0,0,0.05)] rounded-[26px] p-2 pl-4 transition-all"
                    >
                        <button
                            type="button"
                            className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors rounded-full"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ask COMAU anything..."
                            className="flex-1 max-h-32 min-h-[24px] w-full resize-none border-0 bg-transparent px-2 py-2 text-[15.5px] focus:ring-0 outline-none leading-relaxed text-gray-800 placeholder:text-gray-500 font-medium"
                            rows={1}
                        />
                        <div className="flex items-center gap-1.5 pr-1 text-gray-500">
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className={`p-2 rounded-full flex items-center justify-center transition-all ${loading || !input.trim()
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-black text-white hover:bg-gray-800 active:scale-95"
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </footer>

            {/* Share / Invite Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in relative">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Share className="w-4 h-4 text-blue-500" /> Share Chat
                            </h3>
                            <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-gray-600">
                                Share this link with others to invite them to this chat. When they join, they can chat and collaborate! If you need the AI to answer in a group setting, just mention <strong>@ai</strong>.
                            </p>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <Link className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="text-sm text-gray-600 truncate flex-1">
                                    {`${window.location.origin}/?joinGroup=${chatId}`}
                                </span>
                            </div>

                            <button
                                onClick={handleCopyInviteLink}
                                className={`w-full py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${copiedLink
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-black text-white hover:bg-gray-800"
                                    }`}
                            >
                                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedLink ? "Link Copied!" : "Copy Invite Link"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
