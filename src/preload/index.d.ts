import type { DevLaunchAPI } from './index'

declare global {
  interface Window {
    api: DevLaunchAPI
  }
}
