import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync } from 'fs'
import type { ConfigEnv, UserConfig } from 'vite'

export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('*******************     Workload Configuration    *******************');
  console.log('process.env.WORKLOAD_NAME: ' + env.WORKLOAD_NAME);
  console.log('process.env.ITEM_NAMES: ' + env.ITEM_NAMES);
  console.log('process.env.WORKLOAD_VERSION: ' + env.WORKLOAD_VERSION);
  console.log('process.env.LOG_LEVEL: ' + env.LOG_LEVEL);
  console.log('*********************************************************************');

  return {
    plugins: [
      react(),
      // Custom plugin to copy web.config file during build
      {
        name: 'copy-web-config',
        writeBundle(options) {
          if (command === 'build' && options.dir) {
            try {
              copyFileSync(
                resolve(process.cwd(), 'app/web.config'),
                resolve(options.dir, 'web.config')
              );
              console.log('✓ web.config copied to build directory');
            } catch (error) {
              console.warn('Could not copy web.config:', error);
            }
          }
        }
      }
    ],
    
    define: {
      'process.env.WORKLOAD_NAME': JSON.stringify(env.WORKLOAD_NAME),
      'process.env.ITEM_NAMES': JSON.stringify(env.ITEM_NAMES),
      'process.env.WORKLOAD_VERSION': JSON.stringify(env.WORKLOAD_VERSION),
      'process.env.LOG_LEVEL': JSON.stringify(env.LOG_LEVEL),
      // Development-specific environment variables
      'process.env.DEV_AAD_CONFIG_FE_APPID': JSON.stringify(env.FRONTEND_APPID || env.DEV_AAD_CONFIG_FE_APPID),
      'process.env.DEV_AAD_CONFIG_BE_APPID': JSON.stringify(env.BACKEND_APPID || env.DEV_AAD_CONFIG_BE_APPID),
      'process.env.DEV_AAD_CONFIG_BE_AUDIENCE': JSON.stringify(env.DEV_AAD_CONFIG_BE_AUDIENCE || ''),
      'process.env.DEV_AAD_CONFIG_BE_REDIRECT_URI': JSON.stringify(env.BACKEND_URL || env.DEV_AAD_CONFIG_BE_REDIRECT_URI),
      'NODE_ENV': JSON.stringify(env.NODE_ENV || mode)
    },

    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },

    css: {
      preprocessorOptions: {
        scss: {
          // Add any global SCSS imports here if needed
        }
      }
    },

    server: {
      port: 60006,
      host: '127.0.0.1',
      open: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: "*"
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: command === 'serve',
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), 'app/index.html')
        }
      }
    },

    // Configure static asset handling
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg'],
    
    publicDir: 'app/assets'
  }
})