export const filterContentForUser = (content: string, username: string, currentUserId: string): string => {
    // Regex: target(list)[content]
    // ([\s\S]*?) matches multiline content non-greedily
    // We need to match globally
    const regex = /target\(([^)]+)\)\[([\s\S]*?)\]/g;

    // We replace matches first
    const filtered = content.replace(regex, (match, users, innerContent) => {
        const userList = users.split(',').map((u: string) => u.trim());
        if (userList.includes(username) || userList.includes(currentUserId)) {
            return innerContent;
        }
        return ''; // Hide if not targeted
    });

    // Remove empty lines left behind if the replacement resulted in empty string?
    // Only if it was on its own line.
    return filtered.replace(/^\s*[\r\n]/gm, '');
};
