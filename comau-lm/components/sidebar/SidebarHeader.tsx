"use client";

import Image from "next/image";
import { PanelLeftClose } from "lucide-react";

interface SidebarHeaderProps {
    onToggleCollapse: () => void;
}

export function SidebarHeader({ onToggleCollapse }: SidebarHeaderProps) {
    return (
        <div className="flex justify-between items-center p-3">
            <div className="flex items-center gap-2 pl-2">
                <Image src="/logo.png" alt="COMAU Logo" width={24} height={24} className="rounded-sm object-contain" />
            </div>
            <button
                onClick={onToggleCollapse}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                title="Collapse Sidebar"
            >
                <PanelLeftClose className="w-5 h-5" />
            </button>
        </div>
    );
}
