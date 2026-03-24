import { test, expect } from '@playwright/test';

const MOCK_CLIENTS = [
  {
    id: 'c1',
    userId: 'testuser',
    name: '김철수',
    phone: '010-1234-5678',
    email: 'kim@example.com',
    industry: '제조업',
    isVip: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c2',
    userId: 'testuser',
    name: '이영희',
    phone: '010-9876-5432',
    email: 'lee@example.com',
    industry: '서비스업',
    isVip: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

test.describe('REQ-003: 클라이언트 목록 페이지 렌더링 (Mock API)', () => {
  test.beforeEach(async ({ page }) => {
    // API mock 설정
    await page.route('**/functions/v1/**', route => {
      const url = route.request().url();
      if (url.includes('/clients')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ clients: MOCK_CLIENTS }),
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

    // 인증 상태를 localStorage에 직접 설정
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', 'testuser');
      localStorage.removeItem('tenantSlug');
    });
    await page.reload();
  });

  test('인증 후 캘린더 또는 목록 화면이 로드된다', async ({ page }) => {
    // 인증된 상태에서 앱이 로그인 폼 없이 메인 화면을 보여야 함
    await page.waitForFunction(
      () => localStorage.getItem('isAuthenticated') === 'true',
    );

    // loading spinner가 사라질 때까지 대기
    await page.waitForTimeout(1000);

    // 로그인 화면이 아닌 메인 앱 UI가 보여야 함
    // (네비게이션 버튼, 로그아웃 버튼 등)
    const logoutBtn = page.locator('button').filter({ hasText: /로그아웃|logout/i });
    const calendarBtn = page.locator('button').filter({ hasText: /캘린더|calendar/i });
    const clientBtn = page.locator('button').filter({ hasText: /고객|clients|목록/i });

    const hasNavigation = await Promise.race([
      logoutBtn.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false),
      calendarBtn.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false),
      clientBtn.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false),
    ]);

    expect(hasNavigation).toBe(true);
  });

  test('고객 목록 탭에서 Mock 고객이 표시된다', async ({ page }) => {
    await page.waitForTimeout(1500);

    // 고객 목록 버튼 클릭
    const listBtn = page.locator('button').filter({ hasText: /고객|목록|clients/i }).first();
    if (await listBtn.isVisible()) {
      await listBtn.click();
    }

    // Mock 고객 이름이 화면에 표시되어야 함
    await expect(page.locator('text=김철수')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=이영희')).toBeVisible({ timeout: 5000 });
  });
});
