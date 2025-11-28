const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// DETECCIÓN AUTOMÁTICA DE CHROME (de tus logs, funciona)
let executablePath = process.env.CHROME_EXECUTABLE_PATH;

if (!executablePath) {
  const chromeBaseDir = '/opt/render/project/.chrome/chrome';
  try {
    console.log('Buscando versiones de Chrome en:', chromeBaseDir);
    const versionFolders = fs.readdirSync(chromeBaseDir).filter(f => f.startsWith('linux-'));
    if (versionFolders.length === 0) {
      throw new Error('No se encontraron carpetas linux-* en ' + chromeBaseDir);
    }
    const latestVersion = versionFolders.sort().reverse()[0];
    executablePath = path.join(chromeBaseDir, latestVersion, 'chrome-linux64', 'chrome');
    console.log('Chrome detectado en:', executablePath);
  } catch (err) {
    console.error('Error detectando Chrome:', err.message);
    console.error('Verifica Build Command: npm install && npx puppeteer browsers install chrome --path /opt/render/project/.chrome');
    process.exit(1);
  }
}

(async () => {
  try {
    console.log('Iniciando Puppeteer con Chrome...');

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--single-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      timeout: 90000
    });

    const page = await browser.newPage();

    // DEBUG MEJORADO: Captura TODO del navegador
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err));
    page.on('requestfailed', req => console.error('REQUEST FAILED:', req.url(), req.failure()));

    const token = process.env.TOKEN?.trim();
    if (!token) {
      console.error('FALTA TOKEN → Render > Environment > TOKEN = tu token de https://www.haxball.com/headlesstoken');
      process.exit(1);
    }

    console.log('Cargando Haxball headless...');
    await page.goto(`https://www.haxball.com/headless#${token}`);

    await page.waitForFunction('typeof window.HBInit === "function"', { timeout: 40000 });

    // Exponer funciones (MEJORADO: onRoomLink ahora se expone ANTES de crear la sala)
    await page.exposeFunction('onRoomLink', link => {
      console.log('🎉 ¡SALA CREADA! Link directo:', link);
      console.log('Comparte este link con tus compas →', link);
    });
    await page.exposeFunction('log', (...args) => console.log('ROOM LOG:', ...args));
    await page.exposeFunction('onPlayerJoin', p => console.log('⚽ JUGADOR ENTRÓ:', p.name, '(ID:', p.id, ')'));
    await page.exposeFunction('onPlayerLeave', p => console.log('👋 JUGADOR SALIÓ:', p.name));
    await page.exposeFunction('onPlayerChat', (p, msg) => console.log('💬 CHAT:', p.name, ':', msg));

    // CREAR LA SALA (MEJORADO: Expone onRoomLink en el config)
    await page.evaluate(() => {
      window.HBInit({
        roomName: "Power Magia Mexicana Unida ⚽🇲🇽",
        maxPlayers: 16,
        public: true,
        noPlayer: true,
        // password: "1234",   // descomenta si privada
        onRoomLink: window.onRoomLink,  // ← CLAVE: Ahora usa la función expuesta
      });
    });

    // ESPERA EXTRA para que onRoomLink dispare (Haxball tarda ~10-30s)
    console.log('Sala creada, esperando link... (puede tardar 30s)');
    await page.waitForTimeout(30000);

    // FALLBACK: Si no disparó onRoomLink, extrae el link de la página
    const roomLink = await page.evaluate(() => {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.src) {
        const match = iframe.src.match(/a=([^&]+)/);
        return match ? `https://www.haxball.com/play?${match[0]}` : null;
      }
      return null;
    });
    if (roomLink) {
      console.log('🔧 FALLBACK: Link extraído manualmente:', roomLink);
      console.log('Comparte este link →', roomLink);
    }

    // Configuraciones (después de crear, para no interferir)
    await page.evaluate(() => {
      const room = window.room || window.HBInit;  // Asegura acceso al room
      if (room && typeof room.setDefaultStadium === 'function') {
        room.setDefaultStadium("Big");
        room.setScoreLimit(7);
        room.setTimeLimit(0);
        room.setTeamsLock(false);
        window.log('¡Configuraciones aplicadas! Sala ON FIRE!');
      }
    });

    console.log('SERVIDOR 24/7 ACTIVO CORRECTAMENTE');
    console.log('Revisa logs para el link. Si no aparece en lobby, espera 2-5 min o invita manual.');
    console.log('Tip: Usa UptimeRobot para pingear tu URL de Render cada 10 min (evita sleep).');

    process.stdin.resume();

  } catch (err) {
    console.error('ERROR FATAL:', err);
    process.exit(1);
  }
})();