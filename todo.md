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
- [ ] Claim Stripe sandbox: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVE1acXhMT0xaalJLdjMzLDE3NzY4ODk2MDEv100JYUHy778 (user action required)
- [x] Add OpenAI API key in Settings → Secrets (OPENAI_API_KEY) — rotate the compromised key first
- [x] Add Anthropic API key in Settings → Secrets (ANTHROPIC_API_KEY)
- [ ] Publish via Manus UI Publish button after claiming Stripe sandbox (user action required)

## Autonomous Agent Upgrade (Manus-like)

### Tool Execution Engine
- [x] Define tool registry: web_search, code_execute, file_read, file_write, api_call, analyze_data, generate_image, task_complete
- [x] Build server-side tool executor with sandboxed code execution (via invokeLLM function-calling)
- [x] Implement agentic loop: think → plan → tool_call → observe → repeat until done
- [x] Stream task steps in real-time via SSE (Server-Sent Events)
- [x] Tool result parsing and error recovery

### Manus API Integration
- [x] Add Manus as a model provider in the LLM router
- [x] Wire BUILT_IN_FORGE_API_URL + BUILT_IN_FORGE_API_KEY for Manus agent calls
- [x] Add "Future Agent (Manus-powered)" model option in agent builder
- [x] Credit pricing for Manus-powered tasks
- [x] Seed database with all 5 models (Future Agent, GPT-4o, GPT-4o Mini, Claude 3.5, Claude Haiku)
- [x] Seed credit packs (Starter $9.99, Growth $39.99, Pro $99.99, Enterprise $299.99)
- [x] Seed subscription plans (Free, Starter $19/mo, Pro $49/mo, Enterprise $199/mo)

### Upgraded Task Execution UI
- [x] Full-screen task workspace (like Manus) with split-pane: chat left, execution right
- [x] Live streaming step feed with tool call cards (web search results, code output, file previews)
- [x] Agent "thinking" animation while processing
- [x] Tool result display: web search snippets, code output blocks, file trees
- [x] Task progress indicator and step counter
- [x] Output artifacts (downloadable files, reports, images)
- [ ] Pause / cancel task controls (future enhancement)
- [ ] Task history with replay (future enhancement)

### Upgraded Agent Builder
- [x] Tool permission matrix (which tools each agent can use)
- [x] Agent persona and avatar
- [x] Max steps / timeout configuration
- [x] Autonomous mode toggle (agent decides tools) vs. guided mode

### Agent Workspace
- [x] File manager panel (agent-created files as downloadable artifacts)
- [x] Launch Workspace button on agent cards
- [x] 29 Vitest tests passing
