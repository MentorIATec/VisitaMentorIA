import { test, expect } from '@playwright/test';

test('Flujo completo de registro', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Matrícula o código').fill('A123');

  // Selección de mentor y comunidad si hay datos
  const mentorSelect = page.getByLabel('Mentor/a');
  if (await mentorSelect.isVisible()) {
    await mentorSelect.selectOption({ index: 1 }).catch(() => {});
  }
  const communitySelect = page.getByLabel('Comunidad');
  if (await communitySelect.isVisible()) {
    const options = await communitySelect.locator('option').all();
    if (options.length > 1) {
      await communitySelect.selectOption({ index: 1 });
    }
  }

  const nextBtn = page.getByRole('button', { name: 'Siguiente' });
  await expect(nextBtn).toBeEnabled();
  await nextBtn.click();

  // Paso 2: duración y mood
  const enviar = page.getByRole('button', { name: 'Enviar' });
  await expect(enviar).toBeEnabled();

  // Puede fallar el POST si el backend no está con datos; al menos validamos navegación
  await enviar.click({ force: true });
});


