// Runs before each test file (via vitest.config.js setupFiles).
// Clears the Anthropic API key so all route tests run in stub mode by default.
// This prevents accidental LLM calls and keeps tests deterministic.
delete process.env.ANTHROPIC_API_KEY
