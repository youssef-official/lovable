'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    description?: string;
    updated_at: string;
}

interface ProjectsGridProps {
    projects: Project[];
    loading?: boolean;
    userName?: string;
}

export function ProjectsGrid({ projects, loading = false, userName }: ProjectsGridProps) {
    const formatTimeAgo = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}w ago`;
        return past.toLocaleDateString();
    };

    return (
        <section className="relative z-10 w-full px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="glass-dark rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                            {userName ? `${userName.split(' ')[0]}'s Projects` : 'Your Projects'}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-white/60 mb-4">No projects yet</p>
                            <p className="text-white/40 text-sm">Start by creating your first project above!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/workspace?sandbox=${project.id}`}
                                    className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-4 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="w-full aspect-video bg-gray-800/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                        <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                                        </svg>
                                    </div>

                                    <h3 className="text-white font-medium mb-1 truncate">
                                        {project.name}
                                    </h3>
                                    <p className="text-white/60 text-sm mb-2 line-clamp-2">
                                        {project.description || 'No description'}
                                    </p>

                                    <div className="flex items-center gap-2 text-white/40 text-xs">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                        {formatTimeAgo(project.updated_at)}
                                    </div>

                                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-orange-500/0 to-pink-600/0 group-hover:from-orange-500/10 group-hover:to-pink-600/10 transition-all duration-300 pointer-events-none" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
