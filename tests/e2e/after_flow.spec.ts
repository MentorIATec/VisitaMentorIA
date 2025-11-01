import { test, expect } from '@playwright/test';

test('Flujo AFTER con token 1-uso (mocks)', async ({ page, request }) => {
  // 1) Registro
  await page.goto('/register');
  await page.getByLabel('Matrícula o código').fill('A123');
  const nextBtn = page.getByRole('button', { name: 'Siguiente' });
  await expect(nextBtn).toBeEnabled();
  await nextBtn.click();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Sugerencias para tu sesión')).toBeVisible();

  // 2) Obtener token
  const tokenRes = await request.get('/api/test/last-followup-token');
  const { token } = await tokenRes.json();
  expect(token).toBeTruthy();

  // 3) Ir a /after/{token} y enviar
  await page.goto(`/after/${token}`);
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Tu seguimiento se registró')).toBeVisible();

  // 4) Reintento debe fallar
  await page.goto(`/after/${token}`);
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Token inválido o ya utilizado')).toBeVisible();
});


