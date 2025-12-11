// Quick fix for missing filePath in audio content records
// Run this from the API directory using: node fix_audio_paths.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to the same database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/my-class-content-browser';

const contentSchema = new mongoose.Schema({
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String },
    filePath: { type: String },
    originalFileName: { type: String },
    fileSize: { type: Number },
    viewCount: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const Content = mongoose.model('Content', contentSchema);

async function fixAudioPaths() {
    try {
        console.log('🔧 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find audio content without filePath
        const audioContents = await Content.find({ 
            type: 'audio',
            $or: [
                { filePath: { $exists: false } },
                { filePath: null },
                { filePath: '' }
            ]
        });

        console.log(`📊 Found ${audioContents.length} audio records needing filePath`);

        let updated = 0;

        for (const content of audioContents) {
            console.log(`\n🔍 Processing: ${content.title}`);
            
            // Try different methods to find the file path
            let filePath = null;
            let originalFileName = null;
            
            // Method 1: From metadata.relativePath
            if (content.metadata?.relativePath) {
                filePath = path.join(__dirname, '..', content.metadata.relativePath);
                originalFileName = path.basename(content.metadata.relativePath);
            }
            // Method 2: From metadata.subCategory (legacy)
            else if (content.metadata?.subCategory && content.metadata.subCategory.includes('uploads/')) {
                filePath = path.join(__dirname, '..', content.metadata.subCategory);
                originalFileName = path.basename(content.metadata.subCategory);
            }
            
            if (filePath && fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                
                await Content.findByIdAndUpdate(content._id, {
                    filePath: filePath,
                    originalFileName: originalFileName,
                    fileSize: stats.size
                });
                
                console.log(`✅ Updated: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                updated++;
            } else {
                console.log(`❌ File not found: ${filePath || 'No path determined'}`);
            }
        }

        console.log(`\n🎉 Successfully updated ${updated} audio records!`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the fix
fixAudioPaths();