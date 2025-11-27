const HaxballJS = require("haxball.js");

HaxballJS().then((HBInit) => {
  // Configuración de la sala (igual que el oficial)
  const room = HBInit({
    roomName: "Power Magia Mexicana Unida ⚽🇲🇽",  // Nombre de tu sala
    maxPlayers: 16,
    public: true,      // true = pública en el lobby
    noPlayer: true,    // true = sin jugador admin visible
    token: "thr1.AAAAAGkoya1OrNKsIdxSFw.aArhywpn-yo",  // ¡CAMBIAR! Ve a https://www.haxball.com/headlesstoken
    // Opcional: password: "tucontraseña" si quieres privada
  });

  // Eventos básicos (opcional, pero útiles)
  room.onRoomLink = (link) => {
    console.log("¡Sala creada! Link para unirte:", link);
  };

  room.onPlayerJoin = (player) => {
    console.log(`${player.name} se unió a la sala!`);
  };

  room.onPlayerLeave = (player) => {
    console.log(`${player.name} dejó la sala.`);
  };

  // Configuraciones de juego (ejemplo básico)
  room.setDefaultStadium("Big");  // Estadio grande
  room.setScoreLimit(7);          // Primer equipo a 7 gana
  room.setTimeLimit(0);           // Sin límite de tiempo
  room.setCustomStadium("");      // Deja vacío para default

  console.log("Servidor Haxball iniciado correctamente. Esperando jugadores...");
}).catch((error) => {
  console.error("Error al iniciar la sala:", error);
  process.exit(1);
});