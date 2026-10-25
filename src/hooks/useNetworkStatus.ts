import { useCallback, useEffect, useState } from 'react'

export interface NetworkStatus {
  isOnline: boolean
  isServerReachable: boolean
  isChecking: boolean
  lastChecked: Date
  latency: number | null
  offlineSince: Date | null
  checkConnection: () => Promise<boolean>
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isServerReachable, setIsServerReachable] = useState<boolean>(true)
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())
  const [latency, setLatency] = useState<number | null>(null)
  const [offlineSince, setOfflineSince] = useState<Date | null>(
    typeof navigator !== 'undefined' && !navigator.onLine ? new Date() : null
  )

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true)
    const startTime = performance.now()
    try {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 4000)

      // Probe lightweight endpoint with cache-busting
      const response = await fetch(`/api/session?_t=${Date.now()}`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'include',
      })
      window.clearTimeout(timeoutId)

      const roundTrip = Math.round(performance.now() - startTime)
      setLatency(roundTrip)
      setLastChecked(new Date())

      // Status 200, 401 (unauthorized is fine, server is online), or 403 means server reached
      if (response.status < 500) {
        setIsOnline(true)
        setIsServerReachable(true)
        setOfflineSince(null)
        setIsChecking(false)
        return true
      }

      setIsServerReachable(false)
      setIsChecking(false)
      return false
    } catch {
      setLatency(null)
      setLastChecked(new Date())
      const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine : false
      setIsOnline(browserOnline)
      setIsServerReachable(false)
      if (!offlineSince) {
        setOfflineSince(new Date())
      }
      setIsChecking(false)
      return false
    }
  }, [offlineSince])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      void checkConnection()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsServerReachable(false)
      setOfflineSince(new Date())
    }

    const handleNetworkError = () => {
      // Triggered by application fetch interceptor when request drops
      if (!navigator.onLine) {
        handleOffline()
      } else {
        setIsServerReachable(false)
        if (!offlineSince) setOfflineSince(new Date())
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('district:network-error', handleNetworkError)

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason
      if (
        err &&
        (String(err).includes('Failed to fetch') ||
          String(err).includes('NetworkError') ||
          String(err).includes('Load failed'))
      ) {
        handleNetworkError()
      }
    }
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Periodic lightweight heartbeat poll when disconnected (every 6 seconds)
    let retryTimer: number | null = null
    if (!isOnline || !isServerReachable) {
      retryTimer = window.setInterval(() => {
        void checkConnection()
      }, 6000)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('district:network-error', handleNetworkError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      if (retryTimer) window.clearInterval(retryTimer)
    }
  }, [checkConnection, isOnline, isServerReachable])

  return {
    isOnline,
    isServerReachable,
    isChecking,
    lastChecked,
    latency,
    offlineSince,
    checkConnection,
  }
}
