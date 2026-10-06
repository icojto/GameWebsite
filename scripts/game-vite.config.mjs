import { defineConfig } from 'vite';
import { buildMetadata, identityPlugin } from './build-identity.mjs';
export default defineConfig(({command})=>({plugins:[identityPlugin(buildMetadata(command==='serve'?'development':'production'))]}));
