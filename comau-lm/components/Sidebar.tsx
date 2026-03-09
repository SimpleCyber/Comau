"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
    Plus, Search, Trash2, User, PanelLeftClose,
    FolderPlus, Folder, Users, ChevronRight, ChevronDown, MessageSquare, X,
    LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chatService, Chat, Project } from "@/lib/chatService";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface SidebarProps {
    activeChatId: string | null;
    onSelectChat: (chatId: string) => void;
    onNewChat: () => void;
}

export function Sidebar({ activeChatId, onSelectChat, onNewChat }: SidebarProps) {
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
    const projectChats = (projectId: string) => chats.filter(c => c.projectId === projectId);

    return (
        <>
            <aside className="w-[260px] h-screen bg-[#F9F9F9] text-gray-800 flex flex-col border-r border-gray-200 overflow-hidden font-sans">
                {/* Top Navigation & Branding */}
                <div className="flex justify-between items-center p-3">
                    <div className="flex items-center gap-2 pl-2">
                        <Image src="/logo.png" alt="COMAU Logo" width={24} height={24} className="rounded-sm object-contain" />
                    </div>
                    <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
                        <PanelLeftClose className="w-5 h-5" />
                    </button>
                </div>

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

                {/* Scrollable Area */}
                <div
                    className="flex-1 overflow-y-auto px-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, null)}
                >
                    {/* Projects Section */}
                    {projects.length === 0 ? (
                        <div className="mt-6 mb-1 flex items-center justify-between px-3">
                            <button
                                onClick={() => setIsProjectModalOpen(true)}
                                className="w-full flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Project
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mt-6 mb-1 flex items-center justify-between px-3 group/header">
                                <span className="text-xs font-semibold text-gray-400">Projects</span>
                                <button
                                    onClick={() => setIsProjectModalOpen(true)}
                                    className="opacity-0 group-hover/header:opacity-100 p-0.5 hover:bg-gray-200 rounded text-gray-500 transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="space-y-0.5">
                                {projects.map(project => (
                                    <div key={project.id} className="mb-1">
                                        <div
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-700 cursor-pointer group"
                                            onClick={() => toggleProject(project.id)}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-gray-200') }}
                                            onDragLeave={(e) => e.currentTarget.classList.remove('bg-gray-200')}
                                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('bg-gray-200'); handleDrop(e, project.id); }}
                                        >
                                            <button className="p-0.5 text-gray-400 hover:text-gray-600">
                                                {expandedProjects.has(project.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                            </button>
                                            <Folder className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="truncate flex-1 font-medium">{project.name}</span>
                                        </div>

                                        {/* Project Chats */}
                                        {expandedProjects.has(project.id) && (
                                            <div className="pl-6 space-y-0.5 mt-0.5">
                                                {projectChats(project.id).length === 0 ? (
                                                    <div className="px-3 py-1 text-xs text-gray-400 italic">No chats</div>
                                                ) : (
                                                    projectChats(project.id).map(chat => (
                                                        <div
                                                            key={chat.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, chat.id)}
                                                            onClick={() => onSelectChat(chat.id)}
                                                            className={`group/chat flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeChatId === chat.id ? "bg-gray-200 text-gray-900" : "hover:bg-gray-200 text-gray-600"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                                <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                <span className="text-[13px] truncate">{chat.title || "Untitled"}</span>
                                                            </div>
                                                            <button
                                                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                                                className="opacity-0 group-hover/chat:opacity-100 p-0.5 hover:text-red-500 transition-all text-gray-400 shrink-0"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Group Chats Section - Conditionally rendered */}
                    {groupChats.length > 0 && (
                        <>
                            <div className="mt-6 mb-1 flex items-center justify-between px-3 group/header">
                                <span className="text-xs font-semibold text-gray-400">Group chats</span>
                            </div>
                            <div className="space-y-0.5">
                                {groupChats.map(chat => (
                                    <div
                                        key={chat.id}
                                        onClick={() => onSelectChat(chat.id)}
                                        className={`group/chat flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeChatId === chat.id ? "bg-gray-200 text-gray-900" : "hover:bg-gray-200 text-gray-700"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                                            <Users className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="text-sm truncate font-medium">{chat.title || "Group Chat"}</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteChat(e, chat.id)}
                                            className="opacity-0 group-hover/chat:opacity-100 p-1 hover:text-red-500 transition-all text-gray-400 shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Your Chats Section */}
                    <div className="mt-6 mb-1 flex items-center justify-between px-3">
                        <span className="text-xs font-semibold text-gray-400">Your chats</span>
                    </div>
                    <div className="space-y-0.5 relative min-h-[50px]">
                        {loading ? (
                            <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
                        ) : personalChats.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm italic">No loose chats</div>
                        ) : (
                            personalChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, chat.id)}
                                    onClick={() => onSelectChat(chat.id)}
                                    className={`group/chat flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeChatId === chat.id ? "bg-gray-200 text-gray-900" : "hover:bg-gray-200 text-gray-700"
                                        }`}
                                >
                                    <span className="text-sm truncate font-medium flex-1">{chat.title || "Untitled Chat"}</span>
                                    <button
                                        onClick={(e) => handleDeleteChat(e, chat.id)}
                                        className="opacity-0 group-hover/chat:opacity-100 p-1 hover:text-red-500 transition-all text-gray-400 shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Bottom User Area */}
                <div className="p-3 border-t border-gray-200 mt-auto relative" ref={profilePopupRef}>
                    <div
                        className="flex items-center justify-between group p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                        onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            {user?.photoURL ? (
                                <img src={user.photoURL} className="w-8 h-8 rounded-full shadow-sm" alt="User profile" />
                            ) : (
                                <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-gray-100 text-gray-600 shrink-0 shadow-sm">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate text-gray-800">{user?.displayName || "User"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Popup */}
                    {isProfilePopupOpen && (
                        <div className="absolute bottom-full left-3 mb-2 w-[236px] bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 animate-fade-in">
                            <div className="p-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left font-medium"
                                >
                                    <LogOut className="w-4 h-4 text-gray-500" />
                                    Log out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Project Creation Modal */}
            {isProjectModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Create New Project</h3>
                            <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="Enter project name..."
                                    className="w-full text-base py-2.5 px-3 border border-gray-300 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black text-gray-900 placeholder:text-gray-400 bg-gray-50 transition-all"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsProjectModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newProjectName.trim()}
                                    className="px-4 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
