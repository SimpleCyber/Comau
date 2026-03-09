import { getEndpoint } from "./registry";

// Get base URL from environment variable or fallback to localhost
const BASE_URL = process.env.LINE_CONFIG_API_BASE_URL || "http://localhost:30059/api/v1";

export async function executeApiCall(functionName: string, args: Record<string, any>): Promise<any> {
    const endpoint = getEndpoint(functionName);

    if (!endpoint) {
        throw new Error(`Endpoint ${functionName} not found in registry.`);
    }

    // 1. Construct URL and replace path parameters
    let urlPath = endpoint.path;
    if (endpoint.pathParams) {
        endpoint.pathParams.forEach(param => {
            const value = args[param.name];
            if (value === undefined && param.required !== false) {
                throw new Error(`Missing required path parameter: ${param.name}`);
            }
            if (value !== undefined) {
                urlPath = urlPath.replace(`{${param.name}}`, String(value));
            }
        });
    }

    const url = new URL(`${BASE_URL}${urlPath}`);

    // 2. Append query parameters
    if (endpoint.queryParams) {
        endpoint.queryParams.forEach(param => {
            const value = args[param.name];
            if (value !== undefined) {
                url.searchParams.append(param.name, String(value));
            } else if (param.required) {
                throw new Error(`Missing required query parameter: ${param.name}`);
            }
        });
    }

    // 3. Construct Headers and Body
    const headers: HeadersInit = {
        "Accept": "application/json",
    };

    let body: BodyInit | undefined = undefined;

    if (["POST", "PUT"].includes(endpoint.method)) {
        headers["Content-Type"] = "application/json";

        // For POST/PUT, the args minus path/query params form the body
        const bodyProps = { ...args };

        // Remove query and path params from the body object
        if (endpoint.queryParams) {
            endpoint.queryParams.forEach(p => delete bodyProps[p.name]);
        }
        if (endpoint.pathParams) {
            endpoint.pathParams.forEach(p => delete bodyProps[p.name]);
        }

        body = JSON.stringify(bodyProps);
    }

    // 4. Execute the network request
    try {
        const response = await fetch(url.toString(), {
            method: endpoint.method,
            headers,
            body,
            // Don't wait forever
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        // Some endpoints might return empty 200 OKs
        const text = await response.text();
        if (!text) return { success: true };

        try {
            return JSON.parse(text);
        } catch {
            // If it's not JSON, just return the text
            return { text };
        }
    } catch (error: any) {
        console.error(`[Executor] Failed to call ${endpoint.method} ${urlPath}:`, error);
        return {
            error: true,
            message: error.message || "Failed to execute API call",
        };
    }
}
