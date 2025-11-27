const puppeteer = require('puppeteer');

(async () => {
  // Args para Render (anti-crash en cloud)
  const puppeteerArgs = process.env.PUPPETEER_ARGS 
    ? process.env.PUPPETEER_ARGS.split(',').map(arg => arg.trim())
    : [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--single-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: puppeteerArgs,
    timeout: 60000
  });

  const page = await browser.newPage();

  // Logs del navegador (para debug)
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));

  const token = process.env.TOKEN;
  if (!token) {
    console.error('¡ERROR! Agrega TOKEN en Environment Variables de Render');
    process.exit(1);
  }

  console.log('Cargando Haxball headless...');
  await page.goto(`https://www.haxball.com/headless#${token}`);

  // Espera a que cargue HBInit
  await page.waitForFunction('typeof window.HBInit === "function"', { timeout: 30000 });

  // Expone funciones de Node al navegador (para eventos)
  await page.exposeFunction('log', (...args) => console.log('ROOM:', ...args));
  await page.exposeFunction('onRoomLink', (link) => {
    console.log('🎉 ¡SALA CREADA! Link para unirte:', link);
  });
  await page.exposeFunction('onPlayerJoin', (player) => {
    console.log(`⚽ ${player.name} se unió! (${player.team} | ${player.score || 0} pts)`);
  });
  await page.exposeFunction('onPlayerLeave', (player) => {
    console.log(`👋 ${player.name} dejó la sala.`);
  });
  await page.exposeFunction('onPlayerChat', (player, message) => {
    console.log(`💬 ${player.name}: ${message}`);
  });

  // ¡CREA LA SALA! (todo en el navegador)
  const initResult = await page.evaluate(() => {
    const room = window.HBInit({
      roomName: "Power Magia Mexicana Unida ⚽🇲🇽",
      maxPlayers: 16,
      public: true,
      noPlayer: true,
      // password: "tucontraseña",  // Descomenta si quieres privada
      onRoomLink: window.onRoomLink,
      onPlayerJoin: window.onPlayerJoin,
      onPlayerLeave: window.onPlayerLeave,
      onPlayerChat: window.onPlayerChat,
      onPlayerActivity: function(player) {},
      onPlayerBallKick: function(player) {},
      onTeamVictory: function(scores) { window.log('¡Victoria! Scores:', scores); },
      onTeamChange: function(player, team) { window.log(player.name, 'cambió a equipo', team); },
    });

    // Configuraciones del juego
    room.setDefaultStadium("Big");    // Estadio grande
    room.setScoreLimit(7);            // A 7 gana
    room.setTimeLimit(0);             // Infinito
    room.lockTeamChanges(false);      // Permite cambios de equipo
    room.lockTeamSelection(false);    // Permite elegir equipo
    room.setAutoTeams(false);         // Equipos manuales

    window.log('¡Sala configurada y lista!');
    return 'OK';
  });

  if (initResult !== 'OK') {
    console.error('Error al crear sala:', initResult);
    await browser.close();
    process.exit(1);
  }

  console.log('✅ Servidor Haxball 24/7 activo. Esperando jugadores...');

  // Mantiene vivo (Render lo hace auto)
  process.stdin.resume();

})();