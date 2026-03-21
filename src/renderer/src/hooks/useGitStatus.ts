import { useState, useEffect, useRef } from 'react'
import { ipc } from '../lib/ipc'
import { GitStatus } from '../lib/types'

export function useGitStatus(projectPath: string) {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    let mounted = true

    async function fetchStatus(): Promise<void> {
      try {
        const status = await ipc.getGitStatus(projectPath)
        if (mounted) {
          setGitStatus(status)
          setIsLoading(false)
        }
      } catch {
        if (mounted) setIsLoading(false)
      }
    }

    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 10000)

    return () => {
      mounted = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [projectPath])

  return { gitStatus, isLoading }
}
