"use client";

import { useState } from "react";
import { Brain, Network, Search, HelpCircle, CheckCircle2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

export interface ThinkingStep {
    id: number;
    type: "planning" | "api_call" | "analyzing" | "asking_user" | "complete";
    title: string;
    detail: string;
    status: "in_progress" | "done" | "waiting";
    data?: any;
}

interface ThinkingStepsProps {
    steps: ThinkingStep[];
    isComplete: boolean;
}

const StepIcon = ({ type, status }: { type: ThinkingStep["type"]; status: ThinkingStep["status"] }) => {
    const size = "w-4 h-4";

    if (status === "in_progress") {
        return <Loader2 className={`${size} animate-spin text-blue-500`} />;
    }

    switch (type) {
        case "planning": return <Brain className={`${size} text-purple-500`} />;
        case "api_call": return <Network className={`${size} text-blue-500`} />;
        case "analyzing": return <Search className={`${size} text-indigo-500`} />;
        case "asking_user": return <HelpCircle className={`${size} text-amber-500`} />;
        case "complete": return <CheckCircle2 className={`${size} text-emerald-500`} />;
        default: return <Brain className={`${size} text-gray-500`} />;
    }
};

export function ThinkingSteps({ steps, isComplete }: ThinkingStepsProps) {
    // Default expanded while thinking, auto-collapse when done
    const [isExpanded, setIsExpanded] = useState(!isComplete);

    if (!steps || steps.length === 0) return null;

    return (
        <div className="w-full max-w-2xl bg-gray-50/80 rounded-xl border border-gray-100 overflow-hidden mb-4 animate-in fade-in duration-300">
            {/* Header / Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-100/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {!isComplete ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <span>{isComplete ? "Thought process complete" : "Agent is thinking..."}</span>
                    <span className="text-xs text-gray-400 font-normal ml-2">
                        ({steps.length} step{steps.length !== 1 ? 's' : ''})
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-1 space-y-4">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className="flex gap-3 relative animate-in slide-in-from-left-2 fade-in duration-300"
                            style={{ animationFillMode: "both", animationDelay: `${index * 100}ms` }}
                        >
                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-gray-200 rounded-full" />
                            )}

                            <div className="flex-shrink-0 mt-0.5 bg-white rounded-full p-1 shadow-sm border border-gray-100 relative z-10">
                                <StepIcon type={step.type} status={step.status} />
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-medium text-gray-800">{step.title}</h4>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                                        {step.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed font-mono bg-white p-2 rounded-md border border-gray-100 shadow-sm">
                                    {step.detail}
                                </p>
                                {step.data && (
                                    <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded truncate max-w-full font-mono">
                                        Received {Array.isArray(step.data) ? step.data.length : 1} object(s)
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
