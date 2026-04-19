import { useEffect, useState } from 'react'

export function useCountdown(deadline: number | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(
    deadline === null ? null : Math.max(0, deadline - Date.now()),
  )

  useEffect(() => {
    if (deadline === null) {
      setRemaining(null)
      return
    }
    setRemaining(Math.max(0, deadline - Date.now()))
    const id = setInterval(() => {
      const left = deadline - Date.now()
      setRemaining(left > 0 ? left : 0)
      if (left <= 0) clearInterval(id)
    }, 250)
    return () => clearInterval(id)
  }, [deadline])

  return remaining
}

export function formatMs(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
