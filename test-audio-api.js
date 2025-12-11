// Test script to check audio content in database
import fetch from 'node-fetch';

async function testAudioAPI() {
    try {
        // Test getting audio content
        console.log('Testing audio content API...');
        const response = await fetch('http://localhost:5000/api/content?type=audio');
        const audioContent = await response.json();
        
        console.log('Audio content found:', audioContent.length);
        if (audioContent.length > 0) {
            console.log('Audio content details:');
            audioContent.forEach(group => {
                console.log(`- Type: ${group.type}, Count: ${group.count}`);
                group.docs.forEach(doc => {
                    console.log(`  * ID: ${doc._id}, Title: ${doc.title}, FilePath: ${doc.filePath || 'No file path'}`);
                });
            });
        }
        
        // Test if any specific file path is working
        if (audioContent.length > 0 && audioContent[0].docs.length > 0) {
            const firstAudio = audioContent[0].docs[0];
            console.log(`\nTesting file serving for: ${firstAudio._id}`);
            const fileResponse = await fetch(`http://localhost:5000/api/content/${firstAudio._id}/file`);
            console.log(`File response status: ${fileResponse.status}`);
            if (!fileResponse.ok) {
                const errorText = await fileResponse.text();
                console.log('Error response:', errorText);
            }
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAudioAPI();