import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, WifiOff } from 'lucide-react'
import type { NetworkStatus } from '../../hooks/useNetworkStatus'
import { Button } from '../ui/button'

interface NetworkStatusBannerProps {
  status: NetworkStatus
  onOpenDetails?: () => void
}

export function NetworkStatusBanner({ status, onOpenDetails }: NetworkStatusBannerProps) {
  const { isOnline, isServerReachable, isChecking, checkConnection } = status
  const isDisconnected = !isOnline || !isServerReachable

  // Show "Restored" toast when transitioning from disconnected to connected
  const [wasDisconnected, setWasDisconnected] = useState(false)
  const [showRestoredNotice, setShowRestoredNotice] = useState(false)

  useEffect(() => {
    if (isDisconnected) {
      setWasDisconnected(true)
      setShowRestoredNotice(false)
    } else if (wasDisconnected) {
      setShowRestoredNotice(true)
      const timer = window.setTimeout(() => {
        setShowRestoredNotice(false)
        setWasDisconnected(false)
      }, 3500)
      return () => window.clearTimeout(timer)
    }
  }, [isDisconnected, wasDisconnected])

  if (!isDisconnected && !showRestoredNotice) {
    return null
  }

  if (showRestoredNotice) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-600 text-white shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto"
      >
        <CheckCircle2 size={15} className="shrink-0" />
        <span>Connection Restored · Live sync active</span>
      </aside>
    )
  }

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-amber-500/95 dark:bg-amber-600/95 text-slate-950 dark:text-white shadow-xl backdrop-blur-md text-xs font-medium border border-amber-400/50 dark:border-amber-500/40 animate-in fade-in slide-in-from-top-2 duration-300 max-w-[92vw]"
    >
      <div className="flex items-center gap-1.5 shrink-0">
        {!isOnline ? (
          <WifiOff size={15} className="text-amber-950 dark:text-amber-100 animate-pulse" />
        ) : (
          <AlertTriangle size={15} className="text-amber-950 dark:text-amber-100" />
        )}
        <strong className="font-bold">
          {!isOnline ? 'Offline' : 'Server Unreachable'}
        </strong>
      </div>

      <span className="hidden sm:inline text-amber-950/80 dark:text-white/80">
        {!isOnline
          ? 'Check your Wi-Fi or mobile data.'
          : 'Connecting to District OS...'}
      </span>

      <div className="flex items-center gap-1.5 ml-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void checkConnection()}
          disabled={isChecking}
          className="h-6 px-2 text-[11px] font-semibold bg-white/80 dark:bg-slate-900/80 border-amber-600/30 text-amber-950 dark:text-amber-100 hover:bg-white hover:text-slate-900 shadow-none gap-1"
        >
          <RefreshCw size={11} className={isChecking ? 'animate-spin' : ''} />
          <span>{isChecking ? 'Checking...' : 'Retry'}</span>
        </Button>

        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="text-[11px] underline underline-offset-2 text-amber-950/90 dark:text-amber-100/90 hover:text-black dark:hover:text-white ml-1 font-semibold"
          >
            Diagnostics
          </button>
        )}
      </div>
    </aside>
  )
}

