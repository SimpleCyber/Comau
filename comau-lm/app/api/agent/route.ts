import { NextResponse } from "next/server";
import { runAgent, ThinkingStep } from "@/lib/agent/orchestrator";

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "Messages are required" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
        }

        // Extract the latest message and history
        const history = messages.slice(0, -1);
        const currentMessage = messages[messages.length - 1].content;

        // Use a TransformStream for Server-Sent Events (SSE)
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();
        const encoder = new TextEncoder();

        const sendEvent = async (data: any) => {
            await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Run the agent in the background and stream results
        (async () => {
            try {
                const result = await runAgent(history, currentMessage, async (step: ThinkingStep) => {
                    await sendEvent({ type: "thinking_step", step });
                });

                // Send the final result
                await sendEvent({
                    type: "final_result",
                    answer: result.finalAnswer,
                    data: result.data,
                    dataFormat: result.dataFormat,
                    needsUserInput: result.needsUserInput,
                    question: result.question,
                });

            } catch (error: any) {
                console.error("Agent error:", error);
                await sendEvent({
                    type: "error",
                    message: error.message || "An error occurred during agent execution",
                });
            } finally {
                await writer.close();
            }
        })();

        // Return the readable stream to the client
        return new Response(stream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error: any) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
    }
}
