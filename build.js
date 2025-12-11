#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if package.json exists
if (!fs.existsSync('./package.json')) {
    console.error('❌ package.json not found in current directory');
    process.exit(1);
}


// Install dependencies
console.log('📦 Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
} catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
}

// Run build
console.log('🏗️  Running build...');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

console.log('🎉 Build process completed successfully!');