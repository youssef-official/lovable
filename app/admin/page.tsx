'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AppUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // @ts-expect-error - role is a custom property added to the session
      if (session.user.role !== 'admin') {
        setError('Unauthorized: Access denied.');
        setLoading(false);
      } else {
        fetchUsers();
      }
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch users: ${response.statusText}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return <div className="text-center p-10 bg-gray-950 text-white min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-10 bg-red-900 text-white min-h-screen">{error}</div>;
  }

  return (
    <div className="container mx-auto p-8 bg-gray-950 text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard - All Users</h1>
      <div className="bg-gray-900 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-800 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-800 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-800 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-800">
                <td className="px-5 py-5 border-b border-gray-800 text-sm">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-white whitespace-no-wrap font-semibold">{user.name}</p>
                      <p className="text-gray-400 whitespace-no-wrap">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5 border-b border-gray-800 text-sm">
                  <span
                    className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${
                      user.role === 'admin' ? 'text-green-900 bg-green-200' : 'text-gray-900 bg-gray-200'
                    }`}
                  >
                    <span aria-hidden className="absolute inset-0 opacity-50 rounded-full"></span>
                    <span className="relative">{user.role}</span>
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-800 text-sm">
                  <p className="text-gray-400 whitespace-no-wrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
