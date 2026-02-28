# bun-chat Emergency Communications System

## Must Have Features
* admin verify a user
* Implement user-access levels
* Implement member list
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
- Implement user-access levels 
    recommend a simple integer-based "Power Level" in your WebSocketData interface:
    0: Unverified (Read-only)
    1: Verified (Can post/claim tasks)
    2: Zone Admin (Can change status/edit tasks)
    3: System Admin (Can verify users)



