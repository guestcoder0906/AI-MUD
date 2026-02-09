import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  history: LogEntry[];
  isLoading: boolean;
  onReferenceClick: (ref: string) => void;
  userId?: string;
}

const LocalMessage: React.FC<{ target: string, content: string, userId?: string, onReferenceClick: (ref: string) => void }> = ({ target, content, userId, onReferenceClick }) => {
  // Logic: 
  // If target == userId, show it.
  // If target == "all", show it? (standard text handles all)
  // If userId is undefined (guest?), maybe show if target is 'guest'?

  // User requirement: "local(player1)[only player 1 can see this]"

  if (target === userId) {
    // Render it with a specific style? Or just normal text?
    // "is not global like usual" implies it should look normal to the user, or maybe qualified?
    // Let's make it look slightly distinct or just normal. 
    // "like for example if an npc whispers only to one player then that happens" -> implies it should look like narrative.
    // Let's render it as normal text but maybe italicized or colored to indicate it's special? 
    // Or just normal. Let's do normal but wrapped for inspectables.

    return (
      <span className="text-terminal-cyan/80 italic">
        {/* We still need to parse inspectables inside local messages! */}
        {processInspectables(content, onReferenceClick)}
      </span>
    );
  }
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
    // Regex for local(player)[content]
    // We need to handle this recursively or just specific blocks?
    // The prompt says "text can be set like this local(player1)[blah blah]".
    // It implies it could be embedded.

    // We'll split by the local pattern first.
    // Regex: /local\((.*?)\)\[(.*?)\]/g  <-- non-greedy match

    const parts = [];
    let lastIndex = 0;
    const regex = /local\((.*?)\)\[(.*?)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }

      const targetPlayer = match[1];
      const content = match[2];

      // Check availability
      // We need userId passed in props. 
      // If no userId prop, we assume we see everything (or nothing? likely nothing if it's private)
      // Actually, if we are the DM/Host maybe we see all? 
      // For now, let's just match exact ID or 'all' maybe?

      parts.push({ type: 'local', target: targetPlayer, content: content });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.type === 'local') {
        // If we don't have a user ID, we probably shouldn't see private messages unless we are debugging.
        // But let's assume valid auth mapping.
        // We need to pass `userId` to Terminal.
        return (
          <span key={index} className="local-message-container">
            {/* We will filter this in the render return or here. 
                        Since we can't conditionally return nothing easily in map without fragment,
                        we'll handle visibility logic in a wrapper or just return null. 
                    */}
            <LocalMessage
              target={part.target!}
              content={part.content!}
              userId={userId}
              onReferenceClick={onReferenceClick}
            />
          </span>
        );
      }

      // Standard text processing (inspectable items)
      return <span key={index}>{processInspectables(part.content!, onReferenceClick)}</span>;
    });
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
