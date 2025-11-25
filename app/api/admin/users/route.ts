import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Admin client for elevated privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const session = await getServerSession(authOptions);

  // @ts-expect-error - role is a custom property added to the session
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // If user is an admin, fetch all users
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  // Also fetch public user data to combine with auth data
  const { data: publicUsers, error: publicUsersError } = await supabaseAdmin
    .from('users')
    .select('id, name, role');
    
  if (publicUsersError) {
      console.error('Error fetching public user data:', publicUsersError);
      // Continue without it, but log the error
  }

  // Combine auth user data with public user data
  const combinedUsers = users.map(authUser => {
      const publicUser = publicUsers?.find(u => u.id === authUser.id);
      return {
          id: authUser.id,
          email: authUser.email,
          name: publicUser?.name || authUser.user_metadata?.full_name || 'N/A',
          role: publicUser?.role || 'user',
          created_at: authUser.created_at,
      };
  });

  return NextResponse.json(combinedUsers);
}
