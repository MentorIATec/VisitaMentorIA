import { defineConfig } from '@playwright/test';

const port = Number(process.env.PORT || 3000);

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry'
  },
  webServer: {
    command: `bash -c "PORT=${port} npm run build && PORT=${port} npm run start"`,
    port,
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      PORT: String(port),
      E2E_MOCKS: '1',
      NEXTAUTH_URL: `http://localhost:${port}`,
      NEXTAUTH_SECRET: 'test_secret',
      HASH_SALT: 'test_salt'
    }
  },
});


