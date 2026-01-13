const sharp = require('sharp');
const https = require('https');
const http = require('http');

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadImage(response.headers.location).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        reject(new Error('Failed to fetch: ' + response.statusCode));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = req.query.url;
    const targetSize = parseInt(req.query.targetSize) || 4096;

    if (!url) {
      return res.status(400).json({ error: 'url parameter required' });
    }

    const decodedUrl = decodeURIComponent(url);
    const imageBuffer = await downloadImage(decodedUrl);
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width;
    const height = metadata.height;

    var newWidth, newHeight;
    
    if (width >= height) {
      if (width >= targetSize) {
        newWidth = width;
        newHeight = height;
      } else {
        newWidth = targetSize;
        newHeight = Math.round((height / width) * targetSize);
      }
    } else {
      if (height >= targetSize) {
        newWidth = width;
        newHeight = height;
      } else {
        newHeight = targetSize;
        newWidth = Math.round((width / height) * targetSize);
      }
    }

    var needsUpscale = (newWidth !== width || newHeight !== height);
    var outputBuffer;
    
    if (needsUpscale) {
      outputBuffer = await sharp(imageBuffer)
        .resize(newWidth, newHeight, {
          kernel: 'lanczos3',
          fit: 'fill',
          withoutEnlargement: false
        })
        .sharpen({ sigma: 0.5 })
        .png()
        .toBuffer();
    } else {
      outputBuffer = await sharp(imageBuffer).png().toBuffer();
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', outputBuffer.length);
    res.setHeader('X-Original-Width', String(width));
    res.setHeader('X-Original-Height', String(height));
    res.setHeader('X-New-Width', String(newWidth));
    res.setHeader('X-New-Height', String(newHeight));
    res.setHeader('X-Upscaled', needsUpscale ? 'true' : 'false');
    
    return res.status(200).send(outputBuffer);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
```
https://wall-art-resize-api.vercel.app/api/upscale?url=https://picsum.photos/1000/1500&targetSize=4096
