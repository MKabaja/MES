import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

process.env.TZ = 'America/New_York';

export default defineConfig({
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		restoreMocks: true,
		unstubEnvs: true,
	},
});
