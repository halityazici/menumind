import { useState, useEffect, useCallback } from 'react'
import { fetchMenu, fetchSettings, insertOrder, supabase } from '../lib/supabaseClient'

export function useMenu() {
    const [menuItems, setMenuItems] = useState([])
    const [settings, setSettings] = useState({})
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [menu, sett] = await Promise.all([fetchMenu(), fetchSettings()])
            setMenuItems(menu)
            setSettings(sett)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    // Load orders (authenticated)
    const loadOrders = useCallback(async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
        if (!error) setOrders(data || [])
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    // CRUD: add menu item
    const addMenuItem = useCallback(async (item) => {
        const { data, error } = await supabase.from('menu').insert([item]).select().single()
        if (error) throw error
        setMenuItems(prev => [...prev, data])
        return data
    }, [])

    // CRUD: update menu item
    const updateMenuItem = useCallback(async (id, updates) => {
        const { data, error } = await supabase.from('menu').update(updates).eq('id', id).select().single()
        if (error) throw error
        setMenuItems(prev => prev.map(m => m.id === id ? data : m))
        return data
    }, [])

    // CRUD: delete menu item
    const deleteMenuItem = useCallback(async (id) => {
        const { error } = await supabase.from('menu').delete().eq('id', id)
        if (error) throw error
        setMenuItems(prev => prev.filter(m => m.id !== id))
    }, [])

    // Update setting
    const updateSetting = useCallback(async (key, value) => {
        const { error } = await supabase
            .from('settings')
            .upsert({ key, value }, { onConflict: 'key' })
        if (error) throw error
        setSettings(prev => ({ ...prev, [key]: value }))
    }, [])

    // Update order status
    const updateOrderStatus = useCallback(async (id, status) => {
        const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
        if (error) throw error
        setOrders(prev => prev.map(o => o.id === id ? data : o))
    }, [])

    return {
        menuItems, settings, orders, loading, error,
        loadData, loadOrders,
        addMenuItem, updateMenuItem, deleteMenuItem,
        updateSetting, updateOrderStatus,
    }
}
