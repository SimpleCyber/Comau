"use client";

import { useEffect, useState, useRef } from "react";
import { Users, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chatService, Chat, Project } from "@/lib/chatService";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Import modular components
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarActions } from "./sidebar/SidebarActions";
import { ProjectSection } from "./sidebar/ProjectSection";
import { ChatSection } from "./sidebar/ChatSection";
import { UserProfile } from "./sidebar/UserProfile";
import { CreateProjectModal } from "./sidebar/CreateProjectModal";

interface SidebarProps {
    activeChatId: string | null;
    onSelectChat: (chatId: string) => void;
    onNewChat: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function Sidebar({ activeChatId, onSelectChat, onNewChat, isCollapsed, onToggleCollapse }: SidebarProps) {
    const { user } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    // Profile popup state
    const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
    const profilePopupRef = useRef<HTMLDivElement>(null);

    // Project modal state
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");

    useEffect(() => {
        if (user) {
            loadData();
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (profilePopupRef.current && !profilePopupRef.current.contains(event.target as Node)) {
                setIsProfilePopupOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        try {
            const [userChats, userProjects] = await Promise.all([
                chatService.getUserChats(user.uid),
                chatService.getUserProjects(user.uid)
            ]);
            setChats(userChats);
            setProjects(userProjects);

            // Auto expand projects that contain the active chat
            if (activeChatId) {
                const active = userChats.find(c => c.id === activeChatId);
                if (active?.projectId) {
                    setExpandedProjects(prev => new Set(prev).add(active.projectId!));
                }
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this chat?")) {
            try {
                await chatService.deleteChat(chatId);
                setChats(prev => prev.filter(c => c.id !== chatId));
                if (activeChatId === chatId) {
                    onNewChat();
                }
            } catch (error) {
                console.error("Error deleting chat:", error);
            }
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim() || !user) return;
        try {
            const projectId = await chatService.createProject(user.uid, newProjectName.trim());
            setProjects([{ id: projectId, name: newProjectName.trim(), userId: user.uid, createdAt: null as any }, ...projects]);
            setNewProjectName("");
            setIsProjectModalOpen(false);
            setExpandedProjects(prev => new Set(prev).add(projectId));
        } catch (error) {
            console.error("Error creating project:", error);
        }
    };

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId);
            else next.add(projectId);
            return next;
        });
    };

    const handleDragStart = (e: React.DragEvent, chatId: string) => {
        e.dataTransfer.setData("chatId", chatId);
    };

    const handleDrop = async (e: React.DragEvent, projectId: string | null) => {
        e.preventDefault();
        const chatId = e.dataTransfer.getData("chatId");
        if (!chatId) return;

        setChats(prev => prev.map(c => c.id === chatId ? { ...c, projectId: projectId || undefined } : c));
        if (projectId) setExpandedProjects(prev => new Set(prev).add(projectId));

        try {
            await chatService.updateChatProject(chatId, projectId);
        } catch (error) {
            console.error("Error updating chat project:", error);
            loadData();
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const groupChats = chats.filter(c => c.members && c.members.length > 1);
    const personalChats = chats.filter(c => (!c.members || c.members.length <= 1) && !c.projectId);

    return (
        <>
            <aside
                className={`h-screen bg-[#F9F9F9] text-gray-800 flex flex-col border-r border-gray-200 overflow-hidden font-sans transition-all duration-300 ease-in-out ${isCollapsed ? "w-0 opacity-0 border-r-0" : "w-[260px] opacity-100"
                    }`}
            >
                <SidebarHeader onToggleCollapse={onToggleCollapse} />
                <SidebarActions onNewChat={onNewChat} />

                {/* Scrollable Area */}
                <div
                    className="flex-1 overflow-y-auto px-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, null)}
                >
                    <ProjectSection
                        projects={projects}
                        chats={chats}
                        activeChatId={activeChatId}
                        expandedProjects={expandedProjects}
                        onToggleProject={toggleProject}
                        onSelectChat={onSelectChat}
                        onDeleteChat={handleDeleteChat}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        onOpenProjectModal={() => setIsProjectModalOpen(true)}
                    />

                    {/* Group Chats Section */}
                    {groupChats.length > 0 && (
                        <ChatSection
                            title="Group chats"
                            chats={groupChats}
                            activeChatId={activeChatId}
                            onSelectChat={onSelectChat}
                            onDeleteChat={handleDeleteChat}
                            onDragStart={handleDragStart}
                            Icon={Users}
                        />
                    )}

                    {/* Your Chats Section */}
                    <ChatSection
                        title="Your chats"
                        chats={personalChats}
                        activeChatId={activeChatId}
                        onSelectChat={onSelectChat}
                        onDeleteChat={handleDeleteChat}
                        onDragStart={handleDragStart}
                        loading={loading}
                        emptyMessage="No loose chats"
                    />
                </div>

                <UserProfile
                    user={user}
                    isProfilePopupOpen={isProfilePopupOpen}
                    setIsProfilePopupOpen={setIsProfilePopupOpen}
                    onLogout={handleLogout}
                    profilePopupRef={profilePopupRef}
                />
            </aside>

            <CreateProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                newProjectName={newProjectName}
                setNewProjectName={setNewProjectName}
                onCreateProject={handleCreateProject}
            />
        </>
    );
}
