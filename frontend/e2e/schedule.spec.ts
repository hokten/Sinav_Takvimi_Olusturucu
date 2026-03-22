import { test, expect } from '@playwright/test';

test.describe('Schedule Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@amasya.edu.tr');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*schedule/);
    await expect(page.getByText('Sistem Yöneticisi').first()).toBeVisible();
  });

  test('should create a new exam successfully', async ({ page }) => {
    // 1. Open Modal
    await page.click('text="+ Sınav Ekle"');
    await expect(page.getByText('Yeni Sınav Ekle')).toBeVisible();

    // 2. Search and select course
    const courseSearch = page.locator('#course-search');
    await courseSearch.click(); // Focus
    await courseSearch.fill('MEK'); 
    
    // Wait for dropdown and click a specific result
    const courseResult = page.locator('button:has-text("MEK")').first();
    await expect(courseResult).toBeVisible({ timeout: 10000 });
    // Use dispatchEvent to ensure the click reaches the button handler bypassing overlays
    await courseResult.dispatchEvent('click');

    // 3. Select Date and Time
    await page.waitForTimeout(500);
    
    const dateSelect = page.locator('#exam-date');
    await dateSelect.selectOption({ index: 1 });
    
    const timeSelect = page.locator('#exam-time');
    await timeSelect.selectOption({ index: 1 });

    // 4. Select Room
    const roomBtn = page.locator('button:has-text("(")').first();
    await expect(roomBtn).toBeVisible();
    await roomBtn.dispatchEvent('click');

    // 5. Select Supervisor
    const supervisorBtn = page.locator('button:has-text("Dr.")').first();
    await expect(supervisorBtn).toBeVisible();
    await supervisorBtn.dispatchEvent('click');

    // 6. Submit
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).not.toBeDisabled();
    await submitBtn.click();

    // 7. Verification
    const toast = page.locator('.fixed.bottom-4.right-4');
    await expect(toast).toBeVisible({ timeout: 15000 });
    
    await expect(toast).toContainText(/eklendi|başarıyla/i);

    // The modal should close
    await expect(page.getByText('Yeni Sınav Ekle')).not.toBeVisible();
  });
});
