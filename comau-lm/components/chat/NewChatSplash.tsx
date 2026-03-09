"use client";

import Image from "next/image";
import { ChatInput } from "./ChatInput";

interface NewChatSplashProps {
    input: string;
    setInput: (val: string) => void;
    onSend: (e?: React.FormEvent) => void;
    loading: boolean;
}

export function NewChatSplash({
    input,
    setInput,
    onSend,
    loading,
}: NewChatSplashProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-8">
                <Image src="/logo.png" alt="COMAU Logo" width={40} height={40} className="object-contain" />
            </div>
            <h1 className="text-3xl md:text-4xl text-gray-900 font-bold mb-10 tracking-tight text-center">How can I help you today?</h1>

            <ChatInput
                input={input}
                setInput={setInput}
                onSend={onSend}
                loading={loading}
                isSplash={true}
            />
        </div>
    );
}
