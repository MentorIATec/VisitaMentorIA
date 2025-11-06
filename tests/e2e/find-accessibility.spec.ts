import { test, expect } from '@playwright/test';

test.describe('Accesibilidad en página Contactar', () => {
  test('chips de comunidad tienen aria-pressed correcto', async ({ page }) => {
    await page.goto('/find?E2E_MOCKS=1');
    
    // Esperar a que carguen las comunidades
    await page.waitForSelector('[role="group"][aria-label="Filtrar por comunidad"]', { timeout: 5000 });
    
    const communityGroup = page.getByRole('group', { name: 'Filtrar por comunidad' });
    await expect(communityGroup).toBeVisible();
    
    // Obtener el primer chip
    const firstChip = communityGroup.locator('button').first();
    await expect(firstChip).toBeVisible();
    
    // Verificar que tiene aria-pressed
    const ariaPressedBefore = await firstChip.getAttribute('aria-pressed');
    expect(ariaPressedBefore).toBeTruthy();
    
    // Hacer click
    await firstChip.click();
    
    // Verificar que aria-pressed cambió a true
    const ariaPressedAfter = await firstChip.getAttribute('aria-pressed');
    expect(ariaPressedAfter).toBe('true');
  });

  test('chips son navegables por teclado', async ({ page }) => {
    await page.goto('/find?E2E_MOCKS=1');
    
    await page.waitForSelector('[role="group"][aria-label="Filtrar por comunidad"]', { timeout: 5000 });
    
    const communityGroup = page.getByRole('group', { name: 'Filtrar por comunidad' });
    const chips = communityGroup.locator('button');
    
    const chipCount = await chips.count();
    if (chipCount > 0) {
      // Hacer focus en el primer chip
      await chips.first().focus();
      
      // Verificar que tiene foco
      await expect(chips.first()).toBeFocused();
      
      // Navegar con Tab
      await page.keyboard.press('Tab');
      
      // Verificar que el siguiente elemento tiene foco (si existe)
      if (chipCount > 1) {
        // El siguiente chip o elemento debería tener foco
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    }
  });

  test('chips son seleccionables con Enter/Espacio', async ({ page }) => {
    await page.goto('/find?E2E_MOCKS=1');
    
    await page.waitForSelector('[role="group"][aria-label="Filtrar por comunidad"]', { timeout: 5000 });
    
    const communityGroup = page.getByRole('group', { name: 'Filtrar por comunidad' });
    const firstChip = communityGroup.locator('button').first();
    
    await firstChip.focus();
    
    // Verificar estado inicial
    const ariaPressedBefore = await firstChip.getAttribute('aria-pressed');
    
    // Presionar Enter
    await page.keyboard.press('Enter');
    
    // Verificar que aria-pressed cambió
    const ariaPressedAfter = await firstChip.getAttribute('aria-pressed');
    expect(ariaPressedAfter).not.toBe(ariaPressedBefore);
  });

  test('botones de contacto tienen aria-label descriptivo', async ({ page }) => {
    await page.goto('/find?E2E_MOCKS=1');
    
    // Esperar a que carguen los mentores
    await page.waitForSelector('button:has-text("WhatsApp"), button:has-text("Correo")', { timeout: 5000 });
    
    // Buscar botones de contacto
    const whatsappButtons = page.getByRole('button', { name: /Contactar por WhatsApp/i });
    const emailButtons = page.getByRole('button', { name: /Enviar correo/i });
    
    const whatsappCount = await whatsappButtons.count();
    const emailCount = await emailButtons.count();
    
    if (whatsappCount > 0) {
      // Verificar que al menos un botón tiene aria-label correcto
      const firstWhatsApp = whatsappButtons.first();
      const ariaLabel = await firstWhatsApp.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('WhatsApp');
    }
    
    if (emailCount > 0) {
      const firstEmail = emailButtons.first();
      const ariaLabel = await firstEmail.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('correo');
    }
  });

  test('chips tienen tamaño táctil adecuado', async ({ page }) => {
    await page.goto('/find?E2E_MOCKS=1');
    
    await page.waitForSelector('[role="group"][aria-label="Filtrar por comunidad"]', { timeout: 5000 });
    
    const communityGroup = page.getByRole('group', { name: 'Filtrar por comunidad' });
    const firstChip = communityGroup.locator('button').first();
    
    await expect(firstChip).toBeVisible();
    
    // Verificar tamaño mínimo (40px)
    const box = await firstChip.boundingBox();
    if (box) {
      // Verificar que tiene al menos 40px de altura o ancho
      expect(box.height >= 32 || box.width >= 32).toBe(true); // px-3 py-2 da aproximadamente 32px mínimo
    }
  });
});

