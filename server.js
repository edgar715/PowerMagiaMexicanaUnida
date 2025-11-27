const puppeteer = require('puppeteer');

// RUTA FIJA Y PERMANENTE EN RENDER (esta nunca se borra)
const executablePath = '/opt/render/project/.chrome/chrome-linux/chrome';
console.log('Chrome path:', executablePath);

// Verificación rápida por si algo sale mal (opcional pero útil)
if (!require('fs').existsSync(executablePath)) {
  console.error('¡ERROR! Chrome no está instalado en la ruta esperada.');
  console.error('Asegúrate de tener este Build Command:');
  console.error('npm install && npx puppeteer browsers install chrome-stable --path /opt/render/project/.chrome');
  process.exit(1);
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

    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err));

    const token = process.env.TOKEN?.trim();
    if (!token) {
      console.error('FALTA EL TOKEN → Ve a Render → Environment → agrega KEY: TOKEN con tu token real');
      process.exit(1);
    }

    console.log('Cargando Haxball headless...');
    await page.goto(`https://www.haxball.com/headless#${token}`);

    await page.waitForFunction('typeof window.HBInit === "function"', { timeout: 40000 });

    await page.exposeFunction('log', (...args) => console.log('ROOM:', ...args));
    await page.exposeFunction('onRoomLink', link => {
      console.log('¡SALA CREADA! →', link);
      console.log('Comparte este enlace:', link);
    });
    await page.exposeFunction('onPlayerJoin', p => console.log(`${p.name} entró (ID: ${p.id})`));
    await page.exposeFunction('onPlayerLeave', p => console.log(`${p.name} salió`));
    await page.exposeFunction('onPlayerChat', (p, msg) => console.log(`[${p.name}]: ${msg}`));

    await page.evaluate(() => {
      const room = window.HBInit({
        roomName: "Power Magia Mexicana Unida",
        maxPlayers: 16,
        public: true,
        noPlayer: true,
        // password: "1234",   // descomenta si quieres privada
      });

      room.onRoomLink = window.onRoomLink;
      room.onPlayerJoin = window.onPlayerJoin;
      room.onPlayerLeave = window.onPlayerLeave;
      room.onPlayerChat = window.onPlayerChat;

      room.setDefaultStadium("Big");
      room.setScoreLimit(7);
      room.setTimeLimit(0);
      room.setTeamsLock(false);

      window.log('¡Power Magia Mexicana Unida está ON FIRE!');
    });

    console.log('SERVIDOR 24/7 ACTIVO CORRECTAMENTE');
    console.log('La sala aparecerá en el lobby público en segundos...');

    process.stdin.resume();

  } catch (err) {
    console.error('ERROR FATAL:', err);
    process.exit(1);
  }
})();