import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys'

export const useSupabaseAuthState = async (supabase, userId) => {
    // 1. Charger les données existantes
    const { data: sessionData, error } = await supabase
        .from('whatsapp_sessions')
        .select('session_data')
        .eq('user_id', userId)
        .single()

    let state = {
        creds: initAuthCreds(),
        keys: {}
    }

    if (sessionData?.session_data) {
        // Restaurer l'état depuis le JSON avec BufferJSON pour gérer les Buffers
        const restored = JSON.parse(sessionData.session_data, BufferJSON.reviver)
        state = {
            creds: restored.creds || initAuthCreds(),
            keys: restored.keys || {}
        }
    }

    // 2. Fonction de sauvegarde
    const saveState = async () => {
        const json = JSON.stringify({ creds: state.creds, keys: state.keys }, BufferJSON.replacer, 2)
        await supabase.from('whatsapp_sessions').upsert({
            user_id: userId,
            session_data: json,
            updated_at: new Date().toISOString(),
            is_connected: true
        })
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
                            if (value) {
                                state.keys[key] = value
                            } else {
                                delete state.keys[key]
                            }
                        }
                    }
                    await saveState()
                }
            }
        },
        saveCreds: saveState
    }
}
