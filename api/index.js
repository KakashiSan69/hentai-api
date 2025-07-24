const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const serverless = require('serverless-http');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) throw new Error('Missing search query');

    const searchUrl = `https://hentaigasm.com/?s=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
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

    res.json({ status: true, results });
    
  } catch (error) {
    res.status(400).json({ 
      status: false,
      error: error.message 
    });
  }
});

app.get('/api/video', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) throw new Error('Missing video URL');

    const { data } = await axios.get(videoUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(data);
    const result = {
      title: $('h1.title').text().trim(),
      description: $('.entry-content p').first().text().trim(),
      tags: $('.tags a').map((i, el) => $(el).text().trim()).get(),
      embeddedVideo: $('iframe').attr('src') || null
    };

    res.json({ status: true, data: result });
    
  } catch (error) {
    res.status(400).json({ 
      status: false,
      error: error.message 
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
module.exports.handler = serverless(app);
