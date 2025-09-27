// netlify/functions/serve.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

function safeJoin(base, target) {
  const cleaned = String(target || '').replace(/^\/+/, '');
  const full = path.resolve(base, cleaned);
  if (!full.startsWith(base)) throw new Error('Path traversal');
  return full;
}

async function tryRead(filePath) {
  try { return await fs.readFile(filePath); } catch { return null; }
}

function getQS(event) {
  const qs = event?.queryStringParameters || {};
  const out = {};
  for (const k in qs) out[k.toLowerCase()] = qs[k];
  return out;
}

function pickContentType(fmt, fallbackExt) {
  const f = (fmt || fallbackExt || '').toLowerCase();
  if (f === 'webp') return 'image/webp';
  if (f === 'avif') return 'image/avif';
  if (f === 'png')  return 'image/png';
  if (f === 'jpg' || f === 'jpeg' || f === 'jpe') return 'image/jpeg';
  if (f === 'gif')  return 'image/gif';
  if (f === 'svg' || f === 'svgz') return 'image/svg+xml';
  return 'application/octet-stream';
}

export async function handler(event) {
  try {
    const qs = getQS(event);
    const imgParam = (qs.img || '').trim();
    if (!imgParam) return { statusCode: 400, body: 'Missing ?img=path' };

    // 🔧 Directorios resueltos desde la raíz del proyecto en runtime
    const ROOT = process.cwd();
    const ORIGINALS_DIR = path.join(ROOT, 'assets', 'originals');
    const IMAGES_DIR    = path.join(ROOT, 'assets', 'images');

    // Busca primero en originals y luego en images
    let absPath = safeJoin(ORIGINALS_DIR, imgParam);
    let buf = await tryRead(absPath);
    if (!buf) {
      absPath = safeJoin(IMAGES_DIR, imgParam);
      buf = await tryRead(absPath);
    }
    if (!buf) {
      return { statusCode: 404, body: 'Image not found' };
    }

    // Parámetros de transformación
    const width  = Number.parseInt(qs.w || qs.width);
    const height = Number.parseInt(qs.h || qs.height);
    const fit    = (qs.fit || 'inside').toLowerCase(); // cover|contain|fill|inside|outside
    const fmt    = (qs.fmt || qs.format || '').toLowerCase();
    const q      = Number.parseInt(qs.q || qs.quality || '82');
    const hasResize = Number.isFinite(width) || Number.isFinite(height);
    const ext = path.extname(absPath).slice(1).toLowerCase();

    // SVG sin transformación → devolver directo
    if ((ext === 'svg' || ext === 'svgz') && !fmt && !hasResize) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
        body: buf.toString('base64'),
        isBase64Encoded: true,
      };
    }

    let img = sharp(buf, { limitInputPixels: false });
    if (hasResize) {
      img = img.resize({
        width: Number.isFinite(width) ? width : null,
        height: Number.isFinite(height) ? height : null,
        fit: ['cover','contain','fill','inside','outside'].includes(fit) ? fit : 'inside',
        withoutEnlargement: true,
      });
    }

    let contentType = pickContentType(fmt, ext);
    if (fmt === 'webp')      img = img.webp({ quality: Number.isFinite(q) ? q : 82 });
    else if (fmt === 'avif') img = img.avif({ quality: Number.isFinite(q) ? q : 50 });
    else if (fmt === 'png')  img = img.png({ compressionLevel: 9 });
    else if (fmt === 'jpg' || fmt === 'jpeg') img = img.jpeg({ quality: Number.isFinite(q) ? q : 85 });
    else contentType = pickContentType(ext, ext); // mantiene formato original

    const out = await img.toBuffer();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': hasResize || fmt ? 'public, max-age=86400' : 'public, max-age=604800',
      },
      body: out.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('[serve] error:', err);
    return { statusCode: 500, body: 'Error serving image' };
  }
}
