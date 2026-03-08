// src/client/modules/linkify.ts
//
// Escapes HTML special characters, then wraps http/https URLs in clickable <a> tags.
// Escaping MUST happen before URL replacement so that a crafted URL such as
// "https://x.com/<script>alert(1)</script>" can never inject markup.

export function linkify(text: string): string {
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    return escaped.replace(
        /https?:\/\/[^\s<>"']+/g,
        url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 break-all">${url}</a>`
    );
}
