# Listen With Friends - Social Music Synchronization Platform

Listen With Friends is a real-time, full-stack social music sharing application. Users can create synchronized rooms, search/queue YouTube music tracks, chat, sing along with auto-scrolling karaoke lyrics, and talk to each other in real-time using full-mesh WebRTC voice chat.

---

## 🚀 Key Features

* **Real-time Synced Playback**: Uses YouTube Iframe Player API to ensure every user in the room listens at the exact same second.
* **Apple Music-Style Karaoke Mode**: Displays synchronized lyrics that scroll and light up with the song. Includes a stunning fullscreen view.
* **WebRTC Voice Chat**: Live, low-latency voice rooms using peer-to-peer WebRTC connections (with speaking indicators and local mute toggles).
* **Robust Admin Controls**: Host transfer, kicking participants, and real-time member listings.
* **Responsive Dark Aesthetics**: Dark theme featuring glassmorphism layout containers and neon glow styles.

---

## 🛠️ Project Structure

```text
music/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT Verification Middleware
│   │   ├── models/
│   │   │   ├── User.js             # User Schema (Mongoose)
│   │   │   ├── Room.js             # Room & Queue State Schema
│   │   │   ├── Message.js          # Chat Log Schema
│   │   │   ├── Playlist.js         # Saved Playlists Schema
│   │   │   └── RoomActivity.js     # User Activity Logs Schema
│   │   ├── routes/
│   │   │   ├── auth.js             # Signup, Signin & Profile Routes
│   │   │   └── rooms.js            # Room CRUD & Verification Routes
│   │   ├── services/
│   │   │   └── socket.js           # Real-Time Socket Event Coordinator
│   │   └── server.js               # Express Server & DB Connection Entry
│   ├── .env                        # Local Environment Config
│   └── package.json                # Server-side Dependencies
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx          # Glassmorphic Floating Header
    │   │   ├── YouTubePlayer.jsx   # Synced YT Player & Controls
    │   │   ├── VoiceChat.jsx       # Voice grid & Peer Audio connections
    │   │   ├── KaraokeLyrics.jsx   # Timed Lyrics & Fullscreen Mode
    │   │   ├── SongQueue.jsx       # Queue manager & Popular Track Search
    │   │   ├── RoomChat.jsx        # Text Chat Sidebar
    │   │   └── AdminControls.jsx   # Host Control panel for peers
    │   ├── context/
    │   │   ├── AuthContext.jsx     # User Registration & Profile states
    │   │   ├── SocketContext.jsx   # Persistent Socket wrapper
    │   │   └── RoomContext.jsx     # Real-time data & WebRTC logic
    │   ├── pages/
    │   │   ├── LandingPage.jsx     # Static animated portal
    │   │   ├── LoginPage.jsx       # User login screen
    │   │   ├── RegisterPage.jsx    # User registration screen
    │   │   ├── Dashboard.jsx       # Stats & Room Launcher
    │   │   ├── RoomPage.jsx        # Synchronization room hub
    │   │   ├── ProfilePage.jsx     # Avatar & account stats panel
    │   │   └── SettingsPage.jsx    # Audio volume & buffers preference
    │   ├── utils/
    │   │   ├── config.js           # API and socket endpoints
    │   │   └── popularSongs.js     # Timed lyrics database mappings
    │   ├── App.jsx                 # Route manager & wrappers
    │   ├── index.css               # Global animations, glow & scrollbars
    │   └── main.jsx                # React root mount
    ├── tailwind.config.js          # Tailwind custom theme definitions
    ├── postcss.config.js           # PostCSS compiler config
    ├── index.html                  # HTML entry point (SEO optimized)
    └── package.json                # Client-side Dependencies
```

---

## ⚡ Local Development Setup

### Prerequisite
* **Node.js** (v16.x or higher)
* **MongoDB** (Running locally or an Atlas connection string)

### 1. Configure and Run Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update `.env` variables if necessary (default presets point to standard configurations):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/listen-with-friends
   JWT_SECRET=super_secret_listen_with_friends_jwt_key_2026
   CLIENT_URL=http://localhost:5173
   ```
4. Boot up development server:
   ```bash
   npm run dev
   ```

### 2. Configure and Run Frontend

1. Navigate to the client directory:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot up the Vite preview instance:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 📜 REST API Documentation

All paths are relative to `/api`.

### Auth Endpoints (`/auth`)

* **POST `/register`**: Creates new user profile.
  * *Request Body*: `{ "username": "...", "email": "...", "password": "..." }`
  * *Response*: JWT Token and User object data.
* **POST `/login`**: Validates credentials and fetches token.
  * *Request Body*: `{ "emailOrUsername": "...", "password": "..." }`
* **GET `/me`**: *(Protected)* Fetches authenticated profile details.
* **PUT `/profile`**: *(Protected)* Updates active username or avatar presets.
* **GET `/stats`**: *(Protected)* Fetches user metrics & activity logs history.

### Room Endpoints (`/rooms`)

* **POST `/create`**: *(Protected)* Provisions a new sync room.
  * *Request Body*: `{ "name": "Room Name", "isPrivate": true, "password": "..." }`
* **GET `/public`**: *(Protected)* Lists all active, non-private rooms.
* **GET `/check/:code`**: *(Protected)* Validates a room code's status and checks password requirements.
* **POST `/join/:code`**: *(Protected)* Adds the user to the room's persistent DB participant roster.
* **GET `/recent`**: *(Protected)* Lists the last rooms visited by the current user.

---

## 📡 Web Socket Events

### Client-to-Server
* `join-room` (`{ roomCode }`): Registers client in room roomCode.
* `send-message` (`{ text }`): Sends chat text.
* `sync-music` (`{ isPlaying, playbackTime }`): Broadcasts new playback parameters (Host only).
* `add-to-queue` (`{ videoId, title, duration, thumbnail }`): Appends song to active playlist.
* `remove-from-queue` (`{ songId }`): Removes song from list.
* `skip-song` (): Skips current song.
* `voice-join` (): Joins the room's WebRTC signaling block.
* `voice-leave` (): Exits voice chat signaling.
* `webrtc-signal` (`{ to, signal }`): Forwards WebRTC SDP details to specific socket ID.
* `voice-toggle-mute` (`{ isMuted }`): Syncs microphone mute icon.
* `voice-speaking-indicator` (`{ isSpeaking }`): Lights up user card.
* `admin-kick-user` (`{ targetSocketId }`): Host kicks client socket.
* `admin-transfer-host` (`{ targetSocketId }`): Transfers Host to client socket.

---

## ☁️ Production Deployment Instructions

### MongoDB Atlas Configuration Guide

1. Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new cluster (Shared Free tier is fine).
3. Under **Database Access**, create a database user with Read/Write privileges.
4. Under **Network Access**, add an IP Access List (Use `0.0.0.0/0` to allow traffic from Render/Vercel).
5. Head to **Database**, click **Connect**, select **Drivers**, and copy the connection URI.
6. Replace `<password>` in the URI with your database user password. Pass this string as the `MONGO_URI` variable in production settings.

### Render Backend Deployment

1. Sign in to [Render](https://render.com).
2. Create a new **Web Service** and connect your GitHub repository.
3. Configure the following deployment parameters:
   * **Root Directory**: `backend`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
4. Under **Environment Variables**, configure:
   * `PORT`: `5000`
   * `MONGO_URI`: *(Your MongoDB Atlas URI)*
   * `JWT_SECRET`: *(A secure string)*
   * `CLIENT_URL`: *(Your frontend netlify/vercel URL)*
5. Trigger build and copy the generated Render URL (e.g. `https://listen-with-friends.onrender.com`).

### Frontend Vercel Deployment

1. Sign in to [Vercel](https://vercel.com).
2. Import your GitHub repository.
3. Configure settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `client`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Under **Environment Variables**, define:
   * `VITE_API_URL`: `https://your-render-url.onrender.com/api`
   * `VITE_SOCKET_URL`: `https://your-render-url.onrender.com`
5. Click **Deploy**.
