import express from "express";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const app = express();
const PORT = process.env.PORT || 3000;

// Obtener el directorio del script actual (necesario cuando usas 'import')
const __dirname = path.resolve(); // Forma moderna de obtener __dirname

// Ajusta a TU estructura real:
// Asumo que tienes una carpeta 'assets/images/properties'
const PROPERTIES_IMAGES_DIR = path.join(__dirname, "assets", "images", "properties");
const BRAND_DIR = path.join(__dirname, "assets", "branding");

// =======================================================
// 1. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS (HTML, CSS, JSON, JS)
// Esto permite que el navegador cargue todos tus archivos de frontend.
// =======================================================
app.use(express.static(__dirname)); 
// Nota: Si tus archivos frontend están en una subcarpeta (ej: 'public'), usa:
// app.use(express.static(path.join(__dirname, 'public')));


// =======================================================
// 2. ENDPOINT /watermark (La corrección del 404)
// =======================================================
app.get("/watermark", async (req, res) => { // <-- ¡Cambiado de /download a /watermark!
    try {
        const { img, w = "0", q = "82", opacity = "70", filename } = req.query;
        // La propiedad 'pos' (position) no está siendo usada, la quité para simplificar.
        
        if (!img) return res.status(400).send("Falta ?img=folder/filename.jpg");

        // ⚠️ La variable 'img' ahora debe ser 'folder/filename.jpg'
        // El frontend genera: img=${folder}/${filename}
        const inputPath = path.join(PROPERTIES_IMAGES_DIR, img); // <-- Usamos PROPERTIES_IMAGES_DIR
        const logoPath = path.join(BRAND_DIR, "natura-logo.png"); // verifica la ruta de tu logo

        // Verificaciones y lectura
        const [inputBuf, logoBuf] = await Promise.all([
            fs.readFile(inputPath).catch(() => null),
            fs.readFile(logoPath).catch(() => null),
        ]);
        
        if (!inputBuf) {
             // Esto significa que el archivo de imagen no está en assets/images/properties/{folder}/{filename}
             console.error("WM ERROR: Imagen NO encontrada en:", inputPath);
             return res.status(404).send("Imagen de propiedad no encontrada en el servidor.");
        }
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
            // Usamos 'center' como ejemplo; puedes cambiar a 'southeast', etc.
            .composite([{ input: logoScaled, gravity: "center", opacity: OP }])
            .jpeg({ quality: Q })
            .toBuffer();


        const safeName = (filename || path.basename(img)).replace(/\.(jpe?g|png|webp)$/i, "");
        // 🔑 MUY IMPORTANTE: Cambiamos Content-Disposition.
        // Quitamos 'attachment' para que el navegador MUESTRE la imagen, no la descargue.
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Content-Disposition", `inline; filename="${safeName}-wm.jpg"`); 
        res.send(outBuf);

    } catch (err) {
        console.error("WM ERROR:", err);
        res.status(500).send("Error generando la marca de agua (ver consola)");
    }
});

// =======================================================
// 3. INICIAR EL SERVIDOR
// =======================================================
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});