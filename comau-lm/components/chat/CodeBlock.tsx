"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export const CodeBlock = ({ inline, className, children, ...props }: any) => {
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
