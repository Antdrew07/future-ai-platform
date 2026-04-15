# Future AI Platform — TODO

## Phase 1: Schema & Design System
- [x] Database schema: users, agents, tasks, steps, conversations, messages, credits, transactions, packs, plans, models, apiKeys, teams, teamMembers, templates, analytics, notifications
- [x] Global CSS design system (dark theme, OKLCH colors, Inter + JetBrains Mono fonts)
- [x] Push DB migrations

## Phase 2: Backend Routers
- [x] agents router: CRUD, deploy, get by slug, publicList
- [x] conversations router: create, list, get messages
- [x] tasks router: create, list, get steps, update status
- [x] llm router: invoke LLM with token tracking + credit deduction (OpenAI, Anthropic, Manus)
- [x] credits router: balance, packs, plans, checkout (Stripe), transaction history, addBonus (admin)
- [x] apiKeys router: create (fut_live_ prefix), list, revoke
- [x] teams router: create, invite, manage members
- [x] templates router: publish, list (public), install, myTemplates
- [x] admin router: user management, pricing config, system stats, approveTemplate, seedData
- [x] analytics router: usage (7/30/90 days), summary

## Phase 3: Frontend Core
- [x] Landing page (hero, features, pricing CTA, demo section)
- [x] FutureDashboardLayout with sidebar (agents, analytics, billing, settings, admin, API keys, teams, templates)
- [x] Dashboard home with stats cards and recent activity
- [x] Agent list page with search and filters
- [x] Usage analytics page with Recharts (line + bar charts)
- [x] Billing page with credit balance and purchase options

## Phase 4: Agent Builder & Chat
- [x] Agent builder UI (system prompt editor, model selector, memory toggle, tool toggles, temperature slider)
- [x] Agent chat panel (AgentChatPanel with streaming)
- [x] Task execution view with live step-by-step logs (TaskView)
- [x] Public shareable agent page (/agent/:slug)

## Phase 5: Advanced Features
- [x] Admin panel (user table, pricing editor, system metrics, role-based access guard)
- [x] Templates marketplace (browse, publish, install, featured templates)
- [x] API key management page (create, list, revoke, copy)
- [x] Team management page (create, invite, member list)
- [x] Settings page (profile, notifications, security, danger zone)
- [x] Pricing page (plans + pay-as-you-go packs)
- [x] Real-time credit balance in sidebar

## Phase 6: Stripe & Polish
- [x] Stripe integration (credit packs checkout via stripe.checkout.sessions.create)
- [x] Stripe webhook handler (/api/stripe/webhook — checkout.session.completed, invoice.paid)
- [x] stripeProducts.ts (credit packs + subscription plan definitions)
- [x] 26 Vitest tests passing (auth, agents, credits, apiKeys, analytics, admin, teams, templates)
- [x] Final checkpoint and delivery

## Post-Launch TODO
- [ ] Claim Stripe sandbox: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVE1acXhMT0xaalJLdjMzLDE3NzY4ODk2MDEv100JYUHy778
- [ ] Add OpenAI API key in Settings → Secrets (OPENAI_API_KEY) — rotate the compromised key first
- [ ] Add Anthropic API key in Settings → Secrets (ANTHROPIC_API_KEY)
- [ ] Publish via Manus UI Publish button after claiming Stripe sandbox
