const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const cleanDatabase = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB Atlas');
        console.log('✓ Database:', mongoose.connection.name);

        // Get list of collections before dropping
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name).filter(name => name !== 'webmasters');

        if (collectionNames.length === 0) {
            console.log('✓ Database is already clean (no collections to drop)');
        } else {
            console.log(`📊 Found ${collectionNames.length} collection(s) to clear:`, collectionNames.join(', '));
            
            // Drop the entire database to ensure clean state
            await mongoose.connection.dropDatabase();
            console.log('✓ Database dropped completely');
            
            // Verify the database is clean
            const collectionsAfter = await mongoose.connection.db.listCollections().toArray();
            const remainingCollections = collectionsAfter.map(c => c.name);
            
            if (remainingCollections.length <= 1) {
                console.log('✓ Database is now completely empty');
            } else {
                console.log(`⚠️  Warning: Found remaining collections: ${remainingCollections.join(', ')}`);
            }
        }

        console.log('\n🎉 Database cleanup completed successfully!');
        console.log('📋 Database is now ready for seeding.');
        console.log('💡 Run: node seed.js');

        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
        
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

cleanDatabase();
