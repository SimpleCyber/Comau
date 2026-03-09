"use client";

import { Share, X, Link, Copy, Check } from "lucide-react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatId: string | null;
    onCopyLink: () => void;
    copiedLink: boolean;
}

export function ShareModal({
    isOpen,
    onClose,
    chatId,
    onCopyLink,
    copiedLink,
}: ShareModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in relative">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Share className="w-4 h-4 text-blue-500" /> Share Chat
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
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
                            {typeof window !== "undefined" ? `${window.location.origin}/?joinGroup=${chatId}` : ""}
                        </span>
                    </div>

                    <button
                        onClick={onCopyLink}
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
    );
}
