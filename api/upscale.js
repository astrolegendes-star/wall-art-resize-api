const sharp = require('sharp');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url, targetSize = 4096 } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'url parameter required' });
    }

    console.log('=== SHARP UPSCALE LANCZOS3 ===');
    console.log('Target size:', targetSize);

    // Télécharger l'image source
    const imageResponse = await fetch(decodeURIComponent(url));
    if (!imageResponse.ok) {
      return res.status(400).json({ error: `Failed to fetch: ${imageResponse.status}` });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Obtenir les dimensions originales
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;
    
    console.log(`Original: ${width}x${height}`);

    // Calculer les nouvelles dimensions (garder le ratio)
    const maxDimension = parseInt(targetSize);
    let newWidth, newHeight;
    
    if (width >= height) {
      // Paysage ou carré
      if (width >= maxDimension) {
        // Déjà assez grand
        newWidth = width;
        newHeight = height;
      } else {
        newWidth = maxDimension;
        newHeight = Math.round((height / width) * maxDimension);
      }
    } else {
      // Portrait
      if (height >= maxDimension) {
        // Déjà assez grand
        newWidth = width;
        newHeight = height;
      } else {
        newHeight = maxDimension;
        newWidth = Math.round((width / height) * maxDimension);
      }
    }

    const needsUpscale = newWidth !== width || newHeight !== height;
    
    console.log(`Target: ${newWidth}x${newHeight} (upscale needed: ${needsUpscale})`);

    let outputBuffer;
    
    if (needsUpscale) {
      // Upscale avec Lanczos3 (meilleur algorithme)
      outputBuffer = await sharp(imageBuffer)
        .resize(newWidth, newHeight, {
          kernel: 'lanczos3',
          fit: 'fill',
          withoutEnlargement: false,
        })
        .sharpen({
          sigma: 0.5,
          m1: 0.5,
          m2: 0.5,
        })
        .png({ quality: 100 })
        .toBuffer();
    } else {
      // Pas besoin d'upscale, juste convertir en PNG
      outputBuffer = await sharp(imageBuffer).png().toBuffer();
    }

    console.log(`Output: ${newWidth}x${newHeight} (${outputBuffer.length} bytes)`);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', outputBuffer.length);
    res.setHeader('X-Original-Width', width);
    res.setHeader('X-Original-Height', height);
    res.setHeader('X-New-Width', newWidth);
    res.setHeader('X-New-Height', newHeight);
    res.setHeader('X-Upscaled', needsUpscale ? 'true' : 'false');
    
    return res.status(200).send(outputBuffer);

  } catch (error) {
    console.error('Upscale error:', error);
    return res.status(500).json({ error: error.message });
  }
};
```

### 6️⃣ Clique "Commit changes" (bouton vert)

### 7️⃣ Attendre 30 secondes (Vercel redéploie automatiquement)

### 8️⃣ Tester l'API upscale :
```
https://wall-art-resize-api.vercel.app/api/upscale?url=https://picsum.photos/1000/1500&targetSize=4096
