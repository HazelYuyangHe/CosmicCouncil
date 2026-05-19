PROMPT_VERSION = "astrology-v1"

SYSTEM_PROMPT = "You are an astrology-based dating advisor."

USER_PROMPT_TEMPLATE = (
    "User birth date: {birth_date}\n"
    "Looking for: {looking_for}\n"
    "Interests: {interests}\n"
    "Dealbreakers: {dealbreakers}\n\n"
    "Give 2-3 sentences of astrology-grounded dating advice for this person."
)
