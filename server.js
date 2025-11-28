const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

console.log("=== Power Magia Mexicana Unida – Headless Server ===");

// TOKEN
const TOKEN = process.env.HAXBALL_TOKEN || "thr1.AAAAAGkpIsmEm1kzbI2IFA.X7Aw1tXD7M0";

// Detectar Chrome de Render
function findChrome() {
    const base = "/opt/render/project/.chrome/chrome";
    const versions = fs.readdirSync(base).filter(f => f.startsWith("linux-"));
    const latest = versions.sort().reverse()[0];
    return path.join(base, latest, "chrome-linux64", "chrome");
}

const executablePath = findChrome();

// =========================================
// =   LA CLAVE: ESPERAR LA CONEXIÓN       =
// =========================================

async function waitForHeadlessReady(page) {
    return await page.waitForFunction(() => {
        return window.haxballRoomLinkPromise !== undefined;
    });
}

(async () => {
    console.log("Iniciando Puppeteer...");

    const browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Capturar logs
    page.on("console", msg => {
        console.log("BROWSER:", msg.text());
        if (msg.text().startsWith("Room link:")) {
            const raw = msg.text().replace("Room link:", "").trim();
            const play = raw.replace("headless", "play");

            console.log("\n========== SALA LISTA ==========");
            console.log("LINK:", play);
            console.log("================================\n");
        }
    });

    console.log("Cargando headless...");
    await page.goto(`https://www.haxball.com/headless#${TOKEN}`, {
        waitUntil: "domcontentloaded"
    });

    console.log("Esperando conexión al servidor maestro...");
    await waitForHeadlessReady(page);

    console.log("Conectado. Creando sala...");

    await page.evaluate(() => {
        const room = HBInit({
            roomName: "🇲🇽 POWER MAGIA MEXICANA UNIDA ⚽🔥",
            maxPlayers: 16,
            public: true,
            noPlayer: true,
            geo: { code: "mx", lat: 25.6866, lon: -100.3161 }
        });

        room.onRoomLink = link => console.log("Room link:", link);

        console.log("Sala creada correctamente. Configuración aplicada.");
    });

    console.log("Servidor HaxBall activo 24/7 ✔");

    process.stdin.resume();
})();
    

// Servidor HTTP requerido por Render
const http = require("http");
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Power Magia Mexicana Unida 24/7\n");
}).listen(PORT, () => {
    console.log("Servidor HTTP para Render activo en el puerto:", PORT);
});
