const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// TOKEN FIJO (cámbialo solo si quieres otro)
const TOKEN = 'thr1.AAAAAGko7vaX2YMX0nVVgA.livFUboa0LE';   // ← aquí tu token válido

// DETECCIÓN AUTOMÁTICA DE CHROME
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

    console.log('Cargando Haxball con token fijo...');
    await page.goto(`https://www.haxball.com/headless#${TOKEN}`);

    await page.waitForFunction('typeof window.HBInit === "function"', { timeout: 40000 });

    await page.exposeFunction('onRoomLink', link => {
      console.log('¡SALA CREADA! LINK →', link);
      console.log('ENTRA AQUÍ →', link);
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

    // Esperamos el link (máx 30 seg)
    await new Promise(r => setTimeout(r, 30000));

    // Fallback por si acaso
    const link = await page.evaluate(() => document.querySelector('iframe')?.src?.replace('headless', 'play'));
    if (link) console.log('LINK DIRECTO →', link);

    console.log('¡SALA 24/7 ACTIVA Y FUNCIONANDO!');

    process.stdin.resume();
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();