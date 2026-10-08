import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webm':'video/webm','.mp4':'video/mp4','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filename = path.resolve(directory, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!filename.startsWith(directory + path.sep)) { response.writeHead(403).end(); return; }
    const body = await readFile(filename);
    response.writeHead(200, {'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});
    response.end(body);
  } catch { response.writeHead(404).end('Not found'); }
});
server.listen(Number(process.env.PORT || 0), '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}`));
