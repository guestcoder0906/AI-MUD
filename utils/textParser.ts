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

    let result = '';
    let i = 0;

    while (i < text.length) {
        // Check for "target("
        if (text.substr(i, 7) === 'target(') {
            const start = i;
            i += 7; // skip "target("

            // Find closing ")" for usernames
            let userEnd = text.indexOf(')', i);
            if (userEnd === -1) {
                // Malformed, just append rest
                result += text.substr(start);
                break;
            }

            const usersStr = text.substring(i, userEnd);
            const users = usersStr.split(',').map(u => u.trim());

            i = userEnd + 1; // skip ")"

            // Check for opening "["
            if (text[i] === '[') {
                const contentStart = i + 1;
                let depth = 1;
                i++; // skip "["

                // Find balanced closing "]"
                let contentEnd = -1;
                while (i < text.length) {
                    if (text[i] === '[') depth++;
                    else if (text[i] === ']') depth--;

                    if (depth === 0) {
                        contentEnd = i;
                        break;
                    }
                    i++;
                }

                if (contentEnd !== -1) {
                    const content = text.substring(contentStart, contentEnd);

                    if (users.includes(currentUsername)) {
                        // Authorized
                        result += `[PRIVATE] ${content}`;
                    } else {
                        // Not authorized, hide completely
                        // result += ''; 
                    }
                    i = contentEnd + 1; // move past "]"
                    continue;
                }
            }

            // If we got here, something didn't match perfectly (e.g. no following [)
            // Reset to start + 1 to avoid infinite loop but proceed
            result += text.substr(start, 1);
            i = start + 1;
        } else {
            result += text[i];
            i++;
        }
    }

    return result;
};
