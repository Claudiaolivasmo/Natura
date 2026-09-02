# Natura — diseño unificado

## Qué cambió

- Inicio, propiedades en venta, alquileres y propiedades relacionadas usan un único componente de tarjetas.
- Fotografías de tarjetas con proporción 4:3, mismo recorte, esquinas y tratamiento; información sobre fondo verde profundo, acentos dorados y títulos Cormorant Garamond.
- Iconos Font Awesome compartidos: habitaciones, baños, huéspedes, terreno y construcción. Los datos desconocidos no se muestran. Las fotografías de galerías conservan su función de ampliación.
- Botones, tipografía Lato, colores, bordes, formularios, encabezado y pie de página consistentes en las 17 páginas ES/EN.
- Las fichas de venta también muestran una fila de características con iconos. Amenidades y características comparten criterios de iconografía.
- El menú, los botones de idioma y las tarjetas conservan sus enlaces. Se preservan galerías, formularios, WhatsApp, newsletter, ordenamiento y paginación de ventas.
- La cifra de propiedades activas en inicio se calcula a partir del catálogo de venta; ya no muestra un número fijo.
- Las animaciones respetan movimiento reducido. El contenido no queda oculto si JavaScript no está disponible.

## Loft en venta

La Perla Loft fue eliminado de ambos catálogos vacacionales y añadido a ambos catálogos de venta con ID 11, precio ₡68.000.000 y ubicación Condominio Perla II, La Perla, La Fortuna. Incluye piscina compartida, rancho y parque infantil.

Los campos lotSize y builtSize permanecen en null hasta confirmar las superficies. No se publicó un precio convertido a dólares ni se afirmó que el mobiliario esté incluido en la venta.

Se conservaron las rutas de fotos existentes para no exigir mover imágenes en el alojamiento. Que estén dentro de una carpeta llamada vacation-rentals no hace que la propiedad aparezca como alquiler.

## Limpieza aplicada

- Eliminados CSS duplicados de tarjetas y botones; los componentes compartidos viven en css/components.css y js/listings.js.
- Retirados filtros, mapa y vista de lista que estaban comentados o carecían de controles visibles. No estaban activos en la versión recibida.
- Eliminados js/map.js, js/utils.js, css/animation.css y css/properties.css, sustituidos por código compartido o sin llamadas activas.
- Simplificados home.js y properties.js; retirados efectos de hover implementados en JavaScript, movimientos al enfocar formularios, atenuación de toda la página y traducciones que ningún script aplicaba.
- Se conserva Tailwind porque las páginas existentes aún usan sus clases de layout. También se conserva js/server.js: puede formar parte del alojamiento y no es seguro considerarlo obsoleto solo porque ningún HTML lo carga.
- Los HTML/CSS/JS del sitio se redujeron aproximadamente un 22 % respecto a la versión corregida anterior, antes de contar estas notas y las pruebas.

## Datos pendientes de confirmar

No se resolvieron automáticamente las siguientes diferencias comerciales heredadas:

| Propiedad | Español | Inglés |
| --- | --- | --- |
| El Tanque | Lote 300 m² y construcción 60 m² | Lote 500 m² y construcción 50 m² |
| Sanchal | 753 m², no negociable | 1.000 m², negociable |
| Lotes La Perla | Tres lotes | Dos lotes |

También difieren algunas coordenadas, carpetas y rutas de fotografías entre los catálogos de venta. San Isidro contiene “10ha” en el slug, aunque lotSize es 10.000 m². Confirmar esos datos antes de publicarlos como definitivos.

El ordenamiento por precio conserva la comparación interna en USD del sitio: usa price cuando existe y, cuando solo hay colones, la referencia heredada de 525 CRC/USD. Esta referencia no es una cotización actual y no altera los precios publicados. Los precios visibles siguen la moneda y el importe guardados en el JSON.

## Verificación y límites

Comprobados: sintaxis de los 13 JavaScript del sitio y scripts inline, JSON, 17 HTML, enlaces locales de páginas/scripts/estilos, atributos e identificadores, dependencias de formularios, consistencia de menús y equivalencias de idioma.

Las pruebas automatizadas de tests/catalogs.cjs usan DOM simulado y comprueban ambos idiomas, 10 ventas y 2 alquileres, clasificación/precio del loft, iconos por tipo de datos, datos ausentes, texto seguro, selección de destacados, ordenamiento/paginación, propiedades relacionadas y errores de carga. Ejecutar con Node: node tests/catalogs.cjs.

No se realizó una revisión visual en navegador. El ZIP original no incluye fotografías de propiedades ni los recursos de /img: quedan pendientes comprobar el recorte real y la carga de imágenes, fuentes e iconos externos. No se enviaron formularios ni se verificó la entrega por Formspree o los servicios externos. No se publicó el sitio.

La Perla conserva dos nombres de carpeta en sus fotos: loft-la-perla para la primera y la-perla-loft para las restantes. Confirmar con las carpetas reales antes de unificarlas.

## Aplicar esta versión

1. Conservar una copia de la versión actual.
2. Copiar el contenido de natura-website-profesional a la raíz del sitio, conservando las fotografías y la configuración del alojamiento.
3. Retirar del alojamiento los cuatro archivos eliminados indicados arriba si todavía existen. No borrar las carpetas de imágenes.
4. Confirmar los datos comerciales pendientes y probar con fotos reales en computadora y celular antes de publicar.

El sitio necesita HTTP/HTTPS desde la raíz del dominio; no abrir los HTML con doble clic mediante file://. Las rutas /img y /download dependen del alojamiento original.
