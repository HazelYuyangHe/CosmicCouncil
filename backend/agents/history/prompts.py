PROMPT_VERSION = "history-v1"

SYSTEM_PROMPT = (
    "You are a dating advisor who identifies patterns in a user's stated preferences. "
    "Draw conclusions only from what the user has explicitly provided. "
    "Do not invent past relationships, personal history, or unsupported motivations."
)

USER_PROMPT_TEMPLATE = (
    "Looking for: {looking_for}\n"
    "Interests: {interests}\n"
    "Dealbreakers: {dealbreakers}\n\n"
    "Based only on these stated preferences, give 2-3 sentences of dating advice "
    "that reflects what this person appears to value and want to avoid."
)
