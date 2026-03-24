import { useState, useEffect } from 'react';
import { Client } from '../types/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { UserPlus, AlertCircle } from 'lucide-react';
import { ColorPicker } from './ColorPicker';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  clients: Client[];
  onSave: (data: {
    clientId: string;
    date: string;
    time: string;
    status?: 'scheduled';
    color?: string;
  }) => Promise<void>;
  onNewClient?: () => void;
  prefilledClientId?: string; // 고객 상세에서 올 때 미리 선택된 고객 ID
}

export function AppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  clients,
  onSave,
  onNewClient,
  prefilledClientId,
}: AppointmentDialogProps) {
  const [clientId, setClientId] = useState('');
  const [time, setTime] = useState('');
  const [color, setColor] = useState('teal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setClientId(prefilledClientId || '');
      setTime('');
      setColor('teal');
    }
  }, [open, prefilledClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !time) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        clientId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time,
        status: 'scheduled',
        color,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create appointment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time options (9:00 ~ 18:00, 30분 간격)
  const timeOptions = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) break; // 18:00까지만
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeStr);
    }
  }

  // Sort clients by name
  const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>상담 예약</DialogTitle>
          <DialogDescription>
            {format(selectedDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* New Client Notice - Always show */}
            <Alert className="bg-blue-50 border-blue-300">
              <AlertCircle className="size-4 text-blue-600" />
              <AlertDescription className="flex flex-col gap-3">
                <p className="text-blue-900">
                  <strong>신규 고객 상담 예약을 하실 경우, 고객 등록을 먼저 해주세요!</strong>
                </p>
                {onNewClient && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full border-blue-400 text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      onOpenChange(false);
                      onNewClient();
                    }}
                  >
                    <UserPlus className="size-4 mr-2" />
                    고객 등록 페이지로 이동
                  </Button>
                )}
              </AlertDescription>
            </Alert>

            {/* No Clients Alert */}
            {sortedClients.length === 0 ? (
              <Alert>
                <AlertCircle className="size-4" />
                <AlertDescription>
                  <p>등록된 고객이 없습니다. 먼저 고객을 등록해주세요.</p>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Client and Time Selection - Compact */}
                <div className="flex gap-3">
                  {/* Client Selection */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="client">고객 *</Label>
                    <Select 
                      value={clientId} 
                      onValueChange={setClientId} 
                      required
                      disabled={!!prefilledClientId}
                    >
                      <SelectTrigger id="client">
                        <SelectValue placeholder="고객 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                            {client.isVip && ' 👑'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Selection */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="time">시간 *</Label>
                    <Select value={time} onValueChange={setTime} required>
                      <SelectTrigger id="time">
                        <SelectValue placeholder="시간 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {prefilledClientId && (
                  <p className="text-sm text-muted-foreground">
                    현재 고객: <strong>{sortedClients.find(c => c.id === prefilledClientId)?.name}</strong>
                  </p>
                )}

                {/* Color Selection */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">색상</span>
                  <ColorPicker
                    value={color}
                    onChange={setColor}
                  />
                </div>
              </>
            )}
          </div>

          {sortedClients.length > 0 && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting || !clientId || !time}>
                {isSubmitting ? '예약 중...' : '예약하기'}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}