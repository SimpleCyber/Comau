"use client";

import { Plus, Folder, ChevronRight, ChevronDown, MessageSquare, Trash2 } from "lucide-react";
import { Chat, Project } from "@/lib/chatService";

interface ProjectSectionProps {
    projects: Project[];
    chats: Chat[];
    activeChatId: string | null;
    expandedProjects: Set<string>;
    onToggleProject: (projectId: string) => void;
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (e: React.MouseEvent, chatId: string) => void;
    onDragStart: (e: React.DragEvent, chatId: string) => void;
    onDrop: (e: React.DragEvent, projectId: string | null) => void;
    onOpenProjectModal: () => void;
}

export function ProjectSection({
    projects,
    chats,
    activeChatId,
    expandedProjects,
    onToggleProject,
    onSelectChat,
    onDeleteChat,
    onDragStart,
    onDrop,
    onOpenProjectModal,
}: ProjectSectionProps) {
    const projectChats = (projectId: string) => chats.filter(c => c.projectId === projectId);

    if (projects.length === 0) {
        return (
            <div className="mt-6 mb-1 flex items-center justify-between px-3">
                <button
                    onClick={onOpenProjectModal}
                    className="w-full flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Project
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="mt-6 mb-1 flex items-center justify-between px-3 group/header">
                <span className="text-xs font-semibold text-gray-400">Projects</span>
                <button
                    onClick={onOpenProjectModal}
                    className="opacity-0 group-header:opacity-100 p-0.5 hover:bg-gray-200 rounded text-gray-500 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="space-y-0.5">
                {projects.map(project => (
                    <div key={project.id} className="mb-1">
                        <div
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-sm text-gray-700 cursor-pointer group"
                            onClick={() => onToggleProject(project.id)}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-gray-200') }}
                            onDragLeave={(e) => e.currentTarget.classList.remove('bg-gray-200')}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('bg-gray-200'); onDrop(e, project.id); }}
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
                                            onDragStart={(e) => onDragStart(e, chat.id)}
                                            onClick={() => onSelectChat(chat.id)}
                                            className={`group/chat flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeChatId === chat.id ? "bg-gray-200 text-gray-900" : "hover:bg-gray-200 text-gray-600"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="text-[13px] truncate">{chat.title || "Untitled"}</span>
                                            </div>
                                            <button
                                                onClick={(e) => onDeleteChat(e, chat.id)}
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
    );
}
