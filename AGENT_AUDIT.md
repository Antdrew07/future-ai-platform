# Agent Tool Audit — Full Findings

## Tools Available (16 total)

| Tool | Current Description | Issues Found |
|---|---|---|
| `web_search` | Search the web for current info | ✅ Clear and correct |
| `browse_url` | Visit a URL and read full content | ✅ Clear and correct |
| `code_execute` | Run Python/JS code, returns real output | ✅ Clear and correct |
| `shell_execute` | Run shell commands (npm, git, pip) | ⚠️ No guidance on when to use vs code_execute |
| `read_file` | Read a file created earlier | ✅ Clear |
| `write_file` | Create any file as a download | ⚠️ Too generic — no explicit guidance that this is the tool for websites/apps/code |
| `export_document` | Export PDF or Markdown | ⚠️ Not clearly distinguished from write_file for documents |
| `create_spreadsheet` | Create downloadable CSV | ✅ Clear |
| `scrape_web` | Extract structured data from website | ✅ Clear |
| `api_call` | Make HTTP requests | ✅ Clear |
| `analyze_data` | Analyze data, produce insights | ⚠️ Vague — no guidance on what format data should be in |
| `generate_image` | Generate image from text | ✅ Clear |
| `create_presentation` | Slide deck ONLY | ✅ Fixed in last session — has NEVER rules |
| `github_repo` | Read public GitHub repos | ✅ Clear |
| `schedule_task` | Schedule future task | ✅ Clear |
| `task_complete` | REQUIRED: call when done | ✅ Clear |

## System Prompt Sections — Issues Found

### Section: "Building Apps (React, Python, Node.js, etc.)"
- PROBLEM: Only mentions React, Python, Node.js. No mention of iOS (Swift/SwiftUI), Android (Kotlin/Jetpack Compose), React Native, Flutter, or Expo.
- PROBLEM: User asked for "an Apple app" → agent has no explicit instruction for native mobile apps.
- PROBLEM: No instruction to tell user what steps are needed to actually run/deploy the app.

### Section: "Building Websites"
- PROBLEM: No mention of multi-page sites, Next.js, or frameworks.
- PROBLEM: No instruction to use browse_url to research the source site when user says "based on this website".
- PROBLEM: No mention of what to do when user provides a URL to base the site on.

### Section: Missing entirely
- NO section for: "Chrome Extensions", "Browser Automations", "CLI Tools", "Python Scripts", "Desktop Apps"
- NO section for: "Email drafting", "Social media content", "Marketing copy"
- NO section for: "Video scripts", "Podcast outlines"
- NO section for: "Database schemas", "API design"

### Section: "CORRECT TOOL FOR EACH DELIVERABLE" table
- PROBLEM: Missing many task types (mobile app, Chrome extension, Python script, CLI tool, etc.)
- PROBLEM: No row for "React Native / Flutter app"
- PROBLEM: No row for "Python script / automation"
- PROBLEM: No row for "Chrome extension"

### write_file tool description
- PROBLEM: "Create a file with content" is too generic. The LLM doesn't know this is the PRIMARY tool for websites, apps, and code.
- FIX NEEDED: Make write_file description explicitly say it's the correct tool for websites, apps, scripts, and all code deliverables.

### export_document tool description  
- PROBLEM: Doesn't clearly distinguish from write_file. When should agent use export_document vs write_file for a document?
- FIX NEEDED: Clarify export_document = PDF/formatted docs; write_file = raw code/HTML/text files.

### shell_execute vs code_execute ambiguity
- PROBLEM: No clear rule for when to use shell_execute vs code_execute.
- FIX NEEDED: code_execute = run logic/calculations/scripts; shell_execute = install packages, run build tools, set up project structure.

## Priority Fixes Needed

1. **write_file description** — make it the explicit primary tool for all code/app/website deliverables
2. **System prompt: Building Apps** — add iOS (Swift), Android (Kotlin), React Native, Flutter, Expo sections with honest deployment disclosure
3. **System prompt: Building Websites** — add instruction to browse source URLs, handle frameworks
4. **System prompt: Missing sections** — add Python scripts, CLI tools, Chrome extensions, automations
5. **CORRECT TOOL table** — expand to cover all task types
6. **export_document vs write_file** — clarify the distinction
7. **shell_execute vs code_execute** — add clear usage rule
