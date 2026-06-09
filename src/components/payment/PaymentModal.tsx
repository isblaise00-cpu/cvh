'use client'

import { useState, useEffect, useRef } from 'react'

interface PaymentModalProps {
  open: boolean
  checkoutUrl: string | null
  onSuccess: () => void
  onClose: () => void
}

export function PaymentModal({ open, checkoutUrl, onSuccess, onClose }: PaymentModalProps) {
  const [status, setStatus] = useState<'pending' | 'checking'>('pending')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const succeededRef = useRef(false)

  useEffect(() => {
    if (!open || !checkoutUrl) return
    succeededRef.current = false
    setStatus('pending')
  }, [open, checkoutUrl])

  const handleIframeLoad = () => {
    if (!open || succeededRef.current) return
    try {
      const url = iframeRef.current?.contentWindow?.location?.href || ''
      if (url) {
        const host = new URL(url).hostname.toLowerCase()
        if (host === 'yengapay.com' || host === 'www.yengapay.com') {
          succeededRef.current = true
          setStatus('checking')
          setTimeout(() => onSuccess(), 800)
        }
      }
    } catch {
      // Cross-origin — l'iframe est sur la page de checkout YengaPay, comportement normal
    }
  }

  if (!open || !checkoutUrl) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: 480, height: 620 }}
      >
        {status === 'pending' && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-semibold text-gray-800">Paiement sécurisé</span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 text-lg leading-none transition"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <iframe
              ref={iframeRef}
              src={checkoutUrl}
              className="flex-1 w-full border-0"
              onLoad={handleIframeLoad}
              allow="payment"
              title="Paiement YengaPay"
            />
          </>
        )}

        {status === 'checking' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Paiement réussi !</h3>
              <p className="text-gray-400 text-sm mt-1">Activation de votre abonnement…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
