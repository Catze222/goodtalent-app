/**
 * API Route para invitar usuarios usando Service Role Key
 * Solo disponible para usuarios con permisos de admin
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente admin para operaciones administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo, userToken } = await request.json()

    if (!email || !userToken) {
      return NextResponse.json(
        { error: 'Email y token de usuario son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el usuario tiene permisos de admin
    // Crear cliente con el token del usuario para verificar permisos
    const userSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    })

    // Verificar permisos del usuario
    const { data: permissions, error: permError } = await userSupabase.rpc('my_permissions')
    
    if (permError) {
      console.error('Error checking permissions:', permError)
      return NextResponse.json(
        { error: 'Error verificando permisos' },
        { status: 403 }
      )
    }

    const canInviteUsers = permissions?.some(
      (p: any) => p.table_name === 'user_permissions' && p.action === 'create'
    )

    if (!canInviteUsers) {
      return NextResponse.json(
        { error: 'No tienes permisos para invitar usuarios' },
        { status: 403 }
      )
    }

    // Invitar usuario usando Service Role Key
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    })

    if (error) {
      console.error('Error inviting user:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
