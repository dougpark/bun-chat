export namespace DOM_AUTH {
    // You have to use 'let' because they start as undefined
    export let loginForm: HTMLFormElement;
    export let registerForm: HTMLFormElement;
    export let authError: HTMLDivElement;
    export let profileForm: HTMLFormElement;
    export let profileMessage: HTMLDivElement;

    // The single function that "fills" the variables above
    export function init() {
        DOM_AUTH.loginForm = document.getElementById('login-form') as HTMLFormElement;
        DOM_AUTH.registerForm = document.getElementById('register-form') as HTMLFormElement;
        DOM_AUTH.authError = document.getElementById('auth-error') as HTMLDivElement;
        DOM_AUTH.profileForm = document.getElementById('profile-form') as HTMLFormElement;
        DOM_AUTH.profileMessage = document.getElementById('profile-message') as HTMLDivElement;
    }
}   
