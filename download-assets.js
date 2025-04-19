const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function downloadFile(url, outputPath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(outputPath);
    
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error downloading ${url}:`, error.message);
    throw error;
  }
}

async function main() {
  // Create directories if they don't exist
  const imageDir = path.join(__dirname, 'public', 'images');
  const audioDir = path.join(__dirname, 'public', 'audio');
  
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }
  
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // Monkey image URL (replace with an actual URL for the same image)
  const monkeyImageUrl = 'https://i.kym-cdn.com/photos/images/newsfeed/002/435/635/174.jpg';
  const monkeyImagePath = path.join(imageDir, 'loading-monkey.jpg');
  
  // Rick Roll audio URL
  const rickRollUrl = 'https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptitle=Never+Gonna+Give+You+Up-+Original&filename=mz/Mzg1ODMxNTIzMzg1ODM3_JzthsfvUY24.MP3';
  const rickRollPath = path.join(audioDir, 'rickroll.mp3');

  try {
    console.log('Downloading monkey image...');
    await downloadFile(monkeyImageUrl, monkeyImagePath);
    console.log('Monkey image downloaded successfully!');
    
    console.log('Downloading Rick Roll audio...');
    await downloadFile(rickRollUrl, rickRollPath);
    console.log('Rick Roll audio downloaded successfully!');
    
    console.log('All assets downloaded successfully!');
  } catch (error) {
    console.error('Failed to download assets:', error);
  }
}

main(); 