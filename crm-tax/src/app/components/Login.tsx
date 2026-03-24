import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { FileText, UserPlus, KeyRound } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import backgroundImage from 'figma:asset/defca6c5e774163963686973981f4d8210cca3e0.png';
import { useTenant } from '../context/TenantContext';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

interface LoginProps {
  onLogin: () => void;
  onAdminLogin: () => void;
  onSignUpClick: () => void;
  onForgotPasswordClick: () => void;
}

export function Login({ onLogin, onAdminLogin, onSignUpClick, onForgotPasswordClick }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { tenant, tenantSlug } = useTenant();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          username,
          password,
          tenantSlug: tenantSlug || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', data.username);
      localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
      
      toast.success('로그인되었습니다.');
      
      if (data.isAdmin) {
        onAdminLogin();
      } else {
        onLogin();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || '로그인에 실패했습니다.');
      setIsLoading(false);
    }
  };

  const bgUrl = tenant?.branding.loginBgUrl ?? backgroundImage;
  const appName = tenant?.name ?? '세무사 고객 관리';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'calc(50% + 150px) center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/50 backdrop-blur-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">{appName}</CardTitle>
          <CardDescription className="text-[var(--color-button,_rgb(0,0,0))]">
            계정으로 로그인하여 상담 내역을 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                type="text"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[var(--color-button,_rgb(0,0,0))]"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="ghost"
              className="text-sm text-[var(--color-button,_rgb(0,0,0))] hover:underline"
              onClick={onSignUpClick}
            >
              <UserPlus className="size-4 mr-2" />
              계정이 없으신가요? 회원가입하기
            </Button>
          </div>
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="ghost"
              className="text-sm text-[var(--color-button,_rgb(0,0,0))] hover:underline"
              onClick={onForgotPasswordClick}
            >
              <KeyRound className="size-4 mr-2" />
              비밀번호를 잊으셨나요? 비밀번호 찾기
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-white text-sm font-medium drop-shadow-lg">
          Developed by Argonautai
        </p>
      </div>
    </div>
  );
}