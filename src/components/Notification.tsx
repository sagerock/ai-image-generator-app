'use client';

import { useEffect, useState } from 'react';

interface NotificationProps {
  type: 'success' | 'error' | 'info';
  message: string;
  show: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const Notification = ({
  type,
  message,
  show,
  onClose,
  autoClose = true,
  duration = 5000
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show && !isVisible) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-stone-50 border-stone-200 text-stone-800';
      default:
        return 'bg-stone-50 border-stone-200 text-stone-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div
        className={`
          transform transition-all duration-300 ease-in-out
          ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          p-4 rounded-xl border shadow-lg
          ${getStyles()}
        `}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 text-lg hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
