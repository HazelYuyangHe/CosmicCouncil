## System Architecture

### Overview

This project is a multi-agent dating advisor system that provides relationship advice from multiple perspectives.

### Components

* Frontend (Next.js): User input and result display
* Backend API: Handles requests and orchestrates agents
* Agents:

  * Astrology Agent
  * Behavioral Agent
  * History Agent
* Orchestrator: Combines outputs into final advice

### Data Flow

User Input → API → Agents → Orchestrator → Response → Frontend

### Design Decisions

* Modular agent design for extensibility
* Separation of concerns between frontend and backend
* Structured JSON response for consistency
