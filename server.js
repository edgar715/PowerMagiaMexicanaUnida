const puppeteer = require('puppeteer');

const fs = require('fs');
const path = require('path');
const chromeDir = '/tmp/chrome/chrome';
let executablePath = process.env.CHROME_EXECUTABLE_PATH;
if (!executablePath) {
  const versions = fs.readdirSync(chromeDir).filter(dir => dir.startsWith('linux-'));
  if (versions.length > 0) {
    const versionDir = versions[0];  // Toma la primera (la más reciente)
    executablePath = path.join(chromeDir, versionDir, 'chrome-linux64', 'chrome');
  } else {
    throw new Error('No Chrome version found in /tmp/chrome/chrome');
  }
}
console.log('Chrome path detectado:', executablePath);

// ← RUTA EXACTA de tus logs (cambia si la versión de Chrome varía en futuro deploys)
const executablePath = process.env.CHROME_EXECUTABLE_PATH || '/tmp/chrome/chrome/linux-131.0.6778.204/chrome-linux64/chrome';

(async () => {
  try {
    console.log('Iniciando navegador con Chrome en:', executablePath);

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-first-run',
        '--single-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      timeout: 90000
    });

    const page = await browser.newPage();

    // Debug del navegador
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err));

    // TOKEN desde variables de entorno (OBLIGATORIO)
    const token = process.env.TOKEN?.trim();
    if (!token) {
      console.error('ERROR: No hay TOKEN. Agrégalo en Environment Variables de Render');
      process.exit(1);
    }

    console.log('Cargando Haxball headless...');
    await page.goto(`https://www.haxball.com/headless#${token}`);

    // Espera a que cargue HBInit
    await page.waitForFunction('typeof window.HBInit === "function"', { timeout: 40000 });

    // Funciones que el navegador llama desde Node.js
    await page.exposeFunction('log', (...args) => console.log('ROOM:', ...args));
    await page.exposeFunction('onRoomLink', (link) => {
      console.log('¡SALA CREADA! Enlace para entrar:', link);
      console.log('Comparte este link →', link);
    });
    await page.exposeFunction('onPlayerJoin', (player) => {
      console.log(`${player.name} se unió (ID: ${player.id})`);
    });
    await page.exposeFunction('onPlayerLeave', (player) => {
      console.log(`${player.name} salió de la sala`);
    });
    await page.exposeFunction('onPlayerChat', (player, msg) => {
      console.log(`[${player.name}]: ${msg}`);
    });

    // CREAR LA SALA
    await page.evaluate(() => {
      const room = window.HBInit({
        roomName: "Power Magia Mexicana Unida",
        maxPlayers: 16,
        public: true,
        noPlayer: true,
        // password: "1234",        // ← descomenta y cambia si quieres contraseña
        token: null,                 // ya viene en la URL
      });

      room.onRoomLink = window.onRoomLink;
      room.onPlayerJoin = window.onPlayerJoin;
      room.onPlayerLeave = window.onPlayerLeave;
      room.onPlayerChat = window.onPlayerChat;

      // Configuración del partido
      room.setDefaultStadium("Big");
      room.setScoreLimit(7);
      room.setTimeLimit(0);           // infinito
      room.setTeamsLock(false);

      window.log('¡Sala 100% configurada y activa!');
    });

    console.log('Servidor Haxball 24/7 activo y funcionando correctamente');
    console.log('La sala aparecerá en el lobby público en unos segundos...');

    // Mantiene el proceso vivo
    process.stdin.resume();

  } catch (err) {
    console.error('ERROR CRÍTICO:', err);
    process.exit(1);
  }
})();