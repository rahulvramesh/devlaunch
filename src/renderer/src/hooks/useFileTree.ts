import { useState, useCallback, useEffect, useRef } from 'react'
import { ipc } from '../lib/ipc'
import { FileEntry, SSHConfig, ConnectionMode } from '../lib/types'

interface FileTreeState {
  children: Map<string, FileEntry[]>
  expandedPaths: Set<string>
  isLoading: boolean
}

export function useFileTree(
  rootPath: string,
  connectionMode: ConnectionMode = 'local',
  sshConfig?: SSHConfig
) {
  const [state, setState] = useState<FileTreeState>({
    children: new Map(),
    expandedPaths: new Set(),
    isLoading: true
  })
  const expandedRef = useRef(state.expandedPaths)
  expandedRef.current = state.expandedPaths

  const loadDirectory = useCallback(
    async (dirPath: string) => {
      try {
        let entries: FileEntry[]
        if (connectionMode === 'ssh' && sshConfig) {
          entries = await ipc.sshReadDirectory(sshConfig, dirPath)
        } else {
          entries = await ipc.readDirectory(dirPath)
        }
        setState((prev) => {
          const newChildren = new Map(prev.children)
          newChildren.set(dirPath, entries)
          return { ...prev, children: newChildren, isLoading: false }
        })
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [connectionMode, sshConfig]
  )

  const refreshAll = useCallback(async () => {
    await loadDirectory(rootPath)
    for (const path of expandedRef.current) {
      await loadDirectory(path)
    }
  }, [rootPath, loadDirectory])

  const toggleDirectory = useCallback(
    async (dirPath: string) => {
      setState((prev) => {
        const newExpanded = new Set(prev.expandedPaths)
        if (newExpanded.has(dirPath)) {
          newExpanded.delete(dirPath)
          return { ...prev, expandedPaths: newExpanded }
        }
        newExpanded.add(dirPath)
        return { ...prev, expandedPaths: newExpanded }
      })

      if (!state.children.has(dirPath)) {
        await loadDirectory(dirPath)
      }
    },
    [state.children, loadDirectory]
  )

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    await refreshAll()
  }, [refreshAll])

  // Initial load
  useEffect(() => {
    loadDirectory(rootPath)
  }, [rootPath, loadDirectory])

  // Auto-refresh via file watcher
  useEffect(() => {
    const unsub = ipc.onFileChanged(() => {
      // Debounce: don't reload if already loading
      refreshAll()
    })

    ipc.startFileWatcher({
      rootPath,
      isSSH: connectionMode === 'ssh',
      sshConnectionId: sshConfig?.id,
      interval: 5
    })

    return () => {
      unsub()
      ipc.stopFileWatcher()
    }
  }, [rootPath, connectionMode, sshConfig?.id, refreshAll])

  return {
    children: state.children,
    expandedPaths: state.expandedPaths,
    isLoading: state.isLoading,
    toggleDirectory,
    refresh
  }
}
