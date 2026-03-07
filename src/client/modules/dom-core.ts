export namespace DOM_CORE {
    // You have to use 'let' because they start as undefined
    export let messageContainer: HTMLDivElement;
    export let postForm: HTMLFormElement;
    export let postContent: HTMLTextAreaElement;
    export let activeTagName: HTMLElement;
    export let connectionStatus: HTMLDivElement;
    export let zoneList: HTMLDivElement;

    // The single function that "fills" the variables above
    export function init() {
        DOM_CORE.messageContainer = document.getElementById('message-container') as HTMLDivElement;
        DOM_CORE.postForm = document.getElementById('post-form') as HTMLFormElement;
        DOM_CORE.postContent = document.getElementById('post-content') as HTMLTextAreaElement;
        DOM_CORE.activeTagName = document.getElementById('active-tag-name') as HTMLElement;
        DOM_CORE.connectionStatus = document.getElementById('connection-status') as HTMLDivElement;
        DOM_CORE.zoneList = document.getElementById('zone-list') as HTMLDivElement;

    }
}