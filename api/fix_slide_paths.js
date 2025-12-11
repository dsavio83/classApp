const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/class-content-browser');
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Define models
const Content = mongoose.model('Content', new mongoose.Schema({}, { strict: false }), 'contents');

async function fixSlidePaths() {
    try {
        console.log('Finding slide content entries...');
        
        // Find slide content entries
        const slideContents = await Content.find({ type: 'slide' });
        
        console.log(`Found ${slideContents.length} slide content entries`);
        
        for (const content of slideContents) {
            console.log(`\nProcessing content: ${content._id}`);
            console.log(`Title: ${content.title}`);
            console.log(`Body: ${content.body}`);
            
            // Check if it has a filePath
            if (content.filePath) {
                console.log(`Already has filePath: ${content.filePath}`);
                continue;
            }
            
            // Parse body as JSON to get metadata
            let metadata = {};
            try {
                if (content.body) {
                    // Handle escaped JSON in body
                    const cleanedBody = content.body.replace(/\\"/g, '"');
                    metadata = JSON.parse(cleanedBody);
                    console.log('Parsed metadata:', metadata);
                }
            } catch (parseError) {
                console.log('Could not parse body as JSON:', parseError.message);
                continue;
            }
            
            // Check if metadata has subCategory with file path
            if (metadata.subCategory && metadata.subCategory.includes('.pdf')) {
                // Extract relative path and construct absolute path
                const relativePath = metadata.subCategory;
                const absolutePath = path.join(__dirname, '../', relativePath.replace(/^\.\.\//, ''));
                
                console.log(`Looking for file at: ${absolutePath}`);
                
                if (fs.existsSync(absolutePath)) {
                    console.log(`File found! Updating content...`);
                    
                    // Update the content with the correct file path
                    await Content.findByIdAndUpdate(content._id, {
                        filePath: absolutePath,
                        originalFileName: path.basename(absolutePath),
                        fileSize: fs.statSync(absolutePath).size
                    });
                    
                    console.log(`✅ Updated content ${content._id} with filePath: ${absolutePath}`);
                } else {
                    console.log(`❌ File not found at: ${absolutePath}`);
                    
                    // Try to find PDF files in the uploads directory
                    const uploadsDir = path.join(__dirname, '../uploads');
                    const pdfFiles = [];
                    
                    function findPdfFiles(dir) {
                        if (!fs.existsSync(dir)) return;
                        
                        const items = fs.readdirSync(dir);
                        for (const item of items) {
                            const itemPath = path.join(dir, item);
                            const stat = fs.statSync(itemPath);
                            
                            if (stat.isDirectory()) {
                                findPdfFiles(itemPath);
                            } else if (item.toLowerCase().endsWith('.pdf')) {
                                pdfFiles.push(itemPath);
                            }
                        }
                    }
                    
                    findPdfFiles(uploadsDir);
                    
                    console.log(`Found ${pdfFiles.length} PDF files in uploads directory`);
                    pdfFiles.forEach(pdf => console.log(`  - ${pdf}`));
                    
                    if (pdfFiles.length > 0) {
                        // Use the first PDF file found
                        const selectedPdf = pdfFiles[0];
                        console.log(`Using PDF file: ${selectedPdf}`);
                        
                        await Content.findByIdAndUpdate(content._id, {
                            filePath: selectedPdf,
                            originalFileName: path.basename(selectedPdf),
                            fileSize: fs.statSync(selectedPdf).size
                        });
                        
                        console.log(`✅ Updated content ${content._id} with filePath: ${selectedPdf}`);
                    }
                }
            }
        }
        
        console.log('\n✅ Slide path fixing completed!');
        
    } catch (error) {
        console.error('Error fixing slide paths:', error);
    }
}

// Run the fix
connectDB().then(() => {
    fixSlidePaths().then(() => {
        console.log('Script completed');
        process.exit(0);
    });
});