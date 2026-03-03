import { Database } from "bun:sqlite";

const db = new Database("chat.sqlite");

// Insert 50 unique users with varying levels
// Level 0: Regular user, Level 1: Member, Level 2: Zone Admin, Level 3+: System Admin

const users = [
    { id: 1, name: 'Sarah Johnson', phone: '555-123-4567', address: '123 Maple Ave', level: 3, role: 'admin' },
    { id: 2, name: 'Michael Chen', phone: '555-234-5678', address: '456 Oak Street', level: 2, role: 'zone_admin' },
    { id: 3, name: 'Emily Rodriguez', phone: '555-345-6789', address: '789 Pine Road', level: 2, role: 'zone_admin' },
    { id: 4, name: 'David Thompson', phone: '555-456-7890', address: '321 Birch Lane', level: 1, role: 'user' },
    { id: 5, name: 'Jennifer Lee', phone: '555-567-8901', address: '654 Cedar Court', level: 1, role: 'user' },
    { id: 6, name: 'Robert Williams', phone: '555-678-9012', address: '987 Elm Drive', level: 1, role: 'user' },
    { id: 7, name: 'Jessica Martinez', phone: '555-789-0123', address: '147 Willow Way', level: 0, role: 'user' },
    { id: 8, name: 'James Anderson', phone: '555-890-1234', address: '258 Spruce Terrace', level: 1, role: 'user' },
    { id: 9, name: 'Ashley Taylor', phone: '555-901-2345', address: '369 Ash Boulevard', level: 1, role: 'user' },
    { id: 10, name: 'Christopher Moore', phone: '555-012-3456', address: '741 Redwood Place', level: 2, role: 'zone_admin' },
    { id: 11, name: 'Amanda Jackson', phone: '555-123-7890', address: '852 Hickory Circle', level: 1, role: 'user' },
    { id: 12, name: 'Matthew White', phone: '555-234-8901', address: '963 Sycamore Street', level: 0, role: 'user' },
    { id: 13, name: 'Melissa Harris', phone: '555-345-9012', address: '159 Magnolia Drive', level: 1, role: 'user' },
    { id: 14, name: 'Daniel Martin', phone: '555-456-0123', address: '267 Poplar Lane', level: 1, role: 'user' },
    { id: 15, name: 'Lisa Thompson', phone: '555-567-1234', address: '378 Walnut Court', level: 2, role: 'zone_admin' },
    { id: 16, name: 'Kevin Garcia', phone: '555-678-2345', address: '489 Chestnut Road', level: 0, role: 'user' },
    { id: 17, name: 'Michelle Robinson', phone: '555-789-3456', address: '591 Beech Avenue', level: 1, role: 'user' },
    { id: 18, name: 'Brian Clark', phone: '555-890-4567', address: '612 Dogwood Street', level: 1, role: 'user' },
    { id: 19, name: 'Stephanie Lewis', phone: '555-901-5678', address: '723 Fir Way', level: 0, role: 'user' },
    { id: 20, name: 'Jason Walker', phone: '555-012-6789', address: '834 Hemlock Place', level: 1, role: 'user' },
    { id: 21, name: 'Nicole Hall', phone: '555-123-8901', address: '945 Laurel Terrace', level: 1, role: 'user' },
    { id: 22, name: 'Ryan Allen', phone: '555-234-9012', address: '156 Juniper Circle', level: 3, role: 'admin' },
    { id: 23, name: 'Kimberly Young', phone: '555-345-0123', address: '267 Sequoia Boulevard', level: 0, role: 'user' },
    { id: 24, name: 'Brandon King', phone: '555-456-1234', address: '378 Cottonwood Lane', level: 1, role: 'user' },
    { id: 25, name: 'Rachel Wright', phone: '555-567-2345', address: '489 Cypress Drive', level: 2, role: 'zone_admin' },
    { id: 26, name: 'Justin Lopez', phone: '555-678-3456', address: '591 Buttonwood Court', level: 1, role: 'user' },
    { id: 27, name: 'Heather Hill', phone: '555-789-4567', address: '612 Hawthorn Street', level: 0, role: 'user' },
    { id: 28, name: 'Aaron Scott', phone: '555-890-5678', address: '723 Linden Road', level: 1, role: 'user' },
    { id: 29, name: 'Amber Green', phone: '555-901-6789', address: '834 Buckeye Avenue', level: 1, role: 'user' },
    { id: 30, name: 'Eric Adams', phone: '555-012-7890', address: '945 Alder Way', level: 0, role: 'user' },
    { id: 31, name: 'Samantha Baker', phone: '555-123-9012', address: '156 Basswood Place', level: 1, role: 'user' },
    { id: 32, name: 'Nathan Gonzalez', phone: '555-234-0123', address: '267 Hazel Terrace', level: 2, role: 'zone_admin' },
    { id: 33, name: 'Crystal Nelson', phone: '555-345-1234', address: '378 Ironwood Circle', level: 1, role: 'user' },
    { id: 34, name: 'Adam Carter', phone: '555-456-2345', address: '489 Yellowwood Boulevard', level: 0, role: 'user' },
    { id: 35, name: 'Brittany Mitchell', phone: '555-567-3456', address: '591 Boxelder Lane', level: 1, role: 'user' },
    { id: 36, name: 'Jacob Perez', phone: '555-678-4567', address: '612 Sweetgum Drive', level: 1, role: 'user' },
    { id: 37, name: 'Danielle Roberts', phone: '555-789-5678', address: '723 Tupelo Court', level: 0, role: 'user' },
    { id: 38, name: 'Tyler Turner', phone: '555-890-6789', address: '834 Hornbeam Street', level: 1, role: 'user' },
    { id: 39, name: 'Victoria Phillips', phone: '555-901-7890', address: '945 Silverbell Road', level: 1, role: 'user' },
    { id: 40, name: 'Jordan Campbell', phone: '555-012-8901', address: '156 Redbud Avenue', level: 2, role: 'zone_admin' },
    { id: 41, name: 'Courtney Parker', phone: '555-123-0123', address: '267 Catalpa Way', level: 0, role: 'user' },
    { id: 42, name: 'Austin Evans', phone: '555-234-1234', address: '378 Persimmon Place', level: 1, role: 'user' },
    { id: 43, name: 'Chelsea Edwards', phone: '555-345-2345', address: '489 Ginkgo Terrace', level: 1, role: 'user' },
    { id: 44, name: 'Kyle Collins', phone: '555-456-3456', address: '591 Mulberry Circle', level: 0, role: 'user' },
    { id: 45, name: 'Monica Stewart', phone: '555-567-4567', address: '612 Sassafras Boulevard', level: 1, role: 'user' },
    { id: 46, name: 'Trevor Sanchez', phone: '555-678-5678', address: '723 Locust Lane', level: 1, role: 'user' },
    { id: 47, name: 'Vanessa Morris', phone: '555-789-6789', address: '834 Black Cherry Drive', level: 3, role: 'admin' },
    { id: 48, name: 'Gregory Rogers', phone: '555-890-7890', address: '945 River Birch Court', level: 0, role: 'user' },
    { id: 49, name: 'Andrea Reed', phone: '555-901-8901', address: '156 Mountain Ash Street', level: 1, role: 'user' },
    { id: 50, name: 'Sean Cook', phone: '555-012-9012', address: '267 White Oak Road', level: 1, role: 'user' }
];

users.forEach(user => {
    db.run(`INSERT OR IGNORE INTO users (id, full_name, phone_number, physical_address, is_verified, role, level) VALUES (?, ?, ?, ?, TRUE, ?, ?);`,
        [user.id, user.name, user.phone, user.address, user.role, user.level]
    );
});