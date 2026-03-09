"use client";

import { RefObject } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, Chat } from "@/lib/chatService";
import { CodeBlock } from "./CodeBlock";

interface MessageListProps {
    messages: Message[];
    loading: boolean;
    user: FirebaseUser | null;
    chat: Chat | null;
    messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function MessageList({
    messages,
    loading,
    user,
    chat,
    messagesEndRef,
}: MessageListProps) {
    return (
        <div className="max-w-3xl mx-auto py-6 px-4 space-y-8">
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={`flex flex-col gap-1 items-start group ${message.role === "user" ? "items-end" : ""}`}
                >
                    <div className={`flex gap-3 md:gap-4 items-end w-full ${message.role === "user" ? "justify-end" : ""}`}>
                        {message.role === "user" && chat?.type === "group" && (
                            <div className="flex-shrink-0 mb-1 relative group/avatar">
                                {message.senderPhotoURL ? (
                                    <img src={message.senderPhotoURL} alt={message.senderName} className="w-6 h-6 rounded-full border border-gray-100 shadow-sm transition-transform hover:scale-110" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                                        <User className="w-3 h-3" />
                                    </div>
                                )}
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded pointer-events-none opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                    {message.senderName || "User"}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                </div>
                            </div>
                        )}

                        {message.role === "model" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden mb-1 text-[#10A37F]">
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

                        {message.role === "user" && chat?.type !== "group" && (
                            <div className="flex-shrink-0 mb-1 ml-2">
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
    );
}
