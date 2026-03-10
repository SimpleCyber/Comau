import { GoogleGenerativeAI } from "@google/generative-ai";
import { getToolDeclarations } from "./registry";
import { executeApiCall } from "./executor";

// Side-effect import: registers all API endpoints in the registry
import "./endpoints";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash-lite";

export interface ThinkingStep {
    id: number;
    type: "planning" | "api_call" | "analyzing" | "asking_user" | "complete";
    title: string;
    detail: string;
    status: "in_progress" | "done" | "waiting";
    data?: any;
}

export interface AgentResult {
    thinkingSteps: ThinkingStep[];
    finalAnswer: string | null;
    data?: any;
    dataFormat?: "table" | "json";
    needsUserInput?: boolean;
    question?: string;
}

const SYSTEM_INSTRUCTION = `
You are the Comau Line Configuration Agent, a highly intelligent system that helps users interact with the backend Line Configuration Services.
You have access to a variety of REST API functions. Your job is to understand the user's intent, decide which APIs to call, call them, and then summarize the results.

RULES:
1. ALWAYS use the provided tools to fetch data or create records if the user asks something related to the Line Configuration Service. Don't invent data.
2. If an API requires an ID (like a configurationId) and you don't know it, you MUST use the ask_user tool to ask the user for it. If you can fetch a list of items to help the user find the ID, mention that you can do so, or just do it and present the list.
3. If the user asks for "all filters", call the list API and then present the data.
4. Keep your final text answers CONCISE. If you fetch a large JSON array or object, do NOT print the entire JSON in your text response. Say something like "Here are the results you requested." The UI will automatically render the raw data in a table/JSON viewer below your text.
5. You MUST respond with natural language in your final response to synthesize what you found.
6. Think step-by-step.
`;

export async function runAgent(
    history: any[],
    currentMessage: string,
    onStepStream?: (step: ThinkingStep) => void
): Promise<AgentResult> {
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: getToolDeclarations(),
    });

    const chat = model.startChat({
        history: history.map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        })),
    });

    let thinkingSteps: ThinkingStep[] = [];
    let finalAnswer: string | null = null;
    let finalData: any = null;
    let finalDataFormat: "table" | "json" = "json";
    let needsUserInput = false;
    let questionToAsk: string | null = null;
    let stepCounter = 1;

    const addStep = (step: Omit<ThinkingStep, "id">) => {
        const newStep = { ...step, id: stepCounter++ } as ThinkingStep;
        thinkingSteps.push(newStep);
        if (onStepStream) onStepStream(newStep);
        return newStep.id;
    };

    const updateStepStatus = (id: number, status: ThinkingStep["status"], detail?: string, data?: any) => {
        const step = thinkingSteps.find(s => s.id === id);
        if (step) {
            step.status = status;
            if (detail) step.detail = detail;
            if (data) step.data = data;
            // Emit the updated step (the UI component should handle updates by ID)
            if (onStepStream) onStepStream(step);
        }
    };

    // 1. Initial Planning Step
    const planningStepId = addStep({
        type: "planning",
        title: "Planning strategy",
        detail: "Analyzing request to determine which APIs to use...",
        status: "in_progress",
    });

    try {
        let chatResult = await chat.sendMessage(currentMessage);
        updateStepStatus(planningStepId, "done", "Determined next action.");

        // Multi-turn loop for function calls
        let loopCount = 0;
        while (loopCount < 10) { // Safety limit
            loopCount++;
            const functionCalls = chatResult.response.functionCalls();

            // If no function calls, Gemini is giving us the final text answer
            if (!functionCalls || functionCalls.length === 0) {
                finalAnswer = chatResult.response.text();

                // Final completion step
                addStep({
                    type: "complete",
                    title: "Complete",
                    detail: "Finished processing request.",
                    status: "done",
                });
                break;
            }

            // Handle function calls
            const call = functionCalls[0]; // We'll handle sequential, one-by-one for simplicity here

            // 2A. Handle "ask_user" explicitly
            if (call.name === "ask_user") {
                const questionArgs = call.args as { question: string };
                needsUserInput = true;
                questionToAsk = questionArgs.question || "Please provide the missing information to proceed.";

                addStep({
                    type: "asking_user",
                    title: "Need more information",
                    detail: questionToAsk,
                    status: "waiting",
                });
                break;
            }

            // 2B. Handle API Calls
            const apiStepId = addStep({
                type: "api_call",
                title: `Calling ${call.name}`,
                detail: `Executing API request with parameters: ${JSON.stringify(call.args)}`,
                status: "in_progress",
            });

            let apiResult;
            try {
                apiResult = await executeApiCall(call.name, call.args as Record<string, any>);
                updateStepStatus(apiStepId, "done", "API call successful.", apiResult);

                // Save the last requested data to display in the UI
                finalData = apiResult;
                finalDataFormat = Array.isArray(apiResult) ? "table" : "json";

            } catch (error: any) {
                apiResult = { error: error.message };
                updateStepStatus(apiStepId, "done", `API call failed: ${error.message}`);
            }

            // Send the function result back to Gemini so it can analyze it
            const analyzeStepId = addStep({
                type: "analyzing",
                title: "Analyzing results",
                detail: "Processing the API response...",
                status: "in_progress",
            });

            chatResult = await chat.sendMessage([{
                functionResponse: {
                    name: call.name,
                    response: apiResult,
                }
            }]);

            updateStepStatus(analyzeStepId, "done", "Analysis complete.");
        }

        if (loopCount >= 10) {
            finalAnswer = "I reached my internal loop limit and had to stop. Here is what I found so far.";
        }

    } catch (error: any) {
        console.error("[Agent Orchestrator] Error:", error);
        addStep({
            type: "complete",
            title: "Error occurred",
            detail: error.message || "An unknown error occurred",
            status: "done",
        });
        finalAnswer = `Sorry, I encountered an error: ${error.message}`;
    }

    return {
        thinkingSteps,
        finalAnswer,
        data: finalData,
        dataFormat: finalDataFormat,
        needsUserInput,
        question: questionToAsk || undefined,
    };
}
