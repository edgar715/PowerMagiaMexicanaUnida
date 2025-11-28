const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// DETECCIÓN AUTOMÁTICA DE CHROME (funciona siempre)
let executablePath = process.env.CHROME_EXECUTABLE_PATH;
if (!executablePath) {
  const chromeBaseDir = '/opt/render/project/.chrome/chrome';
  const versionFolders = fs.readdirSync(chromeBaseDir).filter(f => f.startsWith('linux-'));
  const latestVersion = versionFolders.sort().reverse()[0];
  executablePath = path.join(chromeBaseDir, latestVersion, 'chrome-linux64', 'chrome');
  console.log('Chrome detectado en:', executablePath);
}

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--single-process'
      ]
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.error('ERROR BROWSER:', err));

    const token = process.env.TOKEN?.trim();
    if (!token) {
      console.error('FALTA TOKEN → Render > Environment > KEY: TOKEN');
      process.exit(1);
    }

    console.log('Cargando Haxball...');
    await page.goto(`https://www.haxball.com/headless#${token}`);

    await page.waitForFunction('typeof window.HBInit === "function"', { timeout: 40000 });

    // Exponer funciones ANTES de crear la sala
    await page.exposeFunction('onRoomLink', link => {
      console.log('¡SALA CREADA! LINK →', link);
      console.log('Comparte este link:', link);
    });

    await page.exposeFunction('log', (...args) => console.log('ROOM:', ...args));
    await page.exposeFunction('onPlayerJoin', p => console.log('ENTRÓ:', p.name));
    await page.exposeFunction('onPlayerLeave', p => console.log('SALIÓ:', p.name));
    await page.exposeFunction('onPlayerChat', (p, m) => console.log(p.name + ': ' + m));

    // CREAR LA SALA
    await page.evaluate(() => {
      window.HBInit({
        roomName: "Power Magia Mexicana Unida",
        maxPlayers: 16,
        public: true,
        noPlayer: true,
        onRoomLink: window.onRoomLink
      });
    });

    console.log('Sala creada, esperando link... (máx 30 segundos)');
    // ← FIX: reemplazamos waitForTimeout por esto
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Fallback: si no disparó onRoomLink, extraemos el link del iframe
    const fallbackLink = await page.evaluate(() => {
      const iframe = document.querySelector('iframe');
      return iframe?.src ? iframe.src.replace('headless', 'play') : null;
    });

    if (fallbackLink) {
      console.log('FALLBACK LINK →', fallbackLink);
      console.log('Comparte este link →', fallbackLink);
    }

    // Configuraciones finales
    await page.evaluate(() => {
      const room = window.room || window.lastRoom;
      if (room) {
        room.setDefaultStadium("Big");
        room.setScoreLimit(7);
        room.setTimeLimit(0);
        room.setTeamsLock(false);
      }
    });

    console.log('¡POWER MAGIA MEXICANA UNIDA 24/7 ACTIVA!');
    console.log('Si no ves el link arriba, espera 2-3 minutos más o genera un token nuevo.');

    process.stdin.resume(); // mantiene vivo

  } catch (err) {
    console.error('ERROR FATAL:', err);
    process.exit(1);
  }
})();