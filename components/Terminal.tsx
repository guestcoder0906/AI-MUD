import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  history: LogEntry[];
  isLoading: boolean;
  onReferenceClick: (ref: string) => void;
  userId?: string;
}

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
    // 1. Filter content based on user ID logic
    const filteredText = filterContentForUser(text, userId || '', userId || '');

    // 2. Process inspectables in the clean text
    // If text became empty, we might return null or empty span?
    if (!filteredText.trim() && text.trim().length > 0) return <span className="text-terminal-gray/20 italic text-[10px]">*silence*</span>;

    return processInspectables(filteredText, onReferenceClick);
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
      return <span key={idx}>{part}</span>;
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
