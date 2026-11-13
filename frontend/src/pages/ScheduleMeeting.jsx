import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontext.jsx';

const STORAGE_KEY = 'holo-meeting-history';

const saveMeetingToHistory = (meeting) => {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const next = [
    {
      ...meeting,
      createdAt: new Date().toISOString(),
    },
    ...existing,
  ].slice(0, 8);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

function formatDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return 'Not scheduled yet';

  const date = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
  });

  const meetingId = useMemo(() => `room-${Math.random().toString(36).slice(2, 8)}`, []);
  const meetingLink = useMemo(
    () => `${window.location.origin}/${meetingId}`,
    [meetingId]
  );

  if (!user) {
    return (
      <div className="schedulePage">
        <div className="scheduleCard">
          <div className="scheduleHeader">
            <div className="brandWrap authBrand">
              <div className="brandLogo">H</div>
              <span>Holo</span>
            </div>
          </div>
          <h2>Please sign in to schedule a meeting.</h2>
          <div className="scheduleActions">
            <button type="button" className="submitBtn" onClick={() => navigate('/auth')}>
              Go to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSchedule = () => {
    if (!form.title.trim() || !form.date || !form.time) {
      return;
    }

    const nextLink = meetingLink;
    saveMeetingToHistory({
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      description: form.description.trim(),
      meetingLink: nextLink,
      hostName: user?.name || 'Holo host',
    });

    navigator.clipboard?.writeText(nextLink).catch(() => {});
  };

  return (
    <div className="schedulePage">
      <div className="scheduleCard">
        <div className="scheduleHeader">
          <div className="brandWrap authBrand">
            <div className="brandLogo">H</div>
            <span>Holo</span>
          </div>
          <button type="button" className="secondaryBtn authSecondary" onClick={() => navigate('/')}>
            Home
          </button>
        </div>

        <h1>Schedule a meeting</h1>

        <div className="scheduleForm">
          <label>
            <span>Meeting title</span>
            <input
              type="text"
              name="title"
              placeholder="Product sync"
              value={form.title}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Date</span>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Time</span>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              name="description"
              placeholder="Agenda or notes"
              value={form.description}
              onChange={handleChange}
            />
          </label>

          <div className="scheduleActions">
            <button type="button" className="submitBtn" onClick={handleCreateSchedule}>
              Generate link
            </button>
            <button type="button" className="secondaryBtn authSecondary" onClick={() => navigate(`/${meetingId}`)}>
              Open meeting
            </button>
          </div>
        </div>

        <div className="scheduleSummary">
          <h3>Meeting summary</h3>
          <div className="scheduleMeta">
            <div><strong>Title:</strong> {form.title || 'Untitled meeting'}</div>
            <div><strong>Date & time:</strong> {formatDateTime(form.date, form.time)}</div>
            <div><strong>Host:</strong> {user?.name || 'Holo user'}</div>
          </div>

          <div className="shareLinkBox">
            <input readOnly value={meetingLink} />
            <button
              type="button"
              className="secondaryBtn authSecondary"
              onClick={() => navigator.clipboard?.writeText(meetingLink)}
            >
              Copy link
            </button>
          </div>

          <p className="scheduleHint">
            Share this link with guests so they can join the scheduled room.
          </p>
        </div>
      </div>
    </div>
  );
}
