'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import { appConfig } from '@/config/app.config';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { FaSun, FaMoon } from '@/lib/icons';

import { UserButton } from '@/components/UserButton';
import { useApiRequest } from '@/hooks/useApiRequest';
import CodeApplicationProgress, { type CodeApplicationState } from '@/components/CodeApplicationProgress';
import Link from 'next/link';


interface SandboxData {
  sandboxId: string;
  url: string;
}

interface ChatMessage {
  content: string;
  type: 'user' | 'ai' | 'system' | 'command' | 'error';
  timestamp: Date;
  metadata?: {
    appliedFiles?: string[];
  };
}

function AISandboxPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { makeRequestWithBody } = useApiRequest();
  const [sandboxData, setSandboxData] = useState<SandboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ text: 'Not connected', active: false });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [aiModel] = useState(appConfig.ai.defaultModel);
  const [activeTab, setActiveTab] = useState<'generation' | 'preview'>('preview');
  const [sandboxFiles, setSandboxFiles] = useState<Record<string, string>>({});

  const [conversationContext, setConversationContext] = useState<{
    lastGeneratedCode?: string;
  }>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [codeApplicationState, setCodeApplicationState] = useState<CodeApplicationState>({
    stage: null
  });
  const [generationProgress, setGenerationProgress] = useState<{
    isGenerating: boolean;
    status: string;
    streamedCode: string;
    isStreaming: boolean;
    isThinking: boolean;
    thinkingText?: string;
    files: Array<{ path: string; content: string; type: string }>;
    isEdit?: boolean;
  }>({
    isGenerating: false,
    status: '',
    streamedCode: '',
    isStreaming: false,
    isThinking: false,
    files: [],
  });

  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const theme = {
    bg_main: isDarkMode ? 'bg-gray-950' : 'bg-white',
    text_main: isDarkMode ? 'text-white' : 'text-gray-900',
    bg_card: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    border_color: isDarkMode ? 'border-gray-800' : 'border-gray-200',
    chat_user_bg: isDarkMode ? 'bg-gray-700' : 'bg-gray-200',
    chat_ai_bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100',
    code_bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-800',
  };

  const addChatMessage = useCallback(async (content: string, type: ChatMessage['type'], metadata?: ChatMessage['metadata']) => {
    const newMessage = { content, type, timestamp: new Date(), metadata };
    setChatMessages(prev => [...prev, newMessage]);

    if (projectId && session?.user?.id && (type === 'user' || type === 'ai')) {
      await supabase.from('chat_messages').insert({
        project_id: projectId,
        user_id: session.user.id,
        content,
        sender: type,
      });
    }
  }, [projectId, session?.user?.id]);

  const createNewProject = useCallback(async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name: 'New Project' })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error creating new project:', error);
      await addChatMessage('Failed to create a new project.', 'error');
      setLoading(false);
      return;
    }
    router.push(`/workspace?project=${data.id}`);
  }, [router, addChatMessage]);

  const loadProject = useCallback(async (projId: string) => {
    setLoading(true);
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('file_structure')
      .eq('id', projId)
      .single();

    if (projectError || !projectData) {
      console.error('Error loading project:', projectError);
      await addChatMessage('Failed to load project.', 'error');
      if (session?.user?.id) createNewProject(session.user.id);
      return;
    }

    const files = projectData.file_structure as Record<string, string> || {};
    setSandboxFiles(files);

    const { data: chatData, error: chatError } = await supabase
      .from('chat_messages')
      .select('content, sender, created_at')
      .eq('project_id', projId)
      .order('created_at', { ascending: true });

    if (!chatError && chatData) {
      const loadedMessages = chatData.map((msg: any) => ({
        content: msg.content,
        type: msg.sender,
        timestamp: new Date(msg.created_at),
      }));
      setChatMessages(loadedMessages);
    }

    const sandboxResult = await createSandbox(files); // Pass files to createSandbox
    setLoading(false);
  }, [addChatMessage, createNewProject, session?.user?.id, createSandbox]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      const projectIdFromUrl = searchParams.get('project');
      if (projectIdFromUrl) {
        setProjectId(projectIdFromUrl);
        loadProject(projectIdFromUrl);
      } else {
        createNewProject(session.user.id);
      }
    } else if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [sessionStatus, session, searchParams, router, createNewProject, loadProject]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const updateStatus = (text: string, active: boolean) => setStatus({ text, active });

  const createSandbox = async (files?: Record<string, string>) => {
    updateStatus('Creating sandbox...', false);
    try {
      const response = await makeRequestWithBody('/api/create-ai-sandbox', { files });
      const data = await response.json();
      if (data.success) {
        setSandboxData(data);
        updateStatus('Sandbox active', true);
        if (iframeRef.current) {
          iframeRef.current.src = data.url;
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      updateStatus('Error', false);
      addChatMessage(`Failed to create sandbox: ${error.message}`, 'error');
    }
  };

  const applyGeneratedCode = async (code: string, isEdit: boolean = false) => {
    setCodeApplicationState({ stage: 'analyzing' });
    try {
        const response = await fetch('/api/apply-ai-code-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                response: code,
                isEdit,
                sandboxId: sandboxData?.sandboxId,
            }),
        });

        if (!response.ok) throw new Error(`Failed to apply code: ${response.statusText}`);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            // Process streaming data for UI updates...
        }

        // After stream is complete
        setCodeApplicationState({ stage: 'complete' });
        addChatMessage(`Code applied successfully!`, 'system');
        await fetchSandboxFiles(); // Fetch and save the new file structure

    } catch (error: any) {
        addChatMessage(`Failed to apply code: ${error.message}`, 'error');
    } finally {
        setCodeApplicationState({ stage: null });
        setGenerationProgress(prev => ({ ...prev, isEdit: false }));
    }
  };

  const fetchSandboxFiles = async () => {
    if (!sandboxData || !projectId) return;
    try {
        const response = await fetch('/api/get-sandbox-files');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                setSandboxFiles(data.files || {});
                await supabase
                    .from('projects')
                    .update({ file_structure: data.files })
                    .eq('id', projectId);
            }
        }
    } catch (error) {
        console.error('Error fetching/saving sandbox files:', error);
    }
  };

  const sendChatMessage = async () => {
    const message = aiChatInput.trim();
    if (!message) return;

    addChatMessage(message, 'user');
    setAiChatInput('');

    const isEdit = Object.keys(sandboxFiles).length > 0;
    setGenerationProgress(prev => ({ ...prev, isGenerating: true, isEdit, status: 'AI is thinking...' }));

    try {
      const response = await makeRequestWithBody('/api/generate-ai-code-stream', {
        prompt: message,
        model: aiModel,
        context: {
          sandboxId: sandboxData?.sandboxId,
          structure: JSON.stringify(sandboxFiles),
          recentMessages: chatMessages.slice(-10),
        },
        isEdit,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedCode = '';
      if (reader) {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Simplified streaming logic
            generatedCode += chunk;
            setGenerationProgress(prev => ({...prev, streamedCode: prev.streamedCode + chunk}));
        }
      }

      setConversationContext({ lastGeneratedCode: generatedCode });

      if (generatedCode) {
        await applyGeneratedCode(generatedCode, isEdit);
      }

    } catch (error: any) {
      addChatMessage(`Error: ${error.message}`, 'error');
    } finally {
        setGenerationProgress(prev => ({ ...prev, isGenerating: false, status: 'Complete' }));
    }
  };

  const reapplyLastGeneration = async () => {
    if (!conversationContext.lastGeneratedCode || !sandboxData) return;
    addChatMessage('Re-applying last generation...', 'system');
    const isEdit = Object.keys(sandboxFiles).length > 0;
    await applyGeneratedCode(conversationContext.lastGeneratedCode, isEdit);
  };

  if (sessionStatus === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Loading...</div>;
  }

  return (
    <div className={`font-sans ${theme.bg_main} ${theme.text_main} h-screen flex flex-col`}>
      <header className={`px-4 py-3 border-b ${theme.border_color} flex items-center justify-between`}>
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-semibold text-lg hover:text-blue-400">Dashboard</Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={toggleTheme} size="icon">
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </Button>
          <UserButton />
          <Button onClick={() => session?.user?.id && createNewProject(session.user.id)} size="sm">New Project</Button>
          <Button onClick={reapplyLastGeneration} size="sm" disabled={!conversationContext.lastGeneratedCode}>Re-apply</Button>
          <div className="text-sm">{status.text}</div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`w-1/4 flex flex-col border-r ${theme.border_color} ${theme.bg_card}`}>
          <div className="flex-1 overflow-y-auto p-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`mb-2 p-2 rounded-lg ${msg.type === 'user' ? theme.chat_user_bg : theme.chat_ai_bg}`}>
                {msg.content}
              </div>
            ))}
            {codeApplicationState.stage && <CodeApplicationProgress state={codeApplicationState} />}
          </div>
          <div className="p-4 border-t">
            <Textarea
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
              placeholder="Ask the AI to make changes..."
            />
            <Button onClick={sendChatMessage} className="mt-2 w-full">Send</Button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
            <div className="p-2 border-b flex justify-center">
              <div className="flex rounded-md bg-gray-800 p-1">
                  <button onClick={() => setActiveTab('generation')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'generation' ? 'bg-gray-700' : ''}`}>Code</button>
                  <button onClick={() => setActiveTab('preview')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'preview' ? 'bg-gray-700' : ''}`}>Preview</button>
              </div>
            </div>
            <div className="flex-1 relative">
                {activeTab === 'preview' && sandboxData?.url && (
                    <iframe
                    ref={iframeRef}
                    src={sandboxData.url}
                    className="w-full h-full border-none"
                    title="Sandbox Preview"
                    />
                )}
                {activeTab === 'generation' && (
                    <div className="p-4 overflow-auto h-full bg-gray-900">
                        <SyntaxHighlighter language="jsx" style={vscDarkPlus} showLineNumbers>
                            {generationProgress.streamedCode || Object.values(sandboxFiles)[0] || "No code generated yet."}
                        </SyntaxHighlighter>
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Loading Workspace...</div>}>
        <AISandboxPage />
      </Suspense>
    );
  }