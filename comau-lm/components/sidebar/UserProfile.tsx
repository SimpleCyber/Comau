"use client";

import { User, LogOut } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { RefObject } from "react";

interface UserProfileProps {
    user: FirebaseUser | null;
    isProfilePopupOpen: boolean;
    setIsProfilePopupOpen: (open: boolean) => void;
    onLogout: () => void;
    profilePopupRef: RefObject<HTMLDivElement | null>;
}

export function UserProfile({
    user,
    isProfilePopupOpen,
    setIsProfilePopupOpen,
    onLogout,
    profilePopupRef,
}: UserProfileProps) {
    return (
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
                            onClick={onLogout}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left font-medium"
                        >
                            <LogOut className="w-4 h-4 text-gray-500" />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
