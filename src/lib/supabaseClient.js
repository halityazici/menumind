import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Convenience: fetch all available menu items
export async function fetchMenu() {
    const { data, error } = await supabase
        .from('menu')
        .select('*')
        .eq('is_available', true)
        .order('sort_order', { ascending: true })
    if (error) throw error
    return data
}

// Insert a new order
export async function insertOrder(orderPayload) {
    const { data, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single()
    if (error) throw error
    return data
}

// Fetch settings as a key-value map
export async function fetchSettings() {
    const { data, error } = await supabase.from('settings').select('key, value')
    if (error) throw error
    return Object.fromEntries((data || []).map(r => [r.key, r.value]))
}

// Upload menu item image to Supabase Storage → returns public URL
export async function uploadMenuImage(file) {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('menu-images').getPublicUrl(path)
    return data.publicUrl
}

// Delete menu item image from Supabase Storage
export async function deleteMenuImage(url) {
    if (!url) return
    const path = url.split('/menu-images/')[1]
    if (!path) return
    await supabase.storage.from('menu-images').remove([path])
}
