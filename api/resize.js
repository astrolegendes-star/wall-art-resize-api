import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
};

export default async function handler(req, res) {
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

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

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
}
```

Cliquer **"Commit changes"**

---

## 📋 ÉTAPE 4 : Déployer sur Vercel (2 min)

### 4.1 Retourner sur Vercel
```
👉 https://vercel.com/dashboard
```

### 4.2 Cliquer "Add New..." → "Project"

### 4.3 Importer ton repository GitHub
- Tu verras la liste de tes repositories GitHub
- Trouve `wall-art-resize-api`
- Cliquer "Import"

### 4.4 Configuration du déploiement
- **Project Name** : `wall-art-resize-api` (ou ce que tu veux)
- **Framework Preset** : `Other`
- **Root Directory** : `.` (laisser par défaut)

### 4.5 Cliquer "Deploy"

⏳ **Attendre 1-2 minutes...**

### 4.6 C'EST DÉPLOYÉ ! 🎉

Tu verras un message "Congratulations!" avec ton URL :
```
https://wall-art-resize-api.vercel.app
```

---

## 📋 ÉTAPE 5 : Tester l'API (1 min)

### 5.1 Ouvrir cette URL dans ton navigateur :

Remplace `TON-PROJET` par ton nom de projet Vercel :
```
https://TON-PROJET.vercel.app/api/resize?url=https://picsum.photos/1000/1500&width=500&height=750
```

### 5.2 Si tu vois une image redimensionnée = ÇA MARCHE ! ✅

---

## 📋 ÉTAPE 6 : Configurer dans Supabase (1 min)

### 6.1 Aller dans Supabase
```
👉 https://supabase.com/dashboard
```

### 6.2 Sélectionner ton projet

### 6.3 Aller dans Settings → Edge Functions → Secrets

### 6.4 Ajouter un nouveau secret :
```
Name: RESIZE_API_URL
Value: https://TON-PROJET.vercel.app/api/resize
```

(Remplace `TON-PROJET` par ton vrai nom de projet)

### 6.5 Cliquer "Save"

✅ **Configuration terminée !**

---

## 📊 RÉCAP VISUEL
```
┌─────────────────────────────────────────────────────────────────┐
│                      CE QUE TU AS CRÉÉ                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GitHub Repository                                               │
│  └── wall-art-resize-api/                                       │
│      ├── package.json        (dépendances)                      │
│      ├── vercel.json         (config Vercel)                    │
│      └── api/                                                   │
│          └── resize.js       (le code qui resize)               │
│                                                                  │
│                    ↓ Déployé sur ↓                              │
│                                                                  │
│  Vercel                                                         │
│  └── https://ton-projet.vercel.app/api/resize                   │
│      └── ?url=xxx&width=500&height=750                          │
│                                                                  │
│                    ↓ Utilisé par ↓                              │
│                                                                  │
│  Supabase Edge Functions                                        │
│  └── process-design appelle l'API pour resize                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
