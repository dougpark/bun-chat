# bun-chat Emergency Communications System

## Must Have Features
1. done - Show timezones in client to client local timezone; relative time, 15min ago
2. Implement user-registration
3. Implement user-login
4. Implement user-profile page with update name, email, address, phone number, password, etc.
5. Implement user-access levels such as: user, verified, #tag person in charge (pic), system admin, system pic
    Item #5 (Access Levels)
    You’ve got a good hierarchy. To keep the code clean in your Bun server, I'd recommend a simple integer-based "Power Level" in your WebSocketData interface:
    0: Unverified (Read-only)
    1: Verified (Can post/claim tasks)
    2: Tag PIC (Can change status/edit tasks)
    3: System Admin (Can verify users)
6. Color code top of chat #tag, called #tag status,  based on emergency level: green, yellow, red
7. #tag status at top of UI shows: #tag, color, pic, weather, time
8. Implement active-user page by #tag
9. Implement per #tag to-do page with pic level to create, modify, update, delete a to-do and loggin in user to claim
10. done - light/dark system theme

### Future Features
- image upload
- profile photos
- browser to phone notifications iphone/android
- 


### Nice to have Features
- emoji picker
- wasm process to resize uploaded images for network and server performance
- local map with grid for emergency tracking
