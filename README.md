
# bun-chat: Emergency Communications Server (ECS)

A lightweight, standalone, and "local-first" communication hub designed for emergency coordination in environments with zero internet connectivity.

## 🚀 Key Features

* **Offline-First Architecture:** Runs entirely on a Local Area Network (LAN, WIFI). No dependency on external APIs, CDNs, or internet-based verification.
* **Geographic Chat Zones:** Organize communication into `#tags` (e.g., #medical, #neighborhood-x, #high-school) to prevent information overload.
* **Tactical Status Headers:** Each zone features a pinned status bar for Hazard Levels (Green/Yellow/Red), current weather, and the designated Person in Charge (PIC).
* **Resource Coordination:** Zone-specific To-Do lists allowing users to "Claim" tasks in real-time to avoid duplication of effort.
* **Trust-Based Onboarding:** Fast registration for immediate "Read-Only" access, followed by physical address verification for full "Contributor" rights.

---

## 💻 Tech Stack

* **Runtime:** [Bun.js](https://bun.sh) (High-performance JS runtime)
* **Server:** Native Bun WebSockets & HTTP
* **Database:** SQLite (Embedded, zero-config)
* **Styling:** Tailwind CSS (Compiled locally for offline use)
* **Containerization:** Docker (Standalone image including all assets)

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
* [Bun](https://bun.sh) installed on your Mac or Linux machine.
* A local network (Wi-Fi or Ethernet) to connect client devices.

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/dougpark/bun-chat.git](https://github.com/dougpark/bun-chat.git)
   cd bun-chat

```

2. **Install dependencies:**
```bash
bun install

```


3. **Initialize the Database:**
```bash
bun run db.ts

```


4. **Start the Server:**
```bash
bun run server.ts

```


The ECS will be live at `http://localhost:3010`.

---

## 🐳 Docker Deployment (The "Emergency" Way)

To run this as a standalone appliance that persists data across restarts:

```bash
docker-compose up -d

```

Your `docker-compose.yml` should map a volume for the `chat.sqlite` file to ensure your neighborhood data is never lost.

---

## 📱 Mobile Testing

To test on an iPhone or Android device within your network:

1. Find your local IP (`ipconfig getifaddr en0` on macOS).
2. Navigate to `http://[YOUR_IP]:3000` on the mobile browser.

```
