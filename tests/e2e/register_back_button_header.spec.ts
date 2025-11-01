import { test, expect } from '@playwright/test';

test.describe('Botón Atrás en header del registro', () => {
  test('Botón Atrás en header retorna al paso anterior sin perder datos', async ({ page }) => {
    await page.goto('/register?E2E_MOCKS=1');
    
    // Paso 1: Llenar información básica
    const matriculaInput = page.getByLabel('Matrícula o código');
    await matriculaInput.fill('E567890');
    
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
    
    // Guardar valores del paso 1 para verificar que se mantienen
    const matriculaValue = await matriculaInput.inputValue();
    
    // Ir al paso 2
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // Verificar que estamos en el paso 2
    await expect(page.locator('text=/Paso 2/i')).toBeVisible();
    
    // Verificar que el botón Atrás está en el header
    const backButton = page.getByRole('button', { name: 'Volver al paso anterior' });
    await expect(backButton).toBeVisible();
    
    // Verificar que el botón tiene el ícono ArrowLeft
    const arrowIcon = backButton.locator('svg');
    await expect(arrowIcon).toBeVisible();
    
    // Llenar algunos datos en el paso 2
    const reasonSelect = page.getByLabel(/Motivo/i);
    if (await reasonSelect.isVisible()) {
      await reasonSelect.selectOption({ index: 1 }).catch(() => {});
    }
    
    // Hacer clic en el botón Atrás del header
    await backButton.click();
    
    // Verificar que volvimos al paso 1
    await expect(page.locator('text=/Paso 1/i')).toBeVisible();
    
    // Verificar que los datos del paso 1 se mantienen
    const matriculaAfter = page.getByLabel('Matrícula o código');
    await expect(matriculaAfter).toHaveValue(matriculaValue);
    
    // Verificar que el botón Atrás ya no está visible en el header
    await expect(backButton).not.toBeVisible();
  });
});
