const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

console.log("=== Power Magia Mexicana Unida – Headless Server ===");

// =============================
// 1. TOKEN
// =============================
const TOKEN = process.env.HAXBALL_TOKEN || 'thr1.AAAAAGkpHq1mF4a9tyRYdA.HE2rF-R3FlE';

// =============================
// 2. DETECCIÓN DE CHROME PARA RENDER
// =============================
function findChrome() {
    const paths = [
        '/opt/render/project/.chrome/chrome',
        '/opt/render/.cache/puppeteer/chrome',
        '/opt/render/project/.cache/puppeteer/chrome'
    ];

    for (const base of paths) {
        try {
            if (!fs.existsSync(base)) continue;

            const versions = fs.readdirSync(base).filter(f => f.startsWith('linux-'));
            if (!versions.length) continue;

            const latest = versions.sort().reverse()[0];
            const chromePath = path.join(base, latest, 'chrome-linux64', 'chrome');

            if (fs.existsSync(chromePath)) {
                console.log("Chrome encontrado en:", chromePath);
                return chromePath;
            }
        } catch (err) {}
    }

    throw new Error("❌ NO SE ENCONTRÓ CHROME EN RENDER");
}

const executablePath = findChrome();

// =============================
// 3. INICIO DEL BROWSER
// =============================
(async () => {
    console.log("Iniciando Puppeteer...");
    const browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-zygote",
            "--single-process"
        ]
    });

    const page = await browser.newPage();

    // =============================
    // 4. CAPTURAR LINK DEL HEADLESS (MÉTODO NUEVO)
    // =============================
    page.on("console", msg => {
        const txt = msg.text();
        console.log("BROWSER:", txt);

        if (txt.startsWith("Room link:")) {
            const headless = txt.replace("Room link:", "").trim();
            const play = headless.replace("headless", "play");

            console.log("══════════════════════════════════════");
            console.log("🔥 ¡SALA CREADA EXITOSAMENTE! 🔥");
            console.log("LINK PARA ENTRAR →", play);
            console.log("══════════════════════════════════════");
        }
    });

    // =============================
    // 5. Cargar HaxBall
    // =============================
    console.log("Cargando headless con token...");
    await page.goto(`https://www.haxball.com/headless#${TOKEN}`);

    // Esperar que HBInit exista
    await page.waitForFunction(() => typeof window.HBInit === "function");

    // =============================
    // 6. Crear sala
    // =============================
    await page.evaluate(() => {
        const room = HBInit({
            roomName: "🇲🇽 POWER MAGIA MEXICANA UNIDA ⚽🔥",
            maxPlayers: 16,
            public: true,
            noPlayer: true
        });

        room.setDefaultStadium("Big");
        room.setScoreLimit(7);
        room.setTimeLimit(0);

        console.log("Sala creada correctamente. Configuración aplicada.");
    });

    console.log("Servidor HaxBall activo 24/7 ✔");

    process.stdin.resume();
})();
    

// =====================================================================
// SERVIDOR HTTP REQUERIDO PARA RENDER (NECESARIO PARA WEB SERVICE GRATIS)
// =====================================================================
const http = require("http");
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Power Magia Mexicana Unida está corriendo 🔥\n");
}).listen(PORT, () => {
    console.log("Servidor HTTP para Render activo en el puerto:", PORT);
});
