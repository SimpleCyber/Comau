export interface ParamDef {
    name: string;
    type: "string" | "integer" | "number" | "boolean" | "array" | "object";
    description: string;
    required?: boolean;
}

export interface ApiEndpoint {
    name: string;
    description: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    pathParams?: ParamDef[];
    queryParams?: ParamDef[];
    bodySchema?: any; // JSON Schema for the body
    responseDescription: string;
}

// Global registry of all available API endpoints
const endpointRegistry: Record<string, ApiEndpoint> = {};

export function registerEndpoint(endpoint: ApiEndpoint) {
    if (endpointRegistry[endpoint.name]) {
        console.warn(`Endpoint ${endpoint.name} is already registered. Overwriting.`);
    }
    endpointRegistry[endpoint.name] = endpoint;
}

export function getEndpoint(name: string): ApiEndpoint | undefined {
    return endpointRegistry[name];
}

export function getAllEndpoints(): ApiEndpoint[] {
    return Object.values(endpointRegistry);
}

/**
 * Converts registered endpoints into Gemini function declarations.
 */
import { SchemaType, Tool } from "@google/generative-ai";

export function getToolDeclarations(): Tool[] {
    const tools = getAllEndpoints().map(endpoint => {
        const properties: Record<string, any> = {};
        const required: string[] = [];

        // Add path params
        if (endpoint.pathParams) {
            endpoint.pathParams.forEach(p => {
                properties[p.name] = {
                    type: p.type === "integer" || p.type === "number" ? SchemaType.NUMBER : (p.type === "boolean" ? SchemaType.BOOLEAN : (p.type === "array" ? SchemaType.ARRAY : (p.type === "object" ? SchemaType.OBJECT : SchemaType.STRING))),
                    description: p.description,
                };
                if (p.required !== false) required.push(p.name);
            });
        }

        // Add query params
        if (endpoint.queryParams) {
            endpoint.queryParams.forEach(p => {
                properties[p.name] = {
                    type: p.type === "integer" || p.type === "number" ? SchemaType.NUMBER : (p.type === "boolean" ? SchemaType.BOOLEAN : (p.type === "array" ? SchemaType.ARRAY : (p.type === "object" ? SchemaType.OBJECT : SchemaType.STRING))),
                    description: p.description,
                };
                if (p.required) required.push(p.name);
            });
        }

        // Add body params if it's a POST/PUT
        if (endpoint.bodySchema && endpoint.bodySchema.properties) {
            Object.entries(endpoint.bodySchema.properties).forEach(([key, value]: [string, any]) => {
                properties[key] = value;
            });
            if (endpoint.bodySchema.required) {
                required.push(...endpoint.bodySchema.required);
            }
        }

        return {
            name: endpoint.name,
            description: endpoint.description,
            parameters: {
                type: SchemaType.OBJECT,
                properties: Object.keys(properties).length > 0 ? properties : undefined,
                required: required.length > 0 ? required : undefined,
            }
        };
    });

    // Add the special ask_user tool
    tools.push({
        name: "ask_user",
        description: "Ask the user a clear question to get missing information (like an ID) needed to complete the task.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                question: {
                    type: SchemaType.STRING,
                    description: "The clear question to ask the user.",
                }
            },
            // Note: the Gemini SDK type definition sometimes balks at `required` on empty objects,
            // but this matches the standard schema.
            required: ["question"]
        }
    });

    return [{
        functionDeclarations: tools as any // as any to quiet the strict SDK typedef check on the entire structure
    }];
}
