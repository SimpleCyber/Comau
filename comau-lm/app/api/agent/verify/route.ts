import { NextResponse } from "next/server";

const BASE_URL = process.env.LINE_CONFIG_API_BASE_URL || "http://localhost:30059/api/v1";

export async function GET() {
    const services = [
        {
            id: "adv_param_filter",
            name: "Advanced Parameter Filter API",
            category: "Reports",
            endpoint: `${BASE_URL}/advparamfilter`,
            method: "GET",
        },
        // Future beta APIs will be added here
    ];

    const results = await Promise.all(
        services.map(async (service) => {
            const start = Date.now();
            try {
                const response = await fetch(service.endpoint, {
                    method: service.method,
                    headers: {
                        Accept: "application/json",
                    },
                    // Short timeout to not keep the UI hanging
                    signal: AbortSignal.timeout(5000),
                });

                const latency = Date.now() - start;

                return {
                    id: service.id,
                    name: service.name,
                    category: service.category,
                    status: response.ok ? "Working" : "Error",
                    statusCode: response.status,
                    latencyMs: latency,
                };
            } catch (error: any) {
                return {
                    id: service.id,
                    name: service.name,
                    category: service.category,
                    status: "Offline",
                    error: error.message,
                    latencyMs: Date.now() - start,
                };
            }
        })
    );

    return NextResponse.json({ services: results });
}
