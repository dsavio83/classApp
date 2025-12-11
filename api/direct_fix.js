// Direct database update for the specific audio record
const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/my-class-content-browser';

async function directFix() {
    try {
        console.log('🔧 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // The specific audio record ID
        const audioId = '69287b414d254a20d070565e';
        
        // Calculate the correct file path based on metadata
        const relativePath = 'uploads/Class 8/tamilat/Unit1/Audios/mp3.mp3';
        const filePath = require('path').join(__dirname, '..', relativePath);
        const originalFileName = 'mp3.mp3';
        
        console.log(`📁 Calculated filePath: ${filePath}`);
        console.log(`📄 Original filename: ${originalFileName}`);
        
        // Check if file exists
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`✅ File exists! Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            
            // Direct MongoDB update using native driver
            const db = mongoose.connection.db;
            const collection = db.collection('contents');
            
            const updateResult = await collection.updateOne(
                { _id: new mongoose.Types.ObjectId(audioId) },
                { 
                    $set: { 
                        filePath: filePath,
                        originalFileName: originalFileName,
                        fileSize: stats.size
                    } 
                }
            );
            
            console.log(`🎉 Update result:`, updateResult);
            console.log(`📊 Modified count: ${updateResult.modifiedCount}`);
            
        } else {
            console.log(`❌ File not found at: ${filePath}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the fix
directFix();