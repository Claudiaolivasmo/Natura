import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const PROPERTIES_ROOT_DIR = path.join(ROOT, 'assets', 'images'); // admite img=properties/...
const BRANDING_DIR = path.join(ROOT, 'assets', 'branding');

function safeJoin(base, target) {
  const targetPath = path.resolve(base, target.replace(/^\/+/, ''));
  if (!targetPath.startsWith(base)) throw new Error('Path traversal');
  return targetPath;
}
function getQS(event) {
  const qs = event?.queryStringParameters || {};
  if (Object.keys(qs).length) return qs;
  const raw = event?.rawQuery || '';
  const params = new URLSearchParams(raw);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}
async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

export async function handler(event) {
  try {
    const qs = getQS(event);
    const imgParam = (qs.img || '').trim();
    const debug = (qs.debug || '') === '1';
    if (!imgParam) return { statusCode: 400, body: 'Missing ?img=path' };

    const inputPath = safeJoin(PROPERTIES_ROOT_DIR, imgParam);
    const logoPath  = path.join(BRANDING_DIR, 'natura_realestate_color_footer_600x200.png');

    // Diagnóstico claro
    const [imgOk, logoOk] = await Promise.all([exists(inputPath), exists(logoPath)]);
    if (debug) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ROOT, PROPERTIES_ROOT_DIR, BRANDING_DIR, imgParam, inputPath, imgOk, logoPath, logoOk }, null, 2)
      };
    }
    if (!imgOk) return { statusCode: 404, body: 'Imagen no encontrada: ' + inputPath };
    if (!logoOk) return { statusCode: 404, body: 'Logo no encontrado: ' + logoPath };

    const fallbackName = path.basename(imgParam).replace(/\.(png|jpe?g|webp|gif|tiff|avif)$/i, '') || 'imagen';
    const filename = (qs.filename || fallbackName).replace(/[^\w\-\.]+/g, '_');

    const inputBuffer = await fs.readFile(inputPath);
    const logoBuffer  = await fs.readFile(logoPath);

    const base = sharp(inputBuffer);
    const meta = await base.metadata();
    const baseW = meta.width || 2000;

    const targetLogoWidth = Math.max(Math.round(baseW * 0.40), 400);
    const logoResizedBuf = await sharp(logoBuffer)
      .resize({ width: targetLogoWidth, withoutEnlargement: true })
      .toBuffer();

    const watermarked = await base
      .composite([{ input: logoResizedBuf, gravity: 'center', blend: 'over', opacity: 0.85 }])
      .jpeg({ quality: 90 })
      .toBuffer();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `inline; filename="${filename}-wm.jpg"`
      },
      body: watermarked.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Error generando marca de agua: ' + e.message };
  }
}
