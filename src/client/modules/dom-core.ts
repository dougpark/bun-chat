export namespace DOM_CORE {
    // You have to use 'let' because they start as undefined
    export let messageContainer: HTMLDivElement;
    export let postForm: HTMLFormElement;
    export let postContent: HTMLTextAreaElement;
    export let activeTagName: HTMLElement;
    export let connectionStatus: HTMLDivElement;
    export let homeConnectionStatus: HTMLSpanElement;
    export let zoneList: HTMLDivElement;
    export let chatInputArea: HTMLDivElement;
    export let uploadOverlay: HTMLDivElement;
    export let imageFileInput: HTMLInputElement;
    export let openFilePickerBtn: HTMLButtonElement;
    export let imageModal: HTMLDivElement;
    export let imageModalImg: HTMLImageElement;
    export let imageModalLink: HTMLAnchorElement;
    export let imageModalClose: HTMLButtonElement;

    // The single function that "fills" the variables above
    export function init() {
        DOM_CORE.messageContainer = document.getElementById('message-container') as HTMLDivElement;
        DOM_CORE.postForm = document.getElementById('post-form') as HTMLFormElement;
        DOM_CORE.postContent = document.getElementById('post-content') as HTMLTextAreaElement;
        DOM_CORE.activeTagName = document.getElementById('active-tag-name') as HTMLElement;
        DOM_CORE.connectionStatus = document.getElementById('connection-status') as HTMLDivElement;
        DOM_CORE.homeConnectionStatus = document.getElementById('home-connection-status') as HTMLSpanElement;
        DOM_CORE.zoneList = document.getElementById('zone-list') as HTMLDivElement;
        DOM_CORE.chatInputArea = document.getElementById('chat-input-area') as HTMLDivElement;
        DOM_CORE.uploadOverlay = document.getElementById('upload-overlay') as HTMLDivElement;
        DOM_CORE.imageFileInput = document.getElementById('image-file-input') as HTMLInputElement;
        DOM_CORE.openFilePickerBtn = document.getElementById('open-file-picker') as HTMLButtonElement;
        DOM_CORE.imageModal = document.getElementById('image-modal') as HTMLDivElement;
        DOM_CORE.imageModalImg = document.getElementById('image-modal-img') as HTMLImageElement;
        DOM_CORE.imageModalLink = document.getElementById('image-modal-link') as HTMLAnchorElement;
        DOM_CORE.imageModalClose = document.getElementById('image-modal-close') as HTMLButtonElement;
    }
}