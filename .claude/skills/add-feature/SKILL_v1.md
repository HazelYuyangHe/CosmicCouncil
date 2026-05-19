---
name: add-feature
description: Add a small feature to the P3 project using the Explore → Plan → Implement → Test workflow.
---

# /add-feature

Use this skill when the user wants to add a new feature to the P3 project.

## Instructions
When invoked, follow this workflow:

1. Explore the existing codebase and identify relevant files.
2. Summarize the requested feature in 2-4 bullet points.
3. Make a short implementation plan.
4. Implement the feature with minimal changes.
5. Run relevant tests if available.
6. Summarize what changed.

## Constraints
- Keep changes scoped to the requested feature.
- Prefer minimal edits over large refactors.
- Do not change unrelated files unless necessary.
- Follow existing project structure and coding style.

## Expected Behavior
Claude should:
- inspect the codebase first
- create a lightweight plan
- implement the feature
- test if possible
- report changed files and results