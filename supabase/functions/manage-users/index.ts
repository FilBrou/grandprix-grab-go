import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // Admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client to verify the calling user
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the calling user
    const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !caller) {
      console.error('Failed to get user:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Caller user ID:', caller.id)

    // Check if caller is admin using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      check_user_id: caller.id,
      check_role: 'admin'
    })

    console.log('Is admin check result:', isAdmin, 'Error:', roleError)

    if (roleError || !isAdmin) {
      console.error('Admin check failed:', roleError)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, userData } = await req.json()
    console.log('Action:', action, 'UserData:', { ...userData, password: userData?.password ? '[REDACTED]' : undefined })

    if (action === 'create') {
      // Create new user with admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { name: userData.name }
      })

      if (createError) {
        console.error('Error creating user:', createError)
        throw createError
      }

      console.log('User created:', newUser.user.id)

      // The profile will be created automatically by the trigger
      // Just update the name and phone if provided
      if (userData.name || userData.phone) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            name: userData.name || null,
            phone: userData.phone || null
          })
          .eq('user_id', newUser.user.id)

        if (updateError) {
          console.error('Error updating profile:', updateError)
        }
      }

      // Set admin role if specified
      if (userData.role === 'admin') {
        const { error: roleInsertError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: 'admin'
          })

        if (roleInsertError) {
          console.error('Error setting admin role:', roleInsertError)
        }
      }

      return new Response(
        JSON.stringify({ user: newUser.user }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update') {
      // Update password if provided
      if (userData.password) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userData.userId,
          { password: userData.password }
        )
        if (updateError) {
          console.error('Error updating password:', updateError)
          throw updateError
        }
        console.log('Password updated for user:', userData.userId)
      }

      // Manage admin role
      if (userData.role === 'admin') {
        // Check if role already exists
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', userData.userId)
          .eq('role', 'admin')
          .single()

        if (!existingRole) {
          const { error: roleInsertError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userData.userId,
              role: 'admin'
            })

          if (roleInsertError) {
            console.error('Error inserting admin role:', roleInsertError)
          }
        }
      } else {
        // Remove admin role
        const { error: roleDeleteError } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userData.userId)
          .eq('role', 'admin')

        if (roleDeleteError) {
          console.error('Error removing admin role:', roleDeleteError)
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userData.userId)
      if (error) {
        console.error('Error deleting user:', error)
        throw error
      }

      console.log('User deleted:', userData.userId)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action: ' + action)

  } catch (error) {
    console.error('Error in manage-users function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})