# DevLaunch

A guided project launcher with built-in terminal and file explorer. Create, launch, and manage projects locally or on remote servers via SSH.

## Features

- **Project Wizard** — Scaffold new projects from templates (Next.js) with a guided 2-step flow
- **Open Existing** — Open any local folder or browse remote directories via SSH
- **Multi-Terminal Tabs** — Run multiple independent shells in parallel with tab management
- **File Explorer** — Browse project files with auto-refresh on changes
- **SSH Remote** — Full SSH support with saved connections, remote shell, and SFTP file browsing
- **Port Forwarding** — Auto-detect listening ports, forward remote ports locally, open in browser
- **Light/Dark Mode** — System preference detection with manual toggle
- **Auto-Updates** — In-app update UI with download progress and one-click install
- **Cross-Platform** — Linux (AppImage, .deb), Windows (NSIS installer), macOS (DMG)

## Quick Start

### Download

Grab the latest release for your platform from [Releases](https://github.com/rahulvramesh/devlaunch/releases).

| Platform | File |
|----------|------|
| Linux | `DevLaunch-x.x.x.AppImage` or `devlaunch_x.x.x_amd64.deb` |
| Windows | `devlaunch-x.x.x-setup.exe` |
| macOS | `DevLaunch-x.x.x-arm64.dmg` |

### Development

```bash
# Clone
git clone https://github.com/rahulvramesh/devlaunch.git
cd devlaunch

# Install
npm install

# Dev mode
npm run dev

# Build
npm run build

# Package
npm run build:linux   # AppImage + .deb
npm run build:win     # NSIS installer
npm run build:mac     # DMG
```

## Architecture

```
Electron App
├── Main Process (Node.js)
│   ├── PTY Manager (node-pty) — local terminal shells
│   ├── SSH Manager (ssh2) — remote connections, shells, SFTP
│   ├── Port Scanner — detect listening ports, forward over SSH
│   ├── File Watcher (chokidar) — auto-refresh file tree
│   └── Auto-Updater (electron-updater) — GitHub releases
├── Preload (contextBridge)
│   └── Typed IPC API — 30+ methods for terminal, SSH, fs, ports
└── Renderer (React + Tailwind)
    ├── Welcome Screen — new project, open existing, recent projects
    ├── Project Wizard — name, template, location (local/SSH)
    ├── Dashboard — file tree + multi-terminal tabs + status bar
    └── SSH Dialog — connect, test, save, browse remote folders
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New project |
| `Ctrl+O` | Open existing project |
| `Ctrl+T` | New terminal tab |
| `Ctrl+W` | Close terminal tab |
| `Ctrl+Tab` | Next terminal tab |
| `Ctrl+Shift+Tab` | Previous terminal tab |
| `Escape` | Go back |

## Tech Stack

- **Electron** — cross-platform desktop app
- **React 18** — UI components
- **Tailwind CSS** — styling
- **xterm.js** — terminal emulator
- **node-pty** — pseudo-terminal management
- **ssh2** — SSH client (pure JS)
- **electron-vite** — build tooling
- **electron-builder** — packaging and distribution
- **electron-updater** — auto-updates from GitHub releases

## License

MIT
