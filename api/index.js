const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 5000;

// Search endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing search query (parameter: q)' });

  try {
    const url = `https://hentaigasm.com/?s=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0'
      }
    });
    const $ = cheerio.load(data);

    const results = [];

    $('.item-post').each((i, el) => {
      const title = $(el).find('h2.title a').text().trim();
      const link = $(el).find('h2.title a').attr('href');
      const thumbnail = $(el).find('.thumb img').attr('src');
      const description = $(el).find('.desc').text().trim();
      const views = $(el).find('.stats .views .count').text().trim();
      const likes = $(el).find('.likes .count').text().trim();
      const posted = $(el).find('.meta .time').text().trim();

      results.push({
        title,
        link,
        thumbnail,
        description,
        views,
        likes,
        posted
      });
    });

    res.json({ 
      status: true, 
      total: results.length, 
      results 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      status: false,
      error: 'Failed to fetch search results',
      message: err.message 
    });
  }
});

// Video details endpoint
app.get('/api/video', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ 
    status: false,
    error: 'Missing video URL (parameter: url)' 
  });

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0'
      }
    });
    const $ = cheerio.load(data);

    // Extract video details
    const title = $('h1.title').text().trim();
    const description = $('.entry-content p').first().text().trim();
    const tags = [];
    $('.tags a').each((i, el) => {
      tags.push($(el).text().trim());
    });

    // Extract download links
    const downloadLinks = [];
    $('.download-links a').each((i, el) => {
      const quality = $(el).text().trim();
      const link = $(el).attr('href');
      downloadLinks.push({ quality, link });
    });

    // Extract embedded video if available
    const embeddedVideo = $('iframe').attr('src') || null;

    // Extract pink button links
    const pinkButtonLinks = [];
    $('.btn.btn-pink').each((i, el) => {
      const $button = $(el);
      pinkButtonLinks.push({
        title: $button.attr('href').split('/').pop().split('.')[0],
        url: $button.attr('href') || null,
      });
    });

    res.json({
      status: true,
      data: {
        title,
        description,
        tags,
        downloadLinks,
        embeddedVideo,
        pinkButtonLinks
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      status: false,
      error: 'Failed to fetch video data',
      message: err.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
