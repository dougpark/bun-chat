# bun-chat Emergency Communications System

## Must Have Features
* member list count of help status
* claim a help and track status updates, clear help
* Unread count bubbles

### Future Features
- image upload
- profile photos
- browser to phone notifications iphone/android
- admin and pic
- to-do per tag
- llm integration

### Nice to have Features
- emoji picker
- wasm process to resize uploaded images for network and server performance
- local map with grid for emergency tracking

### Design Details
- Tailwind CSS for styling


### Completed

* done - admin verify a user
* done - Implement user-access levels
* done - Implement member list

- Implement user-access levels 
    recommend a simple integer-based "Power Level" in your WebSocketData interface:
    0: Unverified (Read-only)
    1: Verified (Can post/claim tasks)
    2: Zone Admin (Can change status/edit tasks)
    3: System Admin (Can verify users)