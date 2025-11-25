'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string | null;
  screenshot_url: string | null;
  updated_at: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // @ts-expect-error - id is a custom property added to the session
      if (session.user.id) {
        // @ts-expect-error - id is a custom property added to the session
        fetchProjects(session.user.id);
      }
    }
  }, [status, session, router]);

  const fetchProjects = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, screenshot_url, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      // Handle error display
    } else {
      setProjects(data as Project[]);
    }
    setLoading(false);
  };

  const createNewProject = async () => {
    // @ts-expect-error - id is a custom property added to the session
    if (!session?.user?.id) return;

    const { data, error } = await supabase
        .from('projects')
        // @ts-expect-error - id is a custom property added to the session
        .insert({ user_id: session.user.id, name: 'New Project' })
        .select('id')
        .single();

    if (error || !data) {
        console.error('Error creating new project:', error);
        // Handle UI feedback for error
    } else {
        router.push(`/workspace?project=${data.id}`);
    }
  };


  if (loading || status === 'loading') {
    return <div className="text-center p-10">Loading projects...</div>;
  }

  return (
    <div className="container mx-auto p-8 bg-gray-950 text-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Your Projects</h1>
        <button
          onClick={createNewProject}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-400">You haven't created any projects yet.</p>
          <p className="mt-2 text-gray-500">Click "New Project" to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Link key={project.id} href={`/workspace?project=${project.id}`}>
              <div className="bg-gray-900 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden cursor-pointer">
                <div className="h-48 bg-gray-800 flex items-center justify-center">
                  {project.screenshot_url ? (
                    <img src={project.screenshot_url} alt={project.name} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-gray-500">No preview available</span>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-2">{project.name}</h2>
                  <p className="text-gray-400 mb-4">{project.description || 'No description'}</p>
                  <p className="text-sm text-gray-500">Last updated: {new Date(project.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
