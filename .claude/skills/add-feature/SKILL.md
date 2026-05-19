---
name: add-feature
description: Add a small scoped feature to the P3 project using a structured Explore → Plan → Implement → Verify → Report workflow.
---

# add-feature

Use this skill when adding a small feature, scaffold, documentation improvement, or UI prototype to the P3 project.

## Purpose
This skill helps Claude make controlled, minimal, and verifiable changes instead of jumping directly into implementation.

## Workflow

### 1. Explore
- Inspect the current repository structure before changing anything.
- Identify the files or directories most likely involved.
- If the requested area does not exist yet, explicitly state that.
- Restate the task in concrete engineering terms.

### 2. Plan
- List the exact files to create or modify.
- Explain the smallest reasonable implementation approach.
- Prefer simple solutions over framework-heavy setups.
- If multiple approaches are possible, choose the one with the lowest complexity that still fits the task.

### 3. Implement
- Actually create or modify the files described in the plan.
- Do not stop after planning.
- Provide full file contents for newly created files.
- Keep the scope tightly limited to the requested task.

### 4. Verify
- If tests exist, run the relevant tests.
- If no tests exist, describe a clear manual verification procedure.
- For documentation changes, verify that commands and paths match the real repository.
- For UI scaffolds, explain how to open and inspect the page locally.
- For placeholder or stub behavior, explicitly label it as placeholder behavior.

### 5. Report
- List all created or modified files.
- Summarize exactly what changed.
- State how the result was verified.
- Mention any limitations, placeholders, or follow-up work.

## Constraints
- Keep changes minimal and scoped.
- Do not introduce unnecessary frameworks or major refactors.
- Prefer plain HTML/CSS/JavaScript for a first UI prototype if no frontend exists yet.
- Do not invent backend integration that does not exist.
- If the slash command is unavailable, apply the workflow manually from this skill file.

## Expected Behavior
Claude should:
- explore before coding
- produce a file-level plan
- complete implementation instead of stopping after the plan
- verify in a concrete way
- clearly distinguish between implemented functionality and placeholders

## Good Fit Examples
- create or improve README
- initialize a minimal static frontend prototype
- add a small validation check
- add a basic result placeholder
- scaffold a small project component

## Bad Fit Examples
- large architecture rewrites
- full production deployment setup
- replacing the whole stack
- broad refactors unrelated to the requested feature