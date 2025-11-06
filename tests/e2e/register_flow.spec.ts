import { test, expect } from '@playwright/test';

test('Flujo completo de registro', async ({ page }) => {
  await page.goto('/register?E2E_MOCKS=1');
  
  // Verificar que la barra de progreso sticky está visible
  const progressBar = page.locator('[role="progressbar"]');
  await expect(progressBar).toBeVisible();
  
  // Paso 1: Matrícula válida
  const matriculaInput = page.getByLabel('Matrícula');
  await matriculaInput.fill('A00123456');
  
  // Selección de mentor si hay múltiples opciones
  const mentorSelect = page.getByLabel('Mentora o mentor');
  if (await mentorSelect.isVisible()) {
    await mentorSelect.selectOption({ index: 1 }).catch(() => {});
  }
  
  // Verificar que la comunidad se selecciona automáticamente si aplica
  const comunidadAuto = page.getByText('Seleccionada automáticamente');
  if (await comunidadAuto.isVisible().catch(() => {})) {
    await expect(comunidadAuto).toBeVisible();
  }

  const nextBtn = page.getByRole('button', { name: 'Siguiente' });
  await expect(nextBtn).toBeEnabled();
  await nextBtn.click();

  // Verificar progreso sticky sigue visible después de scroll
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(progressBar).toBeVisible();

  // Paso 2: Seleccionar valencia
  const valenciaGroup = page.getByRole('radiogroup', { name: 'Valencia emocional' });
  await expect(valenciaGroup).toBeVisible();
  await page.getByRole('radio', { name: 'Neutras' }).click();

  // Ajustar slider a 3
  const slider = page.locator('input[type="range"]');
  await slider.fill('3');

  // Seleccionar palabra de emoción
  const emotionChip = page.locator('[role="group"][aria-label="Emociones disponibles"]').locator('button').first();
  await emotionChip.click();

  // Verificar que el resumen con aria-live se actualiza
  const resumen = page.locator('[aria-live="polite"]');
  await expect(resumen).toBeVisible();
  await expect(resumen).toContainText('Registramos emociones');

  // Agregar nota
  const textarea = page.getByLabel(/Reflexión|Qué más quieres compartir/i);
  await textarea.fill('Esta es una nota de prueba');

  // Enviar
  const enviar = page.getByRole('button', { name: 'Enviar' });
  await expect(enviar).toBeEnabled();
  await enviar.click();

  // Verificar redirección a /thanks
  await expect(page).toHaveURL(/\/thanks/);
});


