const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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

async function createSlideEntry() {
    try {
        console.log('Creating slide entry for existing PDF file...');
        
        // The lessonId from the terminal logs
        const lessonId = '6926687675b79202135152e4';
        
        // Path to the existing PDF file
        const pdfPath = path.join(__dirname, '../uploads/Class 8/tamilat/Unit1/Slides/compressedpdf.pdf');
        
        console.log(`PDF file path: ${pdfPath}`);
        console.log(`File exists: ${fs.existsSync(pdfPath)}`);
        
        if (!fs.existsSync(pdfPath)) {
            console.error('PDF file not found!');
            return;
        }
        
        const fileStats = fs.statSync(pdfPath);
        console.log(`File size: ${fileStats.size} bytes`);
        
        // Create slide content entry
        const slideContent = new Content({
            lessonId: new mongoose.Types.ObjectId(lessonId),
            type: 'slide',
            title: '1. அருவி வாழ்க!',
            body: '',
            filePath: pdfPath,
            originalFileName: 'compressedpdf.pdf',
            fileSize: fileStats.size,
            metadata: {
                category: 'Custom',
                subCategory: '../uploads/Class 8/tamilat/Unit1/Slides/compressedpdf.pdf',
                hierarchyPath: '../uploads/Class 8/tamilat/Unit1/Slides',
                className: 'Class 8',
                subjectName: 'tamilat',
                unitName: 'Unit1',
                resourceFolder: 'Slides',
                relativePath: 'uploads/Class 8/tamilat/Unit1/Slides/compressedpdf.pdf'
            }
        });
        
        await slideContent.save();
        
        console.log(`✅ Created slide content entry: ${slideContent._id}`);
        console.log(`Title: ${slideContent.title}`);
        console.log(`File path: ${slideContent.filePath}`);
        
        // Verify it was created
        const createdSlide = await Content.findById(slideContent._id);
        console.log(`\nVerification:`);
        console.log(`Found in database: ${!!createdSlide}`);
        console.log(`File still exists: ${fs.existsSync(createdSlide.filePath)}`);
        
    } catch (error) {
        console.error('Error creating slide entry:', error);
    }
}

// Run the function
connectDB().then(() => {
    createSlideEntry().then(() => {
        console.log('Script completed');
        process.exit(0);
    });
});