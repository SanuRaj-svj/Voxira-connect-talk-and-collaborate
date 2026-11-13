import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontext.jsx';

const initialForm = {
  name: '',
  username: '',
  password: '',
  confirmPassword: '',
};

export default function Authentication() {
  const navigate = useNavigate();
  const { login, register, loading: authLoading } = useAuth();
  const [mode, setMode] = useState('signin');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setStep(2);
  };

  const validateStep = () => {
    if (mode === 'signup' && !form.name.trim()) {
      setError('Please enter your full name.');
      return false;
    }

    if (!form.username.trim()) {
      setError('Please enter a valid username.');
      return false;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (mode === 'signup' && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validateStep()) return;

    try {
      if (mode === 'signin') {
        await login(form.username, form.password);
      } else {
        await register(form.name, form.username, form.password);
      }

      setSuccess(
        mode === 'signin'
          ? 'Welcome back! Your account is ready.'
          : 'Account created successfully. You are all set.'
      );
      setStep(3);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setError('');
    setSuccess('');
    setStep(1);
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authHeader">
          <div className="brandWrap authBrand">
            <div className="brandLogo">H</div>
            <span>Holo</span>
          </div>
          <button type="button" className="secondaryBtn authSecondary" onClick={() => navigate('/')}>
            Home
          </button>
        </div>

        {step === 1 && (
          <div className="authStepBox">
            <h1>Welcome</h1>
            <p>Choose how you want to continue.</p>

            <div className="modeGrid">
              <button
                type="button"
                className={mode === 'signin' ? 'modeOption active' : 'modeOption'}
                onClick={() => switchMode('signin')}
              >
                <span>Sign in</span>
                <small>Already have an account</small>
              </button>

              <button
                type="button"
                className={mode === 'signup' ? 'modeOption active' : 'modeOption'}
                onClick={() => switchMode('signup')}
              >
                <span>Create account</span>
                <small>New to Holo</small>
              </button>
            </div>
          </div>
        )}

        {step >= 2 && step < 3 && (
          <form onSubmit={handleSubmit} className="authForm">
            <div className="formHeaderRow">
              <button type="button" className="backBtn" onClick={resetForm}>
                ← Back
              </button>
              <span className="stepLabel">Step 2 of 2</span>
            </div>

            <h2>{mode === 'signin' ? 'Sign in to your account' : 'Create your account'}</h2>

            {mode === 'signup' && (
              <label>
                <span>Full name</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  placeholder="Enter your full name"
                  onChange={handleChange}
                />
              </label>
            )}

            <label>
              <span>Username</span>
              <input
                type="text"
                name="username"
                value={form.username}
                placeholder="Enter your username"
                onChange={handleChange}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                placeholder="Enter your password"
                onChange={handleChange}
              />
            </label>

            {mode === 'signup' && (
              <label>
                <span>Confirm password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  placeholder="Re-enter your password"
                  onChange={handleChange}
                />
              </label>
            )}

            {error && <div className="authMessage error">{error}</div>}

            <button type="submit" className="submitBtn" disabled={authLoading}>
              {authLoading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="successBox">
            <div className="successBadge">Success</div>
            <h2>{success}</h2>
            <p>
              {mode === 'signin'
                ? 'You are now signed in and ready to continue.'
                : 'Your account has been created successfully.'}
            </p>
            <div className="successActions">
              <button type="button" className="submitBtn" onClick={() => navigate('/')}>
                Go to home
              </button>
              <button type="button" className="secondaryBtn authSecondary" onClick={resetForm}>
                Use another account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
