// Servidor estático mínimo para desarrollo (sin dependencias).
// Solo sirve los archivos de /frontend: NO es una API (la API la provee la cátedra).
//
//   npm start    → sirve la página
//   npm run dev  → además recarga el navegador al guardar cambios en /frontend
const http = require('http');
const fs = require('fs');
const path = require('path');

const argPort = process.argv.find((a) => a.startsWith('--port='));
const PORT = Number(argPort?.split('=')[1]) || Number(process.env.PORT) || 5500;
const ROOT = path.join(__dirname, 'frontend');
const DEV = process.argv.includes('--dev');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// ---------- Recarga en vivo (solo en modo dev) ----------
const clientes = new Set();

// Script que se inyecta en el HTML: escucha al servidor y recarga.
// Si solo cambió CSS, recarga las hojas de estilo sin perder lo cargado en el formulario.
const SCRIPT_LIVERELOAD = `
<script>
(() => {
  const es = new EventSource('/__livereload');
  es.onmessage = (e) => {
    if (e.data === 'css') {
      document.querySelectorAll('link[rel=stylesheet]').forEach((l) => {
        const url = new URL(l.href);
        url.searchParams.set('t', Date.now());
        l.href = url.toString();
      });
    } else {
      location.reload();
    }
  };
})();
</script>`;

if (DEV) {
  let timer;
  let soloCss = true;
  fs.watch(ROOT, { recursive: true }, (_evento, archivo) => {
    if (!archivo) return;
    if (path.extname(archivo) !== '.css') soloCss = false;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const tipo = soloCss ? 'css' : 'reload';
      console.log(`[dev] cambio en ${archivo} → ${tipo}`);
      clientes.forEach((res) => res.write(`data: ${tipo}\n\n`));
      soloCss = true;
    }, 100);
  });
}

// ---------- Servidor ----------
http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);

    if (DEV && url === '/__livereload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(': conectado\n\n');
      clientes.add(res);
      req.on('close', () => clientes.delete(res));
      return;
    }

    const archivo = path.normalize(path.join(ROOT, url === '/' ? 'index.html' : url));

    // Evita salir de la carpeta frontend (../)
    if (!archivo.startsWith(ROOT)) {
      res.writeHead(403).end('Prohibido');
      return;
    }

    fs.readFile(archivo, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
        return;
      }
      const ext = path.extname(archivo);
      const headers = { 'Content-Type': TIPOS[ext] || 'application/octet-stream' };
      if (DEV) headers['Cache-Control'] = 'no-store';

      if (DEV && ext === '.html') {
        data = data.toString().replace('</body>', SCRIPT_LIVERELOAD + '\n</body>');
      }
      res.writeHead(200, headers);
      res.end(data);
    });
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`El puerto ${PORT} está ocupado. Cerrá el otro proceso o usá otro puerto:  $env:PORT=5501; npm run dev`);
      process.exit(1);
    }
    throw err;
  })
  .listen(PORT, () => {
    console.log(`Campus CO2 corriendo en http://localhost:${PORT}${DEV ? '  (modo dev: recarga en vivo)' : ''}`);
  });
