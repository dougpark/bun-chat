import type { Server } from "bun";
import { db } from "./db";
import { OLLAMA_CHAT_CONFIG } from "./config";
import type { WebSocketData } from "./ws/handlers";

interface ChatQueueItem {
    postId: number;
    userMessage: string;
    tagName: string;
    server: Server<WebSocketData>;
}

const queue: ChatQueueItem[] = [];
let processing = false;

/**
 * Enqueues a post that triggered @chat for an LLM reply.
 * The reply text is appended to the original post content and broadcast
 * as a `chatReply` WebSocket event so all subscribers update live.
 */
export function enqueueChatReply(item: ChatQueueItem): void {
    queue.push(item);
    if (!processing) drainQueue();
}

async function drainQueue(): Promise<void> {
    processing = true;
    while (queue.length > 0) {
        const item = queue.shift()!;
        try {
            console.log(`[Chat Queue] Generating reply for post ${item.postId}…`);
            const reply = await queryChatModel(item.userMessage);

            const updatedContent = db.query("SELECT content FROM posts WHERE id = $id")
                .get({ $id: item.postId }) as { content: string } | null;

            const newContent = `${updatedContent?.content ?? item.userMessage}\n\n**@chat:** ${reply}`;

            db.run(
                "UPDATE posts SET content = $content WHERE id = $id",
                { $content: newContent, $id: item.postId } as any
            );

            item.server.publish(
                item.tagName,
                JSON.stringify({ type: "chatReply", postId: item.postId, reply })
            );

            console.log(`[Chat Queue] Done — post ${item.postId}`);
        } catch (err) {
            console.error(`[Chat Queue] Failed for post ${item.postId}:`, err);
        }
    }
    processing = false;
}

async function queryChatModel(userMessage: string): Promise<string> {
    const response = await fetch(`${OLLAMA_CHAT_CONFIG.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: OLLAMA_CHAT_CONFIG.model,
            stream: false,
            messages: [
                { role: "system", content: OLLAMA_CHAT_CONFIG.systemPrompt },
                {
                    role: "user",
                    content: userMessage
                        .replace(/(@chat|!chat|\/chat)\b\s*/gi, "") // strip word triggers
                        .replace(/^(?:chat\b|[?.]\s*)/i, "")            // strip prefix-only triggers
                        .trim(),
                },
            ],
        }),
        signal: AbortSignal.timeout(OLLAMA_CHAT_CONFIG.timeoutMs),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Ollama chat responded ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json() as { message?: { content?: string } };
    return (data.message?.content ?? "").trim();
}
