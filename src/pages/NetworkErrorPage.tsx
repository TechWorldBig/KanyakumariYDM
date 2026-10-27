import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Home,
  RefreshCw,
  ServerOff,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { NetworkStatus } from '../hooks/useNetworkStatus'
import type { Page } from '../types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

interface NetworkErrorPageProps {
  status: NetworkStatus
  onNavigate: (page: Page) => void
  onDismissOffline?: () => void
}

export function NetworkErrorPage({
  status,
  onNavigate,
  onDismissOffline,
}: NetworkErrorPageProps) {
  const { isOnline, isServerReachable, isChecking, lastChecked, latency, checkConnection, offlineSince } = status
  const [autoRetrySeconds, setAutoRetrySeconds] = useState(6)

  // Auto-retry countdown timer
  useEffect(() => {
    const timer = window.setInterval(() => {
      setAutoRetrySeconds((prev) => {
        if (prev <= 1) {
          void checkConnection()
          return 6
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [checkConnection])

  // If connection is fully restored while on this page, navigate to Overview automatically
  useEffect(() => {
    if (isOnline && isServerReachable) {
      const timeout = window.setTimeout(() => {
        onNavigate('Overview')
      }, 1200)
      return () => window.clearTimeout(timeout)
    }
  }, [isOnline, isServerReachable, onNavigate])

  const formatRelativeOffline = (date: Date | null) => {
    if (!date) return 'Recently'
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  }

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* Top Status Header */}
      <div className="text-center space-y-3 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 shadow-xs">
          <WifiOff size={14} className="animate-pulse" />
          <span>NETWORK CONNECTION ISSUE</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
          {!isOnline ? 'You Are Currently Offline' : 'Cannot Reach District Server'}
        </h1>

        <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
          {!isOnline
            ? 'District OS has detected that your device lost its internet connection. Please inspect your Wi-Fi, mobile data, or local gateway.'
            : 'Your internet connection appears active, but the District OS cloud services could not be reached. We are automatically attempting to reconnect.'}
        </p>
      </div>

      {/* Diagnostics and Telemetry Card */}
      <Card className="w-full p-5 sm:p-6 bg-[var(--card)] border border-[var(--border)] shadow-xs rounded-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-[var(--color-district-600)] dark:text-[var(--color-district-400)]" />
            <h2 className="text-sm sm:text-base font-bold text-[var(--foreground)]">
              Live Connection Diagnostics
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">Auto-retry in:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {autoRetrySeconds}s
            </Badge>
          </div>
        </div>

        {/* Status Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
              Device Network
            </span>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi size={16} className="text-emerald-500" />
              ) : (
                <WifiOff size={16} className="text-rose-500" />
              )}
              <strong className="text-sm font-bold text-[var(--foreground)]">
                {isOnline ? 'Connected' : 'Disconnected'}
              </strong>
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)] block">
              {isOnline ? 'Wi-Fi / Ethernet active' : 'No connection detected'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
              District OS Gateway
            </span>
            <div className="flex items-center gap-2">
              {isServerReachable ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <ServerOff size={16} className="text-amber-500" />
              )}
              <strong className="text-sm font-bold text-[var(--foreground)]">
                {isServerReachable ? 'Operational' : 'Unreachable'}
              </strong>
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)] block font-mono">
              {latency ? `${latency}ms latency` : 'Request timed out'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
              Offline Since
            </span>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--color-district-600)] dark:text-[var(--color-district-400)]" />
              <strong className="text-sm font-bold text-[var(--foreground)]">
                {formatRelativeOffline(offlineSince)}
              </strong>
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)] block">
              Checked {lastChecked.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => void checkConnection()}
              disabled={isChecking}
              className="w-full sm:w-auto gap-2 bg-[var(--color-district-600)] hover:bg-[var(--color-district-700)] text-white shadow-sm h-10 px-4 text-xs font-semibold"
            >
              <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
              <span>{isChecking ? 'Checking Server...' : 'Check Connection Now'}</span>
            </Button>

            {onDismissOffline && (
              <Button
                type="button"
                variant="outline"
                onClick={onDismissOffline}
                className="w-full sm:w-auto text-xs h-10 px-4"
              >
                Work with Cached Data
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => onNavigate('Overview')}
            className="w-full sm:w-auto text-xs gap-1.5 h-10 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <Home size={14} />
            <span>Return to Overview</span>
          </Button>
        </div>
      </Card>

      {/* Troubleshooting Checklist */}
      <div className="w-full p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 text-xs text-[var(--muted-foreground)] space-y-2.5">
        <strong className="text-slate-900 dark:text-slate-100 font-bold block text-sm">
          Recommended Troubleshooting Steps:
        </strong>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Verify your mobile data or Wi-Fi toggle is enabled on your phone or computer.</li>
          <li>If on an institutional or office network, check if a captive login portal requires authorization.</li>
          <li>Disable active VPNs or strict browser adblockers that might intercept WebSocket or API calls.</li>
          <li>Your locally cached church data and session remain safely stored in your browser.</li>
        </ul>
      </div>
    </div>
  )
}

