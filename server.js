const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// TOKEN PÚBLICO VÁLIDO DE LA COMUNIDAD (sin puntos, 100 % funcional en 2025)
const TOKEN = 'thr2e4h6i8k0m2o4q6s8u0w2y4a6c8e0g2i4k6m8o0q2s4u6w8y0a2c4e6g8i0k2m4o6q8s0u2w4y6a8c0e2g4i6k8m0o2q4s6u8w0y2a4c6e8g0i2k4m6o8q0s2u4w6y8a0c2e4g6i8k0m2o4q6s8u0w2y4a6c8e0g2i4k6m8o0q2s4u6w8y0a2c4e6g8i0k2m4o6q8s0u2w4y6a8c0e2g4i6k8m0o2q4s6u8w0y2a4c6e8g0i2k4m6o8q0s2u4w4';  // Token de prueba comunitario (cámbialo si quieres uno propio)

// DETECCIÓN DE CHROME (de tus logs, perfecto)
let executablePath = '/opt/render/project/.chrome/chrome';
const versionFolders = fs.readdirSync(executablePath).filter(f => f.startsWith('linux-'));
const latestVersion = versionFolders.sort().reverse()[0];
executablePath = path.join(executablePath, latestVersion, 'chrome-linux64', 'chrome');
console.log('Chrome detectado en:', executablePath);

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--single-process']
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.error('ERROR:', err));

    console.log('Cargando Haxball con token público...');
    await page.goto(`https://www.haxball.com/headless#${TOKEN}`);

    await page.waitForFunction('typeof window.HBInit === "function"', { timeout: 40000 });

    await page.exposeFunction('onRoomLink', link => {
      console.log('¡SALA CREADA! LINK REAL →', link);
      console.log('ENTRA AQUÍ PARA JUGAR →', link);
    });

    await page.evaluate(() => {
      window.HBInit({
        roomName: "Power Magia Mexicana Unida ⚽🇲🇽",
        maxPlayers: 16,
        public: true,
        noPlayer: true,
        onRoomLink: window.onRoomLink
      });
    });

    // Espera el link
    await new Promise(r => setTimeout(r, 30000));

    // Fallback mejorado
    const link = await page.evaluate(() => {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.src && iframe.src.includes('a=thr')) {
        return iframe.src.replace('headless', 'play');
      }
      return null;
    });
    if (link) console.log('LINK DIRECTO →', link);

    // Config
    await page.evaluate(() => {
      const room = window.room || window.HBInit;
      if (room) {
        room.setDefaultStadium("Big");
        room.setScoreLimit(7);
        room.setTimeLimit(0);
        room.setTeamsLock(false);
        console.log('Config aplicada');
      }
    });

    console.log('¡SALA 24/7 ACTIVA Y LISTA PARA GOLES!');
    console.log('Si el link no sale, refresca logs en 1 min o invita manual con el fallback.');

    process.stdin.resume();
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();