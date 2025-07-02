const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Node modules polyfill content
const createNodePolyfill = (moduleName) => {
  if (moduleName === 'fs') {
    return `
      export const readFileSync = () => { throw new Error('fs.readFileSync is not supported in browser'); };
      export const writeFileSync = () => { throw new Error('fs.writeFileSync is not supported in browser'); };
      export const existsSync = () => false;
      export default { readFileSync, writeFileSync, existsSync };
    `;
  }
  
  if (moduleName === 'path') {
    return `
      export const join = (...paths) => paths.join('/').replace(/\\/+/g, '/');
      export const resolve = (...paths) => paths.join('/').replace(/\\/+/g, '/');
      export const basename = (path) => path.split('/').pop() || '';
      export const dirname = (path) => {
        const parts = path.split('/');
        parts.pop();
        return parts.join('/') || '.';
      };
      export const extname = (path) => {
        const basename = path.split('/').pop() || '';
        const dotIndex = basename.lastIndexOf('.');
        return dotIndex !== -1 ? basename.substring(dotIndex) : '';
      };
      export default { join, resolve, basename, dirname, extname };
    `;
  }
  
  if (moduleName === 'os' || moduleName === 'crypto') {
    return `export default {};`;
  }

  if (moduleName === 'zlib') {
    return `
      export const inflateRawSync = (buffer) => buffer;
      export const deflateRawSync = (buffer) => buffer;
      export default { inflateRawSync, deflateRawSync };
    `;
  }
  
  if (moduleName === 'stream') {
    return `
      export class Duplex {
        constructor() {}
        pipe() { return this; }
        on() { return this; }
        write() {}
        end() {}
      }
      export default { Duplex };
    `;
  }
  
  if (moduleName === 'http' || moduleName === 'https') {
    return `
      export const request = () => ({ on: () => {}, write: () => {}, end: () => {} });
      export default { request };
    `;
  }
  
  if (moduleName === 'url') {
    return `
      export const parse = (url) => ({ protocol: '', host: '', pathname: url });
      export default { parse };
    `;
  }
  
  return `export default {};`;
};

// Create mocks for various adm-zip modules
const createAdmZipMocks = (modulePath) => {
  // Main adm-zip module
  if (modulePath === 'adm-zip') {
    return `
      // Mock AdmZip class
      class AdmZip {
        constructor() {
          this.entries = [];
        }
        
        addFile() { return this; }
        addLocalFile() { return this; }
        addLocalFolder() { return this; }
        getEntries() { return []; }
        getEntry() { return null; }
        extractAllTo() {}
        extractEntryTo() { return false; }
        updateFile() {}
        getZipComment() { return ""; }
        setZipComment() {}
        getEntryComment() { return ""; }
        setEntryComment() {}
        deleteFile() {}
        addZipComment() {}
        addZipEntryComment() {}
        writeZip() {}
        toBuffer() { return Buffer.from([]); }
      }
      
      export default AdmZip;
    `;
  }
  
  // The problematic inflater.js module
  if (modulePath.includes('methods/inflater.js') || modulePath.includes('methods/inflater')) {
    return `
      // Safe mock for the inflater
      export function inflater() {
        return {
          inflate: function() { return Buffer.from([]); },
          inflateAsync: function(callback) { 
            if (callback) callback(Buffer.from([]));
            return Promise.resolve(Buffer.from([]));
          }
        };
      }
      
      export default inflater;
    `;
  }
  
  // Other methods
  if (modulePath.includes('methods/')) {
    return `
      // Generic mock for adm-zip methods
      export function genericMethod() {
        return {};
      }
      
      export default genericMethod;
    `;
  }
  
  // ZipEntry mock
  if (modulePath.includes('zipEntry')) {
    return `
      // Mock ZipEntry
      export class ZipEntry {
        constructor() {}
        
        getData() { return Buffer.from([]); }
        getDataAsync() { return Promise.resolve(Buffer.from([])); }
        isEncrypted() { return false; }
        getName() { return ''; }
        
        // Add any other ZipEntry methods here
      }
      
      export default ZipEntry;
    `;
  }
  
  // Default mock for any other adm-zip module
  return `
    // Generic mock for adm-zip modules
    export default {};
  `;
};

// Build the webview
const buildWebview = async () => {
  try {
    const result = await esbuild.build({
      entryPoints: ['src/webview/index.tsx'],
      bundle: true,
      outfile: 'media/editor.js',
      format: 'iife',
      sourcemap: true,
      platform: 'browser',
      define: {
        'process.env.NODE_ENV': '"development"',
        'global': 'window'
      },
      mainFields: ['module', 'main'], // prefer ESM modules
      loader: {
        '.ts': 'ts',
        '.tsx': 'tsx',
      },
      banner: {
        js: `
          if (typeof window !== 'undefined' && !window.process) {
            window.process = { env: { NODE_ENV: 'production' } };
          }
        `
      },
      plugins: [
        {
          name: 'node-modules-polyfill',
          setup(build) {
            // Handle all node built-ins
            build.onResolve({ filter: /^(fs|path|os|crypto|zlib)$/ }, (args) => {
              return {
                path: args.path,
                namespace: 'node-polyfill',
              };
            });
            
            // Handle additional Node.js built-ins
            build.onResolve({ filter: /^(stream|http|https|url)$/ }, (args) => {
              return {
                path: args.path,
                namespace: 'node-polyfill',
              };
            });
            
            build.onLoad({ filter: /.*/, namespace: 'node-polyfill' }, (args) => {
              return {
                contents: createNodePolyfill(args.path),
                loader: 'js',
              };
            });
            
            // Handle adm-zip main module
            build.onResolve({ filter: /^adm-zip$/ }, (args) => {
              return {
                path: 'adm-zip',
                namespace: 'adm-zip-mock',
              };
            });
            
            // Handle any path within adm-zip
            build.onResolve({ filter: /adm-zip\/.*/ }, (args) => {
              return {
                path: args.path,
                namespace: 'adm-zip-mock',
              };
            });
            
            // Load appropriate mock for any adm-zip module
            build.onLoad({ filter: /.*/, namespace: 'adm-zip-mock' }, (args) => {
              return {
                contents: createAdmZipMocks(args.path),
                loader: 'js',
              };
            });
            
            // Also add a high-priority external resolver for any direct references to adm-zip
            build.onResolve({ filter: /.*adm-zip.*\.js$/, namespace: 'file' }, (args) => {
              if (args.path.includes('adm-zip')) {
                return {
                  path: args.path,
                  namespace: 'adm-zip-mock',
                };
              }
              return null;
            });
            
            // Add global shims
            build.onLoad({ filter: /editor\.ts$/ }, (args) => {
              const code = fs.readFileSync(args.path, 'utf8');
              const processShim = `
                // Add polyfills for node globals
                if (typeof window !== 'undefined' && !window.process) {
                  window.process = { env: { NODE_ENV: 'production' }, cwd: () => '/' };
                }
                if (typeof window !== 'undefined' && !window.Buffer) {
                  window.Buffer = { 
                    isBuffer: () => false,
                    from: (arr) => Array.isArray(arr) ? arr : [],
                    alloc: (size) => new Uint8Array(size),
                    concat: (chunks) => {
                      if (!Array.isArray(chunks)) return new Uint8Array(0);
                      return chunks.reduce((acc, val) => [...acc, ...(val || [])], []);
                    }
                  };
                }
              `;
              
              return {
                contents: processShim + code,
                loader: 'ts',
              };
            });
          },
        },
      ],
    });
    console.log('Webview build complete');
  } catch (error) {
    console.error('Webview build failed:', error);
    process.exit(1);
  }
};

buildWebview(); 