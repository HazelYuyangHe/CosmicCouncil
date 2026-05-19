# Testing Strategy

## Overview

This project uses a layered testing strategy to improve reliability across the multi-agent system, backend APIs, and frontend user flow. Our goal is to ensure that core functionality remains stable as the application evolves, especially because the system depends on multiple agents and orchestration logic.

We focus on three levels of testing:

- **Unit tests** for individual agents and utility functions
- **Integration tests** for backend routes and orchestration logic
- **End-to-end (E2E) tests** for the complete user workflow

We aim to combine automated testing with incremental validation during development so that failures can be caught early.

---

## Testing Goals

The main goals of our testing strategy are:

- Verify that each agent behaves correctly in isolation
- Ensure the orchestrator combines agent outputs in a stable and predictable way
- Validate that API endpoints return the expected schema and status codes
- Confirm that users can successfully complete the main flow from input submission to receiving advice
- Reduce regressions as frontend and backend components change
- Maintain at least **70% test coverage** for core project logic

---

## Test Types

### 1. Unit Tests

Unit tests are used to validate small, isolated components of the system.

Examples include:

- Astrology agent response generation
- Behavioral agent response generation
- History agent response generation
- Helper functions for formatting or schema validation

These tests help us confirm that each component works independently before combining them into larger workflows.

---

### 2. Integration Tests

Integration tests focus on interactions between multiple components.

Examples include:

- Orchestrator correctly calling all three agents
- Aggregated response containing all required fields
- Backend API endpoints returning valid JSON responses
- Error handling for invalid or incomplete input

These tests are especially important in this project because the main value of the application comes from combining multiple agent outputs into one final response.

---

### 3. End-to-End (E2E) Tests

E2E tests validate the complete user journey through the application.

The primary E2E flow includes:

1. User opens the application
2. User enters a dating or relationship scenario
3. User submits the form
4. Backend processes the request through the agent pipeline
5. Frontend displays the multi-agent analysis and final advice

This level of testing ensures that frontend, backend, and orchestration work together as expected.

---

## TDD Approach

For selected core features, we use a **Test-Driven Development (TDD)** workflow following the **red-green-refactor** cycle:

1. Write a failing test for the desired behavior
2. Implement the minimal code needed to pass the test
3. Refactor the code while keeping tests green

We applied this workflow to core features such as:

- Agent response validation
- Orchestrator output formatting
- API response schema behavior

TDD helps us define expected behavior clearly before implementation and reduces debugging effort later in development.

---

## Tools

The project uses the following testing tools:

- **Pytest** for backend unit and integration tests
- **Playwright** for end-to-end testing
- **Coverage tooling** for reporting code coverage

These tools were chosen because they are lightweight, widely used, and fit well with our Python backend and web application workflow.

---

## Current Test Coverage Focus

Our current testing efforts prioritize the following areas:

- Individual agent logic
- Backend orchestration flow
- Core API response behavior
- Main happy-path user workflow

Because of time constraints, we prioritize high-impact paths first, then expand coverage to edge cases and failure scenarios.

---

## Edge Cases and Failure Scenarios

We also plan to test important edge cases, including:

- Empty user input
- Missing or malformed agent output
- API request failures
- Unexpected response formats
- Frontend handling of backend errors

These cases are important because multi-agent systems can fail in ways that are less predictable than traditional deterministic software.

---

## CI Testing Workflow

Testing is intended to be part of our CI/CD pipeline so that checks run automatically on pull requests and merges.

Our CI workflow includes:

- Linting
- Type or build checks where applicable
- Unit tests
- Integration tests
- E2E tests
- Security-related checks such as dependency scanning

This helps ensure that broken code is caught before it reaches the main branch.

---

## Test Organization

Our tests are organized by responsibility so they remain easy to maintain.

Example structure:

```text
tests/
  agents/
    test_astrology_agent.py
    test_behavioral_agent.py
    test_history_agent.py
  orchestrator/
    test_orchestrator.py
  api/
    test_api.py
  test_e2e.py