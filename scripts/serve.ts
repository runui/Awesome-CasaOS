import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { normalizeBase, stripBase } from '../src/lib/paths';

// Deliberately no SPA fallback: browser tests must pass on an ordinary directory-based static host.
const base = normalizeBase(process.env.BASE_PATH ?? '/');
const root = resolve('dist');
const types: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
	'.xml': 'application/xml',
	'.txt': 'text/plain',
};
createServer(async (req, res) => {
	try {
		const url = new URL(req.url ?? '/', 'http://localhost');
		const path = stripBase(decodeURIComponent(url.pathname), base);
		if (path === null) throw new Error('Not in base path');
		let file = resolve(root, `.${path}`);
		if (file !== root && !file.startsWith(`${root}/`)) throw new Error('Outside static root');
		if ((await stat(file)).isDirectory()) {
			if (!url.pathname.endsWith('/')) {
				res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
				res.end();
				return;
			}
			file = join(file, 'index.html');
		}
		res.writeHead(200, {
			'Content-Type': types[extname(file)] ?? 'application/octet-stream',
		});
		res.end(await readFile(file));
	} catch {
		res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
		res.end(await readFile(join(root, '404.html')).catch(() => 'Not found'));
	}
}).listen(4173, '127.0.0.1', () => console.log(`Static test server: http://127.0.0.1:4173${base}`));
