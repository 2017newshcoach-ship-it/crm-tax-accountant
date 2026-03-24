import { useState, useEffect } from 'react';
import { Client } from '../types/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Save, Crown } from 'lucide-react';

interface ClientFormProps {
  client?: Client;
  onSave: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClientForm({ client, onSave, onCancel, isLoading }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    businessNumber: '',
    industry: '',
    memo: '',
    isVip: false,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phone: client.phone || '',
        email: client.email || '',
        businessNumber: client.businessNumber || '',
        industry: client.industry || '',
        memo: client.memo || '',
        isVip: client.isVip || false,
      });
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{client ? '고객 정보 수정' : '신규 고객 등록'}</CardTitle>
        <CardDescription>
          {client ? '고객 정보를 수정합니다' : '새로운 고객을 등록합니다'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 2단 그리드: 고객명 | 연락처 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                고객명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">연락처</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="010-1234-5678"
                type="tel"
              />
            </div>
          </div>

          {/* 2단 그리드: 이메일 | 사업자등록번호 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessNumber">사업자등록번호</Label>
              <Input
                id="businessNumber"
                value={formData.businessNumber}
                onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                placeholder="123-45-67890"
              />
            </div>
          </div>

          {/* 2단 그리드: 업종/업태 | VIP */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">업종/업태</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="소매업"
              />
            </div>

            <div className="space-y-2">
              <Label className="opacity-0 select-none">VIP</Label>
              <div className="flex items-center gap-2 h-10">
                <Checkbox
                  id="isVip"
                  checked={formData.isVip}
                  onCheckedChange={(checked) => setFormData({ ...formData, isVip: checked === true })}
                />
                <Label htmlFor="isVip" className="cursor-pointer flex items-center gap-2">
                  <Crown className="size-4 text-yellow-600" />
                  <span>VIP 고객</span>
                </Label>
              </div>
            </div>
          </div>

          {/* 전체 너비: 메모 */}
          <div className="space-y-2">
            <Label htmlFor="memo">메모</Label>
            <Textarea
              id="memo"
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="기타 메모사항을 입력하세요"
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-4 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="size-4 mr-2" />
              {isLoading ? '저장 중...' : client ? '수정하기' : '등록하기'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}