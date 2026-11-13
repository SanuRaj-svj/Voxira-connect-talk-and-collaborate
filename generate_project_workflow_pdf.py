from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, PageBreak

OUTPUT_FILE = 'Voxira_Project_Workflow.pdf'


def add_section(story, title, paragraphs, styles):
    story.append(Paragraph(title, styles['h1']))
    for p in paragraphs:
        story.append(Paragraph(p, styles['body']))
        story.append(Spacer(1, 6))


def build_pdf():
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        alignment=1,
        spaceAfter=18,
    )
    h1_style = ParagraphStyle(
        'H1Style',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        spaceBefore=14,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        spaceAfter=6,
    )
    styles.add(title_style)
    styles.add(h1_style)
    styles.add(body_style)

    story = [
        Paragraph('Voxira Project Workflow and Feature Documentation', title_style),
        Spacer(1, 10),
        Paragraph('Prepared from the current project implementation in the workspace.', body_style),
        Spacer(1, 10),
    ]

    add_section(
        story,
        '1. Project Overview',
        [
            'Voxira is a virtual collaboration platform designed to support real-time meetings, chat, screen sharing, whiteboard drawing, code collaboration, and live session replay. The project is split into a Node.js backend and a React frontend, with Socket.IO handling real-time communication and MongoDB storing user accounts and meeting metadata.',
            'The application is intended for users who want a lightweight meeting experience with a modern interface. It allows authenticated users to create a meeting room and guest users to join through an invite link. The architecture is intentionally simple but includes multiple collaborative workflows inside one room.',
            'At a high level, the flow is: landing page -> authentication -> scheduling or joining -> lobby -> live collaborative room -> room actions like chat, screen share, mic toggle, whiteboard, code editor, and host controls.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '2. System Architecture',
        [
            'Frontend: React + Vite runs in the browser and manages UI, route transitions, local media capture, WebRTC peer connections, and collaborative room interaction.',
            'Backend: Express app is the API server and Socket.IO server. It exposes authentication endpoints and tracks real-time room membership in memory.',
            'Database: MongoDB stores users and scheduled meeting records. The User model stores name, username, password hash, and token. The Meeting model stores user_id, meeting_id, and date.',
            'Real-time communication: Socket.IO is used to manage room membership, direct peer signaling, chat, whiteboard updates, code changes, host commands, and meeting termination events.',
            'WebRTC: The browser uses RTCPeerConnection with Google STUN to establish peer-to-peer video/audio streams between participants in the same room.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '3. User Authentication Workflow',
        [
            'The authentication flow starts from the landing screen. Users can choose to sign in or create an account. The UI is handled by Authentication.jsx and the shared state comes from AuthContext.',
            'On login, the client calls POST /api/v1/users/login with username and password. On registration, it calls POST /api/v1/users/register with name, username, and password. The backend validates the request, checks unique username rules, hashes the password with bcrypt, and stores the user.',
            'The backend login routine searches for the user in MongoDB, compares the submitted password using bcrypt.compare, creates a random token, stores it on the user document, and responds with a success message and token. The frontend stores the user object in localStorage and sets the global auth context.',
            'The logout action clears the localStorage entry and sets the user context to null. This returns the app to a guest-style flow and hides schedule-specific features unless the user logs back in.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '4. Landing Page Workflow',
        [
            'The landing page is the entry screen of the product. It shows a hero section with animated background shapes and marketing copy, plus action buttons for login, signup, schedule meeting, join meeting, and logout.',
            'If a user is authenticated, the app shows schedule and join controls. If not, it shows login/signup controls and a guest join option. The landing page can also display meeting history read from localStorage so the user can reopen recent meeting links.',
            'Navigation is handled through React Router. The route structure is: / = landing page, /auth = authentication page, /schedule = scheduling page, /:url = live meeting room.',
            'The join meeting action chooses a random room ID if there is an authenticated user; otherwise it pushes the user to the auth page.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '5. Meeting Scheduling Workflow',
        [
            'Authenticated users can create a scheduled meeting through ScheduleMeeting.jsx. A user who is not logged in is blocked and redirected to the sign-in screen.',
            'The scheduling form captures meeting title, date, time, and description. A meeting room ID is generated as room-xxxxx using a random string. A full meeting link is created using window.location.origin + /{meetingId}.',
            'When the user clicks Generate link, the app saves the meeting metadata into localStorage under the meeting history key. It also copies the link to the clipboard if the browser supports it. The scheduled room can then be opened immediately via the Open meeting button.',
            'This workflow is a lightweight planning tool rather than a database-backed scheduling system. It is used for convenience and quick access rather than full calendar integration.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '6. Joining a Meeting and Lobby Workflow',
        [
            'When a user enters the meeting route, VideoMeetComponent loads and checks whether the user is authenticated or a guest. The lobby allows a host to define a room ID or a guest to paste a meeting invite link.',
            'Host flow: the UI sets a room ID, updates the browser URL to /{room}, and emits join-call with room, userId, and isHost. Guest flow: the app validates the invite link format, normalizes the path, sets the new room, and emits the same join-call payload with isHost false.',
            'A valid guest link must be either an absolute URL or a relative path starting with /. The guest route is rejected if it points to auth or schedule pages or if the link is malformed. Once validated, the meeting room opens and the app transitions from lobby state to live meeting room.',
            'The lobby also pre-requests access to local camera and microphone using navigator.mediaDevices.getUserMedia. It reflects the current camera and mic availability in the user interface so the user knows whether access is blocked or enabled.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '7. Real-Time Room Management',
        [
            'The backend socket manager keeps in-memory room state with three main structures: connections, messages, and roomHosts. Each room is keyed by meeting ID and contains a list of connected socket IDs. The host is determined by the socket ID captured when the first participant creates the room and marks isHost as true.',
            'On join-call, the server adds the client to the room if not already present, assigns host status when required, sends user-joined events to all participants, and responds with room-state containing the host ID and current room members. It also emits all previous chat messages in that room so new joiners see the earlier conversation history.',
            'When the host ends the meeting, the server emits meeting-ended to everyone in the room and clears the room state. When a participant disconnects, the backend removes them from the room list and, if the host leaves, it forces all remaining users out and disconnects their sockets.',
            'This in-memory model is sufficient for a lightweight collaborative meeting app but does not persist room state after restart, which is why meeting history is handled on the client side instead of server-side storage.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '8. Video and Audio Workflow',
        [
            'The live meeting screen renders a local video tile and one or more remote video tiles. Each participant connects with WebRTC using RTCPeerConnection. When a new user joins a room, the system creates offers to all other peers and exchanges SDPs through the signal event.',
            'The signal event includes the sender socket ID and the WebRTC signal payload. The client receives it, creates or reuses the peer connection, then handles offer, answer, and ICE candidates as needed. This establishes the connection necessary for live audio and video exchange.',
            'Microphone and camera state are controlled by toggles in the meeting room. The toggle functions update local track.enabled values and emit media-state-change to the room. If the user is the host, the host can change media state for all members; otherwise the own-device control is limited to the current participant.',
            'Screen sharing is supported by getDisplayMedia. The app captures the display stream, swaps the video track on all peer connections, and sets the local video element to the screen stream. When the screen share ends, the app restores the webcam stream.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '9. Chat and Reactions Workflow',
        [
            'The chat panel is one of the most active collaboration features. Messages are sent via socket.io using the chat-message event with the text content and sender name. The backend stores a copy of the message in the per-room message list and broadcasts it to everyone in that room.',
            'The frontend listens for chat-message and pushes a new bubble to the UI with metadata such as sender, timestamp, and a mine flag to align the message to the current user. Quick reactions such as emoji are also sent using the same event type, making them appear in the same conversation stream.',
            'This means the room chat persists only while the server is running and while the room is active. When a room is torn down, the in-memory messages are cleared. That is why the app does not keep full historical chat archives in MongoDB.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '10. Whiteboard Workflow',
        [
            'The whiteboard is rendered on an HTML canvas inside the meeting room. Users can select a color, draw freehand strokes, clear the canvas, and export the drawing as a PNG image.',
            'The draw lifecycle works as follows: pointer down starts a new stroke, pointer move records points, pointer up finalizes the stroke and emits whiteboard-update to the room. The backend relays the stroke payload to all other members in the room. The receiving client draws the same points on its local canvas to synchronize the board across participants.',
            'The export action uses canvas.toDataURL and creates a downloadable PNG file. The app also logs whiteboard activity in the session replay timeline so the activity can be reviewed later.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '11. Code Collaboration Workflow',
        [
            'The code panel offers a text area that can switch between JavaScript, TypeScript, Python, HTML, and CSS. Code changes are synchronized in real time using the code-update event.',
            'Typing in the editor triggers handleCodeChange, which updates the local state and broadcasts the new value to the room. The server does not store code content in the database; it simply forwards the latest text to connected peers in the room using the code-update socket event.',
            'Every code update is also recorded in the session replay list, which creates a visible activity log. The feature is especially suited for technical walkthroughs, pair programming, or live debugging sessions.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '12. Session Replay and Activity Tracking',
        [
            'The Replays tab maintains a timeline of user actions including chat messages, code updates, and whiteboard events. Each entry contains a type, description, timestamp, and payload. The app can play the activity back using a timer that advances through the replay list automatically.',
            'This feature is not a true video recording or event sourcing engine. Instead, it creates a lightweight timeline of collaboration activity for the current browser session. It is helpful for quick review and summarization of what happened in the meeting room.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '13. Host Controls Workflow',
        [
            'The host role is determined when a user joins with isHost true. The host is marked in the top bar and receives extra controls: Mute all, End meeting, and room-wide media toggles. Host-only actions are protected on the server by checking whether roomHosts[room] === socket.id.',
            'Mute all sends a media-state-change event with target equal to all and mediaType audio. The backend verifies that the sender is room host before broadcasting the change. End meeting calls host-end-meeting, which clears the room state and notifies all remaining participants that the meeting has ended.',
            'Role enforcement is mostly client-friendly and server-authoritative, meaning authorized actions must be validated on the backend before processing. This is important because direct browser calls can otherwise trigger unauthorized room control actions.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '14. Backend API Endpoints and Data Model',
        [
            'Endpoint: POST /api/v1/users/register. Input: name, username, password. Validation ensures all values exist, rejects duplicate usernames, hashes the password, and saves the user.',
            'Endpoint: POST /api/v1/users/login. Input: username, password. Validation ensures credentials exist, finds the user, validates the password with bcrypt, and returns a session token for later use.',
            'MongoDB models: User contains name, username, password, token. Meeting contains user_id, meeting_id, date. Although Meeting is defined, its primary use is minimal and the app relies more heavily on localStorage and in-memory room storage for ongoing collaboration.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '15. Full End-to-End User Journey',
        [
            '1. A user loads the landing page and chooses to sign in, create an account, or join as guest. 2. If authenticated, they can schedule a meeting or open a random room. 3. If guest, they paste a meeting link and enter the lobby. 4. The app collects camera/mic access and then navigates to the live room. 5. Room members are connected through Socket.IO and WebRTC. 6. Users can chat, share screen, draw on the whiteboard, edit code, and manage host controls. 7. When the session ends, the room is closed and the in-memory state is cleaned up.',
            'This is the core workflow of Voxira: simple onboarding, quick room creation, collaborative live discussion, and controlled meeting lifecycle management.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    add_section(
        story,
        '16. Project Strengths and Current Implementation Notes',
        [
            'The project is a strong prototype for a real-time collaboration platform. It includes all of the major meeting workflows expected in a modern workspace: authentication, scheduling, room creation, live video/audio, chat, collaborative editing, whiteboard sharing, and session replay.',
            'Key implementation strengths include modular client-side routing, real-time socket communication, peer-to-peer video exchange, and a polished front-end experience. The use of localStorage for meeting history and user session makes the app easy to test and use without a full backend session store.',
            'Current limitations include the fact that room state is kept in memory only, meeting history is not persisted to MongoDB, and not all collaboration flows are tied to a persistent backend database. A production version would benefit from persistent room metadata, secure token validation, persistent chat archives, and stronger meeting policies.',
        ],
        {'h1': h1_style, 'body': body_style},
    )

    story.append(PageBreak())
    story.append(Paragraph('Conclusion', h1_style))
    story.append(Paragraph('In summary, Voxira is a real-time meeting collaboration app with a lightweight architecture, real-time room synchronization, and several collaboration tools built into one experience. It successfully blends authentication, meeting scheduling, video conferencing, chat, whiteboard work, live code editing, and meeting moderation into a single product workflow.', body_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph('This document reflects the current project implementation and serves as a workflow guide for developers, teams, and stakeholders reviewing the app structure and feature model.', body_style))

    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        rightMargin=0.7 * inch,
        leftMargin=0.7 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.7 * inch,
    )
    doc.build(story)


if __name__ == '__main__':
    build_pdf()
    print(f'Created: {OUTPUT_FILE}')
