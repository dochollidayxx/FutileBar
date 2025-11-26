# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AGS (Astal) project written in TypeScript that creates a desktop bar widget for Linux window managers (primarily Hyprland). AGS is a scaffolding tool for building GTK4-based desktop widgets using TypeScript/JSX.

## Development Commands

```bash
# Run the bar (development mode)
ags run

# Bundle the application for production
ags bundle

# Generate TypeScript types from GObject introspection files
ags types

# List running AGS instances
ags list

# Quit a running instance
ags quit

# Toggle window visibility
ags toggle <window-name>

# Inspect with GTK debug tools
ags inspect
```

## Architecture

### Application Entry Point

- `app.ts` - Main entry point that initializes the AGS app with CSS styling and creates a Bar widget for each monitor

### Widget Structure

- `widget/Bar.tsx` - The main bar component using JSX syntax
  - Creates a window with TOP, LEFT, RIGHT anchors (exclusive positioning)
  - Uses GTK4 components (Gtk.Align, Gtk.Calendar, etc.)
  - Integrates with Hyprland window manager via AstalHyprland GObject bindings
  - Contains three sections in a centerbox: start (button), center (empty), end (menubutton with time/calendar)

### Styling

- `style.scss` - SCSS stylesheet compiled and injected at runtime
  - Uses GTK theme variables (@theme_fg_color, @theme_bg_color)
  - Styles are scoped to window.Bar

### Type Definitions

- `env.d.ts` - Module declarations for importing SCSS, CSS, and BLP files as strings
- `@girs/` - GObject Introspection type definitions (auto-generated, in .gitignore)
  - Contains TypeScript definitions for GTK4, GLib, Gio, Astal libraries, and more
  - Do not manually edit files in @girs/

### Dependencies

- `ags` - The AGS framework (GTK4-based shell toolkit)
  - AGS re-exports from `gnim` (the underlying reactive framework)
  - Installed system-wide and symlinked from `/usr/share/ags/js`
- `gnim` - The reactive framework powering AGS (provides JSX runtime and state management)

## Key Concepts

### JSX/TSX with GTK4

Components use JSX syntax that maps to GTK widgets. The `jsxImportSource` is set to "ags/gtk4" in tsconfig.json, enabling React-like JSX for GTK4 widgets.

**Important GTK4 differences from HTML/React:**
- Use `cssClasses={["class-name"]}` (array) instead of `className="class-name"`
- Properties map to GTK widget properties, not HTML attributes
- Use `cssName` to set the CSS node name (used in centerbox example)

### GObject Introspection

The project uses GObject Introspection (gi://) to import native GNOME libraries:
```typescript
import Hyprland from "gi://AstalHyprland"
```

### AGS/Gnim Utilities

- `ags/gtk4/app` - Application instance and lifecycle
- `ags/process` - Execute async shell commands (e.g., execAsync)
- `ags/time` - Polling utilities (e.g., createPoll for updating time)
- `ags` - Core reactive primitives (re-exported from gnim):
  - `createBinding(object, property)` - Create reactive binding to GObject property
  - `createState(initialValue)` - Create reactive state
  - `createComputed(fn)` - Create computed/derived value

### Reactive Bindings

To reactively bind to GObject properties (e.g., Hyprland workspace changes):

```typescript
import { createBinding } from "ags"
import Hyprland from "gi://AstalHyprland"

const hyprland = Hyprland.get_default()

// Returns an Accessor that updates when the property changes
const workspace = createBinding(hyprland, "focusedWorkspace")

// Use .as() to transform the value
<label label={workspace.as(ws => `Workspace ${ws?.get_id() ?? "?"}`)} />
```

**Key points:**
- `createBinding` returns an `Accessor` object with `.as()` and `.get()` methods
- Use `.as(transform)` to transform the value for display
- The binding automatically subscribes to GObject property notifications
- Do NOT use `bind()` - it doesn't exist in this version of AGS

### Window Properties

- `exclusivity` - EXCLUSIVE means the window reserves screen space (like a dock)
- `anchor` - Bitwise flags for window positioning (TOP | LEFT | RIGHT)
- `gdkmonitor` - Associates the window with a specific monitor
