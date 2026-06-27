// src/components/auth/OTPForm.jsx
import { useState } from 'react';

export default function OTPForm({ userId, onBack, onSuccess }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Please enter 6-digit code");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/auth/2fa/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Invalid OTP');
        setLoading(false);
        return;
      }

      onSuccess(data);   // Successful OTP verification
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Enter 6-digit code from Google Authenticator</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#1d9e75] text-center text-2xl tracking-widest"
          placeholder="123456"
        />
      </div>

      {error && <div className="text-red-600 text-sm text-center">{error}</div>}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full py-3.5 bg-[#1d9e75] text-white font-semibold rounded-xl hover:bg-[#17855f] transition disabled:opacity-70"
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full py-3 text-gray-600 hover:text-gray-800 transition"
      >
        ← Back to Login
      </button>
    </form>
  );
}