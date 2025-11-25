```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Send, Download, RefreshCw, Play, Code, MessageSquare, Monitor, Check, X, ChevronRight, ChevronDown, Folder, File, FileJson, FileCode, FileType } from 'lucide-react';
import { appConfig } from '@/config/app.config';
import { useApiRequest } from '@/hooks/useApiRequest';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { UserButton } from '@/components/UserButton';
import { Button } from '@/components/ui/button';

// Interfaces
interface SandboxData {
    sandboxId: string;
    url: string;
    [key: string]: any;
}

interface ChatMessage {
    content: string;
    type: 'user' | 'ai' | 'system' | 'file-update' | 'command' | 'error';
    timestamp: Date;
    metadata?: {
        websiteDescription?: string;
        generatedCode?: string;
        appliedFiles?: string[];
        commandType?: 'input' | 'output' | 'error' | 'success';
    };
}

interface GenerationProgress {
    isGenerating: boolean;
    status: string;
    components: Array<{ name: string; path: string; completed: boolean }>;
    currentComponent: number;
    streamedCode: string;
    isThinking?: boolean; // Added based on the new code
    thinkingText?: string; // Added based on the new code
    isStreaming?: boolean; // Added based on the new code
}

// Assuming the rest of the component logic is here,
// and the provided code is meant to be inserted within the main component function.

// Placeholder for the main component function, assuming it's named WorkspacePage
// and has all the necessary state and helper functions defined.
// This is a necessary assumption to make the provided snippet syntactically correct.
export default function WorkspacePage() {
  const [sandboxData, setSandboxData] = useState<SandboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeMode, setActiveMode] = useState<'visual' | 'chat'>('chat');
  const [activeTab, setActiveTab] = useState<'preview' | 'generation'>('preview');
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    isGenerating: false,
    status: '',
    components: [],
    currentComponent: 0,
    streamedCode: '',
  });
  const [sandboxFiles, setSandboxFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const { makeRequest, makeRequestWithBody } = useApiRequest();
  const searchParams = useSearchParams();
  const router = useRouter();
  const aiModel = 'gpt-4o'; // Example model, adjust as needed

  // Placeholder for conversationContext, assuming it's defined elsewhere
  const [conversationContext, setConversationContext] = useState({
    appliedCode: [],
    websiteDescription: '',
  });

  // Placeholder for addChatMessage, assuming it's defined elsewhere
  const addChatMessage = (content: string, type: ChatMessage['type'], metadata?: ChatMessage['metadata']) => {
    setChatMessages(prev => [...prev, { content, type, timestamp: new Date(), metadata }]);
  };

  // Placeholder for createSandbox, assuming it's defined elsewhere
  const createSandbox = async (initialPrompt: boolean = false) => {
    setLoading(true);
    try {
      const response = await makeRequestWithBody('/api/create-sandbox', { initialPrompt });
      if (response.ok) {
        const data = await response.json();
        setSandboxData(data);
        addChatMessage(`Sandbox created at ${ data.url } `, 'system');
        fetchSandboxFiles(data.sandboxId);
      } else {
        throw new Error('Failed to create sandbox');
      }
    } catch (error: any) {
      console.error('Error creating sandbox:', error);
      addChatMessage(`Error creating sandbox: ${ error.message } `, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for fetchSandboxFiles, assuming it's defined elsewhere
  const fetchSandboxFiles = async (sandboxId?: string) => {
    const currentSandboxId = sandboxId || sandboxData?.sandboxId;
    if (!currentSandboxId) return;

    try {
      const response = await makeRequest(`/ api / sandbox - files ? sandboxId = ${ currentSandboxId } `);
      if (response.ok) {
        const files = await response.json();
        setSandboxFiles(files);
        if (!selectedFile && Object.keys(files).length > 0) {
          setSelectedFile(Object.keys(files)[0]);
        }
      } else {
        throw new Error('Failed to fetch sandbox files');
      }
    } catch (error: any) {
      console.error('Error fetching sandbox files:', error);
      addChatMessage(`Error fetching sandbox files: ${ error.message } `, 'error');
    }
  };

  // Placeholder for downloadZip, assuming it's defined elsewhere
  const downloadZip = async () => {
    if (!sandboxData?.sandboxId) {
      addChatMessage('No sandbox to download.', 'system');
      return;
    }
    try {
      const response = await fetch(`/ api / download - sandbox ? sandboxId = ${ sandboxData.sandboxId } `);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lovable - app - ${ sandboxData.sandboxId }.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        addChatMessage('Code downloaded successfully!', 'system');
      } else {
        throw new Error('Failed to download sandbox');
      }
    } catch (error: any) {
      console.error('Error downloading sandbox:', error);
      addChatMessage(`Error downloading sandbox: ${ error.message } `, 'error');
    }
  };

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, generationProgress.isThinking]);

  useEffect(() => {
    const initialPrompt = searchParams.get('prompt');
    if (initialPrompt) {
      setChatInput(initialPrompt);
      // Automatically send the prompt if it's from the URL
      // This might need to be handled carefully to avoid double-sends or race conditions
      // For now, we'll just set the input. User can press enter.
    }
  }, [searchParams]);

  // Send AI Chat
  const sendAIChat = async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message
    addChatMessage(message, 'user');
    setChatInput('');
    
    // Check for commands
    const lowerMsg = message.toLowerCase().trim();
    if (lowerMsg === 'check packages' || lowerMsg === 'npm install') {
      if (sandboxData) {
        addChatMessage('Checking packages...', 'system');
        // Trigger package check logic (simplified)
        return;
      }
    }

    // Create sandbox if needed
    if (!sandboxData) {
      addChatMessage('Creating sandbox first...', 'system');
      await createSandbox(true);
    }

    setGenerationProgress(prev => ({
      ...prev,
      isGenerating: true,
      status: 'Thinking...',
      isThinking: true
    }));

    try {
      const context = {
        sandboxId: sandboxData?.sandboxId,
        recentMessages: chatMessages.slice(-10),
        currentCode: message,
        sandboxUrl: sandboxData?.url
      };

      const response = await makeRequestWithBody('/api/generate-ai-code-stream', {
        prompt: message,
        model: aiModel,
        context,
        isEdit: conversationContext.appliedCode.length > 0
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${ response.status } `);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedCode = '';
      let explanation = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'status') {
                  setGenerationProgress(prev => ({ ...prev, status: data.message }));
                } else if (data.type === 'thinking') {
                  setGenerationProgress(prev => ({
                    ...prev,
                    thinkingText: (prev.thinkingText || '') + data.text
                  }));
                } else if (data.type === 'conversation') {
                  // Add conversational text
                  let text = data.text || '';
                  if (!text.includes('<file') && text.trim().length > 0) {
                    addChatMessage(text.trim(), 'ai');
                  }
                } else if (data.type === 'stream' && data.raw) {
                  setGenerationProgress(prev => ({
                    ...prev,
                    streamedCode: prev.streamedCode + data.text,
                    isStreaming: true,
                    isThinking: false
                  }));
                } else if (data.type === 'complete') {
                  generatedCode = data.generatedCode;
                  explanation = data.explanation;
                  setGenerationProgress(prev => ({
                    ...prev,
                    isGenerating: false,
                    isStreaming: false,
                    status: 'Complete'
                  }));
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      if (generatedCode) {
        // Apply code
        addChatMessage('Applying generated code...', 'system');
        
        // Call apply endpoint
        const applyResponse = await fetch('/api/apply-ai-code-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            response: generatedCode,
            isEdit: conversationContext.appliedCode.length > 0,
            sandboxId: sandboxData?.sandboxId
          })
        });

        if (applyResponse.ok) {
          addChatMessage('Code applied successfully!', 'system');
          // Refresh iframe
          if (iframeRef.current && sandboxData?.url) {
            iframeRef.current.src = `${ sandboxData.url }?t = ${ Date.now() } `;
          }
          // Fetch updated files
          fetchSandboxFiles();
        }
      }

    } catch (error: any) {
      console.error('AI generation failed:', error);
      addChatMessage(`Error: ${ error.message } `, 'error');
      setGenerationProgress(prev => ({ ...prev, isGenerating: false }));
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col overflow-hidden font-sans text-white">
      {/* Header */}
      <header className="workspace-header flex items-center justify-between px-6 py-3 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 z-10">
        <div className="flex items-center gap-4">
          <button className="text-white/60 hover:text-white p-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white text-xs font-bold">L</span>
            </div>
            <span className="text-white font-medium tracking-tight">Lovable</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#1a1a1a] rounded-lg p-1 border border-white/5">
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px - 4 py - 1.5 rounded - md text - sm font - medium flex items - center gap - 2 transition - all ${ activeTab === 'preview' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-white/60 hover:text-white' } `}
            >
              <Monitor className="w-3.5 h-3.5" />
              Preview
            </button>
            <button 
              onClick={() => setActiveTab('generation')}
              className={`px - 4 py - 1.5 rounded - md text - sm font - medium flex items - center gap - 2 transition - all ${ activeTab === 'generation' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-white/60 hover:text-white' } `}
            >
              <Code className="w-3.5 h-3.5" />
              Code
            </button>
          </div>
          
          <div className="h-6 w-px bg-white/10 mx-1"></div>

          <button 
            onClick={downloadZip}
            className="text-white/60 hover:text-white p-2 transition-colors" 
            title="Download Code"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              if (iframeRef.current && sandboxData?.url) {
                iframeRef.current.src = `${ sandboxData.url }?t = ${ Date.now() } `;
              }
            }}
            className="text-white/60 hover:text-white p-2 transition-colors" 
            title="Refresh Preview"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Preview / Code Area */}
        <div className="flex-1 relative bg-[#1a1a1a]">
          {activeTab === 'preview' ? (
            <div className="w-full h-full relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                  <p className="text-white/60 font-medium">Initializing Sandbox...</p>
                </div>
              ) : sandboxData?.url ? (
                <iframe
                  ref={iframeRef}
                  src={sandboxData.url}
                  className="w-full h-full border-0 bg-white"
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 bg-[#0a0a0a]">
                  <Monitor className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No preview available</p>
                  <p className="text-sm mt-2 opacity-60">Start chatting to generate your app</p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-[#0a0a0a] flex">
              {/* File Explorer */}
              <div className="w-64 border-r border-white/5 flex flex-col bg-[#0a0a0a]">
                <div className="p-3 border-b border-white/5 font-medium text-sm text-white/80 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-blue-400" />
                  Files
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {Object.keys(sandboxFiles).sort().map(file => (
                    <div 
                      key={file}
                      onClick={() => setSelectedFile(file)}
                      className={`flex items - center gap - 2 px - 3 py - 2 rounded - md cursor - pointer text - sm transition - colors ${ selectedFile === file ? 'bg-blue-500/20 text-blue-400' : 'text-white/60 hover:bg-white/5 hover:text-white' } `}
                    >
                      {file.endsWith('.css') ? <FileType className="w-4 h-4 text-blue-400" /> : 
                       file.endsWith('.json') ? <FileJson className="w-4 h-4 text-yellow-400" /> :
                       <FileCode className="w-4 h-4 text-purple-400" />}
                      <span className="truncate">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Code Editor */}
              <div className="flex-1 flex flex-col bg-[#0a0a0a]">
                {selectedFile ? (
                  <>
                    <div className="p-3 border-b border-white/5 font-medium text-sm text-white/80 flex items-center gap-2 bg-[#111]">
                      <FileCode className="w-4 h-4 opacity-60" />
                      {selectedFile}
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      <SyntaxHighlighter
                        language={selectedFile.endsWith('.css') ? 'css' : 'javascript'}
                        style={vscDarkPlus}
                        customStyle={{ background: 'transparent', margin: 0, padding: 0 }}
                        showLineNumbers={true}
                      >
                        {sandboxFiles[selectedFile] || ''}
                      </SyntaxHighlighter>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-white/30">
                    Select a file to view code
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Floating Chat Panel */}
        <div className="absolute bottom-6 left-6 w-[450px] flex flex-col z-20">
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setActiveMode('visual')}
              className={`flex items - center gap - 2 px - 3 py - 1.5 rounded - lg text - sm font - medium transition - all backdrop - blur - md border ${
    activeMode === 'visual'
        ? 'bg-white/10 text-white border-white/20 shadow-lg shadow-black/20'
        : 'bg-black/40 text-white/50 border-transparent hover:text-white/70 hover:bg-black/60'
} `}
            >
              <Monitor className="w-3.5 h-3.5" />
              Visual edits
            </button>
            <button
              onClick={() => setActiveMode('chat')}
              className={`flex items - center gap - 2 px - 3 py - 1.5 rounded - lg text - sm font - medium transition - all backdrop - blur - md border ${
    activeMode === 'chat'
        ? 'bg-white/10 text-white border-white/20 shadow-lg shadow-black/20'
        : 'bg-black/40 text-white/50 border-transparent hover:text-white/70 hover:bg-black/60'
} `}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>

          {/* Chat Messages Area */}
          {activeMode === 'chat' && (
            <div 
              ref={chatMessagesRef}
              className={`mb - 3 max - h - [400px] overflow - y - auto scrollbar - hide flex flex - col gap - 3 transition - all duration - 300 ${ chatMessages.length > 0 ? 'opacity-100' : 'opacity-0 h-0' } `}
            >
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${ msg.type === 'user' ? 'justify-end' : 'justify-start' } `}>
                  <div 
                    className={`max - w - [90 %] px - 4 py - 3 rounded - 2xl text - sm leading - relaxed shadow - lg backdrop - blur - md border ${
    msg.type === 'user'
        ? 'bg-blue-600/90 text-white border-blue-500/50 rounded-br-sm'
        : msg.type === 'system'
            ? 'bg-gray-800/80 text-gray-300 border-gray-700/50 text-xs'
            : 'bg-[#1a1a1a]/90 text-gray-200 border-white/10 rounded-bl-sm'
} `}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {generationProgress.isThinking && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a1a]/90 text-gray-400 px-4 py-3 rounded-2xl rounded-bl-sm border border-white/10 text-sm flex items-center gap-2 backdrop-blur-md">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                    {generationProgress.status || 'Thinking...'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendAIChat(chatInput);
                  }
                }}
                placeholder="Ask Lovable..."
                className="w-full bg-transparent border-none px-5 py-4 pr-12 text-white placeholder-white/30 focus:outline-none focus:ring-0 text-[15px]"
              />
              <button
                onClick={() => sendAIChat(chatInput)}
                disabled={!chatInput.trim() || generationProgress.isGenerating}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                {generationProgress.isGenerating ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```
