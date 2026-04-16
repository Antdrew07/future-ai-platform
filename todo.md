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
- [ ] Claim Stripe sandbox: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVE1acXhMT0xaalJLdjMzLDE3NzY4ODk2MDEv100JYUHy778 *(blocked: requires user to click link — cannot be automated)*
- [x] Add OpenAI API key in Settings → Secrets (OPENAI_API_KEY) — rotate the compromised key first
- [x] Add Anthropic API key in Settings → Secrets (ANTHROPIC_API_KEY)
- [ ] Publish via Manus UI Publish button after claiming Stripe sandbox *(blocked: requires user to click Publish in Management UI — cannot be automated)*

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
- [ ] Pause / cancel task controls *(deferred: future enhancement, not in MVP scope)*
- [ ] Task history with replay *(deferred: future enhancement, not in MVP scope)*

### Upgraded Agent Builder
- [x] Tool permission matrix (which tools each agent can use)
- [x] Agent persona and avatar
- [x] Max steps / timeout configuration
- [x] Autonomous mode toggle (agent decides tools) vs. guided mode

### Agent Workspace
- [x] File manager panel (agent-created files as downloadable artifacts)
- [x] Launch Workspace button on agent cards
- [x] 29 Vitest tests passing

## Branding Cleanup

- [x] Remove all "Manus", "Meta", "Powered by Manus" references from landing page
- [x] Remove all such references from dashboard layout, sidebar, footer
- [x] Remove from AgentBuilder, AgentWorkspace, and all other pages
- [x] Replace any "Manus" model label with "Future Agent" in UI
- [x] Audit all files for any remaining third-party branding leakage

## Full Ecosystem Upgrade

### Branding Cleanup
- [x] Remove all "Manus", "Meta", "Powered by Manus" text from every page
- [x] Replace "Future Agent (Powered by Manus)" with "Future Agent" everywhere
- [x] Update model labels in AgentBuilder, AgentList, AdminPanel, AgentWorkspace
- [x] Update landing page hero copy to reflect independent ecosystem vision
- [x] Update footer — Future branding only

### Engine Upgrade
- [x] Wire OpenAI GPT-4o directly as primary agent engine (tool_choice + function calling)
- [x] Wire Claude 3.5 Sonnet directly as secondary engine (Anthropic tool_use)
- [x] Update agentLoop.ts to route by modelId to correct provider
- [x] Update llmRouter.ts to use OPENAI_API_KEY and ANTHROPIC_API_KEY env vars

### Ecosystem Expansion
- [x] Add onboarding wizard for new users (3-step: welcome, create agent, ready)
- [x] Add public Agent Gallery page (/gallery — browse community agents, search, filter)
- [x] Enhance Templates marketplace with categories and featured section
- [x] Add /gallery and /onboarding routes to App.tsx
- [x] Rewrite Home.tsx as full ecosystem landing page with tool arsenal, model grid, pricing preview
- [x] 29 Vitest tests passing, 0 TypeScript errors

## Proprietary AI Branding (No Third-Party AI Names)

- [x] Define Future's own model name system: Future-1 Ultra, Future-1 Pro, Future-1 Code, Future-1 Mini, Future-1 Fast
- [x] Replace all "GPT-4o", "ChatGPT", "OpenAI" references in frontend pages with Future model names
- [x] Replace all "Claude", "Claude 3.5", "Anthropic" references in frontend pages with Future model names
- [x] Update AgentBuilder model selector — show only Future model names, no vendor names
- [x] Update Home.tsx landing page — remove all vendor AI names, use Future branding only
- [x] Update Pricing.tsx — remove vendor model names
- [x] Update AdminPanel.tsx — show Future model names only
- [x] Update AgentWorkspace.tsx — no vendor names in model display
- [x] Update AgentList.tsx — no vendor names in model badges
- [x] Update Analytics.tsx — no vendor names in charts/labels
- [x] Update AgentGallery.tsx — no vendor names
- [x] Update seed.mjs — model display names use Future branding only, provider set to 'future'
- [x] Update db.ts fallback defaults — all model display names use Future branding
- [x] Schema migration pushed — provider enum now includes 'future'
- [x] Database re-seeded with all 5 Future-branded models successfully
- [x] 29 tests passing, 0 TypeScript errors after all branding changes

## Luxury Visual Rebrand

### Logo & Brand Assets
- [x] Generate custom Future logo (futuristic, minimal, luxury feel)
- [x] Upload logo to CDN and set as app logo
- [x] Generate favicon from logo

### Global Design System
- [x] Redesign index.css: luxury dark theme with glassmorphism, deep blacks, electric violet, gold accents
- [x] Premium typography: Space Grotesk headings + Inter body
- [x] Glass card components with backdrop blur and subtle borders
- [x] Gradient accent system (violet → blue → gold)
- [x] Glow effects, subtle animations, cinematic depth
- [x] Custom scrollbar styling

### Landing Page Redesign
- [x] Cinematic hero with animated gradient orbs and particle effects
- [x] Premium feature cards with glass morphism
- [x] Model showcase with luxury tier cards
- [x] Animated stats counter section
- [x] Premium pricing cards with glow borders
- [x] High-end footer with gradient divider

### Dashboard Redesign
- [x] Luxury sidebar with glass effect and gradient active states
- [x] Premium stat cards with gradient borders and glow
- [x] Redesign all dashboard pages with luxury card components
- [x] Agent builder with premium model selector cards
- [x] Agent workspace with cinematic execution feed

### All Pages Redesign
- [x] Billing page with premium credit pack cards
- [x] Admin panel with luxury data tables
- [x] Analytics with premium chart styling
- [x] Settings, Teams, Templates, Gallery, Onboarding — all luxury UI
- [x] 29 tests passing, 0 TypeScript errors, dev server running clean

## Luxury Rebrand Gaps (Fix)

- [x] Upload generated logo/favicon to CDN (logo: future-logo_e02304b5.png, favicon: future-favicon_934ff57c.png)
- [x] Implement animated numeric counters on landing page stats section (IntersectionObserver-based)
- [x] Footer with gradient divider in Home.tsx verified and implemented
- [x] Upgrade AgentWorkspace execution feed cards with luxury glass styling (StepCard + ArtifactsPanel)

## Custom Email/Password Auth (Replace Manus OAuth)

- [x] Add passwordHash column to users table, push migration
- [x] Install bcryptjs for password hashing
- [x] Build auth.register tRPC procedure (email, password, name)
- [x] Build auth.login tRPC procedure (email, password → JWT cookie)
- [x] Build auth.logout and auth.me procedures using custom JWT
- [x] Replace Manus OAuth context with custom JWT session context
- [x] Build Future-branded Sign In page (/signin)
- [x] Build Future-branded Sign Up page (/signup)
- [x] Update App.tsx: remove Manus OAuth login URL, wire /signin and /signup routes
- [x] Update FutureDashboardLayout: replace getLoginUrl() with /signin redirect
- [x] Update useAuth hook to use custom auth procedures
- [x] Remove all Manus OAuth references from frontend
- [x] Write Vitest tests for register/login/logout
- [x] Final checkpoint

## Onboarding Redesign — Manus-style Task Prompt

- [x] Replace "Create Agent" template picker with a simple task prompt UI (text box + suggestion chips)
- [x] Suggestion chips: Build a website, Write & run code, Research a topic, Analyze data, Create a presentation, Automate a workflow, Custom task
- [x] On submit, navigate to agent workspace with the task pre-filled
- [x] Keep the same 3-step onboarding flow structure

## Free Credits on Signup

- [x] Grant 100 free credits to every new user on registration (in auth.register procedure)
- [x] Seed existing users who have 0 credits with 100 free credits via DB migration script
- [x] Show free credit balance clearly in the workspace UI so users know they have credits

## Agent Workspace Bug Fixes

- [x] Fix: completed agent steps stuck on "Agent is thinking..." — final answer never renders in step card
- [x] Fix: step card should show actual LLM response text when status is complete

## Full Platform Audit

- [x] Fix agent engine: steps stuck on "Agent is thinking..." — final answer never rendered
- [x] Fix agent SSE stream: ensure "complete" event carries finalAnswer and renders in conversation
- [x] Audit agent execution loop in server (agentEngine or routers.ts)
- [x] Audit auth flow: register, login, logout, session persistence
- [x] Audit billing/credits: balance display, Stripe checkout, webhook
- [x] Audit dashboard: agents list, task history, analytics
- [x] Audit routing: all pages reachable, no dead links
- [x] Run full vitest suite and confirm 0 failures

## Dashboard Redesign — Manus-Style

- [ ] Replace current Dashboard.tsx with a minimal home screen: greeting, central prompt box, suggestion chips, recent tasks
- [ ] Simplify FutureDashboardLayout sidebar — fewer items, cleaner look
- [ ] Prompt box on dashboard navigates to workspace with task pre-filled
- [ ] Suggestion chips: practical tasks (Build a website, Write code, Research, Analyze data, etc.)
- [ ] Recent tasks section shows last 5 tasks with status and quick-resume link

## Light Theme Redesign

- [x] Redesign global CSS (index.css) to clean white/light theme with violet brand accents
- [x] Update FutureDashboardLayout sidebar for light theme
- [x] Update Dashboard home screen for light theme
- [x] Update SignIn and SignUp pages for light theme
- [x] Ensure all text is readable on light backgrounds
