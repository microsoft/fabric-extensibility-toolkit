#!/bin/bash

echo "🚀 Starting Webpack to Vite migration..."
echo ""

# Navigate to Workload directory
cd "$(dirname "$0")/Workload" || exit 1

echo "📦 Installing new Vite dependencies..."
npm install --save-dev vite@^7.1.7 @vitejs/plugin-react@^4.3.1 cors@^2.8.5

echo ""
echo "🧹 Optionally removing old Webpack dependencies..."
echo "   (You can skip this step and remove them later after testing)"

read -p "Remove old Webpack dependencies now? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing Webpack dependencies..."
    npm uninstall webpack webpack-cli webpack-dev-server webpack-merge
    npm uninstall clean-webpack-plugin copy-webpack-plugin html-webpack-plugin
    npm uninstall css-loader style-loader sass-loader ts-loader vite-plugin-env-compatible
    echo "✅ Old dependencies removed"
else
    echo "⏭️  Skipping removal of old dependencies"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run start:devServer' to test the new Vite dev server"
echo "2. If you need custom API endpoints, also run 'npm run start:apiServer' in another terminal"
echo "3. Test your build with 'npm run build:test' or 'npm run build:prod'"
echo "4. See VITE_MIGRATION.md for detailed information"
echo ""