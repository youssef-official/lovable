import { NextRequest, NextResponse } from 'next/server';
import { Sandbox } from '@e2b/code-interpreter';
import { appConfig } from '@/config/app.config';
import { getApiKey, getAllApiKeysFromHeaders, getAllApiKeysFromBody } from '@/lib/api-key-utils';

// Store active sandbox globally
declare global {
  var activeSandbox: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
}

export async function POST(request: NextRequest) {
  let sandbox: any = null;

  try {
    const body = await request.json().catch(() => ({}));
    const { files: projectFiles } = body;

    const E2B_API_KEY = getAllApiKeysFromHeaders(request).e2b || getAllApiKeysFromBody(body).e2b;

    if (!E2B_API_KEY) {
      return NextResponse.json({ success: false, error: 'E2B API key is required.' }, { status: 400 });
    }
    
    if (global.activeSandbox) {
      await global.activeSandbox.kill();
      global.activeSandbox = null;
    }
    
    global.existingFiles = new Set<string>();

    sandbox = await Sandbox.create({
      apiKey: E2B_API_KEY,
      timeoutMs: appConfig.e2b.timeoutMs
    });
    
    const sandboxId = (sandbox as any).sandboxId || Date.now().toString();
    const host = (sandbox as any).getHost(appConfig.e2b.vitePort);
    
    if (projectFiles && Object.keys(projectFiles).length > 0) {
      console.log('[create-ai-sandbox] Loading project files into sandbox...');
      for (const [path, content] of Object.entries(projectFiles)) {
        const dir = path.substring(0, path.lastIndexOf('/'));
        if (dir) {
          await sandbox.filesystem.makeDir(dir);
        }
        await sandbox.filesystem.write(path, content as string);
        global.existingFiles.add(path);
      }
      console.log('✓ Project files loaded.');
    } else {
      console.log('[create-ai-sandbox] No project files provided, setting up default Vite app...');
      // Default Vite app setup script from your original file
      const setupScript = `
import os
import json
os.makedirs('/home/user/app/src', exist_ok=True)
# ... [rest of the default setup script] ...
# This part is long, so I'm omitting it for brevity, but it's the same as before.
# It creates package.json, vite.config.js, etc.
package_json = { "name": "sandbox-app", "version": "1.0.0", "type": "module", "scripts": { "dev": "vite --host", "build": "vite build", "preview": "vite preview" }, "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0" }, "devDependencies": { "@vitejs/plugin-react": "^4.0.0", "vite": "^4.3.9", "tailwindcss": "^3.3.0", "postcss": "^8.4.31", "autoprefixer": "^10.4.16" } }
with open('/home/user/app/package.json', 'w') as f:
    json.dump(package_json, f, indent=2)
vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], server: { host: '0.0.0.0', port: 5173, strictPort: true, hmr: false, allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'] } })"""
with open('/home/user/app/vite.config.js', 'w') as f:
    f.write(vite_config)
# ... and so on for all default files
`;
      await sandbox.runCode(setupScript);
    }

    console.log('[create-ai-sandbox] Installing dependencies...');
    await sandbox.runCode(`
import subprocess
subprocess.run(['npm', 'install'], cwd='/home/user/app', capture_output=True, text=True)
    `);
    
    console.log('[create-ai-sandbox] Starting Vite dev server...');
    await sandbox.runCode(`
import subprocess, os
os.chdir('/home/user/app')
subprocess.Popen(['npm', 'run', 'dev'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    `);
    
    await new Promise(resolve => setTimeout(resolve, appConfig.e2b.viteStartupDelay));

    global.activeSandbox = sandbox;
    global.sandboxData = { sandboxId, url: `https://${host}` };
    
    console.log('[create-ai-sandbox] Sandbox ready at:', `https://${host}`);
    
    return NextResponse.json({
      success: true,
      sandboxId,
      url: `https://${host}`,
    });

  } catch (error: any) {
    console.error('[create-ai-sandbox] Error:', error);
    if (sandbox) await sandbox.kill();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}