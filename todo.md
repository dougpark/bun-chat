# bun-chat Emergency Communications System

## Must Have Features
* 
* check-in history table and user and admin updates and close
* 
* reactions to a post - up, down, seen, done
* level >=2 public message in dashboard from admin menu

### Optimization Tasks
* In your renderMessage function, check how many messages are in the container. If it's over 200, remove the oldest one before adding the newest one.
* The "Feature Complete" Checklist
Before you pivot to optimization, here is what "Feature Complete" usually looks like for a robust ECS:
The Happy Path: Can a user register, join a tag, post a message, and react?
The Admin Path: Can an admin change a tag's hazard level and verify a user?
The Emergency Path: Can a user hit "Need Help," and does it show up prominently for others?
Persistence: If you pull the plug on the server and restart it, is the state exactly where you left it?

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
done - if any help then show banner on top of home with button to member list
done - member list count of help status

* done - admin verify a user
* done - Implement user-access levels
* done - Implement member list
* done - Unread count bubbles

- Implement user-access levels 
    recommend a simple integer-based "Power Level" in your WebSocketData interface:
    0: Unverified (Read-only)
    1: Verified (Can post/claim tasks)
    2: Zone Admin (Can change status/edit tasks)
    3: System Admin (Can verify users)