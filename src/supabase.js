import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lfrqdjmprhsqqjkabwxv.supabase.co'   // mesma do .env
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcnFkam1wcmhzcXFqa2Fid3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODE1MDQsImV4cCI6MjA5MDk1NzUwNH0.qkqwAUUMl6KsS9-xtjCimqLEq6cDSvxMdTnThPlgk6g'                    // mesma do .env

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)