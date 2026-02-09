
/**
 * Parses text to handle visibility rules based on the current user.
 * 
 * Syntax: target(user1, user2)[private content]
 * 
 * If currentUsername is in the target list, the content is shown (with a visual indicator).
 * If currentUsername is NOT in the target list, the content is hidden/removed.
 * Content outside of target() blocks is visible to everyone.
 */
export const parseTargetedText = (text: string, currentUsername: string): string => {
    if (!text) return text;

    // Regex explanation:
    // target\(([^)]+)\)  -> Matches "target(" followed by comma-separated users in group 1, then ")"
    // \[([\s\S]*?)\]     -> Matches "[" followed by content in group 2 (non-greedy), then "]"
    // The 'g' flag finds all occurrences.
    const regex = /target\(([^)]+)\)\[([\s\S]*?)\]/g;

    return text.replace(regex, (match, usersStr, content) => {
        const users = usersStr.split(',').map((u: string) => u.trim());

        // Check if current user is in the list
        if (users.includes(currentUsername)) {
            // Visible to this user - Return content (maybe styled?)
            // For raw text processing, we just return the content. 
            // Components can opt to style this by detecting it, but for now let's just return the content
            // possibly with a prefix to indicate it's private?
            // User wanted: "details only the player themselves would know"
            // Let's return it as is, or maybe wrapped?
            // The requirement says "text can be set like this... only player 1 can see this"
            return `[PRIVATE] ${content}`;
        } else {
            // Not visible - Remove it entirely
            return '';
        }
    });
};
