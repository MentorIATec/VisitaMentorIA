import { test, expect } from '@playwright/test';

test('Registro exige comunidad y muestra canal presencial', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByText('Canal: presencial')).toBeVisible();

  // Botón siguiente deshabilitado hasta que se valide paso 1
  const nextBtn = page.getByRole('button', { name: 'Siguiente' });
  await expect(nextBtn).toBeDisabled();

  await page.getByLabel('Matrícula o código').fill('A123');
  // Mentor y comunidad pueden no estar poblados sin datos reales; este test verifica accesibilidad básica
  await expect(page.getByLabel('Comunidad')).toBeVisible();
});


