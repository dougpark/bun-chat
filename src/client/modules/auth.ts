// src/client/modules/auth.ts
import { DOM_AUTH } from './dom-auth.ts';
import { USER_LEVELS } from '../../shared/constants.ts';
import type { User } from '../types/types.ts';
import * as NAV from './navigation.ts';

// ========== STATE ========== //
export let currentUserLevel = 0;
export let currentUserName = '';
export let currentUserId = 0;

// ========== TYPE DEFINITIONS ========== //
export interface AuthConfig {
    viewAuth: HTMLDivElement;
    navAdmin: HTMLDivElement;
    onAuthSuccess: () => void;  // Call initWebSocket
}

// ========== AUTH CHECK ========== //
export async function checkAuth(config: AuthConfig): Promise<User | null> {
    try {
        const res = await fetch('/api/me');
        if (res.ok) {
            const user: User = await res.json();
            config.viewAuth.classList.add('hidden');

            // Update state
            currentUserLevel = user.user_level || 0;
            currentUserName = user.name || 'Admin';
            currentUserId = user.id || 0;

            if ((user.user_level || 0) >= 2) {
                config.navAdmin.classList.remove('hidden');
            } else {
                config.navAdmin.classList.add('hidden');
            }

            config.onAuthSuccess();
            return user;
        } else {
            config.viewAuth.classList.remove('hidden');
            return null;
        }
    } catch (e) {
        console.error('Auth check failed:', e);
        config.viewAuth.classList.remove('hidden');
        return null;
    }
}

// ========== AUTH MODE TOGGLE ========== //
export function toggleAuthMode(mode: string): void {
    DOM_AUTH.init();
    DOM_AUTH.authError.classList.add('hidden');
    DOM_AUTH.authError.textContent = '';
    if (mode === 'register') {
        DOM_AUTH.loginForm.classList.add('hidden');
        DOM_AUTH.registerForm.classList.remove('hidden');
    } else {
        DOM_AUTH.loginForm.classList.remove('hidden');
        DOM_AUTH.registerForm.classList.add('hidden');
    }
}

// ========== AUTH FORM SUBMISSION ========== //
export async function handleAuthSubmit(
    e: SubmitEvent,
    url: string,
    config: AuthConfig
): Promise<void> {
    e.preventDefault();
    DOM_AUTH.authError.classList.add('hidden');

    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            // Success
            config.viewAuth.classList.add('hidden');
            config.onAuthSuccess();
            (e.target as HTMLFormElement).reset();
        } else {
            const result = await res.json() as Record<string, string>;
            DOM_AUTH.authError.textContent = result.error || 'Authentication failed';
            DOM_AUTH.authError.classList.remove('hidden');
        }
    } catch (err) {
        DOM_AUTH.authError.textContent = 'Network error occurred';
        DOM_AUTH.authError.classList.remove('hidden');
    }
}

// ========== FORM SETUP ========== //
export function initAuthForms(config: AuthConfig): void {
    DOM_AUTH.loginForm.addEventListener('submit', (e: Event) =>
        handleAuthSubmit(e as SubmitEvent, '/api/login', config)
    );
    DOM_AUTH.registerForm.addEventListener('submit', (e: Event) =>
        handleAuthSubmit(e as SubmitEvent, '/api/register', config)
    );
}

// ========== PROFILE MANAGEMENT ========== //
export async function openProfile(): Promise<void> {
    try {
        const res = await fetch('/api/me');
        if (res.ok) {
            const user: User = await res.json();
            const form = document.getElementById('profile-form') as HTMLFormElement;
            (form.elements.namedItem('full_name') as HTMLInputElement).value = user.full_name || '';
            (form.elements.namedItem('email') as HTMLInputElement).value = user.email || '';
            (form.elements.namedItem('phone_number') as HTMLInputElement).value = user.phone_number || '';
            (form.elements.namedItem('physical_address') as HTMLInputElement).value = user.physical_address || '';
            (form.elements.namedItem('bio') as HTMLTextAreaElement).value = user.bio || '';

            // Update Level Display
            const levelDisplay = document.getElementById('profile-level-display');
            if (levelDisplay) {
                const level = user.user_level || 0;
                const levelLabel = USER_LEVELS[level as keyof typeof USER_LEVELS]?.label || 'Unknown';
                levelDisplay.textContent = `${level} - ${levelLabel}`;
            }
        }
    } catch (e) {
        console.error('Failed to fetch profile', e);
    }

    NAV.navigateTo('profile');
}

export function initProfileForm(): void {
    DOM_AUTH.profileForm.addEventListener('submit', async (e: Event): Promise<void> => {
        e.preventDefault();
        DOM_AUTH.profileMessage.classList.add('hidden');

        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                DOM_AUTH.profileMessage.textContent = 'Profile updated successfully!';
                DOM_AUTH.profileMessage.className = 'text-center text-sm mt-2 text-green-600 dark:text-green-400';
                DOM_AUTH.profileMessage.classList.remove('hidden');
            } else {
                const result = await res.json() as Record<string, string>;
                DOM_AUTH.profileMessage.textContent = result.error || 'Update failed';
                DOM_AUTH.profileMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                DOM_AUTH.profileMessage.classList.remove('hidden');
            }
        } catch (err) {
            DOM_AUTH.profileMessage.textContent = 'Network error';
            DOM_AUTH.profileMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
            DOM_AUTH.profileMessage.classList.remove('hidden');
        }
    });
}
