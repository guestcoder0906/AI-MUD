import React from 'react';
import { LiveUpdate } from '../types';

interface LiveTickerProps {
  updates: LiveUpdate[];
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ updates }) => {
  // Show most recent updates. Since it's bottom-right, we want them to stack upwards?
  // Or just list them.
  // App.tsx places this in a container.

  return (
    <div className="flex flex-col items-end space-y-1">
      {updates.slice(0, 5).map((update, idx) => (
        <div
          key={update.id}
          className={`
            text-xs font-mono px-3 py-1 rounded bg-black/80 border backdrop-blur-sm shadow-lg
            transform transition-all duration-500 ease-out animate-slide-in-right
            ${update.type === 'POSITIVE' ? 'border-terminal-green text-terminal-green' :
              update.type === 'NEGATIVE' ? 'border-red-800 text-red-400' :
                'border-terminal-gray text-terminal-lightGray'}
          `}
          style={{ opacity: 1 - (idx * 0.15) }}
        >
          {update.text}
        </div>
      ))}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};
