import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { FileText, Mail, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { useTenant } from '../context/TenantContext';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

interface SignUpProps {
  onBack: () => void;
  onSignUpSuccess: () => void;
}

export function SignUp({ onBack, onSignUpSuccess }: SignUpProps) {
  const { tenantSlug, tenant } = useTenant();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    email: '',
    verificationCode: '',
  });
  const [sentCode, setSentCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [devMode, setDevMode] = useState(false); // 개발 모드 여부
  const [displayCode, setDisplayCode] = useState(''); // 화면에 표시할 코드

  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    // 간단한 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsSendingCode(true);
    try {
      // 🔍 헬스 체크 먼저 실행!
      console.log('🔍 [HEALTH CHECK] Checking server API key status...');
      try {
        const healthResponse = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });
        const healthData = await healthResponse.json();
        console.log('✅ [HEALTH CHECK] Server status:', healthData);
      } catch (healthError) {
        console.error('❌ [HEALTH CHECK] Failed:', healthError);
      }
      
      // 6자리 랜덤 숫자 생성
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log('[FRONTEND] Sending verification code:', code, 'to', formData.email);
      
      const response = await fetch(`${API_BASE_URL}/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: formData.email,
          code: code,
        }),
      });

      const data = await response.json();
      console.log('[FRONTEND] Verification response:', data);
      console.log('[FRONTEND] Response details:', {
        success: data.success,
        message: data.message,
        hasDevCode: !!data.devCode,
        devCode: data.devCode
      });

      if (!response.ok) {
        throw new Error('인증 코드 전송 실패');
      }

      setSentCode(code);
      setCodeSent(true);
      
      // devCode가 있으면 이메일이 실제로 발송되지 않은 것
      if (data.devCode) {
        console.warn('[FRONTEND] Email not sent! Using dev code:', data.devCode);
        toast.warning(
          '⚠️ 이메일 발송 실패 (개발 모드)\n콘솔에서 인증 코드를 확인하세요: ' + data.devCode,
          { duration: 10000 }
        );
        setDevMode(true);
        setDisplayCode(data.devCode);
      } else {
        toast.success('✅ 인증 코드가 이메일로 전송되었습니다!');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast.error('인증 코드 전송에 실패했습니다.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검증
    if (formData.password !== formData.passwordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 강도 검증 (영문 + 숫자)
    const hasLetter = /[a-zA-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    if (!hasLetter || !hasNumber) {
      toast.error('비밀번호는 영문과 숫자를 포함해야 합니다.');
      return;
    }

    // 아이디 검증 (3-20자, 영문/숫자/언더스코어)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      toast.error('아이디는 3-20자의 영문, 숫자, 언더스코어만 사용할 수 있습니다.');
      return;
    }

    if (!sentCode) {
      toast.error('이메일 인증을 진행해주세요.');
      return;
    }

    if (formData.verificationCode !== sentCode) {
      toast.error('인증 코드가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[SIGNUP] Attempting signup with:', {
        username: formData.username,
        email: formData.email,
        passwordLength: formData.password.length,
      });

      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          tenantSlug: tenantSlug || undefined,
        }),
      });

      const data = await response.json();
      console.log('[SIGNUP] Response:', { status: response.status, data });
      console.log('[SIGNUP] Full response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('[SIGNUP] Server error response:', data);
        throw new Error(data.error || '회원가입 실패');
      }

      toast.success('회원가입이 완료되���습니다!');
      onSignUpSuccess();
    } catch (error: any) {
      console.error('[SIGNUP] Error:', error);
      toast.error(error.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // If the tenant already has an owner, block signup
  if (tenantSlug && tenant?.ownerUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertCircle className="size-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">회원가입 불가</CardTitle>
            <CardDescription>
              이 페이지는 이미 사용 중인 계정이 있습니다.<br />
              오너 계정으로 로그인해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="size-4 mr-2" />
              로그인으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <FileText className="size-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>
            새로운 계정을 만들어 상담 관리를 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                아이디 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="아이디를 입력하세요"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                비밀번호 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="8자 이상, 영문+숫자 포함"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                비밀번호는 8자 이상이어야 하며, 영문과 숫자를 포함해야 합니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">
                비밀번호 확인 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                이메일 <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerificationCode}
                  disabled={isSendingCode || !formData.email}
                >
                  {isSendingCode ? '전송 중...' : codeSent ? '재전송' : '인증'}
                </Button>
              </div>
              {codeSent && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="size-3" />
                  인증 코드가 이메일로 전송되었습니다
                </p>
              )}
            </div>

            {/* 인증 코드 입력란 - 인증 버튼 클릭 후 표시 */}
            {codeSent && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label htmlFor="verificationCode">
                  인증 코드 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="이메일로 받은 6자리 숫자"
                  value={formData.verificationCode}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) 
                  })}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  이메일에서 받은 6자리 인증 코드를 입력하세요
                </p>
                {devMode && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    개발 모드: 인증 코드는 {displayCode} 입니다
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onBack}
                className="flex-1"
              >
                <ArrowLeft className="size-4 mr-2" />
                로그인으로
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isLoading || !codeSent || formData.verificationCode.length !== 6}
              >
                {isLoading ? '처리 중...' : '회원가입'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}