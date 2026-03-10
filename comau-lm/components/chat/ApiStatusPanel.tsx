"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Activity, ServerCrash, X, ChevronRight } from "lucide-react";

interface ApiServiceStatus {
    id: string;
    name: string;
    category: string;
    status: "Working" | "Offline" | "Error";
    statusCode?: number;
    error?: string;
    latencyMs?: number;
}

interface ApiStatusPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ApiStatusPanel({ isOpen, onClose }: ApiStatusPanelProps) {
    const [services, setServices] = useState<ApiServiceStatus[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastTested, setLastTested] = useState<Date | null>(null);

    const checkApis = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/agent/verify");
            if (!res.ok) throw new Error("Failed to fetch API status");
            const data = await res.json();
            setServices(data.services || []);
            setLastTested(new Date());
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && services.length === 0) {
            checkApis();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const allWorking = services.length > 0 && services.every(s => s.status === "Working");
    const anyOffline = services.some(s => s.status === "Offline" || s.status === "Error");

    return (
        <aside className="w-80 border-l border-gray-100 bg-white flex flex-col h-full animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 tracking-tight">System Status</h2>
                    <p className="text-[10px] text-gray-500 font-medium">Backend API Registry</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-400"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Connectors</span>
                    <button
                        onClick={checkApis}
                        disabled={isLoading}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 transition-colors"
                        title="Refresh Status"
                    >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {services.length === 0 && !isLoading ? (
                    <div className="text-center py-8">
                        <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 px-4">No services discovered in registry.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {services.map(service => (
                            <div key={service.id} className="group p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-default">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        {service.status === "Working" ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        ) : service.status === "Offline" ? (
                                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                        )}
                                        <span className="text-[13px] font-semibold text-gray-800 leading-tight">
                                            {service.name}
                                        </span>
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${service.status === "Working" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                            service.status === "Offline" ? "bg-red-50 text-red-600 border border-red-100" :
                                                "bg-amber-50 text-amber-600 border border-amber-100"
                                        }`}>
                                        {service.status}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-gray-400 font-medium">{service.category}</span>
                                    {service.latencyMs !== undefined && service.status === "Working" && (
                                        <span className="text-[10px] font-mono text-gray-400">
                                            {service.latencyMs}ms
                                        </span>
                                    )}
                                </div>

                                {service.status !== "Working" && service.error && (
                                    <div className="mt-2 pt-2 border-t border-red-50">
                                        <p className="text-[10px] text-red-500 break-words leading-relaxed italic">
                                            {service.error}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-gray-500 font-medium tracking-tight">Global Connectivity</span>
                    {allWorking ? (
                        <span className="text-emerald-600 font-bold">Stable</span>
                    ) : (
                        <span className="text-red-500 font-bold">Issues Detected</span>
                    )}
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${allWorking ? 'bg-emerald-500' : anyOffline ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: allWorking ? '100%' : '60%' }}
                    />
                </div>
                {lastTested && (
                    <p className="text-[9px] text-gray-400 mt-3 text-center font-medium uppercase tracking-widest">
                        Pulse check: {lastTested.toLocaleTimeString()}
                    </p>
                )}
            </div>
        </aside>
    );
}
