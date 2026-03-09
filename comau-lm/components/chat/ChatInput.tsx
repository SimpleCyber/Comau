"use client";

import { Plus, Send } from "lucide-react";

interface ChatInputProps {
    input: string;
    setInput: (val: string) => void;
    onSend: (e?: React.FormEvent) => void;
    loading: boolean;
    isSplash?: boolean;
}

export function ChatInput({
    input,
    setInput,
    onSend,
    loading,
    isSplash = false,
}: ChatInputProps) {
    return (
        <div className={isSplash ? "w-full max-w-[760px]" : "max-w-[760px] mx-auto relative group"}>
            <form
                onSubmit={onSend}
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
                            onSend();
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
    );
}
