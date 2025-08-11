/**
 * Example Supabase Edge Function for GOOD Talent
 * This is a template function - replace with your actual business logic
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  try {
    const { name } = await req.json()
    
    const data = {
      message: `Hello ${name || 'World'}!`,
      timestamp: new Date().toISOString(),
      from: 'GOOD Talent Edge Function'
    }

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }, 
        status: 400 
      },
    )
  }
})
