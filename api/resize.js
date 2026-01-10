const sharp = require('sharp');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { 
      url, 
      width, 
      height, 
      format = 'jpeg', 
      quality = 95,
      // NOUVEAUX PARAMÈTRES POUR LE CROP
      crop_x,
      crop_y,
      crop_width,
      crop_height,
      info
    } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'url parameter is required' });
    }

    // Télécharger l'image
    const imageResponse = await fetch(decodeURIComponent(url));
    if (!imageResponse.ok) {
      return res.status(400).json({ error: `Failed to fetch: ${imageResponse.status}` });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Si on demande juste les infos (dimensions)
    if (info === 'true') {
      const metadata = await sharp(imageBuffer).metadata();
      return res.status(200).json({
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      });
    }

    let sharpInstance = sharp(imageBuffer);

    // ÉTAPE 1: CROP si demandé (pour découper les panneaux)
    if (crop_x !== undefined && crop_y !== undefined && crop_width && crop_height) {
      sharpInstance = sharpInstance.extract({
        left: parseInt(crop_x),
        top: parseInt(crop_y),
        width: parseInt(crop_width),
        height: parseInt(crop_height),
      });
    }

    // ÉTAPE 2: RESIZE si demandé
    if (width && height) {
      sharpInstance = sharpInstance.resize(parseInt(width), parseInt(height), {
        fit: 'cover',
        position: 'center',
      });
    }

    // ÉTAPE 3: FORMAT de sortie
    if (format === 'jpeg' || format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality) });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png();
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: parseInt(quality) });
    }

    const outputBuffer = await sharpInstance.toBuffer();

    res.setHeader('Content-Type', `image/${format === 'jpg' ? 'jpeg' : format}`);
    res.setHeader('Content-Length', outputBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    return res.status(200).send(outputBuffer);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
