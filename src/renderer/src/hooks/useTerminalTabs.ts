import { useState, useCallback } from 'react'

export interface TerminalTab {
  id: string
  name: string
  tmuxWindowId?: string
  tmuxPaneId?: string
}

let tabCounter = 0

function createTabId(): string {
  return `term-${Date.now()}-${++tabCounter}`
}

export function useTerminalTabs(initialName?: string) {
  const [tabs, setTabs] = useState<TerminalTab[]>(() => {
    const first: TerminalTab = {
      id: createTabId(),
      name: initialName || 'Terminal 1'
    }
    return [first]
  })

  const [activeTabId, setActiveTabId] = useState(() => tabs[0].id)

  const addTab = useCallback((name?: string) => {
    const newTab: TerminalTab = {
      id: createTabId(),
      name: name || `Terminal ${tabs.length + 1}`
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
    return newTab.id
  }, [tabs.length])

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) {
          // Can't close last tab — create a replacement
          const replacement: TerminalTab = { id: createTabId(), name: 'Terminal 1' }
          setActiveTabId(replacement.id)
          return [replacement]
        }

        const idx = prev.findIndex((t) => t.id === id)
        const newTabs = prev.filter((t) => t.id !== id)

        // If closing the active tab, activate a neighbor
        if (id === activeTabId) {
          const newIdx = Math.min(idx, newTabs.length - 1)
          setActiveTabId(newTabs[newIdx].id)
        }

        return newTabs
      })
    },
    [activeTabId]
  )

  const renameTab = useCallback((id: string, name: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))
  }, [])

  const closeOtherTabs = useCallback(
    (keepId: string) => {
      setTabs((prev) => prev.filter((t) => t.id === keepId))
      setActiveTabId(keepId)
    },
    []
  )

  const restoreTabs = useCallback(
    (windows: Array<{ windowId: string; paneId: string; name: string }>) => {
      const restoredTabs: TerminalTab[] = windows.map((w) => ({
        id: createTabId(),
        name: w.name,
        tmuxWindowId: w.windowId,
        tmuxPaneId: w.paneId
      }))
      if (restoredTabs.length > 0) {
        setTabs(restoredTabs)
        setActiveTabId(restoredTabs[0].id)
      }
      return restoredTabs
    },
    []
  )

  const updateTabMapping = useCallback(
    (tabId: string, windowId: string, paneId: string) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId ? { ...t, tmuxWindowId: windowId, tmuxPaneId: paneId } : t
        )
      )
    },
    []
  )

  return {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    renameTab,
    setActiveTab: setActiveTabId,
    closeOtherTabs,
    restoreTabs,
    updateTabMapping
  }
}
