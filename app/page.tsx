'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { ProjectsGrid } from '@/components/ProjectsGrid';

export default function HomePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [promptInput, setPromptInput] = useState('');
    const [projects, setProjects] = useState<any[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Fetch user projects
    useEffect(() => {
        if (!session) {
            setProjectsLoading(false);
            return;
        }

        async function fetchProjects() {
            try {
                const res = await fetch('/api/projects?limit=6&sortBy=updated_at&sortOrder=DESC');
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data.projects || []);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setProjectsLoading(false);
            }
        }

        fetchProjects();
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptInput.trim() || submitting) return;

        setSubmitting(true);

        // Navigate to workspace with the prompt
        const params = new URLSearchParams();
        params.set('prompt', promptInput);
        router.push(`/workspace?${params.toString()}`);
    };

    return (
        <div className="min-h-screen w-full overflow-hidden lovable-gradient relative">
            {/* Animated gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 gradient-blur-blue animate-float"></div>
                <div className="absolute top-1/3 right-1/4 w-96 h-96 gradient-blur-purple animate-float animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/3 w-96 h-96 gradient-blur-orange animate-float animation-delay-4000"></div>
            </div>

            {/* Navigation */}
            <Navigation />

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32">
                <div className="max-w-4xl w-full text-center mb-12 animate-fade-in-up">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* New Feature Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-white/10 mb-8 cursor-pointer hover:bg-[#252525] transition-colors">
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold tracking-wide uppercase">New</span>
                            <span className="text-white/90 text-sm font-medium">AI-Powered Code Generation</span>
                            <ArrowRight className="w-3.5 h-3.5 text-white/50" />
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
                            Build something <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">🧡</span> Lovable
                        </h1>

                        {/* Subheading */}
                        <p className="text-xl text-white/60 mb-12 font-medium">
                            Create apps and websites by chatting with AI
                        </p>
                    </motion.div>

                    {/* Input Form */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full"
                    >
                        <form onSubmit={handleSubmit}>
                            <div className="relative w-full max-w-[800px] mx-auto">
                                <div className="glass-input rounded-[32px] p-4 transition-all duration-300 focus-within:ring-1 focus-within:ring-white/10">
                                    <textarea
                                        value={promptInput}
                                        onChange={(e) => setPromptInput(e.target.value)}
                                        placeholder="Ask Lovable to create a landing page for my..."
                                        className="w-full bg-transparent text-white placeholder-white/40 border-none outline-none resize-none text-lg min-h-[60px] px-2 font-light"
                                        rows={2}
                                        disabled={submitting}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }
                                        }}
                                    />

                                    <div className="flex items-center justify-between mt-2 px-1">
                                        <div className="flex items-center gap-2">
                                            <button type="button" className="w-8 h-8 rounded-full bg-[#2A2A2A] hover:bg-[#333] flex items-center justify-center text-white/70 transition-colors">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                            </button>
                                            <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2A2A2A] hover:bg-[#333] transition-colors text-white/90 text-sm font-medium">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                                </svg>
                                                Attach
                                            </button>
                                            <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2A2A2A] hover:bg-[#333] transition-colors text-white/90 text-sm font-medium">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="3" y1="9" x2="21" y2="9"></line>
                                                    <line x1="9" y1="21" x2="9" y2="9"></line>
                                                </svg>
                                                Theme
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="submit"
                                                disabled={!promptInput.trim() || submitting}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${promptInput.trim() && !submitting
                                                        ? 'bg-white text-black hover:scale-105'
                                                        : 'bg-[#2A2A2A] text-white/30 cursor-not-allowed'
                                                    }`}
                                            >
                                                {submitting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <ArrowRight className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </main>

            {/* Projects Section */}
            {session && (
                <ProjectsGrid
                    projects={projects}
                    loading={projectsLoading}
                    userName={session.user?.name || undefined}
                />
            )}
        </div>
    );
}
