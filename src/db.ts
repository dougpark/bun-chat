import { Database } from "bun:sqlite";

const db = new Database("chat.sqlite");

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    physical_address TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user' -- 'user' or 'admin'
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    hazard_level TEXT DEFAULT 'green',
    weather TEXT,
    person_in_charge TEXT
  );
`);

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
db.run(`INSERT OR IGNORE INTO tags (name, description, hazard_level, weather, person_in_charge) VALUES ('#general','General discussion', 'green', 'Normal', 'Admin');`);
db.run(`INSERT OR IGNORE INTO tags (name, description, hazard_level, weather, person_in_charge) VALUES ('#medical', 'Medical emergencies', 'yellow', 'Normal', 'Admin');`);
db.run(`INSERT OR IGNORE INTO tags (name, description, hazard_level, weather, person_in_charge) VALUES ('#security', 'Security concerns', 'red', 'Normal', 'Admin');`);
db.run(`INSERT OR IGNORE INTO tags (name, description, hazard_level, weather, person_in_charge) VALUES ('#hazard', 'Hazardconcerns', 'orange', 'Normal', 'Admin');`);
db.run(`INSERT OR IGNORE INTO tags (name, description, hazard_level, weather, person_in_charge) VALUES ('#damage', 'Damage concerns', 'green', 'Normal', 'Admin');`);
db.run(`INSERT OR IGNORE INTO users (id, full_name, phone_number, physical_address, is_verified, role) VALUES (1, 'Test User', '555-123-4567', '123 Main St', TRUE, 'user');`);

export { db };
