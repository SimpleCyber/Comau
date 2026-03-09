"use client";

import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState, useEffect, Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { useSearchParams, useRouter } from "next/navigation";
import { chatService } from "@/lib/chatService";
import { Users, X, Info } from "lucide-react";

export default function Home() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <ChatContainer />
      </Suspense>
    </ProtectedRoute>
  );
}

function ChatContainer() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarKey, setSidebarKey] = useState(0); // To force sidebar refresh on new chat
  const [pendingJoinGroupId, setPendingJoinGroupId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const joinGroupId = searchParams.get("joinGroup");
    if (joinGroupId && user) {
      setPendingJoinGroupId(joinGroupId);
    }
  }, [searchParams, user]);

  const confirmJoinGroup = async () => {
    if (!pendingJoinGroupId || !user) return;
    setIsJoining(true);
    try {
      await chatService.joinGroupChat(pendingJoinGroupId, user.uid);
      setActiveChatId(pendingJoinGroupId);
      setSidebarKey(prev => prev + 1);
      setPendingJoinGroupId(null);
      router.replace("/");
    } catch (error) {
      console.error("Error joining group chat:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const cancelJoinGroup = () => {
    setPendingJoinGroupId(null);
    router.replace("/");
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleNewChat = () => {
    setActiveChatId(null);
  };

  const handleChatCreated = (chatId: string) => {
    setActiveChatId(chatId);
    setSidebarKey(prev => prev + 1); // Refresh sidebar to show new chat
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        key={sidebarKey}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          chatId={activeChatId}
          onChatCreated={handleChatCreated}
        />
      </div>

      {/* Join Group Confirmation Modal */}
      {pendingJoinGroupId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Join Group Chat</h3>
              <p className="text-sm text-gray-500">
                You've been invited to join a group chat. Would you like to join now?
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={cancelJoinGroup}
                className="flex-1 py-2.5 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
                disabled={isJoining}
              >
                Cancel
              </button>
              <button
                onClick={confirmJoinGroup}
                className="flex-1 py-2.5 px-4 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
                disabled={isJoining}
              >
                {isJoining ? "Joining..." : "Join Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
