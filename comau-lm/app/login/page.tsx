"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Bot, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { user } = useAuth();
    const router = useRouter();

    // Redirect if already logged in
    if (user) {
        router.push("/");
        return null;
    }

    const saveUserToFirestore = async (uid: string, email: string | null, displayName: string | null, photoURL: string | null) => {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid,
                email,
                displayName: displayName || email?.split('@')[0] || "User",
                photoURL: photoURL || null,
                createdAt: new Date(),
            });
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await saveUserToFirestore(userCredential.user.uid, email, name, null);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        setError("");
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            await saveUserToFirestore(
                userCredential.user.uid,
                userCredential.user.email,
                userCredential.user.displayName,
                userCredential.user.photoURL
            );
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Google authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full font-sans">
            {/* Left side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#110e1b] overflow-hidden items-center p-12 lg:p-24">
                {/* Dynamic Gradient Background */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/40 blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/30 blur-[130px]" />
                </div>

                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center gap-3 text-white mb-20 animate-fade-in">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-[#110e1b]" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">AI Assistant</span>
                    </div>

                    <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
                        Intelligence <br /> Reimagined.
                    </h1>
                    <p className="text-lg text-white/70 leading-relaxed font-light max-w-md">
                        Join thousands of individuals and teams using our AI assistant to transform their workflows, write code, and brainstorm perfect ideas.
                    </p>

                    <div className="absolute bottom-12 left-12 lg:left-24 text-sm text-white/40 flex gap-6">
                        <span>© 2026 AI Assistant Inc.</span>
                        <a href="#" className="hover:text-white/70 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
                    </div>
                </div>
            </div>

            {/* Right side - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-[420px] space-y-8">
                    <div className="text-center lg:text-left space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            {isSignUp ? "Create an account" : "Welcome back"}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {isSignUp ? "Enter your details to get started." : "Enter your details to access your workspace."}
                        </p>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl">
                                {error}
                            </div>
                        )}

                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                {!isSignUp && (
                                    <a href="#" className="text-xs font-semibold text-gray-900 hover:underline">
                                        Forgot?
                                    </a>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
                        </button>
                    </form>

                    <div className="relative items-center flex py-2">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Or continue with
                        </span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <button
                        onClick={signInWithGoogle}
                        disabled={loading}
                        className="w-full bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-medium hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                            <path
                                d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9503 1.19 15.2353 0 12.0003 0C7.31028 0 3.25528 2.69 1.25028 6.60998L5.32028 9.76998C6.27528 6.83998 9.00528 4.75 12.0003 4.75Z"
                                fill="#EA4335"
                            />
                            <path
                                d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L20.18 21.29C22.57 19.09 24 15.96 24 12.275V12.275H23.49Z"
                                fill="#4285F4"
                            />
                            <path
                                d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.6499C0.46 8.2299 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3499L5.26498 14.2949Z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L15.8604 17.905C14.7904 18.64 13.5054 19.05 12.0004 19.05C9.00539 19.05 6.2754 16.96 5.3204 14.03L1.25039 17.14C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                                fill="#34A853"
                            />
                        </svg>
                        Sign in with Google
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="font-semibold text-gray-900 hover:underline"
                        >
                            {isSignUp ? "Sign in" : "Sign up"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
