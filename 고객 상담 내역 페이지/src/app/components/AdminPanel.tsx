import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Users, Mail, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

interface User {
  username: string;
  email: string;
  createdAt: string;
}

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('회원 목록을 가져올 수 없습니다.');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('회원 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`정말로 "${username}" 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 사용자의 모든 데이터가 삭제됩니다.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/delete-user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '계정 삭제에 실패했습니다.');
      }

      toast.success(`"${username}" 계정이 삭제되었습니다.`);
      
      // 목록에서 제거
      setUsers(users.filter(user => user.username !== username));
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || '계정 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4 mr-2" />
            로그인으로 돌아가기
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Users className="size-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">관리자 페널</CardTitle>
                  <CardDescription>
                    가입된 회원 목록을 확인할 수 있습니다
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                총 {users.length}명
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">회원 목록을 불러오는 중...</div>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="size-12 text-muted-foreground mb-3" />
                <div className="text-lg font-semibold mb-1">등록된 회원이 없습니다</div>
                <div className="text-sm text-muted-foreground">
                  새로운 회원이 가입하면 여기에 표시됩니다
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user, index) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{user.username}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="size-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">회원</Badge>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteUser(user.username)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}