import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { parseTargetedText } from '../utils/textParser';

interface TerminalProps {
  history: LogEntry[];
  isLoading: boolean;
  onReferenceClick: (ref: string) => void;
  userId?: string;
}

const LocalMessage: React.FC<{ target: string, content: string, userId?: string, onReferenceClick: (ref: string) => void }> = ({ target, content, userId, onReferenceClick }) => {
  // Deprecated approach, we now use parseTargetedText for inline parsing
  return null;
};

// Helper for reuse
const processInspectables = (text: string, onClick: (ref: string) => void) => {
  const parts = text.split(/(\[.*?\])/g);
  return parts.map((part, idx) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span
          key={idx}
          onClick={() => onClick(part)}
          className="text-terminal-amber font-bold cursor-pointer hover:underline hover:text-yellow-400 transition-colors"
          title="Inspect System File"
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export const Terminal: React.FC<TerminalProps> = ({ history, isLoading, onReferenceClick, userId }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const renderText = (text: string) => {
    // Parse for visibility first
    const visibleText = parseTargetedText(text, userId || 'Guest');
    if (!visibleText) return null;

    // Then process inspectables
    return processInspectables(visibleText, onReferenceClick);
  };

  const processInspectables = (text: string, onClick: (ref: string) => void) => {
    const parts = text.split(/(\[.*?\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={idx}
            onClick={() => onClick(part)}
            className="text-terminal-amber font-bold cursor-pointer hover:underline hover:text-yellow-400 transition-colors"
            title="Inspect System File"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 font-mono text-sm md:text-base leading-relaxed space-y-4">
      {history.length === 0 && (
        <div className="text-terminal-lightGray opacity-50 italic text-center mt-20">
          Initialize simulation by describing your world...
          <br />
          e.g., "A gritty cyberpunk city where rain never stops."
          <br />
          or "A medieval kingdom ruled by dragons."
        </div>
      )}

      {history.map((entry) => (
        <div key={entry.id} className={`animate-fade-in ${entry.type === 'INPUT' ? 'opacity-70 mt-6 mb-2 border-l-2 border-terminal-gray pl-2' : ''}`}>
          {entry.type === 'INPUT' ? (
            <div className="text-terminal-lightGray font-bold">{entry.text}</div>
          ) : entry.type === 'ERROR' ? (
            <div className="text-red-500 bg-red-900/10 p-2 rounded border border-red-900">{entry.text}</div>
          ) : (
            <div className="text-terminal-green whitespace-pre-wrap">{renderText(entry.text)}</div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex items-center space-x-2 text-terminal-amber mt-4">
          <div className="w-2 h-2 bg-terminal-amber rounded-full animate-pulse-fast"></div>
          <div className="w-2 h-2 bg-terminal-amber rounded-full animate-pulse-fast delay-75"></div>
          <div className="w-2 h-2 bg-terminal-amber rounded-full animate-pulse-fast delay-150"></div>
          <span className="text-xs uppercase tracking-widest ml-2">Calculating Physics & Time...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
