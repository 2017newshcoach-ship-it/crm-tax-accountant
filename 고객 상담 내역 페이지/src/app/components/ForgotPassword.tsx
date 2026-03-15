import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { KeyRound, ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[FRONTEND] Requesting password reset for:', email);

      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('[FRONTEND] Password reset response:', data);

      if (!response.ok) {
        throw new Error(data.error || '비밀번호 재설정 실패');
      }

      setResetSuccess(true);

      // devPassword가 있으면 개발 모드
      if (data.devPassword) {
        console.warn('[FRONTEND] Dev mode - Temporary password:', data.devPassword);
        setDevMode(true);
        setTempPassword(data.devPassword);
        toast.success('✅ 임시 비밀번호가 생성되었습니다!\n(개발 모드: 화면에 표시됩니다)');
      } else {
        toast.success('✅ 임시 비밀번호가 이메일로 전송되었습니다!');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <KeyRound className="size-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
          <CardDescription>
            가입하신 이메일로 임시 비밀번호를 발송해드립니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!resetSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  회원가입 시 입력한 이메일 주소를 입력하세요
                </p>
              </div>

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
                  disabled={isLoading}
                >
                  {isLoading ? '처리 중...' : '임시 비밀번호 받기'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                    <Mail className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      임시 비밀번호 발송 완료
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {email}로 임시 비밀번호가 발송되었습니다.
                    </p>
                  </div>
                </div>
              </div>

              {devMode && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full">
                      <AlertCircle className="size-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        개발 모드 (이메일 미발송)
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        실제 이메일이 발송되지 않았습니다. 아래 임시 비밀번호를 사용하세요.
                      </p>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-red-200 dark:border-red-800">
                        <div className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium">
                          임시 비밀번호
                        </div>
                        <div className="text-2xl font-mono font-bold text-red-700 dark:text-red-300 tracking-wider">
                          {tempPassword}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">📧 이메일을 확인하세요</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 스팸함도 확인해주세요</li>
                  <li>• 임시 비밀번호로 로그인 후 비밀번호를 변경하세요</li>
                  <li>• 이메일이 오지 않으면 다시 시도해주세요</li>
                </ul>
              </div>

              <Button 
                onClick={onBack}
                className="w-full"
              >
                로그인 화면으로 돌아가기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
