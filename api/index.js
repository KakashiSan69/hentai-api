const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const serverless = require('serverless-http'); // For Vercel compatibility

const app = express();

// Search endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing search query (q)' });

  try {
    const url = `https://hentaigasm.com/?s=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const $ = cheerio.load(data);

    const results = [];
    $('.item-post').each((i, el) => {
      results.push({
        title: $(el).find('h2.title a').text().trim(),
        link: $(el).find('h2.title a').attr('href'),
        thumbnail: $(el).find('.thumb img').attr('src'),
        description: $(el).find('.desc').text().trim(),
        views: $(el).find('.stats .views .count').text().trim(),
        likes: $(el).find('.likes .count').text().trim(),
        posted: $(el).find('.meta .time').text().trim()
      });
    });

    res.json({ status: true, total: results.length, results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data', details: err.message });
  }
});

// Video details endpoint
app.get('/api/video', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing video URL (url)' });

  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const $ = cheerio.load(data);

    const title = $('h1.title').text().trim();
    const description = $('.entry-content p').first().text().trim();
    const tags = $('.tags a').map((i, el) => $(el).text().trim()).get();
    const downloadLinks = $('.download-links a').map((i, el) => ({
      quality: $(el).text().trim(),
      link: $(el).attr('href')
    })).get();
    const embeddedVideo = $('iframe').attr('src') || null;
    const pinkButtonLinks = $('.btn.btn-pink').map((i, el) => ({
      title: $(el).attr('href').split('/').pop().split('.')[0],
      url: $(el).attr('href')
    })).get();

    res.json({
      status: true,
      data: { title, description, tags, downloadLinks, embeddedVideo, pinkButtonLinks }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video data', details: err.message });
  }
});

// Export for Vercel
module.exports.handler = serverless(app);
