"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Activity, ServerCrash } from "lucide-react";

interface ApiServiceStatus {
    id: string;
    name: string;
    category: string;
    status: "Working" | "Offline" | "Error";
    statusCode?: number;
    error?: string;
    latencyMs?: number;
}

export function ApiVerificationWidget() {
    const [services, setServices] = useState<ApiServiceStatus[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastTested, setLastTested] = useState<Date | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const checkApis = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/agent/verify");
            if (!res.ok) throw new Error("Failed to fetch API status");
            const data = await res.json();
            setServices(data.services || []);
            setLastTested(new Date());
            setIsOpen(true); // Open upon first manual/auto test completion
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial auto-check on mount
        checkApis();
    }, []);

    const allWorking = services.length > 0 && services.every(s => s.status === "Working");
    const anyOffline = services.some(s => s.status === "Offline" || s.status === "Error");

    return (
        <div className="w-full max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                {/* Header Ribbon */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between p-3.5 transition-colors border-b ${allWorking
                            ? "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50"
                            : anyOffline
                                ? "bg-red-50/50 border-red-100 hover:bg-red-50"
                                : "bg-gray-50 border-gray-100 hover:bg-gray-100/50"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${allWorking ? "bg-emerald-100 text-emerald-600" : anyOffline ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-500"
                            }`}>
                            {allWorking ? <Activity className="w-4 h-4" /> : anyOffline ? <ServerCrash className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Backend Services API Status
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                {isLoading ? (
                                    <>Checking connection...</>
                                ) : allWorking ? (
                                    <>All systems operational</>
                                ) : anyOffline ? (
                                    <span className="text-red-600 font-medium">Some services are unreachable</span>
                                ) : (
                                    <>Waiting for test</>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {lastTested && !isLoading && (
                            <span className="text-[10px] text-gray-400 font-medium hidden sm:block">
                                Last checked: {lastTested.toLocaleTimeString()}
                            </span>
                        )}
                        <div
                            onClick={(e) => { e.stopPropagation(); checkApis(); }}
                            className={`p-1.5 rounded-md hover:bg-white border border-transparent hover:border-gray-200 transition-colors cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                            title="Retest APIs"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                        </div>
                    </div>
                </button>

                {/* Expanded Content */}
                {isOpen && (
                    <div className="p-4 bg-gray-50/30">
                        {services.length === 0 && !isLoading ? (
                            <p className="text-sm text-center text-gray-500 py-4">No services configured for testing.</p>
                        ) : (
                            <div className="space-y-2">
                                {services.map(service => (
                                    <div key={service.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            {service.status === "Working" ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            ) : service.status === "Offline" ? (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                            )}
                                            <div>
                                                <span className="text-sm font-medium text-gray-800 tracking-tight">{service.name}</span>
                                                {service.status === "Offline" && service.error && (
                                                    <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px] sm:max-w-xs">{service.error}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-right">
                                            {service.latencyMs !== undefined && service.status === "Working" && (
                                                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 hidden sm:inline-block">
                                                    {service.latencyMs}ms
                                                </span>
                                            )}
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider ${service.status === "Working" ? "bg-emerald-50 text-emerald-700" :
                                                    service.status === "Offline" ? "bg-red-50 text-red-700" :
                                                        "bg-amber-50 text-amber-700"
                                                }`}>
                                                {service.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
