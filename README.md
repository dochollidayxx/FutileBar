# FutileBar

A minimal and elegant desktop bar widget for Hyprland and other Linux window managers, built with AGS (Astal/Gnim) and GTK4.

## Features

- **Workspace Indicator** - Visual workspace switcher with diamond indicators
- **Window Title Display** - Shows the currently focused window title in the center
- **System Stats** - Real-time CPU usage, temperature, memory, and disk usage monitoring
- **Audio Visualizer** - CAVA-powered audio visualization bars
- **System Tray** - Full system tray support with icon detection and menu handling
- **Audio Control** - Quick access to volume controls (pwvucontrol integration)
- **Bluetooth Control** - Bluetooth connection status and quick access to Overskride
- **Power Menu** - Shutdown, reboot, suspend, lock, and logout options
- **Multi-Monitor Support** - Automatically creates a bar for each connected monitor

## Prerequisites

- [AGS (Astal)](https://github.com/aylur/ags) - The GTK4-based shell toolkit
- Hyprland (or another window manager with compatible bindings)
- Linux system with GTK4 support

### Required System Libraries

The following Astal libraries are used:
- `AstalHyprland` - Hyprland window manager integration
- `AstalBluetooth` - Bluetooth device management
- `AstalWp` (WirePlumber) - Audio device management
- `AstalTray` - System tray implementation
- `AstalCava` - Audio visualization

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url> futilebar
   cd futilebar
   ```

2. Generate TypeScript type definitions:
   ```bash
   ags types
   ```

3. Run in development mode:
   ```bash
   ags run
   ```

4. Or bundle for production:
   ```bash
   ags bundle
   ```
   This creates a standalone `futilebar` executable that can be run directly.

## Usage

### Running the Bar

Development mode:
```bash
ags run
```

Production mode (after bundling):
```bash
./futilebar
```

### Configuration

The bar is configured through several files:

- `app.ts` - Application entry point and monitor setup
- `widget/Bar.tsx` - Main bar layout and component composition
- `style.scss` - Visual styling and theming
- Individual widget files in `widget/` directory

### Styling

The bar uses SCSS for styling with a custom color palette defined in `style.scss`:

- **Silver** - `#a2a29e`
- **Shadow Grey** - `#272727`
- **Brick Red** - `#b22127`
- **Deep Crimson** - `#8f1218`
- **Porcelain** - `#fcfbf6`

Modify `style.scss` to customize the appearance.

### External Commands

The bar integrates with several external applications:

- `rofi` - Application launcher (activated via the launcher button)
- `pwvucontrol` - Audio control interface
- `overskride` - Bluetooth management interface
- `hyprlock` - Screen locking
- `hyprctl` - Hyprland workspace control

## Project Structure

```
futilebar/
├── app.ts              # Application entry point
├── style.scss          # Styling and theming
├── env.d.ts           # TypeScript module declarations
├── tsconfig.json      # TypeScript configuration
├── package.json       # Project metadata
├── assets/            # Static assets (SVG icons)
├── widget/            # UI components
│   ├── Bar.tsx           # Main bar component
│   ├── Workspaces.tsx    # Workspace indicator
│   ├── PowerMenu.tsx     # Power menu dropdown
│   ├── Tray.tsx          # System tray
│   ├── SystemStats.tsx   # System resource monitoring
│   ├── Cava.tsx          # Audio visualizer
│   └── useWindowTitle.ts # Window title hook
└── @girs/             # Auto-generated type definitions (gitignored)
```

## Development

### AGS Commands

```bash
# Run in development mode
ags run

# Bundle for production
ags bundle

# Generate TypeScript types
ags types

# List running instances
ags list

# Quit running instance
ags quit

# Inspect with GTK debugger
ags inspect
```

### Architecture

FutileBar uses:
- **AGS/Gnim** - Reactive framework with JSX support for GTK4
- **GObject Introspection** - Native GNOME library bindings
- **TypeScript** - Type-safe development

See `CLAUDE.md` for detailed architecture documentation and development guidance.

## Autostart

To launch FutileBar automatically with your window manager, add to your Hyprland config:

```conf
exec-once = /path/to/futilebar/futilebar
```

Or for development:

```conf
exec-once = ags run --config /path/to/futilebar
```

## Customization

### Adding New Widgets

1. Create a new `.tsx` file in the `widget/` directory
2. Import and use AGS reactive primitives from `ags`:
   ```typescript
   import { createBinding, createState } from "ags"
   ```
3. Add your widget to `Bar.tsx`
4. Style it in `style.scss`

### Reactive Data Binding

FutileBar uses AGS reactive primitives:

```typescript
// Bind to GObject properties
const workspace = createBinding(hyprland, "focusedWorkspace")

// Create local state
const [value, setValue] = createState(0)

// Transform values for display
<label label={workspace.as(ws => `Workspace ${ws?.get_id()}`)} />
```

## License

This project is licensed under the GNU General Public License v3.0. See the `LICENSE` file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Acknowledgments

- Built with [AGS (Astal)](https://github.com/aylur/ags)
- Powered by [Gnim](https://github.com/aylur/gnim) reactive framework
- Designed for [Hyprland](https://hyprland.org/)
