// Random username generator
const adjectives = [
    'brave', 'swift', 'clever', 'wise', 'mighty', 'cunning', 'noble', 'fierce',
    'silent', 'mystic', 'ancient', 'eternal', 'bright', 'dark', 'golden', 'silver',
    'iron', 'shadow', 'storm', 'frost', 'flame', 'thunder', 'crystal', 'wild'
];

const nouns = [
    'knight', 'wizard', 'rogue', 'warrior', 'sage', 'hunter', 'ranger', 'paladin',
    'monk', 'druid', 'bard', 'cleric', 'sorcerer', 'warlock', 'barbarian', 'fighter',
    'thief', 'assassin', 'ninja', 'samurai', 'demon', 'angel', 'dragon', 'phoenix'
];

export const generateRandomUsername = (): string => {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    return `${adjective}_${noun}_${randomNum}`;
};

export const generateGameCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
    if (!username || username.trim().length === 0) {
        return { valid: false, error: 'Username cannot be empty' };
    }

    if (username.length < 3) {
        return { valid: false, error: 'Username must be at least 3 characters' };
    }

    if (username.length > 20) {
        return { valid: false, error: 'Username must be 20 characters or less' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }

    return { valid: true };
};
