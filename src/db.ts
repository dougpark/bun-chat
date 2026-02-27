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
    level INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user' -- 'user' or 'admin'
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
  db.run("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 0");
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
    hazard_level TEXT DEFAULT 'green',
    level INTEGER DEFAULT 0,
    weather TEXT,
    person_in_charge TEXT
  );
`);

try {
  db.run("ALTER TABLE tags ADD COLUMN level INTEGER DEFAULT 0");
} catch (e) { }

db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER,
    user_id INTEGER,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    assigned_to_user_id INTEGER,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
  );
`);

// Seed initial data (for demonstration)
db.run(`INSERT OR IGNORE INTO tags (name, description, hazard_level, weather, person_in_charge, level) VALUES ('#general','General discussion', 'green', 'Normal', 'Admin', 0);`);
db.run(`INSERT OR IGNORE INTO tags (name, description, hazard_level, weather, person_in_charge, level) VALUES ('#medical', 'Medical emergencies', 'yellow', 'Normal', 'Admin', 0);`);
db.run(`INSERT OR IGNORE INTO tags (name, description, hazard_level, weather, person_in_charge, level) VALUES ('#security', 'Security concerns', 'red', 'Normal', 'Admin', 1);`);
db.run(`INSERT OR IGNORE INTO tags (name, description, hazard_level, weather, person_in_charge, level) VALUES ('#Zone Admin', 'Zone discussion', 'green', 'Normal', 'Admin', 2);`);
db.run(`INSERT OR IGNORE INTO tags (name, description, hazard_level, weather, person_in_charge, level) VALUES ('#Sys Admin', 'System discussion', 'green', 'Normal', 'Admin', 3);`);
db.run(`INSERT OR IGNORE INTO users (id, full_name, phone_number, physical_address, is_verified, role, level) VALUES (1, 'Test User', '555-123-4567', '123 Main St', TRUE, 'user', 3);`);

export { db };
