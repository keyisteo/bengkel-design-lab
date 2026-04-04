#!/usr/bin/env bash
set -euo pipefail

# Bengkel Design Lab — Project Scaffolding Script
# Usage: ./scripts/create-project.sh <id> <name> <tagline> <logo-char> <accent-color>
# Example: ./scripts/create-project.sh my-app "My App" "One-line description" M "#4F46E5"

if [ "$#" -lt 5 ]; then
  echo "Usage: ./scripts/create-project.sh <id> <name> <tagline> <logo-char> <accent-color>"
  echo ""
  echo "Arguments:"
  echo "  id           Project ID (kebab-case, e.g. 'my-app')"
  echo "  name         Display name (e.g. 'My App')"
  echo "  tagline      One-line description (e.g. 'Task manager for teams')"
  echo "  logo-char    Single character for sidebar logo (e.g. 'M')"
  echo "  accent-color Primary accent color hex (e.g. '#4F46E5')"
  echo ""
  echo "Example:"
  echo "  ./scripts/create-project.sh my-app \"My App\" \"Task manager for teams\" M \"#4F46E5\""
  exit 1
fi

PROJECT_ID="$1"
PROJECT_NAME="$2"
PROJECT_TAGLINE="$3"
LOGO_CHAR="$4"
ACCENT_COLOR="$5"

# Derive prefix from ID (first 2 chars, no hyphens)
PREFIX=$(echo "$PROJECT_ID" | tr -d '-' | cut -c1-2)

PROJECT_DIR="src/projects/$PROJECT_ID"

if [ -d "$PROJECT_DIR" ]; then
  echo "Error: $PROJECT_DIR already exists"
  exit 1
fi

echo "Creating project: $PROJECT_NAME ($PROJECT_ID)"
echo "  Directory: $PROJECT_DIR"
echo "  Prefix: --${PREFIX}-"
echo "  Accent: $ACCENT_COLOR"
echo ""

# Create directory structure
mkdir -p "$PROJECT_DIR"/{pages,personas,data}

# Create CSS tokens
cat > "$PROJECT_DIR/$PROJECT_ID.css" << CSSEOF
.$PROJECT_ID {
  --${PREFIX}-bg: #F8FAFC;
  --${PREFIX}-surface: #FFFFFF;
  --${PREFIX}-primary: $ACCENT_COLOR;
  --${PREFIX}-primary-hover: $ACCENT_COLOR;
  --${PREFIX}-muted: #94A3B8;
  --${PREFIX}-text: #1E293B;
  --${PREFIX}-text-secondary: #64748B;
  --${PREFIX}-border: #E2E8F0;

  font-family: 'Inter', system-ui, sans-serif;
  background-color: var(--${PREFIX}-bg);
  color: var(--${PREFIX}-text);
}

.$PROJECT_ID .${PREFIX}-card {
  background: var(--${PREFIX}-surface);
  border-radius: 12px;
  border: 1px solid var(--${PREFIX}-border);
}

.$PROJECT_ID .${PREFIX}-btn-primary {
  background-color: var(--${PREFIX}-primary);
  color: #FFFFFF;
  border-radius: 10px;
  height: 48px;
  font-weight: 600;
  transition: background-color 150ms;
}

.$PROJECT_ID .${PREFIX}-btn-primary:hover {
  background-color: var(--${PREFIX}-primary-hover);
}

.$PROJECT_ID .${PREFIX}-input {
  background: var(--${PREFIX}-surface);
  border: 1px solid var(--${PREFIX}-border);
  border-radius: 10px;
  padding: 12px 16px;
  color: var(--${PREFIX}-text);
  outline: none;
  transition: border-color 150ms;
  width: 100%;
}

.$PROJECT_ID .${PREFIX}-input:focus {
  border-color: var(--${PREFIX}-primary);
}

.$PROJECT_ID .${PREFIX}-input::placeholder {
  color: var(--${PREFIX}-muted);
}
CSSEOF

# Create entry point
COMPONENT_NAME=$(echo "$PROJECT_ID" | sed -E 's/(^|-)([a-z])/\U\2/g')

cat > "$PROJECT_DIR/index.tsx" << TSXEOF
import { useState, useEffect } from 'react'
import './$PROJECT_ID.css'

interface ${COMPONENT_NAME}AppProps {
  screen?: string
  onScreenChange?: (screen: string) => void
}

export function ${COMPONENT_NAME}App({ screen: externalScreen, onScreenChange }: ${COMPONENT_NAME}AppProps) {
  const [screen, setScreen] = useState(externalScreen ?? '${PROJECT_ID}-home')

  useEffect(() => {
    if (!externalScreen || externalScreen === screen) return
    setScreen(externalScreen)
  }, [externalScreen]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (s: string) => {
    setScreen(s)
    onScreenChange?.(s)
  }

  return (
    <div className="$PROJECT_ID w-full h-full">
      {screen === '${PROJECT_ID}-home' && (
        <div className="flex flex-col min-h-screen items-center justify-center px-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-4"
            style={{ background: 'var(--${PREFIX}-primary)' }}
          >
            $LOGO_CHAR
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--${PREFIX}-text)' }}>
            $PROJECT_NAME
          </h1>
          <p className="text-sm" style={{ color: 'var(--${PREFIX}-muted)' }}>
            $PROJECT_TAGLINE
          </p>
          <p className="text-xs mt-8" style={{ color: 'var(--${PREFIX}-muted)' }}>
            Start building your screens in pages/
          </p>
        </div>
      )}
    </div>
  )
}
TSXEOF

# Create persona index
cat > "$PROJECT_DIR/personas/_index.json" << JSONEOF
{
  "_meta": {
    "purpose": "Persona index for $PROJECT_NAME. Each persona represents a target user archetype."
  },
  "personas": []
}
JSONEOF

# Create design docs
cat > "$PROJECT_DIR/DESIGN_BRIEF.md" << MDEOF
# $PROJECT_NAME — Design Brief

## What is it?
<!-- One-line description of the project -->

## Who is it for?
<!-- Target users -->

## Business Goals
<!-- What success looks like -->

## Core Problem
<!-- The problem this solves -->
MDEOF

cat > "$PROJECT_DIR/APP_STRUCTURE.md" << MDEOF
# $PROJECT_NAME — App Structure

## Directory Layout

\`\`\`
src/projects/$PROJECT_ID/
├── index.tsx
├── $PROJECT_ID.css
├── pages/
├── data/
├── personas/
├── DESIGN_BRIEF.md
├── APP_STRUCTURE.md
├── DESIGN_TOKENS.md
└── DECISIONS.md
\`\`\`

## Screens

| Screen ID | Name | Goal |
|---|---|---|
| \`${PROJECT_ID}-home\` | Home | <!-- Goal --> |

## Scenarios

### Happy Path
**Flow:** Home → ...
MDEOF

cat > "$PROJECT_DIR/DESIGN_TOKENS.md" << MDEOF
# $PROJECT_NAME — Design Tokens

All tokens are scoped under \`.$PROJECT_ID\` and prefixed with \`--${PREFIX}-\`.

## Color Palette

| Token | Value | Usage |
|---|---|---|
| \`--${PREFIX}-bg\` | \`#F8FAFC\` | Primary canvas |
| \`--${PREFIX}-surface\` | \`#FFFFFF\` | Card surfaces |
| \`--${PREFIX}-primary\` | \`$ACCENT_COLOR\` | Primary accent |
| \`--${PREFIX}-muted\` | \`#94A3B8\` | Placeholder text |
| \`--${PREFIX}-text\` | \`#1E293B\` | Primary text |
| \`--${PREFIX}-border\` | \`#E2E8F0\` | Borders |
MDEOF

cat > "$PROJECT_DIR/DECISIONS.md" << MDEOF
# $PROJECT_NAME — Decision Log

All design decisions for the $PROJECT_NAME project.

---

<!-- Add decisions here as you iterate -->
MDEOF

echo ""
echo "Project scaffolded at $PROJECT_DIR"
echo ""
echo "Next steps:"
echo "  1. Import and register in src/projects/registry.ts:"
echo ""
echo "     import { ${COMPONENT_NAME}App } from './$PROJECT_ID'"
echo "     import ${PROJECT_ID//-/}PersonaIndex from './$PROJECT_ID/personas/_index.json'"
echo ""
echo "     export const ${PROJECT_ID//-/_}_CONFIG: ProjectConfig = {"
echo "       id: '$PROJECT_ID',"
echo "       component: ${COMPONENT_NAME}App,"
echo "       brand: { ... },"
echo "       scenarios: [{ id: '${PROJECT_ID}-happy-path', ... }],"
echo "       personaIndex: ${PROJECT_ID//-/}PersonaIndex as ProjectConfig['personaIndex'],"
echo "       personaFiles: {},"
echo "     }"
echo ""
echo "  2. Add to PROJECT_CONFIGS:"
echo "     '$PROJECT_ID': ${PROJECT_ID//-/_}_CONFIG,"
echo ""
echo "  3. Add SCREEN_DOCS entries in src/data/screenDocs.ts"
echo "  4. Build screens in $PROJECT_DIR/pages/"
echo ""
echo "See docs/NEW-PROJECT.md for the full guide."
