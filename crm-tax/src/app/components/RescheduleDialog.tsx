import { useState, useEffect } from 'react';
import { Consultation, Client } from '../types/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { CalendarDays } from 'lucide-react';

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultation: Consultation | null;
  client: Client | null;
  onSave: (consultationId: string, date: string, time: string) => Promise<void>;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  consultation,
  client,
  onSave,
}: RescheduleDialogProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && consultation) {
      setDate(consultation.date);
      setTime(consultation.time || '');
    }
  }, [open, consultation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultation || !date || !time) return;

    setIsSubmitting(true);
    try {
      await onSave(consultation.id, date, time);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to reschedule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 9:00 ~ 18:00, 30분 간격
  const timeOptions: string[] = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) break;
      timeOptions.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            날짜/시간 변경
          </DialogTitle>
          <DialogDescription>
            {client?.name} 고객의 예약 날짜와 시간을 변경합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">날짜 *</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reschedule-time">시간 *</Label>
              <Select value={time} onValueChange={setTime} required>
                <SelectTrigger id="reschedule-time">
                  <SelectValue placeholder="시간 선택" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting || !date || !time}>
              {isSubmitting ? '변경 중...' : '변경하기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
