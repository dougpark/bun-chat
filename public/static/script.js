// public/static/script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const messageContainer = document.getElementById('message-container');
    const postForm = document.getElementById('post-form');
    const postContent = document.getElementById('post-content');
    const activeTagName = document.getElementById('active-tag-name');
    const connectionStatus = document.getElementById('connection-status');

    // View Management
    const viewHome = document.getElementById('view-home');
    const viewChat = document.getElementById('view-chat');

    let currentTag = '#general';

    // WebSocket Setup
    const ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onopen = () => {
        console.log('WebSocket connection established.');
        updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // console.log('Message from server:', data);

        if (data.type === 'newPost') {
            addMessageToChat(data.post);
        } else if (data.type === 'history') {
            messageContainer.innerHTML = ''; // Clear previous messages
            data.posts.forEach(post => addMessageToChat(post));
        } else if (data.type === 'error') {
            alert(data.message);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed.');
        updateConnectionStatus(false);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };

    // UI Logic: Navigation
    window.openZone = (tagName) => {
        currentTag = tagName;
        activeTagName.textContent = tagName;

        // Clear previous messages
        messageContainer.innerHTML = '';

        // Slide animation: Move chat into view
        viewChat.classList.remove('translate-x-full');
        viewChat.classList.add('translate-x-0');

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'subscribe', tag: tagName }));
        }
    };

    window.goHome = () => {
        // Slide animation: Move chat out of view
        viewChat.classList.remove('translate-x-0');
        viewChat.classList.add('translate-x-full');
    };

    // UI Logic: Forms
    postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = postContent.value.trim();
        if (content) {
            // Assume authentication is handled via cookie or session logic on server for now
            // or we'd send a token. relying on ws.data for now.
            const message = { type: 'post', content: content, tag: currentTag };
            ws.send(JSON.stringify(message));
            postContent.value = '';
        }
    });

    // Helper: Add Message
    function addMessageToChat(post) {
        // Only show message if it belongs to the current tag (simple client-side filter)
        // In a real app, server handles subscriptions.
        if (post.tagName && post.tagName !== currentTag) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-white p-3 rounded-lg shadow-sm border border-slate-200 self-start max-w-[85%] animate-fade-in-up';

        const timeString = new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <p class="text-xs font-bold text-indigo-600 mb-1">${post.userName}</p>
            <p class="text-slate-800">${post.content}</p>
            <p class="text-[10px] text-slate-400 mt-1">${timeString}</p>
        `;

        messageContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    function updateConnectionStatus(isOnline) {
        if (!connectionStatus) return;

        if (isOnline) {
            connectionStatus.classList.remove('bg-red-500');
            connectionStatus.classList.add('bg-emerald-400', 'animate-pulse');
        } else {
            connectionStatus.classList.remove('bg-emerald-400', 'animate-pulse');
            connectionStatus.classList.add('bg-red-500');
        }
    }
});
