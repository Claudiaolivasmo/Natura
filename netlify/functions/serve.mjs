// netlify/functions/serve.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.join(process.cwd(), 'assets', 'images');

function sanitize(p) {
  // Normaliza y evita rutas tipo ../
  return path.posix.normalize(p).replace(/^(\.\.(\/|\\|$))+/g, '');
}

export async function handler(event) {
  try {
    const qs = new URLSearchParams(event.rawQuery || '');
    const imgParam = qs.get('img');                 // p.ej. properties/003-finca-agua-azul/foto1.jpg
    if (!imgParam) return { statusCode: 400, body: 'Missing ?img' };

    // Parámetros opcionales
    const w   = parseInt(qs.get('w') || '', 10) || null;     // ancho deseado
    const q   = Math.min(Math.max(parseInt(qs.get('q') || '82', 10), 40), 95); // calidad
    const fmt = (qs.get('fmt') || 'webp').toLowerCase();     // webp | jpg | jpeg

    const filePath = path.join(ROOT, sanitize(imgParam));
    const input = await fs.readFile(filePath);

    let image = sharp(input);
    if (w) image = image.resize({ width: w, withoutEnlargement: true });

    let contentType = 'image/webp';
    if (fmt === 'jpg' || fmt === 'jpeg') {
      image = image.jpeg({ quality: q });
      contentType = 'image/jpeg';
    } else {
      image = image.webp({ quality: q });
    }

    const out = await image.toBuffer();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        // cache agresivo para CDN/navegador
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      body: out.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 404, body: 'Not found' };
  }
}
