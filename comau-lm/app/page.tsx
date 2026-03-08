"use client";

import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState, useRef, useEffect } from "react";
import { LogOut, Send, Bot, User as UserIcon, Loader2 } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "model";
  content: string;
};

export default function Home() {
  return (
    <ProtectedRoute>
      <ChatInterface />
    </ProtectedRoute>
  );
}

function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      content: "Hello! I am your AI assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate response");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: data.text,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: `Error: ${error.message}. Please check your environment variables or try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Bot className="w-5 h-5 text-purple-700" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-800 to-blue-600 bg-clip-text text-transparent">
            AI Assistant
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {user?.displayName || "User"}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-500" />
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-4 ${message.role === "user" ? "flex-row-reverse" : ""
              }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${message.role === "user"
                  ? "bg-gray-200"
                  : "bg-purple-100 text-purple-700"
                }`}
            >
              {message.role === "user" ? (
                user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-gray-600" />
                )
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Message bubble */}
            <div
              className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm text-[15px] leading-relaxed ${message.role === "user"
                  ? "bg-black text-white rounded-tr-sm"
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm ring-1 ring-gray-900/5 shadow-md shadow-gray-200/50"
                }`}
            >
              <div className="prose prose-sm max-w-none">
                {message.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i !== message.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="max-w-[75%] bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-md ring-1 ring-gray-900/5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-sm text-gray-500 font-medium">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 pb-safe">
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
          <form
            onSubmit={handleSend}
            className="flex items-end gap-3 bg-gray-50 border border-gray-200 focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-100 rounded-2xl p-2 transition-all shadow-inner"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message AI Assistant..."
              className="flex-1 max-h-32 min-h-[48px] w-full resize-none border-0 bg-transparent px-3 py-3 text-[15px] focus:ring-0 outline-none leading-relaxed"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`flex-shrink-0 p-3 rounded-xl mb-1 flex items-center justify-center transition-all ${!input.trim() || loading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800 active:scale-95 shadow-sm"
                }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-xs text-gray-400 font-medium">AI generated content may be inaccurate or inappropriate.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
