
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pxdovjbwktuaaolzjijd.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_KEY || 'sb_publishable_iAxQdLMtg8z2MvNsQPuhxQ_XIGqQGQe'

export const supabase = createClient(supabaseUrl, supabaseKey)
