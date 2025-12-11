const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const mongoUri = 'mongodb+srv://dsavio83_db_user:amhpj0609H@cluster0.kfyrhlx.mongodb.net/?appName=Cluster0';
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Define models
const Content = mongoose.model('Content', new mongoose.Schema({}, { strict: false }), 'contents');

async function checkContent() {
    try {
        console.log('Checking all content entries...');
        
        // Find all content entries
        const allContents = await Content.find({});
        
        console.log(`Found ${allContents.length} total content entries`);
        
        // Group by type
        const byType = {};
        allContents.forEach(content => {
            if (!byType[content.type]) {
                byType[content.type] = 0;
            }
            byType[content.type]++;
        });
        
        console.log('Content by type:', byType);
        
        // Show recent entries
        console.log('\nAll content entries:');
        allContents.forEach((content, index) => {
            console.log(`\nEntry ${index + 1}:`);
            console.log(`  ID: ${content._id}`);
            console.log(`  Type: "${content.type}"`);
            console.log(`  Title: "${content.title}"`);
            console.log(`  Has filePath: ${!!content.filePath}`);
            if (content.filePath) console.log(`  filePath: ${content.filePath}`);
            if (content.body) {
                const bodyPreview = content.body.length > 150 ? content.body.substring(0, 150) + '...' : content.body;
                console.log(`  Body preview: ${bodyPreview}`);
            }
            console.log(`  LessonId: ${content.lessonId}`);
        });
        
        // Look specifically for slide entries
        const slideContents = await Content.find({ type: 'slide' });
        console.log(`\nSlide-specific query found: ${slideContents.length} entries`);
        
    } catch (error) {
        console.error('Error checking content:', error);
    }
}

// Run the check
connectDB().then(() => {
    checkContent().then(() => {
        console.log('Check completed');
        process.exit(0);
    });
});