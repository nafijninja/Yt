const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

function normalizeYouTubeURL(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.split('/')[1];
      return `https://www.youtube.com/watch?v=${id}`;
    }

    if (parsed.hostname === 'm.youtube.com') {
      parsed.hostname = 'www.youtube.com';
    }

    if (parsed.pathname.includes('/shorts/')) {
      const id = parsed.pathname.split('/shorts/')[1].split(/[/?&]/)[0];
      return `https://www.youtube.com/watch?v=${id}`;
    }

    return parsed.href;
  } catch (err) {
    return null;
  }
}

app.get('/api/info', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const normalizedUrl = normalizeYouTubeURL(url);
  if (!normalizedUrl || !ytdl.validateURL(normalizedUrl)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(normalizedUrl);
    const title = info.videoDetails.title;
    const videoId = info.videoDetails.videoId;
    const thumbnail = info.videoDetails.thumbnails.at(-1).url;

    res.json({
      title,
      thumbnail,
      videoId,
    });
  } catch (err) {
    console.error('Error fetching video info:', err);
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

app.get('/api/download', async (req, res) => {
  const { url, format } = req.query;
  const normalizedUrl = normalizeYouTubeURL(url);

  if (!normalizedUrl || !ytdl.validateURL(normalizedUrl)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(normalizedUrl);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

    const filter =
      format === 'audio' ? 'audioonly' : 'videoandaudio';

    res.header(
      'Content-Disposition',
      `attachment; filename="${title}.${format === 'audio' ? 'mp3' : 'mp4'}"`
    );

    ytdl(normalizedUrl, {
      filter,
      quality: 'highest',
    }).pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
