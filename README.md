# 🎥 Voxira — Real-Time Collaboration & Video Conferencing Platform

> **Voxira** is a modern real-time collaboration platform that combines video conferencing with chat, screen sharing, collaborative whiteboarding, live code editing, meeting scheduling, and lightweight session replay — all inside a single meeting room.

The project is built using the **MERN ecosystem**, **WebRTC**, and **Socket.IO** to provide real-time communication and collaboration between participants.

---

## 🚀 Features

### 🎥 Real-Time Video & Audio

* Peer-to-peer video and audio communication using **WebRTC**
* Camera and microphone controls
* Real-time participant connections
* Google STUN server for WebRTC connectivity
* Dynamic local and remote video tiles

### 🖥️ Screen Sharing

* Share your entire screen with meeting participants
* Uses browser `getDisplayMedia()`
* Automatically restores webcam video after screen sharing ends

### 💬 Real-Time Chat

* Instant room-based messaging using **Socket.IO**
* Sender name and timestamps
* Message synchronization between participants
* Emoji/reaction support

### 🎨 Collaborative Whiteboard

* Real-time shared drawing canvas
* Freehand drawing
* Multiple color options
* Clear board functionality
* Export whiteboard as PNG
* Whiteboard activities added to the replay timeline

### 💻 Live Code Collaboration

Collaborate on code during meetings with support for:

* JavaScript
* TypeScript
* Python
* HTML
* CSS

Code changes are synchronized between participants in real time using Socket.IO.

### 📅 Meeting Scheduling

Authenticated users can:

* Create meetings
* Add meeting title
* Select date and time
* Add descriptions
* Generate unique meeting IDs
* Copy meeting links
* Reopen recent meetings

### 🔗 Guest Meeting Access

Participants can join meetings through an invite link without requiring a full authenticated workflow.

### 👑 Host Controls

Meeting hosts have additional controls:

* 🔇 Mute all participants
* 🎤 Control room-wide audio state
* 📹 Control room-wide media state
* 🛑 End the meeting
* Host actions are validated on the backend

### 🔐 Authentication

* User registration
* User login
* Password hashing with **bcrypt**
* Authentication context on the frontend
* Token-based login response
* Logout functionality

### ▶️ Session Replay

Voxira maintains a lightweight activity timeline containing:

* Chat messages
* Code changes
* Whiteboard events
* Timestamps
* Activity descriptions

The timeline can be played back to review what happened during a collaboration session.

---

## 🏗️ System Architecture

```text
                     ┌─────────────────────┐
                     │      Voxira UI      │
                     │   React + Vite      │
                     └──────────┬──────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
         REST API          Socket.IO           WebRTC
              │                 │                 │
              ▼                 ▼                 ▼
        ┌──────────┐      ┌────────────┐    ┌─────────────┐
        │ Express  │      │ Real-Time  │    │ Peer-to-Peer│
        │ Backend  │      │ Room Server│    │ Audio/Video │
        └────┬─────┘      └────────────┘    └─────────────┘
             │
             ▼
        ┌──────────┐
        │ MongoDB  │
        └──────────┘
```

The frontend uses React + Vite for UI, routing, local media capture, WebRTC connections, and collaboration features. The backend uses Express and Socket.IO, while MongoDB stores user and meeting information.

---

## 🛠️ Tech Stack

| Technology       | Purpose                             |
| ---------------- | ----------------------------------- |
| **React.js**     | Frontend UI                         |
| **Vite**         | Frontend development/build tool     |
| **Node.js**      | Backend runtime                     |
| **Express.js**   | REST API server                     |
| **Socket.IO**    | Real-time communication             |
| **WebRTC**       | Peer-to-peer audio/video            |
| **MongoDB**      | Database                            |
| **Mongoose**     | MongoDB data modeling               |
| **bcrypt**       | Password hashing                    |
| **React Router** | Client-side routing                 |
| **HTML Canvas**  | Collaborative whiteboard            |
| **STUN**         | WebRTC connection establishment     |
| **localStorage** | Client-side session/meeting history |

---

## 📂 Main Application Flow

```text
Landing Page
     │
     ├── Login / Register
     │
     ├── Join Meeting
     │
     └── Schedule Meeting
              │
              ▼
            Lobby
              │
              ▼
        Permission Check
       Camera + Microphone
              │
              ▼
       ┌───────────────┐
       │  Live Meeting │
       └───────┬───────┘
               │
     ┌─────────┼──────────┬──────────┐
     ▼         ▼          ▼          ▼
   Video     Chat     Whiteboard   Code
     │         │          │          │
     └─────────┴──────────┴──────────┘
                    │
                    ▼
              Session Replay
                    │
                    ▼
              End Meeting
```

---

## 🔐 Authentication Flow

### Registration

```text
User
 │
 ▼
Registration Form
 │
 ▼
POST /api/v1/users/register
 │
 ▼
Validate Input
 │
 ▼
Check Username
 │
 ▼
Hash Password using bcrypt
 │
 ▼
Store User in MongoDB
```

### Login

```text
User
 │
 ▼
Login Form
 │
 ▼
POST /api/v1/users/login
 │
 ▼
Find User
 │
 ▼
bcrypt.compare()
 │
 ▼
Generate Token
 │
 ▼
Return Success + Token
 │
 ▼
Store User in localStorage
```

The current implementation exposes registration and login through `/api/v1/users/register` and `/api/v1/users/login`.

---

## 🌐 Application Routes

| Route       | Purpose            |
| ----------- | ------------------ |
| `/`         | Landing page       |
| `/auth`     | Authentication     |
| `/schedule` | Meeting scheduling |
| `/:url`     | Live meeting room  |

---

## 📡 Real-Time Communication

Socket.IO is responsible for synchronizing collaboration events between participants.

```text
Client A
   │
   │ Socket.IO
   ▼
Voxira Server
   │
   │ Broadcast
   ▼
Client B
Client C
Client D
```

Real-time events include:

* `join-call`
* `user-joined`
* `room-state`
* `signal`
* `chat-message`
* `whiteboard-update`
* `code-update`
* `media-state-change`
* `host-end-meeting`
* `meeting-ended`

The server maintains room membership and relays collaboration events to participants.

---

## 🎥 WebRTC Architecture

Voxira uses `RTCPeerConnection` for peer-to-peer communication.

```text
              Voxira Signaling Server
                       │
             Socket.IO Signaling
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       User A        User B       User C
          │            │            │
          └────── WebRTC P2P ───────┘
               Audio + Video
```

WebRTC handles:

* Offers
* Answers
* ICE candidates
* Peer connections
* Audio streams
* Video streams

Google STUN is used to assist with establishing peer-to-peer connections.

---

## 🗄️ Database Models

### User

```text
User
├── name
├── username
├── password
└── token
```

### Meeting

```text
Meeting
├── user_id
├── meeting_id
└── date
```

MongoDB stores user accounts and meeting records, while active room state and ongoing collaboration data are primarily maintained in memory.

---

## 🎨 Whiteboard Architecture

```text
User Draws
    │
    ▼
Canvas Pointer Events
    │
    ▼
Capture Stroke Points
    │
    ▼
whiteboard-update
    │
    ▼
Socket.IO Server
    │
    ▼
Other Participants
    │
    ▼
Render Stroke on Canvas
```

The whiteboard also supports PNG export using the browser canvas API.

---

## 💻 Collaborative Code Editor

The code collaboration workflow is designed for:

* Pair programming
* Technical demonstrations
* Live debugging
* Teaching/coding sessions

```text
Typing
  │
  ▼
handleCodeChange()
  │
  ▼
Local State Update
  │
  ▼
code-update
  │
  ▼
Socket.IO
  │
  ▼
Other Participants
```

Code content is synchronized in real time but is not currently persisted in MongoDB.

---

## 👑 Host Management

The first participant joining a room as host becomes the room host.

Host-only capabilities include:

```text
Host
 │
 ├── Mute All
 │
 ├── Media Controls
 │
 └── End Meeting
```

Host-sensitive operations are checked on the server before being processed, rather than relying only on frontend restrictions.

---

## 📊 Session Replay

Voxira records a lightweight activity timeline:

```text
Meeting Started
      │
      ├── 💬 Chat Message
      │
      ├── 💻 Code Updated
      │
      ├── 🎨 Whiteboard Updated
      │
      ├── 💬 Chat Message
      │
      └── 🎨 Whiteboard Updated
               │
               ▼
          Replay Timeline
```

> **Note:** Session Replay is an activity timeline rather than a complete video recording or event-sourcing system.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/voxira.git
cd voxira
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

> Add any additional environment variables required by your local implementation.

### 4. Start the Backend

```bash
npm start
```

or, if your project uses nodemon:

```bash
npm run dev
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 6. Start the Frontend

```bash
npm run dev
```

Open the Vite development URL shown in the terminal.

---

## 🔄 End-to-End User Journey

```text
1. Open Voxira
       ↓
2. Login / Register / Join as Guest
       ↓
3. Schedule or Join Meeting
       ↓
4. Enter Lobby
       ↓
5. Allow Camera & Microphone
       ↓
6. Enter Meeting Room
       ↓
7. Connect using WebRTC + Socket.IO
       ↓
8. Collaborate
   ├── Video/Audio
   ├── Chat
   ├── Screen Sharing
   ├── Whiteboard
   ├── Code Editor
   └── Host Controls
       ↓
9. Review Session Activity
       ↓
10. End Meeting
```

This represents the current end-to-end workflow implemented by Voxira.

---

## 💡 Why Voxira?

Traditional video conferencing applications primarily focus on communication.

**Voxira extends the meeting experience into a collaborative workspace.**

Instead of switching between:

```text
Video Call
   ↓
WhatsApp / Chat
   ↓
Google Meet Screen Share
   ↓
Online Whiteboard
   ↓
Code Editor
   ↓
Meeting Notes
```

Voxira brings multiple collaboration workflows together:

```text
             ┌──────────────┐
             │    VOXIRA    │
             └───────┬──────┘
                     │
       ┌─────────────┼─────────────┐
       │             │             │
    Video          Chat        Screen Share
       │             │             │
       ├─────────────┼─────────────┤
       │             │             │
 Whiteboard      Code Editor   Host Controls
       │             │             │
       └─────────────┼─────────────┘
                     │
              Session Replay
```

---

## 🔮 Future Improvements

The current implementation is a strong prototype, but several areas can be improved for production deployment.

### Backend & Persistence

* Persistent room metadata
* Persistent chat history
* Persistent collaboration events
* Better meeting history management
* Database-backed session storage

### Security

* Stronger token validation
* Token expiration
* Secure authentication/session management
* Improved authorization policies
* Rate limiting

### WebRTC

* TURN server integration
* Better NAT traversal
* Improved handling of large meetings
* Connection quality monitoring

### Collaboration

* Richer code editor
* Code execution/sandboxing
* File sharing
* Persistent whiteboards
* Meeting notes
* Polls and Q&A

### Meeting Management

* Calendar integration
* Recurring meetings
* Meeting invitations
* Participant management
* Waiting room controls

The current documentation specifically identifies in-memory room state, limited persistence, token validation, chat persistence, and meeting policies as areas for production improvement.

---

## 🧪 Current Project Status

**Status:** 🚀 Working Prototype

Voxira currently demonstrates:

* ✅ Authentication
* ✅ Meeting scheduling
* ✅ Guest joining
* ✅ WebRTC video/audio
* ✅ Screen sharing
* ✅ Real-time chat
* ✅ Emoji reactions
* ✅ Collaborative whiteboard
* ✅ Live code collaboration
* ✅ Host moderation
* ✅ Session activity replay

The implementation combines the major workflows expected from a modern real-time collaboration platform.

---

## 📌 Project Highlights

### Real-Time

Powered by **Socket.IO + WebRTC**

### Collaborative

Whiteboard + Code Editor + Chat

### Secure Architecture

Authentication + bcrypt + server-side host validation

### Lightweight

Uses in-memory room management for fast real-time interactions

### Modern Frontend

React + Vite with client-side routing

---

## 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repository

# Create your feature branch
git checkout -b feature/your-feature

# Commit your changes
git commit -m "Add your feature"

# Push your branch
git push origin feature/your-feature
```

Then open a Pull Request.

---

## 📄 License

This project is intended for educational, portfolio, and development purposes.

Add your preferred license here if the repository uses one.

---

## 👨‍💻 Author

**Sanu Raj**

B.Tech — Computer Science & Engineering

Interested in:

* MERN Stack Development
* Java & DSA
* Real-Time Web Applications
* WebRTC
* Software Engineering

---

## ⭐ Support

If you find **Voxira** interesting, consider giving the repository a ⭐ on GitHub!

> **Voxira — Connect. Collaborate. Create.**
