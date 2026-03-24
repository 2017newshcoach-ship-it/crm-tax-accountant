import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, Users, Trash2, Plus, LogOut, Eye, EyeOff, Link } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

interface Tenant {
  id: string;
  slug: string;
  name: string;
  ownerUsername: string;
  userCount: number;
  createdAt: string;
  branding?: unknown;
}

interface NewTenantForm {
  slug: string;
  name: string;
}

const EMPTY_FORM: NewTenantForm = {
  slug: '',
  name: '',
};

function getSuperAdminHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
    'X-Super-Admin-Key': sessionStorage.getItem('superAdminKey') ?? '',
  };
}

// ── Login Screen ──────────────────────────────────────────────────────────────

interface LoginScreenProps {
  onAuthenticated: () => void;
}

function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/tenants`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Super-Admin-Key': key.trim(),
        },
      });

      if (response.ok) {
        sessionStorage.setItem('superAdminKey', key.trim());
        onAuthenticated();
      } else if (response.status === 403) {
        setError('잘못된 관리자 키입니다');
      } else {
        setError('인증 중 오류가 발생했습니다');
      }
    } catch {
      setError('서버에 연결할 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Building2 className="size-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">플랫폼 관리자</CardTitle>
          <CardDescription>슈퍼 관리자 키를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key">관리자 키</Label>
              <div className="relative">
                <Input
                  id="admin-key"
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="관리자 키 입력"
                  className="pr-10"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showKey ? '키 숨기기' : '키 보기'}
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !key.trim()}>
              {isLoading ? '인증 중...' : '확인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Dashboard Screen ──────────────────────────────────────────────────────────

interface DashboardScreenProps {
  onLogout: () => void;
}

function DashboardScreen({ onLogout }: DashboardScreenProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [form, setForm] = useState<NewTenantForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<NewTenantForm>>({});
  const [debugKeys, setDebugKeys] = useState<{ total: number; grouped: Record<string, string[]> } | null>(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);

  const handleDebugKeys = async () => {
    setIsLoadingDebug(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/debug/keys`, {
        headers: getSuperAdminHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'KV 키 조회 실패');
      setDebugKeys(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'KV 키 조회 실패');
    } finally {
      setIsLoadingDebug(false);
    }
  };

  const fetchTenants = useCallback(async () => {
    setIsLoadingTenants(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tenants`, {
        headers: getSuperAdminHeaders(),
      });

      if (!response.ok) {
        throw new Error('테넌트 목록을 가져올 수 없습니다');
      }

      const data = await response.json();
      setTenants(data.tenants ?? []);
    } catch {
      toast.error('테넌트 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const validateForm = (): boolean => {
    const errors: Partial<NewTenantForm> = {};
    const slugPattern = /^[a-z0-9-]{3,20}$/;

    if (!slugPattern.test(form.slug)) {
      errors.slug = '영문 소문자, 숫자, 하이픈만 사용 가능하며 3~20자여야 합니다';
    }
    if (!form.name.trim()) {
      errors.name = '상호명을 입력해주세요';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tenants`, {
        method: 'POST',
        headers: getSuperAdminHeaders(),
        body: JSON.stringify({
          slug: form.slug,
          name: form.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? '테넌트 생성에 실패했습니다');
      }

      const pageUrl = `${window.location.origin}/${form.slug}/`;
      toast.success('테넌트가 생성되었습니다', {
        description: pageUrl,
        action: {
          label: '링크 복사',
          onClick: () => navigator.clipboard.writeText(pageUrl),
        },
      });
      setForm(EMPTY_FORM);
      setFormErrors({});
      await fetchTenants();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '테넌트 생성에 실패했습니다';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const updateField = (field: keyof NewTenantForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Building2 className="size-5 text-primary" />
            </div>
            <span className="font-semibold text-lg">플랫폼 관리자</span>
          </div>
          <Button
            variant="ghost"
            onClick={onLogout}
            className="rounded-lg px-3 h-9 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <LogOut className="size-4 mr-1.5" />
            로그아웃
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-8">
        {/* Tenant List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Building2 className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">테넌트 목록</CardTitle>
                  <CardDescription>등록된 사무소 테넌트를 관리합니다</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                총 {tenants.length}개
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTenants ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">테넌트 목록을 불러오는 중...</div>
              </div>
            ) : tenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="size-12 text-muted-foreground mb-3" />
                <div className="text-lg font-semibold mb-1">등록된 테넌트가 없습니다</div>
                <div className="text-sm text-muted-foreground">
                  아래 양식으로 첫 번째 테넌트를 등록해주세요
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">슬러그</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">상호명</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">오너 계정</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">유저 수</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">생성일</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <TenantRow
                        key={tenant.id}
                        tenant={tenant}
                        formatDate={formatDate}
                        onDeleted={fetchTenants}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Tenant Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Plus className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">신규 테넌트 등록</CardTitle>
                <CardDescription>새로운 사무소 테넌트를 등록합니다</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTenant} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  id="slug"
                  label="슬러그"
                  value={form.slug}
                  onChange={(v) => updateField('slug', v)}
                  placeholder="koh"
                  error={formErrors.slug}
                  hint="영문 소문자, 숫자, 하이픈 (3~20자)"
                />
                <FormField
                  id="name"
                  label="상호명"
                  value={form.name}
                  onChange={(v) => updateField('name', v)}
                  placeholder="고경남 세무사"
                  error={formErrors.name}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="min-w-32">
                  {isSubmitting ? '등록 중...' : '테넌트 등록'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* KV Store Debug */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">KV 스토어 진단</CardTitle>
                <CardDescription>데이터 마이그레이션 문제 확인용 — 실제 저장된 키 목록을 조회합니다</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDebugKeys}
                disabled={isLoadingDebug}
              >
                {isLoadingDebug ? '조회 중...' : '키 목록 조회'}
              </Button>
            </div>
          </CardHeader>
          {debugKeys && (
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">총 {debugKeys.total}개 키</p>
              <div className="space-y-3">
                {Object.entries(debugKeys.grouped).map(([prefix, keys]) => (
                  <div key={prefix}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      {prefix} ({keys.length}개)
                    </p>
                    <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
                      {keys.map((k) => (
                        <div key={k} className="text-xs font-mono py-0.5">{k}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}

// ── Tenant Row ────────────────────────────────────────────────────────────────

interface TenantRowProps {
  tenant: Tenant;
  formatDate: (date: string) => string;
  onDeleted: () => void;
}

function TenantRow({ tenant, formatDate, onDeleted }: TenantRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  // 'idle' | 'confirm-migrate' | 'confirm-delete'
  const [confirmState, setConfirmState] = useState<'idle' | 'confirm-migrate' | 'confirm-delete'>('idle');

  const executeMigrate = async () => {
    setConfirmState('idle');
    setIsMigrating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/migrate`, {
        method: 'POST',
        headers: getSuperAdminHeaders(),
        body: JSON.stringify({ targetTenantSlug: tenant.slug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? '마이그레이션 실패');
      toast.success(
        `마이그레이션 완료 — 유저 ${data.usersUpdated}명, 고객 ${data.clientsCopied}건, 상담 ${data.consultationsCopied}건`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '마이그레이션 실패');
    } finally {
      setIsMigrating(false);
    }
  };

  const executeDelete = async () => {
    setConfirmState('idle');
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tenants/${tenant.slug}`, {
        method: 'DELETE',
        headers: getSuperAdminHeaders(),
      });

      if (response.status === 404) {
        toast.error('삭제 API가 지원되지 않습니다');
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? '삭제에 실패했습니다');
      }

      toast.success(`"${tenant.name}" 테넌트가 삭제되었습니다`);
      onDeleted();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '삭제에 실패했습니다';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
        <td className="py-3 px-4">
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{tenant.slug}</code>
        </td>
        <td className="py-3 px-4 font-medium">{tenant.name}</td>
        <td className="py-3 px-4 text-muted-foreground">{tenant.ownerUsername}</td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-3.5" />
            {tenant.userCount}
          </div>
        </td>
        <td className="py-3 px-4 text-muted-foreground">{formatDate(tenant.createdAt)}</td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const pageUrl = `${window.location.origin}/${tenant.slug}/`;
                navigator.clipboard.writeText(pageUrl);
                toast.success('링크가 복사되었습니다', { description: pageUrl });
              }}
              className="size-8"
              aria-label="페이지 링크 복사"
            >
              <Link className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmState('confirm-migrate')}
              disabled={isMigrating || confirmState !== 'idle'}
              className="text-xs h-8"
            >
              {isMigrating ? '이전 중...' : '레거시 데이터 이전'}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setConfirmState('confirm-delete')}
              disabled={isDeleting || confirmState !== 'idle'}
              aria-label={`${tenant.name} 테넌트 삭제`}
              className="size-8"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </td>
      </tr>
      {confirmState === 'confirm-migrate' && (
        <tr className="bg-amber-50 dark:bg-amber-950/20 border-b">
          <td colSpan={6} className="px-4 py-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-amber-800 dark:text-amber-300">
                <strong>{tenant.name}</strong> 테넌트로 레거시 데이터를 이전합니다. 기존 고객/상담 데이터가 복사됩니다.
              </span>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" className="h-7 text-xs" onClick={executeMigrate}>확인</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmState('idle')}>취소</Button>
              </div>
            </div>
          </td>
        </tr>
      )}
      {confirmState === 'confirm-delete' && (
        <tr className="bg-destructive/5 border-b">
          <td colSpan={6} className="px-4 py-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-destructive">
                <strong>{tenant.name}</strong> 테넌트를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
              </span>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={executeDelete}>삭제</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmState('idle')}>취소</Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Form Field helper ─────────────────────────────────────────────────────────

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  type?: string;
}

function FormField({ id, label, value, onChange, placeholder, error, hint, type = 'text' }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? 'border-destructive' : ''}
      />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Root Component ────────────────────────────────────────────────────────────

export function SuperAdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!sessionStorage.getItem('superAdminKey');
  });

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('superAdminKey');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onAuthenticated={handleAuthenticated} />;
  }

  return <DashboardScreen onLogout={handleLogout} />;
}
