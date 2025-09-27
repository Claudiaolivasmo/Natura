import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export async function handler(event, context) {
  try {
    const params = new URLSearchParams(event.rawQuery || '');
    const img = params.get('img');
    const filename = params.get('filename') || img;

    if (!img) return { statusCode: 400, body: 'Missing ?img=path' };

    // 1) Leer imagen original (no pública)
    const inputPath = path.join(process.cwd(), 'assets', 'originals', img);
    const inputBuffer = await fs.readFile(inputPath);

    // 2) Leer logo de Natura (PNG con transparencia)
    const logoPath = path.join(process.cwd(), 'assets', 'branding', 'natura-logo.png');
    const logoBuffer = await fs.readFile(logoPath);

    // 3) Medir la imagen para escalar el logo de forma proporcional
    const base = sharp(inputBuffer);
    const meta = await base.metadata();

    // Ancho del logo ≈ 18% del ancho de la foto (ajústalo a gusto)
    const targetLogoWidth = Math.max( Math.round((meta.width || 2000) * 0.18), 180 );
    const logoResized = await sharp(logoBuffer)
      .resize({ width: targetLogoWidth, withoutEnlargement: true })
      .toBuffer();

    // 4) Componer: colocar logo en esquina inferior derecha con un poco de margen
    //    Puedes ajustar opacity para que sea más/menos visible (0–1)
    const watermarked = await base
      .composite([
        {
          input: logoResized,
          gravity: 'southeast', // esquina inferior derecha
          left: 24,             // margen desde el borde derecho
          top: 24,              // margen desde el borde inferior
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
        'Content-Disposition': `attachment; filename="${filename.replace(/\.(png|jpg|jpeg|webp|gif)$/i,'')}-wm.jpg"`
      },
      body: watermarked.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Error generando marca de agua' };
  }
}
