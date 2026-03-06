export namespace DOM {
    // You have to use 'let' because they start as undefined
    export let messageContainer: HTMLDivElement;
    export let postForm: HTMLFormElement;
    export let postContent: HTMLTextAreaElement;
    export let activeTagName: HTMLElement;
    export let connectionStatus: HTMLDivElement;
    export let zoneList: HTMLDivElement;

    // The single function that "fills" the variables above
    export function init() {
        DOM.messageContainer = document.getElementById('message-container') as HTMLDivElement;
        DOM.postForm = document.getElementById('post-form') as HTMLFormElement;
        DOM.postContent = document.getElementById('post-content') as HTMLTextAreaElement;
        DOM.activeTagName = document.getElementById('active-tag-name') as HTMLElement;
        DOM.connectionStatus = document.getElementById('connection-status') as HTMLDivElement;
        DOM.zoneList = document.getElementById('zone-list') as HTMLDivElement;

    }
}