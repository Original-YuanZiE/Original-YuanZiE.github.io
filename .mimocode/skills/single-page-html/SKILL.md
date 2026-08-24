---
name: single-page-html
description: "Create a single-file HTML interactive tool or game (inline CSS+JS). Use when the user asks to build a self-contained web page with animations, games, or interactive UI — e.g. Gomoku, name picker, poetry animation, clock, calculator."
---

# Single-Page HTML Interactive Tool

Build a self-contained `.html` file with all CSS and JavaScript inlined. No frameworks, no external dependencies.

## Workflow

1. **Clarify requirements** — ask the user about:
   - Visual style (classic / modern minimalist / dark theme / themed)
   - Key features and interactions
   - Any specific difficulty levels, data inputs, or export needs
   Use the `question` tool with 2-3 focused questions, each offering 3 options.

2. **Write a plan** — create a plan file at `~/.local/share/mimocode/plans/<timestamp>-<name>.md` covering:
   - Feature list and UI layout
   - CSS approach (variables, animations, responsive breakpoints)
   - JS architecture (event handling, state management, game logic if applicable)
   - File structure (always single file)

3. **Build** — after plan approval, write one `.html` file containing:
   - `<!DOCTYPE html>` with `<meta charset="UTF-8">` and viewport meta
   - All `<style>` in `<head>`
   - All `<script>` before `</body>`
   - Semantic HTML5 structure
   - CSS custom properties for theming
   - Responsive design (works on mobile and desktop)

4. **Test** — open the file in the default browser:
   ```powershell
   Start-Process "<path>.html"
   ```
   If the user reports issues, fix and re-test.

## Conventions

- Language: respond in the user's language (typically Chinese).
- File encoding: UTF-8 with Chinese-friendly fonts (`system-ui`, `Microsoft YaHei`, etc.).
- Animations: prefer CSS `@keyframes` + `transition` for simple effects; use `<canvas>` + `requestAnimationFrame` for particle systems or complex rendering.
- Keep file size reasonable — avoid embedding large assets (images, fonts). Use SVG or CSS shapes instead.
- For AI opponent logic (games): implement Minimax with Alpha-Beta pruning, offer 3 difficulty levels by varying search depth.
- For data import: use `<input type="file">` with `FileReader` API; support CSV/XLSX via SheetJS CDN if needed, otherwise plain text parsing.
- Always include a brief `<title>` and visible heading describing the tool.

## Anti-patterns

- Do NOT split into multiple files — the entire point is single-file portability.
- Do NOT use React/Vue/Angular — vanilla HTML/CSS/JS only.
- Do NOT use CDN dependencies unless absolutely necessary (e.g. SheetJS for XLSX). If used, note it in the plan.
- Do NOT create a server — everything runs client-side.
