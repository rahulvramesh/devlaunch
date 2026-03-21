if (!window.api) {
  console.error('DevLaunch: window.api is not available. Preload script may have failed to load.')
}

export const ipc = window.api
