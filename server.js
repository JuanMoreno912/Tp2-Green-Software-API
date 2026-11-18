// Servidor estático mínimo para desarrollo (sin dependencias).
// Solo sirve los archivos de /frontend: NO es una API (la API la provee la cátedra).
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 5500;
const ROOT = path.join(__dirname, 'frontend');

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

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
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
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`El puerto ${PORT} está ocupado. Cerrá el otro proceso o usá otro puerto:  $env:PORT=5501; npm start`);
      process.exit(1);
    }
    throw err;
  })
  .listen(PORT, () => {
    console.log(`Campus CO2 corriendo en http://localhost:${PORT}`);
  });
