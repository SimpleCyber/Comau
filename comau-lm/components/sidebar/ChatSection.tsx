"use client";

import { Trash2, LucideIcon } from "lucide-react";
import { Chat } from "@/lib/chatService";

interface ChatSectionProps {
    title: string;
    chats: Chat[];
    activeChatId: string | null;
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (e: React.MouseEvent, chatId: string) => void;
    onDragStart: (e: React.DragEvent, chatId: string) => void;
    loading?: boolean;
    emptyMessage?: string;
    Icon?: LucideIcon;
}

export function ChatSection({
    title,
    chats,
    activeChatId,
    onSelectChat,
    onDeleteChat,
    onDragStart,
    loading = false,
    emptyMessage = "No chats",
    Icon,
}: ChatSectionProps) {
    return (
        <>
            <div className="mt-6 mb-1 flex items-center justify-between px-3">
                <span className="text-xs font-semibold text-gray-400">{title}</span>
            </div>
            <div className="space-y-0.5 relative min-h-[50px]">
                {loading ? (
                    <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
                ) : chats.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm italic">{emptyMessage}</div>
                ) : (
                    chats.map((chat) => (
                        <div
                            key={chat.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, chat.id)}
                            onClick={() => onSelectChat(chat.id)}
                            className={`group/chat flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeChatId === chat.id ? "bg-gray-200 text-gray-900" : "hover:bg-gray-200 text-gray-700"
                                }`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
                                <span className="text-sm truncate font-medium flex-1">{chat.title || "Untitled Chat"}</span>
                            </div>
                            <button
                                onClick={(e) => onDeleteChat(e, chat.id)}
                                className="opacity-0 group-hover/chat:opacity-100 p-1 hover:text-red-500 transition-all text-gray-400 shrink-0"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
