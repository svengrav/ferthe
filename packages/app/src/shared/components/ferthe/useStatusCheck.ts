import { useEffect, useState } from 'react'
import { StatusResult } from '../../../api/apiUtils'

interface StatusCheckOptions {
  checkStatus: () => Promise<StatusResult>
  retryInterval?: number
  onSuccess?: () => void
}

interface UseStatusCheckResult {
  status: StatusResult | null
  isChecking: boolean
  countdown: number
  progress: number
}

/**
 * Hook für Health-Check mit automatischem Retry
 */
export const useStatusCheck = ({
  checkStatus,
  retryInterval = 5000,
  onSuccess,
}: StatusCheckOptions): UseStatusCheckResult => {
  const [status, setStatus] = useState<StatusResult | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [isChecking, setIsChecking] = useState(true)

  // Initial health check
  useEffect(() => {
    const performHealthCheck = async () => {
      setIsChecking(true)
      const result = await checkStatus()
      setStatus(result)

      if (result.available) {
        onSuccess?.()
      } else {
        setIsChecking(false)
        setCountdown(retryInterval / 1000)
      }
    }

    performHealthCheck()
  }, [])

  // Countdown und Retry
  useEffect(() => {
    if (countdown > 0 && !isChecking) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !isChecking && status && !status.available) {
      // Retry health check
      const performHealthCheck = async () => {
        setIsChecking(true)
        const result = await checkStatus()
        setStatus(result)

        if (result.available) {
          onSuccess?.()
        } else {
          setIsChecking(false)
          setCountdown(retryInterval / 1000)
        }
      }
      performHealthCheck()
    }
  }, [countdown, isChecking, status, retryInterval, checkStatus, onSuccess])

  const progress = ((retryInterval / 1000 - countdown) / (retryInterval / 1000)) * 100

  return {
    status,
    isChecking,
    countdown,
    progress,
  }
}
