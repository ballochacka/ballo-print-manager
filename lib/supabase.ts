import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sqwxwgnlylsszjhgjrsc.supabase.co'
const supabaseKey = 'sb_publishable_Kh_G0D9er6Hm2b6CUYeFyQ_B_FDvagK'

export const supabase = createClient(supabaseUrl, supabaseKey)