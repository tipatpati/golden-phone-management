
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, password, role = 'salesperson', first_name, last_name } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email e password sono obbligatori' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating auth user for employee:', email)

    // First check if user already exists in auth system
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error checking existing users:', listError)
      return new Response(
        JSON.stringify({ error: 'Errore nel controllo utenti esistenti' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const existingUser = existingUsers.users.find(user => user.email === email)
    
    if (existingUser) {
      console.log('User already exists with email:', email)
      return new Response(
        JSON.stringify({ error: 'Un utente con questa email esiste già nel sistema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the auth user with admin privileges
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation for admin-created users
      user_metadata: {
        role,
        first_name,
        last_name,
        created_by_admin: true
      }
    })

    if (authError) {
      console.error('Auth user creation failed:', authError)
      
      // Provide more specific error messages
      let errorMessage = 'Errore nella creazione dell\'account'
      if (authError.message.includes('already been registered')) {
        errorMessage = 'Un utente con questa email esiste già nel sistema'
      } else if (authError.message.includes('password')) {
        errorMessage = 'La password non soddisfa i requisiti di sicurezza'
      } else if (authError.message.includes('email')) {
        errorMessage = 'Formato email non valido'
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Auth user created successfully:', authUser.user.id)

    return new Response(
      JSON.stringify({ 
        user_id: authUser.user.id,
        email: authUser.user.email,
        success: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Errore interno del server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
