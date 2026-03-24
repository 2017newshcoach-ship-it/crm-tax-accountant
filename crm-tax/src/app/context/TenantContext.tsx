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
    const slug =
      extractSlugFromPath(window.location.pathname) ??
      localStorage.getItem('tenantSlug');

    if (!slug) {
      setIsLoading(false);
      return;
    }

    localStorage.setItem('tenantSlug', slug);
    setTenantSlug(slug);

    const loadTenantConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/tenant/${slug}/config`, {
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
