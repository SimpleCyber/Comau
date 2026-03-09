import { registerEndpoint } from "../registry";

// 1. GET /advparamfilter
registerEndpoint({
    name: "list_adv_param_filters",
    description: "Lists all advanced parameter filter configurations. Useful for seeing what filters already exist or getting a list of IDs to choose from.",
    method: "GET",
    path: "/advparamfilter",
    responseDescription: "An array of advanced parameter filter objects containing configurationId, configurationName, startTime, endTime, and reportDetail.",
});

// 2. GET /advparamfilter/{id}
registerEndpoint({
    name: "get_adv_param_filter",
    description: "Gets the details of a specific advanced parameter filter by its integer configuration ID.",
    method: "GET",
    path: "/advparamfilter/{id}",
    pathParams: [
        {
            name: "id",
            type: "integer",
            description: "The unique ID (configurationId) of the advanced parameter filter.",
            required: true,
        }
    ],
    responseDescription: "A single advanced parameter filter object.",
});

// 3. POST /advparamfilter
registerEndpoint({
    name: "create_adv_param_filter",
    description: "Creates a new advanced parameter filter.",
    method: "POST",
    path: "/advparamfilter",
    bodySchema: {
        type: "object",
        properties: {
            configurationId: { type: "integer", description: "The ID of the configuration (usually 0 for new)" },
            configurationName: { type: "string", description: "The name of the filter" },
            startTime: { type: "string", description: "ISO date string for start time" },
            endTime: { type: "string", description: "ISO date string for end time" },
            reportDetail: {
                type: "object",
                description: "The details containing variable analysis groups.",
            }
        },
        required: ["configurationName", "startTime", "endTime", "reportDetail"]
    },
    responseDescription: "Empty OK response on success.",
});

// We can omit DELETE for now or add it later if needed. The 3 main ones cover most use cases.
