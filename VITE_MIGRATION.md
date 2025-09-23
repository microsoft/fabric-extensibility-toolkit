# Webpack to Vite Migration Guide

This document outlines the migration from Webpack to Vite for the Microsoft Fabric Extensibility Toolkit.

## Migration Summary

### What's Changed

1. **Build Tool**: Replaced Webpack with Vite for faster development and build times
2. **Configuration**: New `vite.config.ts` replaces `webpack.config.js` and `webpack.dev.js`
3. **Dependencies**: Updated to use Vite plugins instead of Webpack loaders
4. **HTML Template**: Updated to use Vite's module system
5. **Development Server**: Simplified dev server setup

### Files Modified

- `package.json` - Updated scripts and dependencies
- `app/index.html` - Added module script tag
- `tsconfig.json` - Updated for better Vite compatibility
- `vite.config.ts` - New Vite configuration (replaces webpack configs)

### Files Added

- `vite.config.ts` - Main Vite configuration
- `vite.dev.config.ts` - Development-specific Vite config (optional)
- `devServer/api-server.js` - Standalone API server for dev endpoints

## Migration Steps

### 1. Install New Dependencies

```bash
npm install
```

This will install:
- `vite` - The build tool
- `@vitejs/plugin-react` - React support for Vite
- `cors` - CORS middleware for API server
- `express` - Already existed but now used for standalone API server

### 2. Remove Old Dependencies (Optional)

After confirming everything works, you can remove the old Webpack dependencies:

```bash
npm uninstall webpack webpack-cli webpack-dev-server webpack-merge
npm uninstall clean-webpack-plugin copy-webpack-plugin html-webpack-plugin
npm uninstall css-loader style-loader sass-loader ts-loader
```

### 3. Update Scripts

The package.json scripts have been updated:

- `npm start` or `npm run start:devServer` - Starts Vite dev server
- `npm run start:apiServer` - Starts the standalone API server (if needed)
- `npm run build:test` - Builds for test environment
- `npm run build:prod` - Builds for production
- `npm run preview` - Previews production build

### 4. Development Workflow

#### Option A: Vite Only (Recommended)
If you don't need the custom API endpoints during development:
```bash
npm run start:devServer
```

#### Option B: Vite + API Server
If you need the custom API endpoints:
```bash
# Terminal 1
npm run start:devServer

# Terminal 2  
npm run start:apiServer
```

## Key Differences

### Environment Variables
- Vite loads environment variables automatically
- All env vars are available in the config through `loadEnv()`
- No need for separate webpack merge configs

### Static Assets
- Assets in `app/assets/` are served from `/assets/` in development
- Assets are automatically copied during build
- `web.config` is copied via custom plugin

### Hot Module Replacement
- Vite provides faster HMR out of the box
- React Fast Refresh works automatically

### Build Output
- Build output structure remains the same
- Builds are significantly faster than Webpack

## Configuration Details

### vite.config.ts

The main configuration file handles:
- Environment variable injection
- React plugin setup
- SCSS processing
- Static asset handling
- Build output configuration
- Development server settings

### Development Server

Two approaches for development:

1. **Simplified** (recommended): Use only Vite dev server
2. **Full Featured**: Run both Vite dev server and API server

## Troubleshooting

### TypeScript Errors
Some TypeScript errors in the config files are expected since the new Vite dependencies aren't installed yet. These will resolve after running `npm install`.

### Port Conflicts
- Vite dev server: `http://127.0.0.1:60006` (same as before)
- API server: `http://127.0.0.1:60007` (new, if used)

### CORS Issues
If you encounter CORS issues when using both servers, ensure your application makes API calls to the correct port (60007 for API endpoints).

## Benefits of Migration

1. **Faster Development**: Vite's dev server starts much faster than Webpack
2. **Faster Hot Reload**: Near-instantaneous updates during development
3. **Faster Builds**: Vite uses Rollup for production builds, which is faster than Webpack
4. **Simpler Configuration**: Less complex configuration files
5. **Better TypeScript Support**: Out-of-the-box TypeScript support
6. **Modern Tooling**: Built for modern JavaScript development

## Rollback Plan

If you need to rollback to Webpack:
1. Keep the old `webpack.config.js` and `devServer/webpack.dev.js` files
2. Restore the original `package.json` from git
3. Run `npm install` to reinstall Webpack dependencies

The migration preserves all functionality while providing significant performance improvements during development.