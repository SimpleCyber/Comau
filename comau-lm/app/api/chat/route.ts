import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "Messages are required" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key is missing. Please configure it in .env.local" }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Format history for Gemini API
        // Gemini expects an array of objects with 'role' (user or model) and 'parts' [{ text: string }]
        // The first message in history MUST be from the 'user' role.
        const filteredMessages = messages.slice(0, -1);
        const firstUserIndex = filteredMessages.findIndex((msg: any) => msg.role === "user");

        const history = (firstUserIndex === -1 ? [] : filteredMessages.slice(firstUserIndex)).map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));

        const currentMessage = messages[messages.length - 1].content;

        const chat = model.startChat({
            history,
        });

        const result = await chat.sendMessage(currentMessage);
        const responseText = result.response.text();

        return NextResponse.json({ text: responseText });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch response" }, { status: 500 });
    }
}
