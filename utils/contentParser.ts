
export const parseContentForUser = (content: string, username: string | null): string => {
    if (!content) return "";

    // RegEx to match local(TARGET_USER)[HIDDEN_CONTENT]
    // We use a non-greedy match for the content inside []
    const localTagRegex = /local\((.*?)\)\[([\s\S]*?)\]/g;

    return content.replace(localTagRegex, (match, targetUser, hiddenContent) => {
        // If username is null, we assume we are not the target (?) or maybe show nothing.
        // Spec: "local(player1)[blah] ... only player 1 can see this"

        if (username && targetUser.trim() === username) {
            return hiddenContent;
        }
        return ""; // Remove the block entirely for others
    });
};
