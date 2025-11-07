
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

    const { email, password, role = 'salesperson', first_name, last_name, store_id } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email e password sono obbligatori' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!store_id) {
      return new Response(
        JSON.stringify({ error: 'Il negozio è obbligatorio' }),
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

      // Instead of failing, ensure profile and role exist, then return success
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

      // Derive a username
      const username = (first_name && last_name)
        ? `${first_name}.${last_name}`.toLowerCase()
        : (existingUser.user_metadata?.username || email.split('@')[0])

      // Ensure profile exists
      const { data: profileRow, error: profileFetchError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', existingUser.id)
        .single()

      if (profileFetchError && profileFetchError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', profileFetchError)
      }

      if (!profileRow) {
        const { error: profileCreateError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: existingUser.id,
            username,
            role
          })
        if (profileCreateError) {
          console.error('Profile creation failed for existing user:', profileCreateError)
          return new Response(
            JSON.stringify({ error: "Errore nella creazione del profilo utente esistente" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        // Try to keep role in sync (best-effort)
        const { error: profileUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({ role })
          .eq('id', existingUser.id)
        if (profileUpdateError) {
          console.warn('Could not update role on existing profile:', profileUpdateError)
        }
      }

      // Ensure role mapping exists (idempotent)
      const { error: roleUpsertError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: existingUser.id, role }, { onConflict: 'user_id,role', ignoreDuplicates: true })
      if (roleUpsertError) {
        console.error('User role upsert failed for existing user:', roleUpsertError)
        return new Response(
          JSON.stringify({ error: 'Errore nella configurazione del ruolo utente esistente' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Audit log for linking existing auth user
      await supabaseAdmin
        .from('security_audit_log')
        .insert({
          event_type: 'employee_linked_existing_auth',
          event_data: {
            reason: 'email_exists',
            email,
            existing_user_id: existingUser.id,
            role,
            client_ip: clientIP
          },
          ip_address: clientIP
        })

      return new Response(
        JSON.stringify({
          user_id: existingUser.id,
          email: existingUser.email,
          success: true,
          existing_user: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      // Create profile entry for the new user (use upsert for idempotency)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authUser.user.id,
          username: first_name && last_name ? `${first_name}.${last_name}`.toLowerCase() : email.split('@')[0],
          role: role,
          is_system_user: ['admin', 'super_admin'].includes(role) // Mark system users
        }, {
          onConflict: 'id'
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

      // Create user role entry (use upsert for idempotency)
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: authUser.user.id,
          role: role
        }, {
          onConflict: 'user_id,role'
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
