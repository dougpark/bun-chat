// public/static/script.js

document.addEventListener('DOMContentLoaded', () => {
    const messageList = document.getElementById('message-list');
    const postForm = document.getElementById('post-form');
    const postContent = document.getElementById('post-content');
    const taskList = document.getElementById('task-list');
    const zoneHeader = document.getElementById('zone-header');

    const ws = new WebSocket(`ws://localhost:3000/ws`);

    ws.onopen = () => {
        console.log('WebSocket connection established.');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message from server:', data);

        if (data.type === 'newPost') {
            addMessageToChat(data.post);
        } else if (data.type === 'taskUpdate') {
            updateTaskBoard(data.task);
        } else if (data.type === 'tagUpdate') {
            updateZoneHeader(data.tag);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed.');
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    // Handle new post submission
    postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = postContent.value.trim();
        if (content) {
            // In a real app, you'd send user ID and tag ID
            const message = { type: 'post', content: content, tag: '#general' };
            ws.send(JSON.stringify(message));
            postContent.value = '';
        }
    });

    // Helper function to add messages to the UI
    function addMessageToChat(post) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-gray-800 p-3 rounded-lg';
        messageDiv.innerHTML = `
            <p class="text-sm text-gray-400">${post.userName} - ${new Date(post.timestamp).toLocaleTimeString()}</p>
            <p>${post.content}</p>
        `;
        messageList.prepend(messageDiv); // Add new messages at the top
    }

    // Placeholder for updating task board
    function updateTaskBoard(task) {
        console.log('Updating task board with task:', task);
        // Logic to find and update/add task in taskList
    }

    // Placeholder for updating zone header
    function updateZoneHeader(tag) {
        console.log('Updating zone header with tag info:', tag);
        // Logic to update zoneHeader innerHTML
        zoneHeader.innerHTML = `${tag.name} | Hazard: ${tag.hazard_level} | Weather: ${tag.weather} | PIC: ${tag.person_in_charge}`;
    }

    // Initial fetch for data (e.g., existing posts, tasks, tag info)
    // In a real application, this would involve API calls upon user authentication and tag selection.
    // For now, we assume initial data is loaded with the HTML or pushed via WebSocket on connection.
});
