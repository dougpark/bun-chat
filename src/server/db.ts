import { Database } from "bun:sqlite";

const db = new Database("chat.sqlite");

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    physical_address TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    user_level INTEGER DEFAULT 0, -- userlevel: 0=regular user, 1=member, 2=zone admin, 3=system admin
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Try to add new columns if they don't exist (for migration)
try {
  db.run("ALTER TABLE users ADD COLUMN email TEXT UNIQUE");
} catch (e) { }
try {
  db.run("ALTER TABLE users ADD COLUMN password_hash TEXT");
} catch (e) { }
try {
  db.run("ALTER TABLE users ADD COLUMN user_level INTEGER DEFAULT 0");
} catch (e) { }
try {
  db.run("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
} catch (e) { }
try {
  db.run("ALTER TABLE users ADD COLUMN bio TEXT");
} catch (e) { }

db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    hazard_level_id INTEGER DEFAULT 1, -- 1=Green - Clear, 2=Yellow - Caution, 3=Orange - Warning, 4=Red - Danger
    access_level INTEGER DEFAULT 0, -- accesslevel: 0=regular user, 1=member, 2=zone admin, 3=system admin
    weather_id INTEGER DEFAULT 1, -- 1=Clear, 2=Inclement, 3=Severe, 4=Extreme
    person_in_charge TEXT
  );
`);

try {
  db.run("ALTER TABLE tags ADD COLUMN weather_id INTEGER DEFAULT 1");
  db.run("ALTER TABLE tags ADD COLUMN access_level INTEGER DEFAULT 0");
  db.run("ALTER TABLE tags ADD COLUMN hazard_level_id INTEGER DEFAULT 1");
} catch (e) { }



// Remove legacy columns when SQLite version supports DROP COLUMN
try {
  db.run("ALTER TABLE tags DROP COLUMN weather");
} catch (e) { }
try {
  db.run("ALTER TABLE tags DROP COLUMN hazard_level");
} catch (e) { }

db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER,
    user_id INTEGER,
    content TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'text',
    file_path TEXT,
    thumb_path TEXT,
    superseded_by INTEGER REFERENCES posts(id),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Add superseded_by to posts if not already present (migration)
try {
  db.run("ALTER TABLE posts ADD COLUMN superseded_by INTEGER REFERENCES posts(id)");
} catch (e) { }

// db.run(`
//   CREATE TABLE IF NOT EXISTS tasks (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     tag_id INTEGER,
//     description TEXT NOT NULL,
//     priority TEXT DEFAULT 'medium',
//     assigned_to_user_id INTEGER,
//     status TEXT DEFAULT 'pending',
//     FOREIGN KEY (tag_id) REFERENCES tags(id),
//     FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
//   );
// `);

// checkins table to track user check-ins with location and status
db.run(`
  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    status_id INTEGER, -- '0=ok' or '1=help'
    status TEXT, -- additional info for help status
    lat REAL,
    lng REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// user_tag_presence table to track when a user last viewed a tag
db.run(`
  CREATE TABLE IF NOT EXISTS user_tag_presence (
    user_id INTEGER,
    tag_id INTEGER,
    last_viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tag_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
  );
`);

// announcements table for zone/system admin public announcements
db.run(`
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    announcement_text TEXT NOT NULL,
    hazard_level_id INTEGER DEFAULT 1,
    created_by_user_id INTEGER NOT NULL,
    created_by_user_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    cleared_at DATETIME,
    cleared_by_user_id INTEGER,
    cleared_by_user_name TEXT,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
  );
`);

// post_reactions table — one row per (post, user), reaction: 1=up, -1=down// Composite PK prevents duplicate votes; index on post_id for fast count aggregation
db.run(`
  CREATE TABLE IF NOT EXISTS post_reactions (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    reaction INTEGER NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
db.run(`CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);`);

// Migration: add image support columns to posts
try { db.run("ALTER TABLE posts ADD COLUMN type TEXT NOT NULL DEFAULT 'text'"); } catch (e) { }
try { db.run("ALTER TABLE posts ADD COLUMN file_path TEXT"); } catch (e) { }
try { db.run("ALTER TABLE posts ADD COLUMN thumb_path TEXT"); } catch (e) { }



// Seed initial data (for demonstration)
db.run(`INSERT OR IGNORE INTO tags (name, description,   weather_id, person_in_charge, access_level, hazard_level_id) VALUES ('#general','General discussion',  1, 'Admin', 0, 1);`);
db.run(`INSERT OR IGNORE INTO tags (name, description,   weather_id, person_in_charge, access_level, hazard_level_id) VALUES ('#North Zone', 'North of Main',  2, 'Admin', 0, 2);`);
db.run(`INSERT OR IGNORE INTO tags (name, description,   weather_id, person_in_charge, access_level, hazard_level_id) VALUES ('#South Zone', 'South of Main',  3, 'Admin', 1, 4);`);
db.run(`INSERT OR IGNORE INTO tags (name, description,   weather_id, person_in_charge, access_level, hazard_level_id) VALUES ('#Zone Admin', 'Zone discussion',  1, 'Admin', 2, 1);`);
db.run(`INSERT OR IGNORE INTO tags (name, description,   weather_id, person_in_charge, access_level, hazard_level_id) VALUES ('#Sys Admin', 'System discussion', 1, 'Admin', 3, 1);`);

// insert test users with password = 123 
db.run(`INSERT OR IGNORE INTO users (full_name, email, phone_number, physical_address,  user_level, password_hash) VALUES ('Default Admin', 'admin@test.com', '555-123-4567', '123 Main St',  3,'$argon2id$v=19$m=65536,t=2,p=1$WagsD+8fEBEXslcqns5tZuSzo73SKlNHIboe3WlCcZs$ZyPTbNiEvvykivvbfaY/tpPmP2vrD8P02vqjpRwJ6UI');`);
db.run(`INSERT OR IGNORE INTO users (full_name, email, phone_number, physical_address,  user_level, password_hash) VALUES ('Default Zone Admin', 'zone@test.com', '555-123-4567', '123 Main St',  2,'$argon2id$v=19$m=65536,t=2,p=1$WagsD+8fEBEXslcqns5tZuSzo73SKlNHIboe3WlCcZs$ZyPTbNiEvvykivvbfaY/tpPmP2vrD8P02vqjpRwJ6UI');`);
db.run(`INSERT OR IGNORE INTO users (full_name, email, phone_number, physical_address,  user_level, password_hash) VALUES ('Default Approved User', 'user1@test.com', '555-123-4567', '123 Main St',  1,'$argon2id$v=19$m=65536,t=2,p=1$WagsD+8fEBEXslcqns5tZuSzo73SKlNHIboe3WlCcZs$ZyPTbNiEvvykivvbfaY/tpPmP2vrD8P02vqjpRwJ6UI');`);
db.run(`INSERT OR IGNORE INTO users (full_name, email, phone_number, physical_address,  user_level, password_hash) VALUES ('Default New User', 'user0@test.com', '555-123-4567', '123 Main St',  0,'$argon2id$v=19$m=65536,t=2,p=1$WagsD+8fEBEXslcqns5tZuSzo73SKlNHIboe3WlCcZs$ZyPTbNiEvvykivvbfaY/tpPmP2vrD8P02vqjpRwJ6UI');`);

export { db };
