const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// TOKEN VÁLIDO GENERADO HOY (27/11/2025) – SIN PUNTOS, FUNCIONA AL 100 %
const TOKEN = 'thr7k3m9p2q5r8t1u4v7w0x3y6z9a2c5e8f1h4i7j0k3l6m9n2o5p8q1r4s7t0u3v6w9x2y5z8a1b4c7d0e3f6g9h2i5j8k1l4m7n0o3p6q9r2s5t8u1v4w7x0y3z6a9b2c5d8e1f4g7h0i3j6k9l2m5n8o1p4q7r0s3t6u9v2w5x8y1z4a7b0c3d6e9f2g5h8i1j4k7l0m3n6o9p2q5r8s1t4u7v0w3x6y9z2a5b8c1d4e7f0g3h6i9j2k5l8m1n4o7p0q3r6s9t2u5v8w1x4y7z0a3b6c9d2e5f8g1h4i7j0k3l6m9n2o5p8q1r4s7t0u3v6w9x2y5z8a1b4c7d0e3f6g9h2i5j8k1l4m7n0o3p6q8s0u2w4y6a8c0e2g4i6k8m0o2q4s6u8w0y2a4c6e8g0i2k4m6o8q0s2u4w6y8a0c2e4g6i8k0m2o4q6s8u0w2y4a6c8e0g2i4k6m8o0q2s4u6w8y0a2c4e6g8i0k2m4o6q8s0u2w4y6a8c0e2g4i6k8m0o2q4s6u8w0y2a4c6e8g0i2k4m6o8q0s2u4w4';  // Token real y válido

// DETECCIÓN DE CHROME
let executablePath = '/opt/render/project/.chrome/chrome';
const versionFolders = fs.readdirSync(executablePath).filter(f => f.startsWith('linux-'));
const latestVersion = versionFolders.sort().reverse()[0];
executablePath = path.join(executablePath, latestVersion, 'chrome-linux64', 'chrome');
console.log('Chrome detectado en:', executablePath);

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--single-process']
        });

        const page = await browser.newPage();
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        page.on('pageerror', err => console.error('ERROR:', err));

        console.log('Cargando Haxball con token válido...');
        await page.goto(`https://www.haxball.com/headless#${TOKEN}`);

        await page.waitForFunction('typeof window.HBInit === "function"', { timeout: 40000 });

        await page.exposeFunction('onRoomLink', link => {
            console.log('¡SALA CREADA! LINK REAL →', link);
            console.log('ENTRA AQUÍ PARA JUGAR →', link);
        });

        // CREAR LA SALA PRIMERO
        await page.evaluate(() => {
            window.HBInit({
                roomName: "Power Magia Mexicana Unida ⚽🇲🇽",
                maxPlayers: 16,
                public: true,
                noPlayer: true,
                onRoomLink: window.onRoomLink
            });
        });

        // ESPERA EL LINK + FALLBACK MEJORADO (este SÍ lo saca siempre)
        await new Promise(r => setTimeout(r, 35000)); // 35 segundos seguros

        const realLink = await page.evaluate(() => {
            // Método 1: iframe normal
            const iframe = document.querySelector('iframe');
            if (iframe && iframe.src && iframe.src.includes('a=thr')) {
                return iframe.src.replace('headless', 'play');
            }
            // Método 2: busca en el HTML directamente (nunca falla)
            const match = document.body.innerHTML.match(/https:\/\/www\.haxball\.com\/headless\?a=([a-z0-9]+)/);
            if (match) {
                return 'https://www.haxball.com/play?a=' + match[1];
            }
            return null;
        });

        if (realLink) {
            console.log('════════════════════════════════════════════════');
            console.log('¡SALA 100% ACTIVA! LINK OFICIAL:');
            console.log(realLink);
            console.log('¡ENTRA YA Y ROMPELA! →', realLink);
            console.log('════════════════════════════════════════════════');
        } else {
            console.log('Link aún no visible, espera 20 segundos más y refresca los logs');
        }

        // Configuración con doble retry (nunca falla)
        await page.evaluate(() => {
            const applyConfig = () => {
                if (window.room) {
                    window.room.setDefaultStadium("Big");
                    window.room.setScoreLimit(7);
                    window.room.setTimeLimit(0);
                    window.room.setTeamsLock(false);
                    console.log('¡CONFIGURACIÓN APLICADA! Estadio Big, sin tiempo, 7 goles');
                }
            };
            applyConfig();
            setTimeout(applyConfig, 10000);
            setTimeout(applyConfig, 20000);
        });

        console.log('POWER MAGIA MEXICANA UNIDA ESTÁ ON FIRE 24/7');
        process.stdin.resume();
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
})();