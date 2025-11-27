const Haxball = require('haxball-headless');

Haxball.room.create({
  name: "Mi Sala Render",
  password: "",           // deja "" si no quieres contraseña
  maxPlayers: 16,
  public: true,
  noPlayer: false,
  token: "thr1.AAAAAGkoya1OrNKsIdxSFw.aArhywpn-yo"   // OBLIGATORIO: consigue tu token en https://www.haxball.com/headlesstoken
}, (room) => {
  console.log("Sala creada! Link:", room.link);

  // Aquí puedes poner tus eventos (onPlayerJoin, etc.)
  room.onPlayerJoin = (player) => {
    console.log(player.name + " entró");
  };
});