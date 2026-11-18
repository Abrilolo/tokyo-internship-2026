# Fotos de la presentación (`presentation/photos/`)

La presentación ([`presentation/index.html`](../index.html)) detecta sola las fotos que guardes aquí con estos nombres. Lo que no exista se sustituye por un marcador.

## Portada (Halftone Reveal)
- `hero.jpg` (o `.png` / `.webp`) — imagen de portada, idealmente 3840×2160. Sin ella se usa la foto real del Fuji (`bg/base-hero.jpg`).

## Rueda de proyectos (portada de cada tarjeta, opcional)
- `cover-foundations.jpg`, `cover-suica.jpg`, `cover-ai.jpg`, `cover-launcher.jpg`
- `42-tokyo.jpg` — portada de Game Arena (también se usa dentro de su estación).
- `tokyo-2.jpg` — portada de "Life in Japan".

## Estación 02 · Game Arena
- `42-tokyo.jpg` — foto del evento en 42 Tokyo.
- `game-arena-ui.png` — captura real del menú de tres puntos / panel lateral.

## Cima · Drift Wall (muro de fotos a pantalla completa)
El muro muestra **solo** las fotos de `fotos-japan/` (hoy 175, incluidas las HEIC).

- `fotos-japan/` — tus originales. La página no los lee directamente (un navegador no puede listar una carpeta ni abrir HEIC).
- `wall/` — copias ligeras (máx. 1000 px, ≈18 MB en total) de cada foto de `fotos-japan/`, más `manifest.js` (la lista que lee la página) e `index.json` (qué copia corresponde a qué original). No edites esta carpeta a mano.
- **Para agregar o quitar fotos:** cambia lo que quieras en `fotos-japan/` y abre la presentación con [`Abrir presentacion.bat`](../Abrir%20presentacion.bat). Ese archivo ejecuta `photos/sync_wall.py`, que convierte las fotos nuevas, borra las copias de las que quitaste y luego abre `index.html`. Solo procesa lo que cambió, así que tarda un instante.
- Si abres `index.html` directamente (o desde GitLab), verás las fotos de la última sincronización.
- Requisitos del sincronizador: Python 3 (`py -3`) con Pillow y pillow-heif; si faltan, se instalan solos la primera vez.
- Los originales de `fotos-japan/` no hacen falta para que la página funcione; si pesan demasiado para GitLab, basta con subir `wall/`.
- Las teselas son verticales (5:6); las fotos horizontales se recortan por los lados. Al hacer clic se ve la foto completa.

## Fondos fotográficos (`bg/`)
Fotos reales de Wikimedia Commons, recortadas y separadas en capas (cielo / montaña / primer plano) para el efecto de profundidad. No cambies los nombres.

| Archivos | Escena | Autor | Licencia | Original |
|---|---|---|---|---|
| `temple.jpg`, `temple-room.webp` | Interior de templo, Arashiyama (Kioto) | lumoplank | CC0 | [Arashiyama, Part II - Arashiyama7542.jpg](https://commons.wikimedia.org/wiki/File:Arashiyama,_Part_II_-_Arashiyama7542.jpg) |
| `base-sky.jpg`, `base-fg.webp`, `base-hero.jpg` | Fuji al amanecer desde el lago Kawaguchi | Romain Guy | CC0 | [Sunrise with Mount Fuji - March 2025.jpg](https://commons.wikimedia.org/wiki/File:Sunrise_with_Mount_Fuji_-_March_2025.jpg) |
| `clouds-sky.jpg`, `clouds-mid.webp`, `clouds-near.webp` | Fuji sobre el mar de nubes | Alpsdake | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Mount Fuji over Sea of clouds.jpg](https://commons.wikimedia.org/wiki/File:Mount_Fuji_over_Sea_of_clouds.jpg) |
| `torii-sky.jpg`, `torii-fg.webp` | Torii de la cima antes del amanecer | U.S. Navy / Sheryl Sullivan | Dominio público | [CFAY MWR Hosts Mount Fuji Climb (9878965).jpg](https://commons.wikimedia.org/wiki/File:CFAY_MWR_Hosts_Mount_Fuji_Climb_(9878965).jpg) |
| `sunrise.jpg` | Amanecer desde la cima | Photos of Japan | CC0 | [Mt. Fuji sunrise Sep 2 502am.jpg](https://commons.wikimedia.org/wiki/File:Mt._Fuji_sunrise_Sep_2_502am.jpg) |

Cambios hechos a todas: reducción de tamaño, recorte en capas con transparencia y relleno del cielo detrás de la montaña; la del templo además está ligeramente desaturada y las siluetas del torii oscurecidas. La foto de Alpsdake exige atribución y que la versión modificada mantenga la misma licencia; el crédito aparece en la última pantalla de la presentación.
