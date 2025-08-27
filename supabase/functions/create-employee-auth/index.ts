
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
    
    // Log security event for admin user creation attempt
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

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
      
      // Log failed attempt for security monitoring
      await supabaseAdmin
        .from('security_audit_log')
        .insert({
          event_type: 'failed_employee_creation',
          event_data: { 
            reason: 'email_exists', 
            email, 
            client_ip: clientIP 
          },
          ip_address: clientIP
        })
      
      return new Response(
        JSON.stringify({ 
          error: 'Un utente con questa email esiste già nel sistema',
          details: 'L\'indirizzo email fornito è già registrato nel sistema. Utilizzare un indirizzo email diverso.'
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    
    try {
      // Create profile entry for the new user
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          username: first_name && last_name ? `${first_name}.${last_name}`.toLowerCase() : email.split('@')[0],
          role: role
        })

      if (profileError) {
        console.error('Profile creation failed:', profileError)
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return new Response(
          JSON.stringify({ error: 'Errore nella creazione del profilo utente' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create user role entry
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: role
        })

      if (roleError) {
        console.error('User role creation failed:', roleError)
        // Clean up auth user and profile if role creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return new Response(
          JSON.stringify({ error: 'Errore nella creazione del ruolo utente' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Profile and role created successfully for user:', authUser.user.id)
      
      // Log successful employee creation for security audit
      await supabaseAdmin
        .from('security_audit_log')
        .insert({
          event_type: 'employee_created',
          event_data: { 
            created_user_id: authUser.user.id,
            created_email: authUser.user.email,
            role,
            client_ip: clientIP
          },
          ip_address: clientIP
        })

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
      console.error('Error in profile/role creation:', error)
      // Clean up auth user if any step fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return new Response(
        JSON.stringify({ error: 'Errore nella configurazione dell\'account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Errore interno del server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
