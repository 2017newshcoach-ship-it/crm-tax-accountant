import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from './ui/button';
import { useTenant } from '../context/TenantContext';
import { API_BASE_URL, fetchWithAuth } from '../utils/api';

interface BrandingSettingsProps {
  onBack: () => void;
}

interface BrandingFormState {
  tenantName: string;
  primaryColor: string;
  buttonColor: string;
  logoUrl: string;
  loginBgUrl: string;
}

function applyColorVars(primaryColor: string, buttonColor: string): void {
  document.documentElement.style.setProperty('--color-primary', primaryColor);
  document.documentElement.style.setProperty('--color-button', buttonColor);
}

export function BrandingSettings({ onBack }: BrandingSettingsProps) {
  const { tenant, tenantSlug } = useTenant();

  const [form, setForm] = useState<BrandingFormState>({
    tenantName: tenant?.name ?? '',
    primaryColor: tenant?.branding?.primaryColor ?? '#2563eb',
    buttonColor: tenant?.branding?.buttonColor ?? '#2563eb',
    logoUrl: tenant?.branding?.logoUrl ?? '',
    loginBgUrl: tenant?.branding?.loginBgUrl ?? '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handlePrimaryColorChange = (value: string) => {
    setForm((prev) => ({ ...prev, primaryColor: value }));
    document.documentElement.style.setProperty('--color-primary', value);
  };

  const handleButtonColorChange = (value: string) => {
    setForm((prev) => ({ ...prev, buttonColor: value }));
    document.documentElement.style.setProperty('--color-button', value);
  };

  const handleSave = async () => {
    if (!tenantSlug) {
      toast.error('테넌트 정보를 찾을 수 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/tenant/${tenantSlug}/branding`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: form.tenantName,
            primaryColor: form.primaryColor,
            buttonColor: form.buttonColor,
            loginBgUrl: form.loginBgUrl,
            logoUrl: form.logoUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('브랜딩 저장 실패');
      }

      applyColorVars(form.primaryColor, form.buttonColor);
      document.title = form.tenantName || document.title;
      toast.success('브랜딩 설정이 저장되었습니다.');
    } catch {
      toast.error('브랜딩 설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="size-4 mr-1" />
          뒤로
        </Button>
        <h1 className="text-xl font-semibold">브랜딩 설정</h1>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Edit Form */}
        <div className="space-y-6">
          {/* Section A: 기본 정보 */}
          <section
            className="bg-card rounded-xl border p-6 space-y-4"
            aria-labelledby="section-basic"
          >
            <h2 id="section-basic" className="text-sm font-semibold text-foreground">
              기본 정보
            </h2>
            <div className="space-y-2">
              <label
                htmlFor="tenantName"
                className="block text-sm font-medium text-muted-foreground"
              >
                상호명
              </label>
              <input
                id="tenantName"
                type="text"
                value={form.tenantName}
                onChange={(e) => setForm((prev) => ({ ...prev, tenantName: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="세무사 사무소 이름"
              />
            </div>
          </section>

          {/* Section B: 색상 설정 */}
          <section
            className="bg-card rounded-xl border p-6 space-y-4"
            aria-labelledby="section-colors"
          >
            <h2 id="section-colors" className="text-sm font-semibold text-foreground">
              색상 설정
            </h2>

            {/* Primary Color */}
            <div className="space-y-2">
              <label
                htmlFor="primaryColor"
                className="block text-sm font-medium text-muted-foreground"
              >
                주색상 (Primary Color)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="primaryColor"
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => handlePrimaryColorChange(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border bg-background p-1"
                  aria-label="주색상 선택"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      handlePrimaryColorChange(value);
                    }
                  }}
                  className="w-32 rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="#2563eb"
                  aria-label="주색상 헥스 값"
                />
                <div
                  className="h-8 w-8 rounded-md border"
                  style={{ backgroundColor: form.primaryColor }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Button Color */}
            <div className="space-y-2">
              <label
                htmlFor="buttonColor"
                className="block text-sm font-medium text-muted-foreground"
              >
                버튼 색상 (Button Color)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="buttonColor"
                  type="color"
                  value={form.buttonColor}
                  onChange={(e) => handleButtonColorChange(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border bg-background p-1"
                  aria-label="버튼 색상 선택"
                />
                <input
                  type="text"
                  value={form.buttonColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      handleButtonColorChange(value);
                    }
                  }}
                  className="w-32 rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="#2563eb"
                  aria-label="버튼 색상 헥스 값"
                />
                <div
                  className="h-8 w-8 rounded-md border"
                  style={{ backgroundColor: form.buttonColor }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </section>

          {/* Section C: 로고 URL */}
          <section
            className="bg-card rounded-xl border p-6 space-y-4"
            aria-labelledby="section-logo"
          >
            <h2 id="section-logo" className="text-sm font-semibold text-foreground">
              로고 이미지
            </h2>
            <div className="space-y-2">
              <label
                htmlFor="logoUrl"
                className="block text-sm font-medium text-muted-foreground"
              >
                로고 URL
              </label>
              <input
                id="logoUrl"
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                SVG 또는 PNG 권장. 파일 업로드는 추후 지원 예정입니다.
              </p>
              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="로고 미리보기"
                  className="h-12 w-auto rounded border bg-background object-contain p-1"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </section>

          {/* Section D: 배경 이미지 URL */}
          <section
            className="bg-card rounded-xl border p-6 space-y-4"
            aria-labelledby="section-bg"
          >
            <h2 id="section-bg" className="text-sm font-semibold text-foreground">
              로그인 배경 이미지
            </h2>
            <div className="space-y-2">
              <label
                htmlFor="loginBgUrl"
                className="block text-sm font-medium text-muted-foreground"
              >
                배경 이미지 URL
              </label>
              <input
                id="loginBgUrl"
                type="url"
                value={form.loginBgUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, loginBgUrl: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="https://example.com/background.jpg"
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP 권장. 파일 업로드는 추후 지원 예정입니다.
              </p>
              {form.loginBgUrl && (
                <img
                  src={form.loginBgUrl}
                  alt="배경 이미지 썸네일"
                  className="h-20 w-full rounded border object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </section>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gap-2"
          >
            <Save className="size-4" />
            {isSaving ? '저장 중...' : '브랜딩 설정 저장'}
          </Button>
        </div>

        {/* Right: Login Page Preview */}
        <div className="space-y-3 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold text-foreground">
            로그인 페이지 미리보기
          </h2>
          <div
            className="relative rounded-xl border overflow-hidden shadow-lg"
            style={{ height: '420px' }}
            role="img"
            aria-label="로그인 페이지 미리보기"
          >
            {/* Background */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200"
              style={
                form.loginBgUrl
                  ? {
                      backgroundImage: `url(${form.loginBgUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {}
              }
              aria-hidden="true"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20" aria-hidden="true" />

            {/* Login Card */}
            <div className="relative flex items-center justify-center h-full p-6">
              <div className="w-full max-w-xs bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 space-y-4">
                {/* Logo */}
                {form.logoUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={form.logoUrl}
                      alt="로고"
                      className="h-10 w-auto object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}

                {/* Tenant Name */}
                <div className="text-center">
                  <h3
                    className="text-base font-semibold"
                    style={{ color: form.primaryColor }}
                  >
                    {form.tenantName || '사무소명'}
                  </h3>
                  <div
                    className="mt-1 mx-auto h-0.5 w-12 rounded"
                    style={{ backgroundColor: form.primaryColor }}
                    aria-hidden="true"
                  />
                </div>

                {/* Fake Inputs */}
                <div className="space-y-2" aria-hidden="true">
                  <div className="h-8 rounded-md border bg-gray-50 px-3 flex items-center">
                    <span className="text-xs text-gray-400">아이디 입력</span>
                  </div>
                  <div className="h-8 rounded-md border bg-gray-50 px-3 flex items-center">
                    <span className="text-xs text-gray-400">비밀번호 입력</span>
                  </div>
                </div>

                {/* Fake Login Button */}
                <div
                  className="h-9 rounded-md flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: form.buttonColor }}
                  aria-hidden="true"
                >
                  로그인
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            색상 및 이미지 변경 시 실시간으로 반영됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
