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
    // Handle both local(player)[content] and target(player1, player2[content]) syntax
    // First, we'll parse for both patterns

    const parts = [];
    let lastIndex = 0;

    // Combined regex for both local() and target()
    // local(player)[content] or target(player1, player2[content])
    const localRegex = /local\((.*?)\)\[(.*?)\]/g;
    const targetRegex = /target\((.*?)\[(.*?)\]\)/g;

    // We need to find all matches and sort them by position
    const matches: Array<{ index: number; type: 'local' | 'target'; target: string; content: string }> = [];

    let match;
    while ((match = localRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        type: 'local',
        target: match[1],
        content: match[2],
      });
    }

    while ((match = targetRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        type: 'target',
        target: match[1],
        content: match[2],
      });
    }

    // Sort by index
    matches.sort((a, b) => a.index - b.index);

    // Build parts array
    lastIndex = 0;
    matches.forEach((m) => {
      // Add text before match
      if (m.index > lastIndex) {
        const matchLength = m.type === 'local'
          ? `local(${m.target})[${m.content}]`.length
          : `target(${m.target}[${m.content}])`.length;
        parts.push({ type: 'text', content: text.substring(lastIndex, m.index) });
        lastIndex = m.index + matchLength;
      }

      parts.push({
        type: m.type,
        target: m.target,
        content: m.content,
      });
    });

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.type === 'local' || part.type === 'target') {
        // Check if current user should see this content
        // For target(), it's a comma-separated list of usernames
        const targetList = part.target!.split(',').map(t => t.trim());
        const canSee = userId && targetList.includes(userId);

        if (canSee) {
          return (
            <span key={index} className="text-terminal-cyan/80 italic">
              {processInspectables(part.content!, onReferenceClick)}
            </span>
          );
        }
        return null;
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
