import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

const ADMIN_SLUGS = new Set(['admin']);

interface TenantBranding {
  primaryColor: string;
  buttonColor: string;
  loginBgUrl: string;
  logoUrl: string;
}

interface TenantConfig {
  slug: string;
  name: string;
  branding: TenantBranding;
}

interface TenantContextValue {
  tenant: TenantConfig | null;
  tenantSlug: string | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextValue | null>(null);

function extractSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/([a-z0-9-]+)(\/|$)/);
  if (!match) return null;
  const slug = match[1];
  if (ADMIN_SLUGS.has(slug)) return null;
  return slug;
}

function applyBrandingCssVars(branding: TenantBranding): void {
  document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
  document.documentElement.style.setProperty('--color-button', branding.buttonColor);
}

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlSlug = extractSlugFromPath(window.location.pathname);
    const storedSlug = localStorage.getItem('tenantSlug');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    // 인증 상태에서는 로그인 시 서버가 지정한 tenantSlug를 신뢰 (URL로 덮어쓰지 않음)
    // 비인증 상태에서는 URL 경로를 우선 사용 (로그인 페이지 브랜딩용)
    const slug = isAuthenticated
      ? (storedSlug ?? urlSlug)
      : (urlSlug ?? storedSlug);

    if (!slug) {
      setIsLoading(false);
      return;
    }

    // 비인증 상태일 때만 localStorage 업데이트 (로그인 후에는 Login.tsx가 담당)
    if (!isAuthenticated && urlSlug) {
      localStorage.setItem('tenantSlug', urlSlug);
    }
    setTenantSlug(slug);

    // 브랜딩은 URL 슬러그 기준으로 로드 (로그인 페이지에서 올바른 브랜딩 표시)
    const brandingSlug = urlSlug ?? slug;
    const loadTenantConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/tenant/${brandingSlug}/config`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });

        if (response.status === 404) {
          setError('존재하지 않는 사무소입니다');
          return;
        }

        if (!response.ok) {
          setError('테넌트 정보를 불러오는데 실패했습니다');
          return;
        }

        const data = await response.json();
        setTenant(data.tenant as TenantConfig);
        applyBrandingCssVars(data.tenant.branding);
        document.title = data.tenant.name;
      } catch {
        setError('테넌트 정보를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadTenantConfig();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, tenantSlug, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
