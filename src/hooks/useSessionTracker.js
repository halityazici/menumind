import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Tracks how long a visitor spends on the page.
 * Call markOrderPlaced() when they successfully submit an order.
 *
 * Inserts a row into `page_sessions` on mount,
 * then updates duration_seconds on unload / unmount.
 */
export function useSessionTracker() {
    const sessionId = useRef(null)
    const startTime = useRef(Date.now())
    const orderPlaced = useRef(false)

    const markOrderPlaced = () => { orderPlaced.current = true }

    useEffect(() => {
        // Insert session row on mount
        supabase
            .from('page_sessions')
            .insert([{ placed_order: false }])
            .select('id')
            .single()
            .then(({ data }) => {
                if (data?.id) sessionId.current = data.id
            })
            .catch(() => { }) // non-critical, swallow errors

        const finish = () => {
            const secs = Math.round((Date.now() - startTime.current) / 1000)
            if (!sessionId.current) return
            // Use sendBeacon for reliability on tab close
            const payload = JSON.stringify({
                duration_seconds: secs,
                placed_order: orderPlaced.current,
            })
            if (navigator.sendBeacon) {
                // sendBeacon can't hit supabase directly — use fetch with keepalive
                fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_sessions?id=eq.${sessionId.current}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                            Prefer: 'return=minimal',
                        },
                        body: payload,
                        keepalive: true,
                    }
                ).catch(() => { })
            }
        }

        window.addEventListener('beforeunload', finish)
        return () => {
            finish()
            window.removeEventListener('beforeunload', finish)
        }
    }, [])

    return { markOrderPlaced }
}
