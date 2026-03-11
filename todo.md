# bun-chat Emergency Communications System

## Must Have Features
* implement public_user_id instead of serialized id in user table for rest of code
    public_user_id TEXT UNIQUE DEFAULT (lower(hex(randomblob(16))))

* add unique user_name based on full name
    The Strategy: "Base + Increment"
    The logic involves three steps:
    Sanitize: Take the full name, convert to lowercase, and remove spaces/special characters.
    UI error if full name doesn't have a first and last name included
    Check: Query the database to see if that base name exists.
    Iterate: If it exists, append a number and check again until you find a "hole" or the next available slot.
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- The "Public" face of the user
    public_user_id TEXT UNIQUE DEFAULT (lower(hex(randomblob(16)))), 
    user_name TEXT UNIQUE NOT NULL, -- built from full_name with counter suffix if needed to ensure uniqueness
    
    full_name TEXT NOT NULL, -- must contain first name and last name for display and sorting purposes
    phone_number TEXT NOT NULL,
    physical_address TEXT NOT NULL,
    email TEXT UNIQUE, -- should be NOT NULL, used for login
    password_hash TEXT,

    -- Status tracking (Industry Standard)
    is_active INTEGER DEFAULT 1,
    last_seen_at DATETIME,

    user_level INTEGER DEFAULT 0, -- userlevel: 0=visitor, 1=member, 2=zone admin, 3=system admin
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

* message search using sqlite global search
    Server-Side (Querying): This sends the search term to your Bun server, which asks SQLite to look through every message ever sent. This is the industry standard for apps like Slack, Discord, and WhatsApp.
    Implementation: SQLite Full-Text Search (FTS5)
    The most user-friendly approach is Global Search with Filtering.
    The Default: Search everything the user has access to. If someone is looking for "Sandbags," they don't want to remember if it was posted in the "Emergency" zone or the "General" zone.
    The Filter: Provide a small toggle or "Chip" in the UI to "Search only this zone."
    To make your search feel "Professional," aim for these four features:

    Feature	Description	Why it matters
    Highlighter	Bolding the search term in the results.	Helps the neighbor's eye find the relevant part of the message instantly.
    Jump to Context	Clicking a result takes you to that point in the chat history.	A search result without context (what was said before/after) is often useless.
    Snippet/Preview	Showing 10 words before and after the match.	Saves the user from having to click every result.
    Media Search	Searching the "Image-to-Text" summaries we discussed.	Allows a neighbor to search "Tree" and find the photo of the fallen oak on Park Hill.
    When a user types a term into your search bar:
    The Trigger: As they press "Enter," a new div (the Overlay) slides up from the bottom or fades in.
    The Fetch: Bun queries the SQLite FTS5 table we discussed.
    The Render: The results appear as a scrollable list of "Cards."
    The Context: Each card shows the message, but uses Snippet logic (showing ~5 words before and after the match).
    The Highlight: The search term is wrapped in a <mark class="bg-blue-500"> tag.
    The "Jump": Clicking the card closes the overlay and scrolls the main chat window to that specific message ID.

* save ai-queue to sqlite in case of server reboot

* file upload with limits:
    Implementation for your Admin Screen
    Since you are building an admin panel, you should make these "Magic Numbers" configurable at runtime:
    max_file_size: Default to 10MB.
    uploads_per_hour: Default to 5 per neighbor.
    allowed_extensions: A comma-separated list like .jpg, .png, .pdf.
    Category	Typical Treatment
    Images	Auto-generate thumbnails; high compression (WebP/HEIC).
    Video	Transcode to H.264/H.265; provide a "Play" button (Streaming).
    Documents	Raw storage; provide metadata (size, extension, filename).

*
* dashboard - detect disconnected and offer button to reconnect

* check-in history table and user and admin updates and close
* 



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
- llm integration
- EPrep documents/wikipedia access

### Nice to have Features
- emoji picker
- wasm process to resize uploaded images for network and server performance
- local map with grid for emergency tracking

### Design Details
- Tailwind CSS for styling


### Completed
* image upload with image to text with local Ollama moondream2
* document upload with local ollama search index
* reactions to a post - up, down, seen, done
* dashboard - online section and total members section
* users table - add a column for Bio to show on member list
done - if any help then show banner on top of home with button to member list
done - member list count of help status
* done - level >=2 public message in dashboard from admin menu

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

    implement a thumbs up/down buttons and counts for each chat post. determine the table structure for a new table to keep track of each selection and show the count in real time for every chat post. it should be optimized to handle 500 active users, so thats a lot of potential responses. do not allow a double click for the same response, but they should be able to change their response and have the system remove their old response and record the new one.
    
* @chat to chat with larger Ollama remote aistation
# chat triggers
    Trigger	Match rule
@chat	anywhere (word boundary)
/chat	anywhere (word boundary)
!chat	anywhere (word boundary)
chat	first word of message
?	first character
.	first character