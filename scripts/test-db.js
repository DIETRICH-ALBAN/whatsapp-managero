import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Utiliser la clé admin pour tester

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
    console.log('🔍 Test de connexion à Supabase...')

    // 1. Vérifier la table whatsapp_sessions
    const { error: sessionError } = await supabase.from('whatsapp_sessions').select('count', { count: 'exact', head: true })

    if (sessionError) {
        console.error('❌ Erreur accès table whatsapp_sessions:', sessionError.message)
        if (sessionError.code === '42P01') {
            console.error('➡️ La table n\'existe pas ! Le script SQL n\'a pas été exécuté correctement.')
        }
    } else {
        console.log('✅ Table whatsapp_sessions accessible')
    }

    // 2. Vérifier la table conversations
    const { error: convoError } = await supabase.from('conversations').select('count', { count: 'exact', head: true })
    if (convoError) {
        console.error('❌ Erreur accès table conversations:', convoError.message)
    } else {
        console.log('✅ Table conversations accessible')
    }
}

testDatabase()
