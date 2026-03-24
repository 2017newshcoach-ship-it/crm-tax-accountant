import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload, X, ImageIcon, Maximize2, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { useTenant } from '../context/TenantContext';
import { API_BASE_URL, fetchWithAuth, getAuthHeadersForUpload } from '../utils/api';

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

// ── Image Upload Zone ──────────────────────────────────────────────────────────

interface ImageUploadZoneProps {
  imageType: 'logo' | 'background';
  currentUrl: string;
  onUploaded: (url: string) => void;
  tenantSlug: string;
}

const LOGO_SPECS = { width: 200, height: 60, maxMB: 2, accept: '.png,.svg,.webp', label: '로고 이미지', hint: '투명 배경 PNG 또는 SVG 권장' };
const BG_SPECS = { width: 1920, height: 1080, maxMB: 5, accept: '.jpg,.jpeg,.png,.webp', label: '로그인 배경 이미지', hint: '가로형(16:9) 이미지 권장' };

function ImageUploadZone({ imageType, currentUrl, onUploaded, tenantSlug }: ImageUploadZoneProps) {
  const specs = imageType === 'logo' ? LOGO_SPECS : BG_SPECS;
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    const maxBytes = specs.maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`파일 크기는 ${specs.maxMB}MB 이하이어야 합니다.`);
      return;
    }

    setIsUploading(true);
    setProgress(10);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', imageType);

      setProgress(40);
      const response = await fetch(
        `${API_BASE_URL}/tenant/${tenantSlug}/branding/upload`,
        { method: 'POST', headers: getAuthHeadersForUpload(), body: formData }
      );
      setProgress(80);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? '업로드 실패');
      }

      const { url } = await response.json();
      setProgress(100);
      onUploaded(url);
      toast.success('이미지가 업로드되었습니다.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '업로드 실패');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [imageType, tenantSlug, specs.maxMB, onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const isLogo = imageType === 'logo';

  return (
    <div className="space-y-3">
      {/* Spec badge row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
          <Maximize2 className="size-3" />
          권장 {specs.width} × {specs.height}px
        </span>
        <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
          최대 {specs.maxMB}MB
        </span>
        <span className="text-xs text-muted-foreground">{specs.hint}</span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          'relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden cursor-pointer group',
          isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30',
          isLogo ? 'h-24' : 'h-40',
        ].join(' ')}
        onClick={() => !isUploading && inputRef.current?.click()}
        role="button"
        aria-label={`${specs.label} 업로드`}
      >
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt={specs.label}
              className={['w-full h-full', isLogo ? 'object-contain p-3' : 'object-cover'].join(' ')}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-md flex items-center gap-1">
                <Upload className="size-3" /> 교체
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <div className={['rounded-full bg-muted flex items-center justify-center', isLogo ? 'size-10' : 'size-12'].join(' ')}>
              <ImageIcon className={isLogo ? 'size-5' : 'size-6'} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium">클릭하거나 드래그하여 업로드</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{specs.accept.replace(/\./g, '').toUpperCase()}</p>
            </div>
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">업로드 중...</p>
          </div>
        )}
      </div>

      {/* URL input (manual fallback) + clear */}
      <div className="flex gap-2">
        <input
          type="url"
          value={currentUrl}
          onChange={(e) => onUploaded(e.target.value)}
          placeholder="또는 이미지 URL 직접 입력"
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground"
        />
        {currentUrl && (
          <button
            type="button"
            onClick={() => onUploaded('')}
            className="shrink-0 size-9 flex items-center justify-center rounded-lg border hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
            aria-label="이미지 삭제"
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={specs.accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type SettingsTab = 'branding' | 'dev-request';

export function BrandingSettings({ onBack }: BrandingSettingsProps) {
  const { tenant, tenantSlug } = useTenant();
  const [activeTab, setActiveTab] = useState<SettingsTab>('branding');

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
        <h1 className="text-xl font-semibold">설정</h1>
      </div>

      {/* Tab Menu */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
            activeTab === 'branding'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          브랜딩 설정
        </button>
        <button
          onClick={() => setActiveTab('dev-request')}
          className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
            activeTab === 'dev-request'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          개발 문의
        </button>
      </div>

      {/* Dev Request Tab */}
      {activeTab === 'dev-request' && (
        <div className="max-w-lg space-y-4">
          <p className="text-sm text-muted-foreground">
            기능 추가, 수정 요청 등 개발 관련 문의를 이메일로 보내실 수 있습니다.
          </p>
          <Button
            className="w-full gap-2"
            onClick={() => {
              const subject = encodeURIComponent(`[${form.tenantName || tenantSlug}] 개발 요청`);
              const body = encodeURIComponent(
                `안녕하세요,\n\n사무소명: ${form.tenantName || ''}\n테넌트 ID: ${tenantSlug || ''}\n\n요청 내용을 아래에 작성해주세요:\n\n`
              );
              window.open(`mailto:baeby@argonautai.co.kr?subject=${subject}&body=${body}`);
            }}
          >
            <Mail className="size-4" />
            개발자에게 요청하기
          </Button>
        </div>
      )}

      {/* Two-column layout (브랜딩 설정 탭) */}
      {activeTab === 'branding' && (
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

          {/* Section C: 로고 이미지 */}
          <section
            className="bg-card rounded-xl border p-6 space-y-4"
            aria-labelledby="section-logo"
          >
            <h2 id="section-logo" className="text-sm font-semibold text-foreground">
              로고 이미지
            </h2>
            <ImageUploadZone
              imageType="logo"
              currentUrl={form.logoUrl}
              onUploaded={(url) => setForm((prev) => ({ ...prev, logoUrl: url }))}
              tenantSlug={tenantSlug ?? ''}
            />
          </section>

          {/* Section D: 로그인 배경 이미지 */}
          <section
            className="bg-card rounded-xl border p-6 space-y-4"
            aria-labelledby="section-bg"
          >
            <h2 id="section-bg" className="text-sm font-semibold text-foreground">
              로그인 배경 이미지
            </h2>
            <ImageUploadZone
              imageType="background"
              currentUrl={form.loginBgUrl}
              onUploaded={(url) => setForm((prev) => ({ ...prev, loginBgUrl: url }))}
              tenantSlug={tenantSlug ?? ''}
            />
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
      )}
    </div>
  );
}
