import { useCallback, useEffect, useRef, useState } from 'react'

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
}

export default function ResizeHandle({ direction, onResize }: ResizeHandleProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false)
  const lastPos = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      lastPos.current = direction === 'horizontal' ? e.clientX : e.clientY
    },
    [direction]
  )

  useEffect(() => {
    if (!isDragging) return

    function handleMouseMove(e: MouseEvent): void {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
      const delta = currentPos - lastPos.current
      lastPos.current = currentPos
      onResize(delta)
    }

    function handleMouseUp(): void {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, direction, onResize])

  const isHorizontal = direction === 'horizontal'

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`${isHorizontal ? 'w-1 cursor-col-resize hover:bg-blue-500/50' : 'h-1 cursor-row-resize hover:bg-blue-500/50'}
        ${isDragging ? 'bg-blue-500/50' : 'bg-transparent'}
        transition-colors shrink-0 relative group`}
    >
      <div
        className={`absolute ${isHorizontal ? 'inset-y-0 -left-1 -right-1' : 'inset-x-0 -top-1 -bottom-1'}`}
      />
    </div>
  )
}
