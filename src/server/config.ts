// Server-side configuration constants

export const OLLAMA_CONFIG = {
    /** Base URL of the Ollama server. Override with OLLAMA_URL env var. */
    baseUrl: process.env.OLLAMA_URL || 'http://192.168.1.92:11434',

    /** LLM model to use for image analysis. Must be a vision-capable model (e.g. llava, llava-phi3, moondream). */
    model: process.env.OLLAMA_MODEL || 'gemma3:4b',

    /** Prompt sent alongside each image. */
    prompt: 'Describe this image concisely in 2-4 sentences. Focus on the main subject, any visible text, and any situational or safety-relevant details.',

    /** Max time (ms) to wait for a response from Ollama before giving up. */
    timeoutMs: 90_000,
};
