# Loading Screen Setup Instructions

## Required Assets
To complete the setup of your custom loading screen, you need to download these two files:

1. **Monkey Image**: Download the image from the following URL and save it as `public/images/loading-monkey.jpg`:
   - Image URL: https://i.kym-cdn.com/photos/images/newsfeed/002/435/635/174.jpg

2. **Rick Roll Audio**: Download the Rick Roll song from one of these URLs and save it as `public/audio/rickroll.mp3`:
   - Option 1: https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptitle=Never+Gonna+Give+You+Up-+Original&filename=mz/Mzg1ODMxNTIzMzg1ODM3_JzthsfvUY24.MP3
   - Option 2: Find the song on YouTube and use an MP3 converter to download it

## Manual Download Instructions

### For the Monkey Image:
1. Open the URL in your browser
2. Right-click on the image and select "Save Image As"
3. Navigate to your project's `public/images` folder
4. Save the file as `loading-monkey.jpg`

### For the Rick Roll Audio:
1. Click on the audio URL
2. When the download dialog appears, save the file to your project's `public/audio` folder
3. Rename the file to `rickroll.mp3` if necessary

## Testing
Once you've downloaded both files, test your application by:
1. Starting your server (`npm start` or `npm run dev`)
2. Opening your browser to your application
3. Submitting a fault code for analysis

The custom loading screen should appear with the monkey image pulsing and the Rick Roll song playing in the background while the analysis is being performed. 