const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files (index.html and other static assets)
app.use(express.static('public'));

// API route to fetch video info (title, size, thumbnail)
app.get('/api/info', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.json({ error: 'No URL provided' });
    }

    try {
        const info = await ytdl.getInfo(url);
        const videoDetails = {
            title: info.videoDetails.title,
            size: (info.formats[0].contentLength / 1024 / 1024).toFixed(2), // Size in MB
            thumbnail: info.videoDetails.thumbnails[0].url,
            mp4Url: info.formats.find(format => format.container === 'mp4' && format.qualityLabel).url, // URL for MP4
            mp3Url: info.formats.find(format => format.container === 'mp4' && format.audioEncoding).url // URL for MP3 (audio-only stream)
        };

        res.json(videoDetails);
    } catch (err) {
        console.error(err);
        res.json({ error: 'Failed to fetch video details' });
    }
});

// API route to handle downloading the video (MP4)
app.get('/download/mp4', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).send('URL is required');
    }

    try {
        const info = await ytdl.getInfo(videoUrl);
        const mp4Url = info.formats.find(format => format.container === 'mp4' && format.qualityLabel);
        
        if (!mp4Url) {
            return res.status(404).send('MP4 format not available');
        }

        res.header('Content-Disposition', 'attachment; filename="video.mp4"');
        ytdl(videoUrl, { format: mp4Url }).pipe(res);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error downloading video');
    }
});

// API route to handle downloading the audio (MP3)
app.get('/download/mp3', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).send('URL is required');
    }

    try {
        const info = await ytdl.getInfo(videoUrl);
        const mp3Url = info.formats.find(format => format.container === 'mp4' && format.audioEncoding);

        if (!mp3Url) {
            return res.status(404).send('MP3 format not available');
        }

        res.header('Content-Disposition', 'attachment; filename="audio.mp3"');
        ytdl(videoUrl, { format: mp3Url }).pipe(res);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error downloading audio');
    }
});

// Home route (serves the index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
