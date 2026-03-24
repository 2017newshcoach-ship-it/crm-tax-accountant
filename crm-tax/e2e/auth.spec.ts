import { test, expect } from '@playwright/test';

test.describe('REQ-002: 로그인 화면 렌더링 및 폼 동작', () => {
  test.beforeEach(async ({ page }) => {
    // 인증 상태 없이 시작 (localStorage 비움)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('username');
      localStorage.removeItem('tenantSlug');
    });
    await page.reload();
  });

  test('로그인 폼이 렌더링된다', async ({ page }) => {
    // 로그인 폼 요소 확인
    await expect(page.locator('input[type="text"], input[name="username"], input[placeholder*="아이디"], input[placeholder*="이름"], input[placeholder*="username"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('빈 폼 제출 시 브라우저 validation 또는 API 에러가 발생한다', async ({ page }) => {
    // API mock — 빈 자격증명 거부
    await page.route('**/functions/v1/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
      });
    });

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // 빈 input이 required 처리되거나 에러 메시지가 표시되어야 함
    const isValid = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[required]');
      return inputs.length > 0;
    });

    // required attribute이 있거나, 에러 toast가 나타나야 함
    // 두 가지 중 하나만 충족해도 통과
    if (!isValid) {
      await expect(page.locator('[data-sonner-toast], .toast, [role="alert"]').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('로그인 성공 시 인증 상태가 설정된다 (Mock)', async ({ page }) => {
    // 성공 응답 mock
    await page.route('**/functions/v1/**', route => {
      const url = route.request().url();
      if (url.includes('/login')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ username: 'testuser', isAdmin: false }),
        });
      } else if (url.includes('/clients')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ clients: [] }),
        });
      } else if (url.includes('/consultations')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ consultations: [] }),
        });
      } else {
        route.continue();
      }
    });

    // 폼 입력
    const usernameInput = page.locator('input[type="text"], input:not([type="password"])').first();
    const passwordInput = page.locator('input[type="password"]');

    await usernameInput.fill('testuser');
    await passwordInput.fill('password123');
    await page.locator('button[type="submit"]').click();

    // localStorage에 isAuthenticated가 설정되어야 함
    await page.waitForFunction(
      () => localStorage.getItem('isAuthenticated') === 'true',
      { timeout: 5000 }
    );

    const isAuth = await page.evaluate(() => localStorage.getItem('isAuthenticated'));
    expect(isAuth).toBe('true');
  });
});
