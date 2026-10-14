# AGENTS.md — Nawy Habit

## 1. Project Overview

Nawy Habit is a habit-tracking application within the Nawy productivity ecosystem.

Its purpose is to help users build habits, record their practice, understand their progress, and maintain consistency through a simple, calm, and privacy-conscious experience.

Nawy Habit is an independent product. It should provide meaningful value on its own while remaining consistent with the broader Nawy product family.

The product is intended to be local-first, offline-capable, mobile-first, and deployable as a static web application without requiring a custom backend for its core functionality.

This document establishes initial direction, not a rigid technical specification. You are expected to investigate, evaluate, challenge assumptions, and recommend better solutions when justified.

## 2. Product Principles

Prioritize the following principles:

- Simplicity over feature quantity.
- Fast, frictionless habit recording.
- Clear and honest progress tracking.
- Encouraging consistency without punishing missed days.
- User ownership of personal data.
- Local-first operation and offline usability.
- Accessibility, responsiveness, and performance.
- Maintainable architecture without unnecessary abstraction.
- Visual and behavioral consistency with the Nawy design system.
- Sustainable development and responsible dependency choices.

Avoid turning the product into a generic task manager, calendar, social network, or analytics dashboard.

## 3. Initial Technical Direction

The following technologies are the initial preferences, not mandatory constraints.

### Frontend

- TypeScript.
- React.
- Vite.
- Modern HTML and CSS.
- A lightweight, maintainable component architecture.

### Local Data

- IndexedDB for persistent browser-side storage.
- Dexie.js as the initial candidate for IndexedDB access and schema management.

Evaluate whether Dexie is the best fit for the actual data model, migrations, transactions, querying, and future portability.

### PWA and Offline Support

- Installable Progressive Web App.
- Service worker and appropriate asset caching.
- Reliable offline access to core functionality.
- Safe application updates and data preservation.

Evaluate suitable tools such as `vite-plugin-pwa`, Workbox, or alternative approaches when appropriate.

### Potential Supporting Technologies

Consider, but do not automatically introduce:

- Zod or equivalent schema validation.
- Zustand or React's built-in state management.
- Vitest and Testing Library.
- Playwright for browser-level testing.
- ESLint and Prettier or equivalent tooling.
- Markdown or other portable formats for data export and import.

Choose tools according to actual requirements rather than popularity or habit.

## 4. Technology and Architecture Evaluation

You are explicitly encouraged to challenge the initial technology choices.

Before introducing a significant dependency, changing the architecture, or rejecting an existing technology, investigate the relevant trade-offs.

Evaluate alternatives when they could materially improve:

- Product quality.
- Development speed.
- Simplicity.
- Runtime performance.
- Bundle size.
- Offline reliability.
- Data integrity.
- Privacy and security.
- Accessibility.
- Long-term maintenance.
- Testing and debugging.
- Compatibility with future Nawy products.
- Portability to desktop or other platforms.

Do not assume React, Vite, Dexie, or IndexedDB must be used for every requirement simply because they are listed above.

Likewise, do not replace an existing technology merely because another option is newer or theoretically more powerful.

Make decisions based on evidence, project constraints, and measurable benefits.

For significant alternatives, explain:

1. The problem being solved.
2. The available approaches.
3. Their relevant advantages and disadvantages.
4. Migration cost and compatibility implications.
5. Your recommendation and why it is preferable.

Small implementation decisions do not require lengthy reports. Reserve detailed comparisons for decisions with meaningful long-term consequences.

## 5. Open-Source Research

Before implementing substantial functionality from scratch, investigate relevant open-source projects, libraries, and established implementation patterns.

Research may include:

- Habit trackers and habit-management applications.
- Local-first and offline-first applications.
- IndexedDB and client-side data persistence.
- PWA installation and service-worker strategies.
- Calendar-based activity and progress visualization.
- Accessible component systems.
- Data export, import, backup, and migration.
- Automated testing and performance measurement.

Potential starting points include:

- Ritual: https://github.com/tangent-labs-dev/ritual
- DoHabit: https://github.com/iNikAnn/DoHabit
- MiniSearch: https://github.com/lucaong/minisearch
- Dexie.js: https://github.com/dexie/Dexie.js
- Vite PWA: https://github.com/vite-pwa/vite-plugin-pwa

These are research starting points, not approved dependencies or mandatory foundations. Verify the current repository, maintenance status, implementation, documentation, and license before relying on any project.

For relevant candidates:

1. Inspect the actual source code and documentation.
2. Verify the current license and any applicable attribution or distribution requirements.
3. Assess maintenance activity, release history, issues, and dependency health.
4. Determine whether the project solves a problem we actually have.
5. Compare reusing the project, adapting selected components, adopting its underlying ideas, and implementing the functionality independently.
6. Consider security, accessibility, performance, and long-term maintenance.
7. Recommend the smallest and most effective solution.

Never assume that an open-source license permits unrestricted reuse. Explain relevant license obligations and compatibility concerns before copying or incorporating code.

If browsing or repository access is unavailable, state what could not be verified instead of presenting assumptions as findings.

## 6. Data Ownership and Persistence

Personal habit records are user-owned data.

The application should:

- Work without requiring an account.
- Keep core records locally by default.
- Preserve user data across normal application updates.
- Use explicit, versioned database schema migrations when necessary.
- Handle malformed, outdated, or partially imported data safely.
- Provide a practical export and import strategy.
- Avoid destructive database resets during development or upgrades.
- Avoid sending personal records to external services without explicit user consent.

IndexedDB persistence is not an absolute guarantee against device failure, browser data eviction, or user-initiated deletion. Design backup and recovery accordingly.

Keep storage operations behind a suitable application-level interface when this reduces coupling and improves testability.

Do not add a server database, authentication, cloud synchronization, or paid infrastructure unless a demonstrated requirement justifies it.

## 7. Habit Domain and Product Behavior

Keep the domain model independent from presentation wherever practical.

Explore a clear representation of:

- Habits and their configuration.
- Habit schedules and recurrence.
- Individual practice records.
- Optional quantitative measurements.
- Historical records and progress summaries.
- Archived or paused habits.
- User preferences and data portability.

Do not assume every habit is daily or binary.

Distinguish a missed occurrence from a confirmed failure, a future scheduled occurrence, an unscheduled day, and a day for which no record exists.

Avoid misleading statistics and ensure that changing a schedule does not silently rewrite historical records.

The exact domain model and supported habit types should be determined through product reasoning and implementation research rather than blindly following another application's design.

## 8. Nawy Design System

Nawy Habit belongs to the Nawy product family.

Review the existing Nawy design system and available product implementations before creating new visual conventions or shared components.

Maintain appropriate consistency in typography, colors, spacing, icons, interaction states, and overall visual language.

The product should support Arabic and RTL from the beginning, with architecture that allows English and LTR support in the future.

Do not copy another application's visual identity. Open-source projects may inform usability and implementation, but the resulting product must remain recognizably Nawy.

Avoid redesigning established Nawy conventions without a clear reason.

## 9. Engineering Standards

- Use TypeScript effectively; avoid unnecessary `any` and unsafe type assertions.
- Prefer clear, readable, maintainable code.
- Separate domain logic, persistence, presentation, and platform-specific behavior where useful.
- Avoid premature abstraction, excessive dependencies, and unnecessary complexity.
- Treat accessibility and responsive design as baseline requirements.
- Validate imported data and external inputs.
- Handle errors explicitly and avoid silently losing user data.
- Add automated tests for important domain behavior, persistence, migrations, and regression risks.
- Measure performance and bundle size before making optimization claims.
- Keep documentation aligned with the actual implementation.
- Never claim that tests, builds, or manual checks passed unless they were actually run.

Do not introduce a framework, library, service, or architectural pattern without understanding its purpose and cost.

## 10. Development Workflow

Before significant implementation:

1. Inspect the repository, existing code, project documentation, and current dependencies.
2. Identify what already works and what must be preserved.
3. Read relevant instructions and existing design-system resources.
4. Research existing solutions where useful.
5. Identify important uncertainties and technical risks.
6. Propose a practical implementation approach.

For routine, low-risk work, proceed directly when the intent is clear.

For consequential architectural choices, investigate alternatives and explain the trade-offs before committing to a direction.

During implementation:

- Prefer small, coherent changes.
- Preserve existing functionality unless a change is intentional.
- Run appropriate tests, linting, type checks, and builds when available.
- Inspect the resulting behavior rather than relying solely on code compilation.
- Document meaningful architectural decisions.

Do not stop at presenting suggestions when the requested work can reasonably be implemented. Investigate, decide, implement, and verify.

## 11. Decision-Making and Autonomy

You are expected to act as an engineering partner, not merely a code generator.

You may recommend changes to the initial stack, data model, architecture, dependencies, project structure, and implementation strategy.

Do not interpret the initial technology preferences as restrictions against better ideas.

At the same time, do not expand the scope unnecessarily or introduce complexity without a clear benefit.

When an alternative is demonstrably better, explain the reason and recommend it confidently. When the evidence is inconclusive, preserve the simpler existing approach and identify the uncertainty.

Distinguish between:

- Established requirements.
- Initial preferences.
- Verified technical facts.
- Assumptions that require validation.
- Optional future enhancements.

Do not ask for approval for every minor decision. Use sound engineering judgment within the product principles and scope.

## 12. Definition of Success

A successful Nawy Habit implementation should be:

- Simple to understand and quick to use.
- Reliable for recording and retrieving personal habit data.
- Useful without an account or custom backend.
- Functional offline after the application has been loaded.
- Installable as a PWA where supported.
- Responsive and accessible.
- Consistent with the Nawy brand.
- Tested against important data-integrity and domain-behavior risks.
- Easy to maintain and evolve.
- Supported by justified technical decisions rather than unnecessary complexity.

The ultimate goal is not to use a particular framework or maximize the number of features.

The goal is to build the best practical habit-tracking product for the Nawy ecosystem while preserving simplicity, user ownership, and long-term engineering quality.
## Platform Stack Decisions (Lovable)

- Framework is TanStack Start v1 (React 19 + Vite 7 + TypeScript); routing is file-based in src/routes — fixed by the platform, never add react-router.
- Local data lives in IndexedDB via Dexie (+ dexie-react-hooks liveQuery) — local-first, no backend for core features.
- Validate persisted data and import/export payloads with Zod — protects against corrupt or older-schema data.
- Dates for habit logs are stored as local calendar keys (YYYY-MM-DD), not timestamps — avoids timezone streak bugs.
- Dexie schema changes always go through versioned `db.version(n).upgrade()` migrations — user data must survive app updates.
- Offline/PWA via vite-plugin-pwa (generateSW), registered only in production and never in preview — prevents stale caches.
- Before adding a dependency, compare open-source alternatives (size, maintenance, license) and prefer platform/React built-ins.
