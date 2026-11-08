xMoonVerse RPG

Multiplayer Idle RPG inside the xMoonVerse ecosystem.

Project status

Development Foundation — In Progress.

The first target platform is Telegram Mini App. The architecture is designed to support future Web, iOS, Android and Desktop clients.

Technology

* React 19
* TypeScript
* Vite
* Phaser 3
* Cloudflare Workers
* Hono
* Cloudflare D1
* Cloudflare KV (planned)

Repository structure

apps/
  web/          React + Phaser client
  api/          Cloudflare Workers API
packages/
  shared/       Shared game types
docs/
  STATUS.md

Requirements

* Node.js 20 or newer
* npm
* Cloudflare account for backend development

Installation

Install dependencies from the repository root:

npm install

Run the web application

npm run dev

Build the web application

npm run build

Type checking

npm run typecheck

Run the API locally

npm run dev --workspace=apps/api

Development principles

* Server-authoritative game logic.
* Secure Telegram Mini App authentication.
* Shared types between client and backend.
* No trust in client-side timestamps.
* Independent game core without Telegram SDK dependency.
* No changes to the existing production Telegram bot.

Current limitations

This is an early development foundation.

Authentication, persistent game sessions, combat, progression, multiplayer and economy are not implemented yet.

The initial D1 migration has been created but has not been applied.

Production deployment is not authorized during the Foundation phase.