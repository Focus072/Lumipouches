'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSessionExpired, shouldShowWarning, getTimeUntilExpiry, formatTimeRemaining, SESSION_TIMEOUT_MS } from '@/lib/utils/session-timeout';

interface SessionTimeoutProps {
  onLogout: () => void;
}

export default function SessionTimeout({ onLogout }: SessionTimeoutProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    // Update last activity on user interaction
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check session status periodically
    const checkInterval = setInterval(() => {
      const now = Date.now();
      
      if (isSessionExpired(lastActivity)) {
        // Session expired - logout
        clearInterval(checkInterval);
        onLogout();
        router.push('/auth/login?expired=true');
        return;
      }

      if (shouldShowWarning(lastActivity)) {
        setShowWarning(true);
        const remaining = getTimeUntilExpiry(lastActivity);
        setTimeRemaining(formatTimeRemaining(remaining));
      } else {
        setShowWarning(false);
      }
    }, 1000); // Check every second

    return () => {
      clearInterval(checkInterval);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [lastActivity, onLogout, router]);

  const handleExtendSession = async () => {
    try {
      // Call API to refresh session
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setLastActivity(Date.now());
          setShowWarning(false);
        }
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Session Expiring Soon
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            Your session will expire in {timeRemaining}. Click &quot;Stay Signed In&quot; to continue.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleExtendSession}
              className="bg-yellow-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-yellow-700"
            >
              Stay Signed In
            </button>
            <button
              onClick={onLogout}
              className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-300"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
