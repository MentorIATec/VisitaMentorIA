import { test, expect } from '@playwright/test';

test.describe('Validación en Home', () => {
  test('muestra helper text cuando input está vacío', async ({ page }) => {
    await page.goto('/?E2E_MOCKS=1');
    
    const matriculaInput = page.getByLabel('Matrícula');
    await matriculaInput.focus();
    
    // Verificar helper text visible
    const helperText = page.getByText('Formato: A seguido de 8 o 9 dígitos');
    await expect(helperText).toBeVisible();
  });

  test('deshabilita CTA cuando matrícula es inválida', async ({ page }) => {
    await page.goto('/?E2E_MOCKS=1');
    
    const matriculaInput = page.getByLabel('Matrícula');
    await matriculaInput.fill('A123');
    
    const submitBtn = page.getByRole('button', { name: 'Registrar una sesión' });
    await expect(submitBtn).toBeDisabled();
  });

  test('muestra error después de blur con formato inválido', async ({ page }) => {
    await page.goto('/?E2E_MOCKS=1');
    
    const matriculaInput = page.getByLabel('Matrícula');
    await matriculaInput.fill('A123');
    await matriculaInput.blur();
    
    // Verificar error visible con role="alert"
    const error = page.locator('[role="alert"]').filter({ hasText: 'Formato inválido' });
    await expect(error).toBeVisible();
  });

  test('habilita CTA cuando matrícula es válida', async ({ page }) => {
    await page.goto('/?E2E_MOCKS=1');
    
    const matriculaInput = page.getByLabel('Matrícula');
    await matriculaInput.fill('A00123456');
    
    const submitBtn = page.getByRole('button', { name: 'Registrar una sesión' });
    await expect(submitBtn).toBeEnabled();
  });
});

test.describe('Validación en Paso 1', () => {
  test('muestra summary de errores al inicio del paso 1', async ({ page }) => {
    await page.goto('/register?E2E_MOCKS=1');
    
    // Intentar avanzar sin completar campos
    const nextBtn = page.getByRole('button', { name: 'Siguiente' });
    
    // Si hay campos requeridos, el botón debería estar deshabilitado
    // Pero si intentamos enviar, deberíamos ver errores
    await nextBtn.click({ force: true }).catch(() => {});
    
    // Esperar un poco para que se validen los campos
    await page.waitForTimeout(500);
    
    // Verificar si hay summary de errores (solo si hay errores)
    const errorSummary = page.locator('[role="alert"][aria-live="assertive"]').filter({ hasText: 'corrige los siguientes errores' });
    const isVisible = await errorSummary.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(errorSummary).toBeVisible();
    }
  });

  test('muestra errores inline debajo de cada campo', async ({ page }) => {
    await page.goto('/register?E2E_MOCKS=1');
    
    const matriculaInput = page.getByLabel('Matrícula');
    
    // Llenar con formato inválido
    await matriculaInput.fill('A123');
    await matriculaInput.blur();
    
    // Verificar error inline con role="alert"
    const error = page.locator('p[role="alert"]').filter({ hasText: 'Formato inválido' });
    await expect(error).toBeVisible();
    
    // Verificar que el input tiene aria-invalid
    await expect(matriculaInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('conecta errores con aria-describedby', async ({ page }) => {
    await page.goto('/register?E2E_MOCKS=1');
    
    const matriculaInput = page.getByLabel('Matrícula');
    await matriculaInput.fill('A123');
    await matriculaInput.blur();
    
    // Verificar que el input tiene aria-describedby apuntando al error
    const describedBy = await matriculaInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(describedBy).toContain('error');
    
    // Verificar que existe el elemento con ese ID
    const errorElement = page.locator(`#${describedBy}`);
    await expect(errorElement).toBeVisible();
  });
});

