import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontext.jsx';
import '../../app.css';

const STORAGE_KEY = 'holo-meeting-history';

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [meetingHistory, setMeetingHistory] = useState([]);
  const heroRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-badge', { y: 18, opacity: 0, duration: 0.7 })
        .from('.hero-title .word', { y: 34, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.25')
        .from('.hero-copy .word', { y: 22, opacity: 0, duration: 0.5, stagger: 0.04 }, '-=0.6')
        .from('.hero-cta', { y: 20, opacity: 0, duration: 0.8 }, '-=0.5')
        .from('.scene-card', { x: 40, opacity: 0, duration: 1.1, stagger: 0.12 }, '-=0.35');

      gsap.to('.orb-one', {
        y: -20,
        x: 16,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.orb-two', {
        y: 24,
        x: -18,
        duration: 5.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.signal-line', {
        scaleX: 1.08,
        opacity: 1,
        repeat: -1,
        yoyo: true,
        duration: 2.5,
        ease: 'sine.inOut',
        stagger: 0.15,
      });

      gsap.fromTo(
        '.floating-pill',
        { y: 0 },
        { y: -12, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.2 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const goToMeeting = () => {
    if (user) {
      const roomId = `room-${Math.random().toString(36).slice(2, 8)}`;
      navigate(`/${roomId}`);
      return;
    }

    navigate('/auth');
  };

  const heroTitleWords = 'Turn every conversation into momentum.'.split(' ');
  const heroCopyWords = 'Meet, chat, and collaborate in one place built for modern teams, founders, and remote communities.'.split(' ');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setMeetingHistory(saved);
    } catch {
      setMeetingHistory([]);
    }
  }, []);

  const handleLogin = () => navigate('/auth');
  const handleSignup = () => navigate('/auth');
  const handleScheduleMeeting = () => {
    if (!user) return;
    navigate('/schedule');
  };
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openMeeting = (link) => {
    if (!link) return;

    try {
      const targetPath = link.startsWith('http') ? new URL(link).pathname : link;
      const safePath = targetPath && targetPath !== '/' ? targetPath : '/';
      navigate(safePath);
    } catch {
      navigate('/');
    }
  };

  const renderPrimaryActions = user ? (
    <>
      <button type="button" className="primaryBtn" onClick={handleScheduleMeeting}>
        Schedule meeting
      </button>
      <button type="button" className="primaryBtn" onClick={goToMeeting}>
        Join meeting
      </button>
      <button type="button" className="secondaryBtn" onClick={handleLogout}>
        Logout
      </button>
    </>
  ) : (
    <>
      <button type="button" className="primaryBtn" onClick={handleLogin}>
        Login
      </button>
      <button type="button" className="secondaryBtn" onClick={handleSignup}>
        Signup
      </button>
      <button type="button" className="primaryBtn" onClick={goToMeeting}>
        Join meeting
      </button>
    </>
  );

  return (
    <div className="landingPageContainer" ref={heroRef}>
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="landingOverlay" />

      <main className="heroContent">
        <div className="textBlock">
          <span className="eyebrow hero-badge">The smarter way to connect</span>
          <h1 className="hero-title" aria-label="Turn every conversation into momentum.">
            {heroTitleWords.map((word, index) => (
              <span key={`${word}-${index}`} className="word">
                {word}
                {index < heroTitleWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
          <p className="hero-copy" aria-label="Meet, chat, and collaborate in one place built for modern teams, founders, and remote communities.">
            {heroCopyWords.map((word, index) => (
              <span key={`${word}-${index}`} className="word">
                {word}
                {index < heroCopyWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>

          <div className="ctaRow hero-cta">
            {renderPrimaryActions}
          </div>

        </div>

        <div className="showcase-scene" id="about" ref={sceneRef}>
          <div className="scene-card video-shell">
            <div className="video-header">
              <div>
                <p className="mutedLabel">Live workspace</p>
                <h3>Weekly team sync</h3>
              </div>
              <span className="statusDot">Live</span>
            </div>

            <div className="video-grid">
              <div className="video-tile tile-main">
                <div className="tile-overlay">
                  <span className="tile-name">Ari</span>
                  <span className="tile-mic">●</span>
                </div>
              </div>

              <div className="video-tile tile-side tile-one">
                <div className="tile-overlay">
                  <span className="tile-name">Lina</span>
                  <span className="tile-mic">●</span>
                </div>
              </div>

              <div className="video-tile tile-side tile-two">
                <div className="tile-overlay">
                  <span className="tile-name">Noah</span>
                  <span className="tile-mic">●</span>
                </div>
              </div>
            </div>

            <div className="toolbar-row">
              <span className="tool-btn tool-muted">Mic</span>
              <span className="tool-btn tool-video">Camera</span>
              <span className="tool-btn tool-share">Share</span>
            </div>
          </div>

          <div className="scene-card floating-pill pill-one">
            <span className="pill-kicker">Focus</span>
            <strong>Built for clear calls</strong>
          </div>

          <div className="scene-card floating-pill pill-two">
            <span className="pill-kicker">Access</span>
            <strong>Simple and secure</strong>
          </div>
        </div>
      </main>

      {meetingHistory.length > 0 && (
        <section className="meetingHistorySection">
          <div className="meetingHistoryHeader">
            <h3>Scheduled meetings</h3>
            <span>{meetingHistory.length} saved</span>
          </div>

          <div className="meetingHistoryList">
            {meetingHistory.map((meeting) => (
              <div key={`${meeting.meetingLink}-${meeting.createdAt}`} className="meetingHistoryItem">
                <div>
                  <strong>{meeting.title}</strong>
                  <p>{meeting.date} • {meeting.time}</p>
                  {meeting.description && <small>{meeting.description}</small>}
                </div>
                <div className="meetingHistoryActions">
                  <button type="button" className="secondaryBtn" onClick={() => openMeeting(meeting.meetingLink)}>
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
