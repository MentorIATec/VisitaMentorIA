import { test, expect } from '@playwright/test';

test.describe('Registro con MoodFlow', () => {
  test('Flujo completo con valencia dificil → intensidad alta → emoción', async ({ page }) => {
    await page.goto('/register?E2E_MOCKS=1');
    
    // Paso 1: Información básica
    await page.getByLabel('Matrícula o código').fill('A123456');
    
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
    
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // Paso 2: MoodFlow (vista unificada)
    // Verificar encabezado único (sin duplicado)
    await expect(page.getByRole('heading', { name: /¿Cómo se sienten tus emociones hoy\?/i })).toBeVisible();
    await expect(page.getByText('¿Cómo te sientes hoy?')).not.toBeVisible();
    
    // Verificar selector de valencia centrado
    const valenceSelector = page.getByRole('button', { name: /Más difíciles/i });
    await expect(valenceSelector).toBeVisible();
    
    // Seleccionar valencia "dificil"
    await valenceSelector.click();
    
    // Verificar que el slider y las emociones son visibles simultáneamente
    const slider = page.locator('input[type="range"]').first();
    await expect(slider).toBeVisible();
    
    // Verificar pregunta actualizada de intensidad
    await expect(page.getByText(/¿Qué tan intensas se sienten tus emociones ahora\?/i)).toBeVisible();
    
    // Ajustar intensidad alta (5)
    await slider.fill('5');
    await expect(slider).toHaveValue('5');
    
    // Verificar descriptor dinámico "Muy intensas"
    await expect(page.getByText('Muy intensas')).toBeVisible();
    
    // Verificar que las emociones están visibles y centradas
    await expect(page.getByRole('button', { name: 'tensión', exact: true })).toBeVisible();
    
    // Seleccionar emoción "tensión" (debe estar en dificil + alta)
    await page.getByRole('button', { name: 'tensión', exact: true }).click();
    
    // Verificar estado seleccionado del chip (border-emerald-500 bg-emerald-50)
    const tensionChip = page.getByRole('button', { name: 'tensión', exact: true });
    await expect(tensionChip).toHaveAttribute('aria-pressed', 'true');
    
    // Escribir nota
    const noteTextarea = page.getByLabel(/Cuéntanos brevemente/i);
    await noteTextarea.fill('Estoy agobiado con el trabajo de la semana');
    await expect(noteTextarea).toHaveValue('Estoy agobiado con el trabajo de la semana');
    
    // Verificar resumen dinámico con nueva plantilla
    await expect(page.getByText(/Parece que hoy sientes tensión, con intensidad Muy intensas y emociones difíciles/i)).toBeVisible();
    
    // Verificar cierre humanizado visible
    await expect(page.getByText(/Gracias por compartir cómo te sientes hoy/i)).toBeVisible();
    await expect(page.getByText(/Tu registro nos ayuda a acompañarte mejor/i)).toBeVisible();
    
    // Verificar ausencia de checkbox de consentimiento en MoodFlow
    await expect(page.getByLabel(/Consentimiento para seguimiento/i)).not.toBeVisible();
    
    // Enviar registro
    const enviarBtn = page.getByRole('button', { name: 'Enviar' });
    await expect(enviarBtn).toBeEnabled();
    await enviarBtn.click();
    
    // Verificar redirección a /thanks
    await expect(page).toHaveURL(/\/thanks/);
  });

  test('Flujo con valencia agradable → intensidad baja → emoción', async ({ page }) => {
    await page.goto('/register?E2E_MOCKS=1');
    
    // Paso 1: Información básica
    await page.getByLabel('Matrícula o código').fill('B789012');
    
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
    
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // Paso 2: MoodFlow (vista unificada)
    // Seleccionar valencia "agradable"
    await page.getByRole('button', { name: /Más agradables/i }).click();
    
    // Verificar que el slider es visible
    const slider = page.locator('input[type="range"]').first();
    await expect(slider).toBeVisible();
    
    // Ajustar intensidad baja (1)
    await slider.fill('1');
    await expect(slider).toHaveValue('1');
    
    // Verificar descriptor dinámico "Suaves"
    await expect(page.getByText('Suaves')).toBeVisible();
    
    // Verificar que las emociones están visibles
    await expect(page.getByRole('button', { name: 'paz', exact: true })).toBeVisible();
    
    // Seleccionar emoción "paz" (debe estar en agradable + baja)
    await page.getByRole('button', { name: 'paz', exact: true }).click();
    
    // Verificar cierre humanizado
    await expect(page.getByText(/Gracias por compartir cómo te sientes hoy/i)).toBeVisible();
    
    // Enviar
    const enviarBtn = page.getByRole('button', { name: 'Enviar' });
    await expect(enviarBtn).toBeEnabled();
    await enviarBtn.click();
    
    // Verificar redirección
    await expect(page).toHaveURL(/\/thanks/);
  });

  test('Navegación por teclado y botón Atrás mantiene datos', async ({ page }) => {
    await page.goto('/register?E2E_MOCKS=1');
    
    // Paso 1 básico
    await page.getByLabel('Matrícula o código').fill('C345678');
    
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
    
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // MoodFlow (vista unificada): Seleccionar neutral con Enter
    const neutralBtn = page.getByRole('button', { name: /Neutras/i });
    await neutralBtn.focus();
    await neutralBtn.press('Enter');
    
    // Verificar que slider y emociones son visibles simultáneamente
    const slider = page.locator('input[type="range"]').first();
    await expect(slider).toBeVisible();
    
    // Navegar slider con Home/End y verificar descriptores
    await slider.focus();
    await slider.press('End'); // Debe ir a 5
    await expect(slider).toHaveValue('5');
    await expect(page.getByText('Muy intensas')).toBeVisible();
    
    await slider.press('Home'); // Debe ir a 1
    await expect(slider).toHaveValue('1');
    await expect(page.getByText('Suaves')).toBeVisible();
    
    // Ajustar a intensidad 3 (Moderadas)
    await slider.fill('3');
    await expect(page.getByText('Moderadas')).toBeVisible();
    
    // Verificar que las emociones están visibles y seleccionar con Enter
    const firstEmotion = page.locator('button[role="button"]').filter({ hasText: /equilibrio|atención|estabilidad|enfoque/i }).first();
    await expect(firstEmotion).toBeVisible();
    if (await firstEmotion.count() > 0) {
      await firstEmotion.focus();
      await firstEmotion.press('Enter');
    }
    
    // Verificar que botón "Atrás" está visible
    const atrasBtn = page.getByRole('button', { name: 'Atrás' });
    await expect(atrasBtn).toBeVisible();
    
    // Volver atrás
    await atrasBtn.click();
    
    // Verificar que se mantienen los datos del paso 1
    await expect(page.getByLabel('Matrícula o código')).toHaveValue('C345678');
    
    // Volver al paso 2
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // Verificar que los datos del MoodFlow se mantienen (valencia neutral por defecto)
    await expect(page.getByRole('button', { name: /Neutras/i })).toHaveAttribute('aria-pressed', 'true');
  });
});

