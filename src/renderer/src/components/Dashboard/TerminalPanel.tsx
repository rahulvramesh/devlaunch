import { useEffect } from 'react'
import { useTerminalTabs } from '../../hooks/useTerminalTabs'
import { SSHConfig, ConnectionMode } from '../../lib/types'
import Terminal from './Terminal'
import TerminalTabs from './TerminalTabs'

interface TerminalPanelProps {
  cwd: string
  scaffoldCommand?: string
  connectionMode: ConnectionMode
  sshConfig?: SSHConfig
}

export default function TerminalPanel({
  cwd,
  scaffoldCommand,
  connectionMode,
  sshConfig
}: TerminalPanelProps): JSX.Element {
  const {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    renameTab,
    setActiveTab,
    closeOtherTabs
  } = useTerminalTabs(scaffoldCommand ? 'Setup' : undefined)

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      // Ctrl+T: new tab
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        addTab()
      }
      // Ctrl+W: close active tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        closeTab(activeTabId)
      }
      // Ctrl+Tab: next tab
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault()
        const idx = tabs.findIndex((t) => t.id === activeTabId)
        if (e.shiftKey) {
          // Previous tab
          const prevIdx = idx <= 0 ? tabs.length - 1 : idx - 1
          setActiveTab(tabs[prevIdx].id)
        } else {
          // Next tab
          const nextIdx = idx >= tabs.length - 1 ? 0 : idx + 1
          setActiveTab(tabs[nextIdx].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId, addTab, closeTab, setActiveTab])

  return (
    <div className="flex flex-col h-full">
      <TerminalTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTab}
        onAddTab={() => addTab()}
        onCloseTab={closeTab}
        onRenameTab={renameTab}
        onCloseOtherTabs={closeOtherTabs}
      />

      {/* Terminal instances — all mounted, only active one visible */}
      <div className="flex-1 min-h-0 relative">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{ display: tab.id === activeTabId ? 'block' : 'none' }}
          >
            <Terminal
              terminalId={tab.id}
              cwd={cwd}
              scaffoldCommand={index === 0 ? scaffoldCommand : undefined}
              connectionMode={connectionMode}
              sshConfig={sshConfig}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
