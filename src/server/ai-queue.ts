import type { Server } from "bun";
import { db } from "./db";
import { analyzeImageWithOllama } from "./ollama";
import type { WebSocketData } from "./ws/handlers";

interface QueueItem {
    postId: number;
    imagePath: string;
    tagName: string;
    server: Server<WebSocketData>;
}

const queue: QueueItem[] = [];
let processing = false;

/**
 * Adds an image post to the AI analysis queue.
 * The queue is drained sequentially so Ollama is not overwhelmed.
 * When analysis completes, the result is saved to the DB and broadcast
 * as an `aiSummaryReady` WebSocket message to all tag subscribers.
 */
export function enqueueImageAnalysis(item: QueueItem): void {
    queue.push(item);
    if (!processing) drainQueue();
}

async function drainQueue(): Promise<void> {
    processing = true;
    while (queue.length > 0) {
        const item = queue.shift()!;
        try {
            console.log(`[AI Queue] Analyzing post ${item.postId}…`);
            const summary = await analyzeImageWithOllama(item.imagePath);

            db.run(
                "UPDATE posts SET ai_summary = $summary WHERE id = $id",
                { $summary: summary, $id: item.postId } as any
            );

            item.server.publish(
                item.tagName,
                JSON.stringify({ type: "aiSummaryReady", postId: item.postId, aiSummary: summary })
            );

            console.log(`[AI Queue] Done — post ${item.postId}`);
        } catch (err) {
            console.error(`[AI Queue] Failed for post ${item.postId}:`, err);
            // Mark as attempted so the UI stops showing "Analyzing…"
            db.run(
                "UPDATE posts SET ai_summary = $summary WHERE id = $id",
                { $summary: "[AI summary unavailable]", $id: item.postId } as any
            );
            item.server.publish(
                item.tagName,
                JSON.stringify({
                    type: "aiSummaryReady",
                    postId: item.postId,
                    aiSummary: "[AI summary unavailable]",
                })
            );
        }
    }
    processing = false;
}
