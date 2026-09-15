import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontext.jsx';
import '../Styles/VideoMeet.css';

const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const peerConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const generateUserId = () => {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function VideoMeetComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const whiteboardCanvasRef = useRef(null);
  const whiteboardCtxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef([]);

  const getMeetingRouteId = () => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return path && path !== 'auth' ? path : 'room-' + Math.random().toString(36).slice(2, 8);
  };

  const roomNameRef = useRef(getMeetingRouteId());

  const [askForUserName, setAskUserName] = useState(true);
  const [userName, setUserName] = useState(user?.name || 'Guest');
  const [meetingId, setMeetingId] = useState(roomNameRef.current);
  const [guestMeetingInput, setGuestMeetingInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [userId, setUserId] = useState(() => generateUserId());
  const [videoAvailable, setVideoAvailable] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [streamInfo, setStreamInfo] = useState('no stream');
  const [remoteVideos, setRemoteVideos] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isHost, setIsHost] = useState(Boolean(user));
  const [hostSocketId, setHostSocketId] = useState(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const [activeFeature, setActiveFeature] = useState('Chat');
  const [codeValue, setCodeValue] = useState('// Start collaborating here\nconst greet = (name) => `Hello, ${name}!`;\nconsole.log(greet("team"));');
  const [replayEntries, setReplayEntries] = useState([]);
  const [whiteboardColor, setWhiteboardColor] = useState('#8b5cf6');
  const [replayIndex, setReplayIndex] = useState(0);
  const [playbackRunning, setPlaybackRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  const quickReactions = ['👍', '🎉', '❤️', '👏', '🚀', '🔥'];
  const featureTabs = ['Chat', 'Whiteboard', 'Code', 'Replay'];
  const languageOptions = ['javascript', 'typescript', 'python', 'html', 'css'];

  const formatMessageTime = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const addSessionReplayEntry = (type, description, payload = null) => {
    setReplayEntries((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        description,
        payload,
        time: formatMessageTime(),
      },
    ]);
  };

  const addRemoteVideo = (socketId, stream) => {
    setRemoteVideos((current) => {
      const alreadyExists = current.some((item) => item.socketId === socketId);
      if (alreadyExists) {
        return current;
      }
      return [...current, { socketId, stream }];
    });
  };

  const ensurePeerConnection = (remoteSocketId) => {
    if (!socketRef.current || peerConnectionsRef.current[remoteSocketId]) {
      return peerConnectionsRef.current[remoteSocketId];
    }

    const pc = new RTCPeerConnection(peerConfig);
    peerConnectionsRef.current[remoteSocketId] = pc;

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        addRemoteVideo(remoteSocketId, remoteStream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal', {
          to: remoteSocketId,
          signal: {
            type: 'candidate',
            candidate: event.candidate,
          },
        });
      }
    };

    return pc;
  };

  const createOfferForPeer = async (remoteSocketId) => {
    const pc = ensurePeerConnection(remoteSocketId);

    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current.emit('signal', {
      to: remoteSocketId,
      signal: pc.localDescription,
    });
  };

  const handleIncomingSignal = async ({ from, signal }) => {
    if (!from || !signal) return;

    let pc = peerConnectionsRef.current[from];
    if (!pc) {
      pc = ensurePeerConnection(from);
    }

    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit('signal', {
          to: from,
          signal: pc.localDescription,
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.type === 'candidate') {
        if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    } catch (error) {
      console.error('WebRTC signal error:', error);
    }
  };

  useEffect(() => {
    socketRef.current = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
    });

    socketRef.current.on('connect', () => {
      console.log('client connected:', socketRef.current.id);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socketRef.current.on('user-joined', async (socketId, clients, currentHost) => {
      if (currentHost) {
        setHostSocketId(currentHost);
      }

      if (!socketId || socketId === socketRef.current.id) return;

      const otherPeers = clients.filter((id) => id !== socketRef.current.id);
      for (const peerId of otherPeers) {
        await createOfferForPeer(peerId);
      }
    });

    socketRef.current.on('room-state', ({ hostSocketId: roomHostId }) => {
      if (roomHostId) {
        setHostSocketId(roomHostId);
      } else {
        setHostSocketId(null);
      }
    });

    socketRef.current.on('meeting-ended', () => {
      setRemoteVideos([]);
      setChatMessages([]);
      setMessageInput('');
      setAskUserName(true);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    });

    socketRef.current.on('signal', handleIncomingSignal);

    socketRef.current.on('chat-message', (data, sender, socketId) => {
      setChatMessages((current) => [
        ...current,
        {
          id: `${socketId || sender || 'chat'}-${Date.now()}-${Math.random()}`,
          text: data,
          sender: sender || 'Guest',
          mine: socketId === socketRef.current?.id,
          timestamp: formatMessageTime(),
        },
      ]);
    });

    socketRef.current.on('code-update', ({ code, from }) => {
      if (!code || from === socketRef.current?.id) return;
      setCodeValue(code);
      addSessionReplayEntry('code', 'Code updated in live session', { code });
    });

    socketRef.current.on('whiteboard-update', ({ stroke, from }) => {
      if (!stroke || from === socketRef.current?.id) return;
      const canvas = whiteboardCanvasRef.current;
      const ctx = whiteboardCtxRef.current;
      if (!canvas || !ctx) return;

      if (!stroke.points || stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = stroke.color || '#8b5cf6';
      ctx.lineWidth = stroke.width || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });

    socketRef.current.on('media-state-change', ({ mediaType, enabled, target, controlledBy }) => {
      if (!mediaType || typeof enabled !== 'boolean') {
        return;
      }

      if (target === 'all' || target === socketRef.current?.id || controlledBy === socketRef.current?.id) {
        if (mediaType === 'audio') {
          setMicEnabled(enabled);
          const audioTracks = localStreamRef.current?.getAudioTracks?.() || [];
          audioTracks.forEach((track) => {
            track.enabled = enabled;
          });
        }

        if (mediaType === 'video') {
          setCameraEnabled(enabled);
          const videoTracks = localStreamRef.current?.getVideoTracks?.() || [];
          videoTracks.forEach((track) => {
            track.enabled = enabled;
          });
        }
      }
    });

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setVideoAvailable(false);
        setAudioAvailable(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const videoTracks = stream.getVideoTracks?.() || [];
        const audioTracks = stream.getAudioTracks?.() || [];
        setStreamInfo(`${videoTracks.length} video track(s), ${audioTracks.length} audio track(s)`);
        setVideoAvailable(true);
        setAudioAvailable(true);
        window.localStream = stream;
      } catch (error) {
        console.error('Camera access failed:', error);
        setVideoAvailable(false);
        setAudioAvailable(false);
      }
    };

    startCamera();

    return () => {
      socketRef.current?.disconnect();

      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!askForUserName && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [askForUserName]);

  useEffect(() => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    whiteboardCtxRef.current = ctx;

    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;

    const resizeCanvas = () => {
      const wrapper = canvas.parentElement;
      if (!wrapper) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = wrapper.clientWidth * ratio;
      canvas.height = 260 * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [activeFeature]);

  const broadcastCodeUpdate = (nextValue) => {
    if (!socketRef.current) return;
    socketRef.current.emit('code-update', { room: roomNameRef.current, code: nextValue });
    addSessionReplayEntry('code', 'Collaborative code updated', { code: nextValue });
  };

  const handleCodeChange = (event) => {
    const nextValue = event.target.value;
    setCodeValue(nextValue);
    broadcastCodeUpdate(nextValue);
  };

  const clearWhiteboard = () => {
    const canvas = whiteboardCanvasRef.current;
    const ctx = whiteboardCtxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    addSessionReplayEntry('whiteboard', 'Whiteboard cleared', { cleared: true });
  };

  const downloadWhiteboardImage = () => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `holo-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    addSessionReplayEntry('whiteboard', 'Whiteboard image downloaded', { exported: true });
  };

  const getPointFromEvent = (event) => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleWhiteboardPointerDown = (event) => {
    const point = getPointFromEvent(event);
    if (!point) return;

    isDrawingRef.current = true;
    currentStrokeRef.current = [point];

    const ctx = whiteboardCtxRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.strokeStyle = whiteboardColor;
    ctx.lineWidth = 3;
  };

  const handleWhiteboardPointerMove = (event) => {
    if (!isDrawingRef.current) return;

    const point = getPointFromEvent(event);
    if (!point) return;

    const ctx = whiteboardCtxRef.current;
    if (!ctx) return;

    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = whiteboardColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    currentStrokeRef.current = [...currentStrokeRef.current, point];
  };

  const handleWhiteboardPointerUp = () => {
    if (!isDrawingRef.current || !socketRef.current) return;

    const stroke = {
      points: currentStrokeRef.current,
      color: '#8b5cf6',
      width: 3,
    };

    socketRef.current.emit('whiteboard-update', {
      room: roomNameRef.current,
      stroke,
    });
    addSessionReplayEntry('whiteboard', 'Whiteboard updated', { stroke });
    isDrawingRef.current = false;
    currentStrokeRef.current = [];
  };

  useEffect(() => {
    if (!replayEntries.length) return undefined;

    if (!playbackRunning) return undefined;

    const intervalId = setInterval(() => {
      setReplayIndex((prev) => (prev + 1) % replayEntries.length);
    }, 1400);

    return () => clearInterval(intervalId);
  }, [replayEntries, playbackRunning]);

  const handleConnect = () => {
    if (!user) {
      const guestInput = guestMeetingInput.trim();
      const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '').trim();
      const rawGuestLink = guestInput || (currentPath && currentPath !== 'auth' && currentPath !== 'schedule' ? `/${currentPath}` : '');

      if (!rawGuestLink) {
        setJoinError('Use a valid meeting invite link to join as a guest.');
        return;
      }

      const hasHttpPrefix = rawGuestLink.startsWith('http://') || rawGuestLink.startsWith('https://');
      const hasPathPrefix = rawGuestLink.startsWith('/');

      if (!hasHttpPrefix && !hasPathPrefix) {
        setJoinError('Guest access is restricted to meeting invite links.');
        return;
      }

      try {
        const parsedUrl = hasHttpPrefix ? new URL(rawGuestLink) : new URL(rawGuestLink, window.location.origin);
        const normalizedRoom = parsedUrl.pathname.replace(/^\/+|\/+$/g, '').trim();

        if (!normalizedRoom || normalizedRoom === 'auth' || normalizedRoom === 'schedule') {
          setJoinError('Use a valid meeting invite link to join as a guest.');
          return;
        }

        roomNameRef.current = normalizedRoom;
        setMeetingId(normalizedRoom);
        setGuestMeetingInput(parsedUrl.href);
        window.history.replaceState({}, '', `/${normalizedRoom}`);
        setJoinError('');

        const nextUserId = userId || generateUserId();
        setUserId(nextUserId);
        setIsHost(false);

        if (socketRef.current) {
          socketRef.current.emit('join-call', {
            room: normalizedRoom,
            userId: nextUserId,
            isHost: false,
          });
        }

        setAskUserName(false);
        return;
      } catch (error) {
        setJoinError('The invite link is invalid. Please use the link shared by the host.');
        return;
      }
    }

    const normalizedRoom = meetingId.replace(/^\/+|\/+$/g, '').trim();

    if (!normalizedRoom) {
      return;
    }

    roomNameRef.current = normalizedRoom;
    setMeetingId(normalizedRoom);
    window.history.replaceState({}, '', `/${normalizedRoom}`);

    const nextUserId = userId || generateUserId();
    setUserId(nextUserId);

    if (socketRef.current) {
      const hostFlag = Boolean(user);
      setIsHost(hostFlag);
      socketRef.current.emit('join-call', {
        room: normalizedRoom,
        userId: nextUserId,
        isHost: hostFlag,
      });
      console.log('join-call emitted for:', normalizedRoom, nextUserId, hostFlag);
    }
    setAskUserName(false);
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    const trimmed = messageInput.trim();

    if (!trimmed || !socketRef.current) {
      return;
    }

    socketRef.current.emit('chat-message', trimmed, userName || 'Guest');
    addSessionReplayEntry('chat', `${userName || 'Guest'} sent a message`, { message: trimmed });
    setMessageInput('');
  };

  const handleQuickReaction = (reaction) => {
    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit('chat-message', reaction, userName || 'Guest');
  };

  const toggleMicrophone = () => {
    const nextState = !micEnabled;
    setMicEnabled(nextState);

    const audioTracks = localStreamRef.current?.getAudioTracks?.() || [];
    audioTracks.forEach((track) => {
      track.enabled = nextState;
    });

    if (socketRef.current) {
      const target = isHost ? 'all' : socketRef.current.id;
      socketRef.current.emit('media-state-change', {
        room: roomNameRef.current,
        mediaType: 'audio',
        enabled: nextState,
        target,
      });
    }
  };

  const toggleCamera = () => {
    const nextState = !cameraEnabled;
    setCameraEnabled(nextState);

    const videoTracks = localStreamRef.current?.getVideoTracks?.() || [];
    videoTracks.forEach((track) => {
      track.enabled = nextState;
    });

    if (socketRef.current) {
      const target = isHost ? 'all' : socketRef.current.id;
      socketRef.current.emit('media-state-change', {
        room: roomNameRef.current,
        mediaType: 'video',
        enabled: nextState,
        target,
      });
    }
  };

  const replaceVideoTrackForAllPeers = (newTrack) => {
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((item) => item.track && item.track.kind === 'video');

      if (sender) {
        sender.replaceTrack(newTrack);
        return;
      }

      pc.addTrack(newTrack, localStreamRef.current || screenStreamRef.current || new MediaStream());
    });
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    const cameraTrack = localStreamRef.current?.getVideoTracks?.()[0];
    if (cameraTrack) {
      replaceVideoTrackForAllPeers(cameraTrack);
    }

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setScreenSharing(false);
  };

  const muteAllGuests = () => {
    if (!isHost || !socketRef.current) {
      return;
    }

    const nextState = false;
    setMicEnabled(false);
    const audioTracks = localStreamRef.current?.getAudioTracks?.() || [];
    audioTracks.forEach((track) => {
      track.enabled = false;
    });

    socketRef.current.emit('media-state-change', {
      room: roomNameRef.current,
      mediaType: 'audio',
      enabled: nextState,
      target: 'all',
    });
  };

  const endMeetingForAll = () => {
    if (!isHost || !socketRef.current) {
      return;
    }

    socketRef.current.emit('host-end-meeting', { room: roomNameRef.current });
  };

  const startScreenShare = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;
      const screenVideoTrack = screenStream.getVideoTracks?.()[0];

      if (screenVideoTrack) {
        replaceVideoTrackForAllPeers(screenVideoTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      screenStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopScreenShare();
      });

      setScreenSharing(true);
    } catch (error) {
      console.error('Screen share permission rejected:', error);
    }
  };

  const leaveMeeting = () => {
    socketRef.current?.disconnect();

    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setScreenSharing(false);
    setAskUserName(true);
    setRemoteVideos([]);
    setChatMessages([]);
    setMessageInput('');
  };

  const meetingLink = `${window.location.origin}/${meetingId}`;

  return (
    <div className="video-meet">
      {askForUserName ? (
        <div className="lobby">
          <div className="lobby-header">
            <div className="brand-mark">H</div>
            <div>
              <p className="eyebrow-pill">Ready to connect</p>
              <h1>{user ? 'Host a meeting' : 'Join a meeting'}</h1>
            </div>
            <button type="button" className="secondaryBtn authSecondary" onClick={() => navigate('/')}>
              Home
            </button>
          </div>

          <div className="lobby-card">
            {user ? (
              <>
                <label className="field-label" htmlFor="meeting-id">
                  Meeting room ID / link
                </label>
                <input
                  id="meeting-id"
                  type="text"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  placeholder="room-name"
                />
                <div className="meeting-link-box">{meetingLink}</div>
              </>
            ) : (
              <>
                <label className="field-label" htmlFor="guest-code">
                  Enter meeting invite link
                </label>
                <input
                  id="guest-code"
                  type="text"
                  value={guestMeetingInput}
                  onChange={(e) => {
                    setGuestMeetingInput(e.target.value);
                    if (joinError) setJoinError('');
                  }}
                  placeholder="https://your-app.com/room-name"
                />
                {joinError && <p className="error-text">{joinError}</p>}
              </>
            )}

            <button type="button" className="connect-btn" onClick={handleConnect}>
              {user ? 'Start meeting' : 'Join as guest'}
            </button>
          </div>

          <div className="local-video-wrap lobby-preview">
            <video ref={localVideoRef} autoPlay muted playsInline />
            <div className="video-fallback">
              <span>Camera preview</span>
            </div>
          </div>

          <div className="status-row">
            <span className={videoAvailable ? 'status-chip ok' : 'status-chip'}>
              Camera: {videoAvailable ? 'enabled' : 'blocked'}
            </span>
            <span className={audioAvailable ? 'status-chip ok' : 'status-chip'}>
              Mic: {audioAvailable ? 'enabled' : 'blocked'}
            </span>
            <span className="status-chip">User ID: {userId}</span>
          </div>

          <p className="stream-meta">Stream: {streamInfo}</p>
        </div>
      ) : (
        <div className="meeting-room">
          <div className="meeting-topbar">
            <div>
              <p className="eyebrow-pill">Live room</p>
              <h2>{isHost ? 'Host meeting' : 'Guest meeting'}</h2>
            </div>
            <div className="topbar-actions">
              <button type="button" className="secondaryBtn authSecondary" onClick={() => navigate('/')}>
                Home
              </button>
              <span className="status-chip ok">{isHost ? 'Host' : 'Guest'} · Connected</span>
              <button type="button" className="ghost-btn" onClick={leaveMeeting}>
                Leave
              </button>
            </div>
          </div>

          <div className="meeting-layout">
            <div className="meeting-grid">
              <div className="local-video-wrap main-video">
                <video ref={localVideoRef} autoPlay muted playsInline />
                <div className="video-name-label">{isHost ? 'Host' : 'Guest'} · You</div>
              </div>

              <div className="remote-video-grid">
                {remoteVideos.length > 0 ? (
                  remoteVideos.map((remoteVideo) => (
                    <div key={remoteVideo.socketId} className="remote-video-wrap">
                      <video
                        autoPlay
                        playsInline
                        ref={(videoElement) => {
                          if (videoElement && remoteVideo.stream) {
                            videoElement.srcObject = remoteVideo.stream;
                          }
                        }}
                      />
                      <div className="video-name-label">
                        {remoteVideo.socketId === hostSocketId ? 'Host' : 'Guest'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="remote-empty-state">
                    <span>Waiting for another participant…</span>
                  </div>
                )}
              </div>
            </div>

            <aside className="feature-panel">
              <div className="feature-tabs">
                {featureTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`feature-tab ${activeFeature === tab ? 'active' : ''}`}
                    onClick={() => setActiveFeature(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeFeature === 'Chat' && (
                <>
                  <div className="chat-header">
                    <h3>Meeting chat</h3>
                    <span>{chatMessages.length} messages</span>
                  </div>

                  <div className="chat-messages">
                    {chatMessages.length === 0 ? (
                      <p className="chat-empty">Start the conversation.</p>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`chat-bubble ${message.mine ? 'mine' : ''}`}
                        >
                          <div className="chat-meta">
                            <span className="chat-author">{message.sender}</span>
                            <span className="chat-time">{message.timestamp}</span>
                          </div>
                          <p>{message.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="reaction-row">
                    {quickReactions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="reaction-btn"
                        onClick={() => handleQuickReaction(emoji)}
                        aria-label={`Send ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <form className="chat-form" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      placeholder="Type a message"
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                    />
                    <button type="submit">Send</button>
                  </form>
                </>
              )}

              {activeFeature === 'Whiteboard' && (
                <div className="workspace-panel">
                  <div className="workspace-header">
                    <h3>Collaborative whiteboard</h3>
                    <span>Draw together</span>
                  </div>

                  <div className="toolbar-inline">
                    <label className="color-picker-wrap">
                      <span>Color</span>
                      <input
                        type="color"
                        value={whiteboardColor}
                        onChange={(event) => setWhiteboardColor(event.target.value)}
                      />
                    </label>
                    <button type="button" className="mini-action" onClick={() => setWhiteboardColor('#0f172a')}>
                      Eraser
                    </button>
                    <button type="button" className="mini-action danger" onClick={clearWhiteboard}>
                      Clear
                    </button>
                    <button type="button" className="mini-action" onClick={downloadWhiteboardImage}>
                      Download image
                    </button>
                  </div>

                  <canvas
                    ref={whiteboardCanvasRef}
                    className="whiteboard-canvas"
                    onPointerDown={handleWhiteboardPointerDown}
                    onPointerMove={handleWhiteboardPointerMove}
                    onPointerUp={handleWhiteboardPointerUp}
                    onPointerLeave={handleWhiteboardPointerUp}
                  />
                </div>
              )}

              {activeFeature === 'Code' && (
                <div className="workspace-panel">
                  <div className="workspace-header">
                    <h3>Collaborative coding</h3>
                    <span>Live shared editor</span>
                  </div>

                  <div className="code-toolbar">
                    <label>
                      <span>Language</span>
                      <select value={selectedLanguage} onChange={(event) => setSelectedLanguage(event.target.value)}>
                        {languageOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <textarea
                    className="code-editor"
                    value={codeValue}
                    onChange={handleCodeChange}
                    spellCheck={false}
                  />
                </div>
              )}

              {activeFeature === 'Replay' && (
                <div className="workspace-panel">
                  <div className="workspace-header">
                    <h3>Session replay</h3>
                    <span>Timeline</span>
                  </div>

                  <div className="replay-controls">
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => setPlaybackRunning((state) => !state)}
                      disabled={replayEntries.length === 0}
                    >
                      {playbackRunning ? 'Pause recap' : 'Play recap'}
                    </button>
                  </div>

                  {replayEntries.length > 0 ? (
                    <div className="replay-current">
                      <div className="replay-badge">{replayEntries[replayIndex]?.type}</div>
                      <div>
                        <strong>{replayEntries[replayIndex]?.description}</strong>
                        <small>{replayEntries[replayIndex]?.time}</small>
                      </div>
                    </div>
                  ) : (
                    <p className="chat-empty">No session activity yet.</p>
                  )}

                  <div className="replay-list">
                    {replayEntries.length === 0 ? (
                      <p className="chat-empty">No session activity yet.</p>
                    ) : (
                      replayEntries.map((entry, index) => (
                        <div
                          key={entry.id}
                          className={`replay-item ${index === replayIndex ? 'active' : ''}`}
                          onClick={() => setReplayIndex(index)}
                        >
                          <div className="replay-badge">{entry.type}</div>
                          <div>
                            <strong>{entry.description}</strong>
                            <small>{entry.time}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>

          <div className="control-bar">
            <button
              type="button"
              className={`control-btn ${micEnabled ? 'active' : ''}`}
              onClick={toggleMicrophone}
            >
              {micEnabled ? 'Mic on' : 'Mic off'}
            </button>
            <button
              type="button"
              className={`control-btn ${cameraEnabled ? 'active' : ''}`}
              onClick={toggleCamera}
            >
              {cameraEnabled ? 'Camera on' : 'Camera off'}
            </button>
            <button
              type="button"
              className={`control-btn ${screenSharing ? 'active' : ''}`}
              onClick={screenSharing ? stopScreenShare : startScreenShare}
            >
              {screenSharing ? 'Stop sharing' : 'Share screen'}
            </button>
            {isHost && (
              <>
                <button
                  type="button"
                  className="control-btn"
                  onClick={muteAllGuests}
                >
                  Mute all
                </button>
                <button type="button" className="control-btn danger" onClick={endMeetingForAll}>
                  End meeting
                </button>
              </>
            )}
            <button type="button" className="control-btn danger" onClick={leaveMeeting}>
              Leave
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
