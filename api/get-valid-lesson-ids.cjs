const mongoose = require('mongoose');
require('dotenv').config();

// Get all valid lesson IDs and their details
const getAllLessons = async () => {
    try {
        console.log('Getting all valid lessons from database...');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB Atlas');
        
        const { Lesson } = require('./models');
        const lessons = await Lesson.find({}).populate({
            path: 'subUnitId',
            populate: {
                path: 'unitId',
                populate: {
                    path: 'subjectId',
                    populate: {
                        path: 'classId'
                    }
                }
            }
        });
        
        console.log('\n=== ALL VALID LESSON IDs ===');
        lessons.forEach((lesson, index) => {
            const className = lesson.subUnitId?.unitId?.subjectId?.classId?.name || 'Unknown Class';
            const subjectName = lesson.subUnitId?.unitId?.subjectId?.name || 'Unknown Subject';
            const unitName = lesson.subUnitId?.unitId?.name || 'Unknown Unit';
            const subUnitName = lesson.subUnitId?.name || 'Unknown SubUnit';
            
            console.log(`${index + 1}. ID: ${lesson._id}`);
            console.log(`   Name: ${lesson.name}`);
            console.log(`   Hierarchy: ${className} > ${subjectName} > ${unitName} > ${subUnitName}`);
            console.log(`   Valid for upload: YES`);
            console.log('');
        });
        
        // Save lesson IDs to a file for frontend to use
        const validLessonIds = lessons.map(lesson => ({
            id: lesson._id.toString(),
            name: lesson.name,
            hierarchy: `${lesson.subUnitId?.unitId?.subjectId?.classId?.name || 'Unknown Class'} > ${lesson.subUnitId?.unitId?.subjectId?.name || 'Unknown Subject'} > ${lesson.subUnitId?.unitId?.name || 'Unknown Unit'} > ${lesson.subUnitId?.name || 'Unknown SubUnit'}`
        }));
        
        require('fs').writeFileSync('./valid-lesson-ids.json', JSON.stringify(validLessonIds, null, 2));
        console.log('✓ Saved valid lesson IDs to valid-lesson-ids.json');
        
        await mongoose.disconnect();
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

getAllLessons();