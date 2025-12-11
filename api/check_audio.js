// Check what audio records exist in the database
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/my-class-content-browser';

async function checkAudio() {
    try {
        console.log('🔧 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('contents');
        
        // Find all audio records
        const audioRecords = await collection.find({ type: 'audio' }).toArray();
        
        console.log(`\n📊 Found ${audioRecords.length} audio records:`);
        
        audioRecords.forEach((record, index) => {
            console.log(`\n${index + 1}. ID: ${record._id}`);
            console.log(`   Title: ${record.title}`);
            console.log(`   FilePath: ${record.filePath || 'MISSING'}`);
            console.log(`   Body: ${record.body?.substring(0, 100)}...`);
            console.log(`   Metadata:`, JSON.stringify(record.metadata, null, 2));
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the check
checkAudio();