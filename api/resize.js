const sharp = require('sharp');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url, width, height, format = 'jpeg', quality = 95 } = req.query;

    // Validation
    if (!url) {
      return res.status(400).json({ error: 'url parameter is required' });
    }
    if (!width || !height) {
      return res.status(400).json({ error: 'width and height parameters are required' });
    }

    const targetWidth = parseInt(width);
    const targetHeight = parseInt(height);
    const qualityInt = parseInt(quality);

    console.log(`Resizing image to ${targetWidth}x${targetHeight}`);

    // Télécharger l'image source
    const imageResponse = await fetch(decodeURIComponent(url));
    
    if (!imageResponse.ok) {
      return res.status(400).json({ 
        error: `Failed to fetch source image: ${imageResponse.status}` 
      });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Resize avec Sharp
    let sharpInstance = sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: false,
      });

    // Format de sortie
    let contentType = 'image/jpeg';
    if (format === 'jpeg' || format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality: qualityInt });
      contentType = 'image/jpeg';
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png();
      contentType = 'image/png';
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: qualityInt });
      contentType = 'image/webp';
    }

    const resizedBuffer = await sharpInstance.toBuffer();

    // Envoyer la réponse
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', resizedBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    return res.status(200).send(resizedBuffer);

  } catch (error) {
    console.error('Resize error:', error);
    return res.status(500).json({ 
      error: 'Failed to resize image',
      details: error.message 
    });
  }
};
