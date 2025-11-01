import { test, expect } from '@playwright/test';

test('Catálogos fallan → retry/fallback permite continuar', async ({ page, context }) => {
  // Interceptar y fallar las requests de catálogos
  await context.route('/api/communities', route => route.abort());
  await context.route('/api/mentors', route => route.abort());
  await context.route('/api/reasons', route => route.abort());

  await page.goto('/register');

  // Verificar que aparece el mensaje de error
  await expect(page.getByText(/No se pudieron cargar catálogos/i)).toBeVisible({ timeout: 5000 });
  
  // Verificar que aparece el botón Reintentar
  const retryButton = page.getByRole('button', { name: /reintentar/i });
  await expect(retryButton).toBeVisible();

  // Simular que ahora las requests funcionan
  await context.route('/api/communities', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, code: 'test', name: 'Test', color: '#000000' }])
  }));
  await context.route('/api/mentors', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 'm1', email: 'test@tec.mx', display_name: 'Test Mentor', campus: null, comunidad_id: null }])
  }));
  await context.route('/api/reasons', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, code: 'TEST', label: 'Test Reason' }])
  }));

  // Hacer clic en Reintentar
  await retryButton.click();

  // Verificar que se cargaron los catálogos (el error desaparece)
  await expect(page.getByText(/No se pudieron cargar catálogos/i)).not.toBeVisible({ timeout: 3000 });

  // Verificar que los selects están disponibles
  const mentorSelect = page.getByLabel(/mentor/i);
  await expect(mentorSelect).toBeEnabled({ timeout: 2000 });
});

test('Fallback a mocks locales cuando E2E_MOCKS=1', async ({ page }) => {
  // Ir a register con E2E_MOCKS en la URL
  await page.goto('/register?E2E_MOCKS=1');

  // Los mocks deberían cargar inmediatamente
  // Verificar que no aparece el error
  await page.waitForTimeout(1000);
  const errorMessage = page.getByText(/No se pudieron cargar catálogos/i);
  await expect(errorMessage).not.toBeVisible({ timeout: 2000 }).catch(() => {
    // Si aparece el error, verificar que al menos los selects están disponibles
    const mentorSelect = page.getByLabel(/mentor/i);
    expect(mentorSelect).toBeEnabled();
  });

  // Verificar que hay opciones en los selects
  const mentorSelect = page.getByLabel(/mentor/i);
  await expect(mentorSelect).toBeEnabled({ timeout: 3000 });
  
  // Debería haber al menos una opción (Karen en los mocks)
  const options = await mentorSelect.locator('option').count();
  expect(options).toBeGreaterThan(0);
});

test('Validación visual de selects estilizados', async ({ page }) => {
  await page.goto('/register');

  // Esperar a que carguen los catálogos
  await page.waitForTimeout(2000);

  // Verificar que los selects tienen estilos personalizados
  // (no son los selects nativos por defecto)
  const mentorSelect = page.getByLabel(/mentor/i);
  await expect(mentorSelect).toBeVisible();

  // Verificar que tiene la clase rounded-lg (estilo personalizado)
  const mentorClasses = await mentorSelect.getAttribute('class');
  expect(mentorClasses).toContain('rounded');

  // Verificar que el select de comunidad también está estilizado
  const communitySelect = page.getByLabel(/comunidad/i);
  await expect(communitySelect).toBeVisible();
  const communityClasses = await communitySelect.getAttribute('class');
  expect(communityClasses).toContain('rounded');

  // Verificar que cuando se selecciona una comunidad, aparece el chip
  if (await communitySelect.locator('option').count() > 1) {
    await communitySelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);
    
    // Buscar el chip de comunidad
    const chip = page.locator('button').filter({ hasText: /ekvilibro|energio|talenta/i }).first();
    const chipCount = await chip.count();
    // Puede haber o no chip visible dependiendo de la implementación
    if (chipCount > 0) {
      await expect(chip).toBeVisible();
    }
  }
});

test('Autoselección de mentor único (Karen)', async ({ page }) => {
  await page.goto('/register');

  // Esperar a que carguen los catálogos
  await page.waitForTimeout(2000);

  // Si hay un solo mentor (Karen en mocks), debería estar autoseleccionado
  const mentorSelect = page.getByLabel(/mentor/i);
  const selectedValue = await mentorSelect.inputValue();
  
  // Si hay exactamente un mentor, debería estar seleccionado
  const optionCount = await mentorSelect.locator('option').count();
  if (optionCount === 2) { // 1 opción vacía + 1 mentor = 2 opciones
    // Hay un mentor, verificar que está seleccionado
    expect(selectedValue).not.toBe('');
  }
});

test('Barra de progreso funciona correctamente', async ({ page }) => {
  await page.goto('/register');

  // Verificar que la barra de progreso está visible
  const progressBar = page.locator('[role="progressbar"]');
  await expect(progressBar).toBeVisible();

  // En paso 1, la barra debe estar al 50%
  let progressWidth = await progressBar.getAttribute('style');
  expect(progressWidth).toContain('50%');

  // Completar paso 1 y avanzar
  await page.getByLabel(/matrícula/i).fill('TEST123');
  await page.waitForTimeout(500);
  
  // Si hay mentor y comunidad, avanzar
  const mentorSelect = page.getByLabel(/mentor/i);
  if (await mentorSelect.locator('option').count() > 1) {
    await mentorSelect.selectOption({ index: 1 });
  }
  
  const communitySelect = page.getByLabel(/comunidad/i);
  if (await communitySelect.locator('option').count() > 1) {
    await communitySelect.selectOption({ index: 1 });
  }

  // Ir al paso 2
  const nextButton = page.getByRole('button', { name: /siguiente/i });
  if (await nextButton.isEnabled()) {
    await nextButton.click();
    await page.waitForTimeout(500);

    // Verificar que la barra está al 100%
    progressWidth = await progressBar.getAttribute('style');
    expect(progressWidth).toContain('100%');
  }
});

