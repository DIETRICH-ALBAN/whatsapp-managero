import { initAuthCreds, BufferJSON } from '@whiskeysockets/baileys'

export const useSupabaseAuthState = async (supabase, userId) => {
    // 1. Charger les données existantes
    const { data: sessionData } = await supabase
        .from('whatsapp_sessions')
        .select('session_data')
        .eq('user_id', userId)
        .single()

    let state = {
        creds: initAuthCreds(),
        keys: {}
    }

    if (sessionData?.session_data) {
        try {
            const restored = JSON.parse(sessionData.session_data, BufferJSON.reviver)
            state = {
                creds: restored.creds || initAuthCreds(),
                keys: restored.keys || {}
            }
            console.log(`[Auth] Session restaurée pour ${userId}`)
        } catch (e) {
            console.error('[Auth] Erreur lecture session_data, reset nécessaire')
        }
    }

    // 2. Fonction de sauvegarde avec DEBOUNCE pour éviter de saturer la DB
    let saveTimeout = null
    const saveState = async () => {
        if (saveTimeout) return // Déjà une sauvegarde prévue

        saveTimeout = setTimeout(async () => {
            try {
                const json = JSON.stringify({ creds: state.creds, keys: state.keys }, BufferJSON.replacer)
                const { error } = await supabase.from('whatsapp_sessions').upsert({
                    user_id: userId,
                    session_data: json,
                    updated_at: new Date().toISOString(),
                    is_connected: true
                })
                if (error) console.error('[Auth] Erreur sauvegarde Supabase:', error.message)
                else console.log(`[Auth] Session sauvegardée pour ${userId} (${Math.round(json.length / 1024)} KB)`)
            } catch (err) {
                console.error('[Auth] Crash sauvegarde:', err.message)
            } finally {
                saveTimeout = null
            }
        }, 2000) // On attend 2 secondes de calme avant de sauvegarder
    }

    return {
        state: {
            creds: state.creds,
            keys: {
                get: (type, ids) => {
                    const data = {}
                    for (const id of ids) {
                        const key = `${type}-${id}`
                        if (state.keys[key]) {
                            data[id] = state.keys[key]
                        }
                    }
                    return data
                },
                set: async (data) => {
                    for (const type in data) {
                        for (const id in data[type]) {
                            const key = `${type}-${id}`
                            const value = data[type][id]
                            if (value) state.keys[key] = value
                            else delete state.keys[key]
                        }
                    }
                    await saveState()
                }
            }
        },
        saveCreds: saveState
    }
}
