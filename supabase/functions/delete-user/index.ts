import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Initialize Supabase Client with service role to bypass RLS and delete user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the JWT to ensure they can only delete themselves
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      throw new Error('Invalid JWT or user not found');
    }

    const userId = user.id;

    console.log(`[delete-user] User ${userId} requested account deletion.`);

    // 1. Delete user images from storage (donation-images)
    // Find items owned by user
    const { data: items } = await supabaseAdmin
      .from('items')
      .select('image_url')
      .eq('user_id', userId);

    if (items && items.length > 0) {
      const urls = items.map(i => i.image_url).filter(url => url !== null);
      for (const url of urls) {
        try {
          // extract filename from public URL (simplistic extraction for this demo)
          const parts = url.split('/');
          const filename = parts[parts.length - 1];
          await supabaseAdmin.storage.from('donation-images').remove([`donations/${filename}`]);
        } catch (e) {
          console.warn(`Failed to delete image ${url}`, e);
        }
      }
    }

    // 2. Delete items (cascade will delete item_pickup_details, requests, etc.)
    await supabaseAdmin.from('items').delete().eq('user_id', userId);
    
    // Delete their profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // 3. Delete user from Auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      throw deleteUserError;
    }

    console.log(`[delete-user] Successfully deleted user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(`[delete-user] Error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
