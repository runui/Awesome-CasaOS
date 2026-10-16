import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { normalizeBase } from './src/lib/paths.ts';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { dataDirectory, writeCompiledContent } from './scripts/content.ts';

export default defineConfig(({ isSsrBuild }) => ({
	base: normalizeBase(process.env.BASE_PATH ?? '/'),
	resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
	plugins: [
		solid({ ssr: true }),
		{
			name: 'awesome-json-content',
			configureServer(server) {
				// JSON declarations are source files; regenerate the ignored artifact during development too.
				server.watcher.add(dataDirectory);
				const update = (file: string) => {
					if (dirname(file) !== dataDirectory || !file.endsWith('.json')) return;
					try {
						writeCompiledContent();
						const modules = server.moduleGraph.getModulesByFile(resolve('.build/content.json'));
						for (const module of modules ?? []) server.moduleGraph.invalidateModule(module);
						server.ws.send({ type: 'full-reload' });
					} catch (error) {
						const failure = error instanceof Error ? error : new Error(String(error));
						server.config.logger.error(failure.message);
						server.ws.send({
							type: 'error',
							err: {
								message: failure.message,
								stack: failure.stack ?? '',
								plugin: 'awesome-json-content',
							},
						});
					}
				};
				for (const event of ['add', 'change', 'unlink'] as const) server.watcher.on(event, update);
				server.httpServer?.once('close', () => {
					for (const event of ['add', 'change', 'unlink'] as const) server.watcher.off(event, update);
				});
			},
		},
	],
	css: {
		postcss: {
			plugins: [
				{
					postcssPlugin: 'tile-ui-registry-css',
					// shadcn also emits Tailwind hints alongside CSS variables. TileUI only needs the variables.
					AtRule(rule: { name: string; remove(): void }) {
						if (rule.name === 'theme' || rule.name === 'custom-variant') rule.remove();
					},
				},
			],
		},
	},
	build: {
		outDir: isSsrBuild ? '.build/server' : 'dist',
		manifest: !isSsrBuild,
		emptyOutDir: true,
	},
}));
