"use client";

import { useState } from "react";
import { Table as TableIcon, Code2, Download } from "lucide-react";

interface DataDisplayProps {
    data: any;
    format?: "table" | "json";
}

export function DataDisplay({ data, format = "json" }: DataDisplayProps) {
    const [activeTab, setActiveTab] = useState<"table" | "json">(format);

    if (!data) return null;

    const isArray = Array.isArray(data);
    const displayFormat = isArray ? activeTab : "json"; // Force JSON if not an array

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `api-data-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-4xl mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-500">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
                <div className="flex bg-gray-200/50 p-1 rounded-lg">
                    {isArray && (
                        <button
                            onClick={() => setActiveTab("table")}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "table"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <TableIcon className="w-4 h-4" />
                            Table
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab("json")}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${displayFormat === "json"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Code2 className="w-4 h-4" />
                        JSON
                    </button>
                </div>

                <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    title="Download JSON"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="p-0 overflow-x-auto max-h-[500px]">
                {displayFormat === "table" ? (
                    <TableView data={data as any[]} />
                ) : (
                    <JsonView data={data} />
                )}
            </div>
        </div>
    );
}

// Sub-component: Table View
function TableView({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return <div className="p-8 text-center text-gray-400">No data available</div>;
    }

    // Extract all unique keys from the first few objects to build columns
    const firstItem = data[0];
    const columns = Object.keys(firstItem).filter(key => {
        // Hide complex nested objects from the top-level table view for simplicity
        const val = firstItem[key];
        return typeof val !== "object" || val === null;
    });

    return (
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 sticky top-0">
                <tr>
                    {columns.map((col) => (
                        <th key={col} className="px-6 py-3 font-medium tracking-wider whitespace-nowrap">
                            {col.replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                    ))}
                    {/* Add a column for nested details if any */}
                    {Object.keys(firstItem).some(k => typeof firstItem[k] === "object" && firstItem[k] !== null) && (
                        <th className="px-6 py-3 font-medium tracking-wider text-right">Details</th>
                    )}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {data.map((row, i) => (
                    <tr key={i} className="bg-white hover:bg-blue-50/30 transition-colors">
                        {columns.map((col) => {
                            const val = row[col];
                            const displayVal = val === null ? "null" : val === undefined ? "-" : String(val);
                            return (
                                <td key={col} className="px-6 py-4 whitespace-nowrap text-gray-700">
                                    {displayVal}
                                </td>
                            );
                        })}

                        {/* View nested object indicator */}
                        {Object.keys(row).some(k => typeof row[k] === "object" && row[k] !== null) && (
                            <td className="px-6 py-4 text-right">
                                <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded cursor-help" title="Contains nested data (switch to JSON view)">
                                    Nested Data
                                </span>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// Sub-component: JSON View
function JsonView({ data }: { data: any }) {
    return (
        <pre className="p-4 text-sm font-mono text-gray-800 bg-[#fafafa] m-0 overflow-x-auto selection:bg-blue-200">
            <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
    );
}
