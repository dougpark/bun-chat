import { OLLAMA_CONFIG } from "./config";

/**
 * Sends an image file to Ollama for vision analysis and returns a text summary.
 * Throws on network error or non-2xx HTTP response.
 */
export async function analyzeImageWithOllama(imagePath: string): Promise<string> {
    const buf = await Bun.file(imagePath).arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");

    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: OLLAMA_CONFIG.model,
            prompt: OLLAMA_CONFIG.prompt,
            images: [base64],
            stream: false,
        }),
        signal: AbortSignal.timeout(OLLAMA_CONFIG.timeoutMs),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Ollama responded ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json() as { response?: string };
    return (data.response ?? "").trim();
}
