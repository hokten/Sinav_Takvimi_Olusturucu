import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully as admin', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[type="email"]', 'admin@amasya.edu.tr');
    await page.fill('input[type="password"]', 'admin123'); // Assuming standard mock password
    
    await page.click('button[type="submit"]');

    // Should redirect to schedule
    await expect(page).toHaveURL(/.*schedule/);
    
    // Check if user name or a dashboard element is visible
    await expect(page.getByText('Sistem Yöneticisi').first()).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpass');
    
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.getByText(/Email veya şifre hatalı/i)).toBeVisible();
  });
});
