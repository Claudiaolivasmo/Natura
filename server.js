import express from "express";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const app = express();
const PORT = process.env.PORT || 3000;

// Ajusta a TU estructura real:
const IMAGES_DIR = path.join(process.cwd(), "assets", "images");      // <-- aquí
const BRAND_DIR  = path.join(process.cwd(), "assets", "branding");    // <-- logo watermark

app.get("/download", async (req, res) => {
  try {
    const { img, w = "0", q = "82", pos = "southeast", opacity = "70", filename } = req.query;
    if (!img) return res.status(400).send("Falta ?img=relative/path");

    // img debe ser **relativa a /assets/images**, ej:
    // img=properties/001-villa-el-manzano/1.jpeg
    const inputPath = path.join(IMAGES_DIR, img);
    const logoPath  = path.join(BRAND_DIR, "natura-logo.png"); // coloca tu logo aquí

    // Verificaciones y lectura
    const [inputBuf, logoBuf] = await Promise.all([
      fs.readFile(inputPath).catch(() => null),
      fs.readFile(logoPath).catch(() => null),
    ]);
    if (!inputBuf) return res.status(404).send("Imagen no encontrada en /assets/images/" + img);
    if (!logoBuf) return res.status(500).send("No se encontró el logo en /assets/branding/natura-logo.png");

    const W = parseInt(w, 10) || 0;
    const Q = Math.min(100, Math.max(40, parseInt(q, 10) || 82));
    const OP = Math.min(100, Math.max(0, parseInt(opacity, 10) || 70)) / 100;

    let pipeline = sharp(inputBuf).rotate();
    if (W > 0) pipeline = pipeline.resize({ width: W, withoutEnlargement: true });

    // Escalamos el logo al ~25% del ancho de salida
    const { width: outW = 1200 } = await pipeline.metadata();
    const logoScaled = await sharp(logoBuf)
      .ensureAlpha()
      .resize({ width: Math.round(outW * 0.25), withoutEnlargement: true })
      .toBuffer();

    const outBuf = await pipeline
        .composite([{ input: logoScaled, gravity: "center", opacity: OP }])
        .jpeg({ quality: Q })
        .toBuffer();


    const safeName = (filename || path.basename(img)).replace(/\.(jpe?g|png|webp)$/i, "");
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}-wm.jpg"`);
    res.send(outBuf);

  } catch (err) {
    console.error("WM ERROR:", err);
    res.status(500).send("Error generando la marca de agua (ver consola)");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
