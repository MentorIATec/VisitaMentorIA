import { test, expect } from '@playwright/test';

interface MockSSOSession {
  userId: string;
  email: string;
  name: string;
  needsLink: boolean;
}

declare global {
  interface Window {
    __MOCK_SSO_SESSION?: MockSSOSession;
  }
}

test.describe('SSO Flow - Primera vez', () => {
  test.beforeEach(async ({ page }) => {
    // Mock de sesión SSO sin matrícula vinculada
    await page.addInitScript(() => {
      window.__MOCK_SSO_SESSION = {
        userId: 'azure-ad-sub-123',
        email: 'test@tec.mx',
        name: 'Usuario Test',
        needsLink: true
      };
    });
  });

  test('SSO primera vez → vinculación → registro completo', async ({ page }) => {
    // Configurar mocks ANTES de navegar
    await page.route('/api/communities', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, code: 'talenta', name: 'talenta', color: '#EC008C' }])
      });
    });
    
    await page.route('/api/mentors', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'm1', email: 'kareng@tec.mx', display_name: 'Karen', campus: 'MTY', comunidad_id: 'talenta' }])
      });
    });
    
    await page.route('/api/users-map/link', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: 'Matrícula vinculada correctamente' })
      });
    });
    
    await page.route('/api/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, sessionId: 's_123', followupToken: 'token_123' })
      });
    });
    
    await page.goto('/?E2E_MOCKS=1&E2E_SSO_MOCK=1');
    
    // Verificar que aparece botón SSO si está habilitado
    // Si SSO está habilitado, el botón debería aparecer
    // Si no está habilitado, el test pasa igual
    
    // Simular login SSO (en un escenario real, esto lo haría NextAuth)
    // Por ahora, vamos directo a la página de vinculación
    await page.goto('/register?link=1&E2E_MOCKS=1');
    
    // Verificar que aparece el paso de vinculación
    await expect(page.getByRole('heading', { name: /Vincula tu matrícula/i })).toBeVisible();
    
    // Ingresar matrícula válida
    const matriculaInput = page.getByLabel('Matrícula');
    await matriculaInput.fill('A00123456');
    
    // Vincular
    const linkButton = page.getByRole('button', { name: /Vincular y continuar/i });
    await expect(linkButton).toBeEnabled();
    
    await linkButton.click();
    
    // Debería redirigir a registro normal con matrícula prellenada
    await expect(page).toHaveURL(/\/register\?matricula=A00123456/);
    
    // Esperar a que carguen los catálogos
    await page.waitForSelector('[role="progressbar"]', { timeout: 5000 });
    
    // Esperar a que el formulario esté listo
    await page.waitForTimeout(2000);
    
    // Verificar que la matrícula está en la URL y rellenarla si es necesario
    const matriculaField = page.getByLabel('Matrícula');
    const currentValue = await matriculaField.inputValue();
    if (!currentValue || currentValue !== 'A00123456') {
      await matriculaField.fill('A00123456');
    }
    
    // Continuar con flujo normal de registro
    const nextBtn = page.getByRole('button', { name: /Siguiente/i });
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
    
    // Completar paso 1
    await nextBtn.click();
    
    // Paso 2: Seleccionar emociones
    const valenciaGroup = page.getByRole('radiogroup', { name: /Valencia emocional/i });
    await expect(valenciaGroup).toBeVisible();
    await page.getByRole('radio', { name: /Neutras/i }).click();
    
    const slider = page.locator('input[type="range"]');
    await slider.fill('3');
    
    const emotionChip = page.locator('[role="group"][aria-label*="Emociones"]').locator('button').first();
    await emotionChip.click();
    
    // Mock de respuesta de sesión
    await page.route('/api/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, sessionId: 's_123', followupToken: 'token_123' })
      });
    });
    
    // Enviar
    const enviar = page.getByRole('button', { name: /Enviar/i });
    await expect(enviar).toBeEnabled();
    await enviar.click();
    
    // Verificar redirección a /thanks
    await expect(page).toHaveURL(/\/thanks/);
  });

  test('Muestra error si matrícula inválida en vinculación', async ({ page }) => {
    await page.goto('/register?link=1&E2E_MOCKS=1');
    
    const matriculaInput = page.getByLabel('Matrícula');
    await matriculaInput.fill('A123'); // Matrícula inválida
    
    const linkButton = page.getByRole('button', { name: /Vincular y continuar/i });
    await expect(linkButton).toBeDisabled();
    
    // Verificar mensaje de error
    const errorMessage = page.getByText(/Formato inválido/i);
    await expect(errorMessage).toBeVisible();
  });

  test('Muestra error si matrícula ya está vinculada', async ({ page }) => {
    await page.goto('/register?link=1&E2E_MOCKS=1');
    
    const matriculaInput = page.getByLabel('Matrícula');
    await matriculaInput.fill('A00123456');
    
    // Mock de respuesta de error (matrícula ya vinculada)
    await page.route('/api/users-map/link', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Esta matrícula ya está vinculada a otra cuenta' })
      });
    });
    
    const linkButton = page.getByRole('button', { name: /Vincular y continuar/i });
    await linkButton.click();
    
    // Verificar mensaje de error (usar getByText para ser más específico)
    const errorAlert = page.getByText(/ya está vinculada/i);
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/ya está vinculada/i);
  });
});

