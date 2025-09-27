// /netlify/functions/watermark.js
// Node ESM
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚠️ CORRECCIÓN: Apunta a la carpeta raíz de tus propiedades dentro de 'images'
const PROPERTIES_ROOT_DIR = path.resolve(__dirname, '../../assets/images/properties');
const BRANDING_DIR = path.resolve(__dirname, '../../assets/branding');

// Sanitiza rutas: evita ../
function safeJoin(base, target) {
  const targetPath = path.resolve(base, target.replace(/^\/+/, ''));
  if (!targetPath.startsWith(base)) throw new Error('Path traversal');
  return targetPath;
}

function getQS(event) {
  // Soporta Netlify y fallback manual
  const qs = event?.queryStringParameters || {};
  if (Object.keys(qs).length) return qs;

  // fallback si pasaras rawQuery (no estándar)
  const raw = event?.rawQuery || '';
  const params = new URLSearchParams(raw);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

export async function handler(event, context) {
  try {
    const qs = getQS(event);
    const imgParam = (qs.img || '').trim();
    if (!imgParam) return { statusCode: 400, body: 'Missing ?img=path' };

    // filename opcional, por defecto usa el nombre del archivo
    const fallbackName = path.basename(imgParam).replace(/\.(png|jpe?g|webp|gif|tiff|avif)$/i, '') || 'imagen';
    const filename = (qs.filename || fallbackName).replace(/[^\w\-\.]+/g, '_');

    // 1) Lee imagen original (no pública)
    // ⚠️ CORRECCIÓN: Usando la nueva ruta PROPERTIES_ROOT_DIR
    const inputPath = safeJoin(PROPERTIES_ROOT_DIR, imgParam);
    const inputBuffer = await fs.readFile(inputPath);

    // 2) Lee logo (PNG con transparencia)
    const logoPath = safeJoin(BRANDING_DIR, 'natura-logo.png');
    const logoBuffer = await fs.readFile(logoPath);

    // 3) Medir base y preparar escalado del logo (≈18% del ancho, mínimo 180px)
    const base = sharp(inputBuffer);
    const meta = await base.metadata();
    const baseW = meta.width || 2000;
    const baseH = meta.height || 1500;

    const targetLogoWidth = Math.max(Math.round(baseW * 0.18), 180);
    const logoResizedBuf = await sharp(logoBuffer)
      .resize({ width: targetLogoWidth, withoutEnlargement: true })
      .toBuffer();

    const logoMeta = await sharp(logoResizedBuf).metadata();
    const logoW = logoMeta.width || targetLogoWidth;
    const logoH = logoMeta.height || Math.round(targetLogoWidth / 3);

    // 4) Calcular offsets para esquina inferior derecha con margen (24px)
    const MARGIN = 24;
    const left = Math.max(0, baseW - logoW - MARGIN);
    const top = Math.max(0, baseH - logoH - MARGIN);

    // 5) Componer (solo logo, sin hora)
    const watermarked = await base
      .composite([
        {
          input: logoResizedBuf,
          // gravity ignorado si defines top/left (usamos top/left directamente)
          left,
          top,
          blend: 'over',
          opacity: 0.85
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `inline; filename="${filename}-wm.jpg"`,
        // Opcional cache:
        // 'Cache-Control': 'public, max-age=31536000, immutable'
      },
      body: watermarked.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Error generando marca de agua' };
  }
}
