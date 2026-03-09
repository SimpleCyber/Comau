"use client";

import { Plus, Search } from "lucide-react";

interface SidebarActionsProps {
    onNewChat: () => void;
}

export function SidebarActions({ onNewChat }: SidebarActionsProps) {
    return (
        <div className="px-3 pb-2 mt-2 space-y-0.5">
            <button
                onClick={onNewChat}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
                <div className="w-6 flex justify-center"><Plus className="w-4 h-4" /></div>
                New chat
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                <div className="w-6 flex justify-center"><Search className="w-4 h-4" /></div>
                Search chats
            </button>
        </div>
    );
}
