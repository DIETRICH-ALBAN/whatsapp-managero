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
            console.log(`[Auth] Session récupérée depuis Supabase (${Math.round(sessionData.session_data.length / 1024)} KB)`)
        } catch (e) {
            console.error('[Auth] Erreur parsing session_data, reset nécessaire')
        }
    }

    // 2. Sauvegarde optimisée (Debounce de 10 secondes)
    let saveTimeout = null
    const saveState = async (force = false) => {
        if (saveTimeout && !force) return

        const delay = force ? 0 : 10000 // 10s pour laisser respirer la DB

        if (saveTimeout) clearTimeout(saveTimeout)

        saveTimeout = setTimeout(async () => {
            try {
                // On ne sauvegarde QUE si on a un début de credentials
                if (!state.creds.registrationId) return

                const json = JSON.stringify({ creds: state.creds, keys: state.keys }, BufferJSON.replacer)
                const { error } = await supabase.from('whatsapp_sessions').upsert({
                    user_id: userId,
                    session_data: json,
                    updated_at: new Date().toISOString(),
                    is_connected: true
                }, { onConflict: 'user_id' })
                if (error) console.error('[Auth] Erreur DB:', error.message)
                else console.log(`[Auth] Backup session réussi (${Math.round(json.length / 1024)} KB)`)
            } catch (err) {
                console.error('[Auth] Erreur fatale sauvegarde:', err.message)
            } finally {
                saveTimeout = null
            }
        }, delay)
    }

    return {
        state: {
            creds: state.creds,
            keys: {
                get: (type, ids) => {
                    const data = {}
                    for (const id of ids) {
                        const key = `${type}-${id}`
                        if (state.keys[key]) data[id] = state.keys[key]
                    }
                    return data
                },
                set: async (data) => {
                    let hasChanged = false
                    for (const type in data) {
                        for (const id in data[type]) {
                            const key = `${type}-${id}`
                            const value = data[type][id]
                            if (value) {
                                state.keys[key] = value
                                hasChanged = true
                            } else if (state.keys[key]) {
                                delete state.keys[key]
                                hasChanged = true
                            }
                        }
                    }
                    if (hasChanged) await saveState()
                }
            }
        },
        saveCreds: () => saveState(true) // Force la sauvegarde
    }
}
