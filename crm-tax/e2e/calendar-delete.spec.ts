import { test, expect } from '@playwright/test';

const TODAY = new Date();
const CONSULTATION_DATE = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`;

const MOCK_CLIENT = {
  id: 'client-001',
  name: '김세무',
  email: 'kim@example.com',
  phone: '010-1234-5678',
  isVip: false,
  tenantId: 'cta-kkn',
};

const MOCK_CONSULTATION = {
  id: 'consult-001',
  clientId: 'client-001',
  date: CONSULTATION_DATE,
  time: '10:00',
  content: '세금 신고 상담',
  isImportant: false,
  status: 'scheduled' as const,
  color: 'teal',
  tenantId: 'cta-kkn',
};

test.describe('REQ-003: 캘린더 뷰 상담 삭제', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all Supabase function calls
    await page.route('**/functions/v1/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      // DELETE consultation
      if (method === 'DELETE' && url.includes('/consultations/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
        return;
      }

      // GET /clients
      if (method === 'GET' && url.includes('/clients') && !url.includes('/consultations')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ clients: [MOCK_CLIENT] }),
        });
        return;
      }

      // GET /consultations (top-level)
      if (method === 'GET' && url.includes('/consultations')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ consultations: [MOCK_CONSULTATION] }),
        });
        return;
      }

      await route.continue();
    });

    // Navigate and set auth state
    await page.goto('/cta-kkn/');
    await page.evaluate(() => {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', 'admin');
      localStorage.setItem('tenantSlug', 'cta-kkn');
    });
    await page.reload();
    await page.waitForTimeout(1500);
  });

  test('REQ-003: 삭제 버튼 클릭 시 인라인 확인 행이 표시된다', async ({ page }) => {
    // Click on today's date cell to select it and show the consultation panel
    const todayDay = TODAY.getDate().toString();
    // Find the date cell in the calendar grid by looking for a button containing the day number
    const dateCell = page.locator(`button`).filter({ hasText: new RegExp(`^${todayDay}$`) }).first();

    const dateCellVisible = await dateCell.isVisible({ timeout: 5000 }).catch(() => false);
    if (!dateCellVisible) {
      // Try clicking on calendar date directly
      await page.locator(`text=${todayDay}`).first().click();
    } else {
      await dateCell.click();
    }

    await page.waitForTimeout(500);

    // Find the MoreVertical (⋮) button on the consultation card
    const moreButton = page
      .locator('[data-radix-popper-content-wrapper]')
      .or(page.locator('button').filter({ hasText: '' }))
      .first();

    // Look for the MoreVertical button specifically — it has no text, just an icon
    const verticalDotButton = page
      .locator('button.size-7, button[class*="size-7"]')
      .first();

    const verticalDotVisible = await verticalDotButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (verticalDotVisible) {
      await verticalDotButton.click();
    } else {
      // Try a broader selector for the dropdown trigger
      const dropdownTrigger = page.locator('[aria-haspopup="menu"], [data-state]').first();
      await dropdownTrigger.click();
    }

    await page.waitForTimeout(300);

    // Click "삭제" in the dropdown
    const deleteMenuItem = page.locator('[role="menuitem"]').filter({ hasText: '삭제' }).first();
    await deleteMenuItem.waitFor({ state: 'visible', timeout: 5000 });
    await deleteMenuItem.click();

    // Verify inline confirm row appears
    const confirmText = page.locator('text=정말 삭제할까요?');
    await expect(confirmText).toBeVisible({ timeout: 3000 });
  });

  test('REQ-003: 삭제 확인 후 카드가 제거되고 성공 토스트가 표시된다', async ({ page }) => {
    // Click on today's date to show consultation panel
    const todayDay = TODAY.getDate().toString();
    const dateCell = page.locator('button').filter({ hasText: new RegExp(`^${todayDay}$`) }).first();

    const dateCellVisible = await dateCell.isVisible({ timeout: 5000 }).catch(() => false);
    if (dateCellVisible) {
      await dateCell.click();
    } else {
      await page.locator(`text=${todayDay}`).first().click();
    }

    await page.waitForTimeout(500);

    // Click the MoreVertical button on the consultation card
    const moreButton = page
      .locator('button.size-7, button[class*="size-7"]')
      .first();

    const moreVisible = await moreButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (moreVisible) {
      await moreButton.click();
    } else {
      const dropdownTrigger = page.locator('[aria-haspopup="menu"]').first();
      await dropdownTrigger.click();
    }

    await page.waitForTimeout(300);

    // Click "삭제" in dropdown
    const deleteMenuItem = page.locator('[role="menuitem"]').filter({ hasText: '삭제' }).first();
    await deleteMenuItem.waitFor({ state: 'visible', timeout: 5000 });
    await deleteMenuItem.click();

    // Wait for inline confirm to appear
    await expect(page.locator('text=정말 삭제할까요?')).toBeVisible({ timeout: 3000 });

    // Click the confirm "삭제" button (destructive variant, not the dropdown item)
    const confirmDeleteButton = page
      .locator('button[class*="destructive"]')
      .filter({ hasText: '삭제' })
      .first();

    await confirmDeleteButton.waitFor({ state: 'visible', timeout: 3000 });
    await confirmDeleteButton.click();

    // Verify the consultation card disappears
    // The client name "김세무" should no longer be visible in the panel
    await expect(page.locator('text=김세무')).toBeHidden({ timeout: 5000 });

    // Verify success toast appears containing "삭제"
    const toast = page
      .locator('[data-sonner-toast], [role="status"], [data-type="success"]')
      .filter({ hasText: /삭제/ })
      .first();

    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});
