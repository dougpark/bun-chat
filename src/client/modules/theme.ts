// src/client/modules/theme.ts

const html = document.documentElement;

function applyTheme(isDark: boolean): void {
    if (isDark) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

export function initTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        applyTheme(true);
    } else {
        applyTheme(false);
    }
}

export function toggleTheme(): void {
    applyTheme(!html.classList.contains('dark'));
}
