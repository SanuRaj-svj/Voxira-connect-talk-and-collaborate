import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/landing.jsx';
import Authentication from './pages/authentication.jsx';
import ScheduleMeeting from './pages/ScheduleMeeting.jsx';
import { AuthProvider } from './contexts/authcontext.jsx';
import VideoMeetComponent from './pages/VideoMeet.jsx';
import '../index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/auth' element={<Authentication />} />
        <Route path='/schedule' element={<ScheduleMeeting />} />
        <Route path='/:url' element={<VideoMeetComponent />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
