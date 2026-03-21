import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

let toastId = 0

export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }): JSX.Element {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(item.id), 4000)
    return () => clearTimeout(timer)
  }, [item.id, onRemove])

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />
  }

  const borderColors = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    info: 'border-blue-500/30'
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-900 border ${borderColors[item.type]}
        text-sm text-zinc-200 shadow-lg animate-in slide-in-from-right`}
    >
      {icons[item.type]}
      <span className="flex-1">{item.message}</span>
      <button onClick={() => onRemove(item.id)} className="p-0.5 rounded hover:bg-zinc-800">
        <X className="w-3 h-3 text-zinc-500" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-10 right-4 flex flex-col gap-2 z-50 max-w-sm">
          {toasts.map((t) => (
            <ToastItem key={t.id} item={t} onRemove={removeToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}
