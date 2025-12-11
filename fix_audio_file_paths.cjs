// Script to fix missing filePath fields in existing audio content records
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/my-class-content-browser');

const Content = mongoose.model('Content', new mongoose.Schema({
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String }, // Text content or JSON
    filePath: { type: String }, // Path to uploaded file
    originalFileName: { type: String }, // Original filename
    fileSize: { type: Number }, // File size in bytes
    viewCount: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true }));

async function fixAudioFilePaths() {
    try {
        console.log('🔧 Starting audio file path fixes...');
        
        // Find all audio content records that don't have filePath
        const audioContents = await Content.find({ 
            type: 'audio',
            $or: [
                { filePath: { $exists: false } },
                { filePath: null },
                { filePath: '' }
            ]
        });
        
        console.log(`📊 Found ${audioContents.length} audio records without filePath`);
        
        let updatedCount = 0;
        
        for (const content of audioContents) {
            console.log(`\n🔍 Processing audio: ${content.title} (${content._id})`);
            console.log(`   Current body: ${content.body?.substring(0, 100)}...`);
            console.log(`   Current metadata:`, content.metadata);
            
            // Try to extract file path from metadata.relativePath or body
            let filePath = null;
            let originalFileName = null;
            let fileSize = null;
            
            // Method 1: Check metadata.relativePath
            if (content.metadata?.relativePath) {
                const relativePath = content.metadata.relativePath;
                // Convert relative path to absolute path
                filePath = require('path').join(__dirname, relativePath);
                originalFileName = require('path').basename(relativePath);
                console.log(`   ✅ Found filePath from metadata.relativePath: ${filePath}`);
            }
            // Method 2: Check if body contains a file path (legacy data)
            else if (content.body && content.body.includes('uploads/')) {
                const pathMatch = content.body.match(/uploads\/[^"'\s,}]+/);
                if (pathMatch) {
                    const relativePath = pathMatch[0];
                    filePath = require('path').join(__dirname, relativePath);
                    originalFileName = require('path').basename(relativePath);
                    console.log(`   ✅ Found filePath from body: ${filePath}`);
                }
            }
            // Method 3: Check metadata.subCategory for path
            else if (content.metadata?.subCategory && content.metadata.subCategory.includes('uploads/')) {
                const relativePath = content.metadata.subCategory;
                filePath = require('path').join(__dirname, relativePath);
                originalFileName = require('path').basename(relativePath);
                console.log(`   ✅ Found filePath from metadata.subCategory: ${filePath}`);
            }
            
            // Check if file exists
            if (filePath && require('fs').existsSync(filePath)) {
                const stats = require('fs').statSync(filePath);
                fileSize = stats.size;
                
                // Update the content record
                await Content.findByIdAndUpdate(content._id, {
                    filePath: filePath,
                    originalFileName: originalFileName,
                    fileSize: fileSize
                });
                
                console.log(`   ✅ Successfully updated record with filePath: ${filePath}`);
                console.log(`   📁 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
                updatedCount++;
            } else {
                console.log(`   ❌ File not found or could not determine path`);
                if (filePath) {
                    console.log(`   🔍 Expected path: ${filePath}`);
                }
            }
        }
        
        console.log(`\n🎉 Fix complete! Updated ${updatedCount} audio records.`);
        
        // Verify the fixes
        console.log('\n🔍 Verifying fixes...');
        const fixedAudios = await Content.find({ type: 'audio' });
        const withFilePath = fixedAudios.filter(a => a.filePath).length;
        console.log(`📊 Total audio records: ${fixedAudios.length}`);
        console.log(`📊 Records with filePath: ${withFilePath}`);
        console.log(`📊 Records without filePath: ${fixedAudios.length - withFilePath}`);
        
    } catch (error) {
        console.error('❌ Error fixing audio file paths:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the fix
fixAudioFilePaths();