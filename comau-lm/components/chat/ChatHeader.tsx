"use client";

import { ChevronDown, Share } from "lucide-react";

interface ChatHeaderProps {
    chatId: string | null;
    onShare: () => void;
}

export function ChatHeader({ chatId, onShare }: ChatHeaderProps) {
    return (
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
                        onClick={onShare}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors mr-2 border border-blue-200"
                    >
                        <Share className="w-3.5 h-3.5" />
                        Share
                    </button>
                )}
            </div>
        </header>
    );
}
