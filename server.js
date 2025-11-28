console.log("=== Power Magia Mexicana Unida – Headless (Railway) ===");

const TOKEN = process.env.HAXBALL_TOKEN || "thr1.AAAAAGkpJ59afrXgigNo_g.fFQ4McFZcjI";

if (!TOKEN.startsWith("thr1")) {
    console.log("❌ ERROR: TOKEN headless inválido.");
    process.exit(1);
}

// ======================================================
// 1. Cargar HaxBall (sin Puppeteer, nativo para Railway)
// ======================================================
const { Worker } = require("worker_threads");

function startRoom() {
    console.log("Iniciando servidor headless...");

    const worker = new Worker(`
        const { parentPort } = require("worker_threads");

        parentPort.on("message", (token) => {
            import("haxball-headless-browser").then(hbb => {
                hbb.HBInit({
                    token: token,
                    roomName: "🇲🇽 POWER MAGIA MEXICANA UNIDA ⚽🔥",
                    maxPlayers: 16,
                    public: true,
                    geo: { code: "NA", lat: 25.6866, lon: -100.3161 }, // Monterrey
                    noPlayer: true,
                    password: ""
                }).then(room => {

                    // ============================
                    // ROOM CONFIG
                    // ============================
                    room.setDefaultStadium("Big");
                    room.setScoreLimit(7);
                    room.setTimeLimit(0);
                    room.setTeamsLock(false);

                    // ADMIN PASSWORD
                    const adminPassword = "admin123";

                    room.onPlayerJoin = (player) => {
                        room.sendAnnouncement(
                            "Bienvenido " + player.name + 
                            " | Para admin escribe !admin contraseña",
                            player.id, 0x00FF00, "bold"
                        );
                    };

                    room.onPlayerChat = (player, msg) => {
                        if (msg.startsWith("!admin ")) {
                            const pwd = msg.split(" ")[1];
                            if (pwd === adminPassword) {
                                room.setPlayerAdmin(player.id, true);
                                room.sendAnnouncement("✔ Admin otorgado.", player.id, 0x00FF00);
                            } else {
                                room.sendAnnouncement("❌ Contraseña incorrecta.", player.id, 0xFF0000);
                            }
                            return false;
                        }
                    };

                    // Detectar link de la sala
                    room.onRoomLink = (link) => {
                        parentPort.postMessage({ type: "roomlink", link });
                    };

                    parentPort.postMessage({ type: "ready" });
                });
            });
        });
    `, { eval: true });

    worker.on("message", (msg) => {
        if (msg.type === "roomlink") {
            console.log("\n══════════════════════════════════════════");
            console.log("🔥 SALA CREADA 🔥");
            console.log("HEADLESS:", msg.link);
            console.log("PLAY:", msg.link.replace("headless", "play"));
            console.log("══════════════════════════════════════════\n");
        }

        if (msg.type === "ready") {
            console.log("✔ Room cargada correctamente.");
        }
    });

    worker.on("error", (err) => {
        console.log("❌ Worker error:", err);
        console.log("Reiniciando en 3s...");
        setTimeout(startRoom, 3000);
    });

    worker.postMessage(TOKEN);
}

startRoom();

// ======================================================
// SERVIDOR WEB (Railway requiere esto)
// ======================================================
const http = require("http");
const PORT = process.env.PORT || 8080;

http.createServer((req, res) => {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Power Magia Mexicana Unida está activo 🚀");
}).listen(PORT, () => {
    console.log("Servidor HTTP en puerto", PORT);
});
