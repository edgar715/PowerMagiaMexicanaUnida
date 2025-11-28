console.log("=== Power Magia Mexicana Unida – Headless Server ===");

const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
    try {
        console.log("Iniciando Puppeteer...");

        const browser = await puppeteer.launch({
            executablePath: "/opt/render/project/.chrome/chrome/linux-131.0.6778.204/chrome-linux64/chrome",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: true
        });

        const page = await browser.newPage();

        /* 
        ======================================================
        CAPTURAR LOGS DEL NAVEGADOR PARA QUE RENDER SI IMPRIMA
        ======================================================
        */
        page.on("console", msg => {
            const text = msg.text();

            if (text.includes("haxball.com/play")) {
                console.log("\n======== ENLACE DE LA SALA HAXBALL ========");
                console.log(text);
                console.log("============================================\n");
            } else {
                console.log("[HB]", text);
            }
        });

        // Cargar página headless
        await page.goto("https://www.haxball.com/headless", { waitUntil: "networkidle0" });

        console.log("Cargando headless con token...");

        // Obtener token
        const token = fs.readFileSync("token.txt", "utf8").trim();

        // Ejecutar script dentro de la página
        await page.evaluate((token) => {

            window.localStorage.setItem("token", token);

            // Esperar que HBInit exista
            const wait = setInterval(() => {
                if (typeof window.HBInit !== "undefined") {
                    clearInterval(wait);

                    const room = window.HBInit({
                        roomName: "Power Magia Mexicana Unida",
                        maxPlayers: 12,
                        public: true,
                        playerName: "PowerBot",

                        /* 
                        ========================
                        GEO MONTERREY
                        ========================
                        */
                        geo: {
                            code: "mx",
                            lat: 25.6866,
                            lon: -100.3161
                        }
                    });

                    console.log("Sala creada correctamente.");

                    room.onRoomLink = (url) => {
                        console.log("Room link:", url);
                    };

                }
            }, 500);

        }, token);

        console.log("Servidor HaxBall activo 24/7 ✔");

    } catch (err) {
        console.error("ERROR:", err);
    }
})();

/*
======================================
SERVIDOR HTTP FAKE PARA RENDER (OBLIGATORIO)
======================================
*/
const http = require("http");
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Power Magia Mexicana Unida – Bot activo ✔\n");
}).listen(PORT, () => {
    console.log("Servidor HTTP para Render activo en el puerto:", PORT);
});
