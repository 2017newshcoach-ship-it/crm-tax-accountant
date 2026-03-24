import { useState, useEffect } from 'react';
import { Client, Consultation, Attachment } from '../types/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Star, FileText, Save, Copy, Paperclip } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { FileUpload } from './FileUpload';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { cn } from './ui/utils';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

interface ClientConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  consultations: Consultation[];
  onSave: (data: {
    clientId: string;
    date: string;
    time: string;
    content: string;
    isImportant: boolean;
    status: 'completed';
    color?: string;
    attachments?: Attachment[];
  }) => Promise<void>;
}

export function ClientConsultationDialog({
  open,
  onOpenChange,
  client,
  consultations,
  onSave,
}: ClientConsultationDialogProps) {
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [color, setColor] = useState('teal');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedConsultation, setExpandedConsultation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 12가지 색상 옵션
  const colorOptions = [
    { value: 'red', label: '빨간색', class: 'bg-red-500' },
    { value: 'pink', label: '분홍색', class: 'bg-pink-500' },
    { value: 'orange', label: '주황색', class: 'bg-orange-500' },
    { value: 'yellow', label: '노란색', class: 'bg-yellow-500' },
    { value: 'teal', label: '민트색', class: 'bg-teal-500' },
    { value: 'green', label: '초록색', class: 'bg-green-600' },
    { value: 'blue', label: '파란색', class: 'bg-blue-500' },
    { value: 'indigo', label: '남색', class: 'bg-indigo-600' },
    { value: 'lavender', label: '라벤더', class: 'bg-purple-400' },
    { value: 'purple', label: '보라색', class: 'bg-purple-600' },
    { value: 'gray', label: '회색', class: 'bg-gray-500' },
    { value: 'slate', label: '청회색', class: 'bg-slate-600' },
  ];

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime('');
      setContent('');
      setIsImportant(false);
      setAttachments([]);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        clientId: client.id,
        date,
        time,
        content,
        isImportant,
        status: 'completed',
        color,
        attachments,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create consultation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time options (9:00 ~ 18:00, 30분 간격)
  const timeOptions = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) break;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeStr);
    }
  }

  // 고객의 과거 상담 내역
  const clientConsultations = consultations
    .filter(c => c.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 검색 필터링
  const filteredConsultations = clientConsultations.filter(c => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const contentText = stripHtml(c.content).toLowerCase();
    return contentText.includes(searchLower);
  });

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Quick Copy 기능
  const copyToEditor = (consultationContent: string) => {
    const plainText = stripHtml(consultationContent);
    setContent(prev => {
      if (!prev) return plainText;
      return prev + '\n\n' + plainText;
    });
    toast.success('내용이 추가되었습니다');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[1400px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>상담 기록 작성</DialogTitle>
          <DialogDescription>
            {client.name} 고객의 상담 내용을 기록합니다
          </DialogDescription>
        </DialogHeader>
        
        {/* 30:70 비율 레이아웃 */}
        <div className="grid grid-cols-[360px_1fr] gap-6 flex-1 overflow-hidden">
          {/* 좌측: 컴팩트한 입력 폼 (30%) */}
          <aside className="overflow-y-auto space-y-4">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">
                새 상담 기록
              </div>
              
              {/* 한 줄로 압축된 메타데이터 */}
              <div className="space-y-2">
                <Label className="text-xs">날짜 & 시간 *</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="14:30"
                    required
                    className="w-28"
                  />
                </div>
              </div>

              {/* 중요 표시 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="important"
                  checked={isImportant}
                  onCheckedChange={(checked) => setIsImportant(checked as boolean)}
                />
                <Label
                  htmlFor="important"
                  className="text-xs font-medium cursor-pointer"
                >
                  ⭐ 중요 상담으로 표시
                </Label>
              </div>

              {/* 색상 선택 - 더 컴팩트하게 */}
              <div className="space-y-2">
                <Label className="text-xs">색상 선택</Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setColor(option.value)}
                      className={`h-8 rounded border-2 transition-all ${option.class} ${
                        color === option.value
                          ? 'border-primary scale-110'
                          : 'border-transparent hover:border-muted-foreground/20'
                      }`}
                      title={option.label}
                    >
                      {color === option.value && (
                        <span className="text-white font-bold text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 상담 내용 에디터 */}
            <div className="space-y-2 flex-1">
              <Label className="text-xs">상담 내용</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
              />
            </div>

            {/* 첨부 파일 */}
            <div className="space-y-2">
              <Label className="text-xs">첨부 파일</Label>
              <FileUpload
                clientId={client.id}
                consultationId={undefined}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                apiBaseUrl={API_BASE_URL}
                publicAnonKey={publicAnonKey}
              />
            </div>

            {/* 저장 버튼 */}
            <div className="flex gap-2 pt-4 sticky bottom-0 bg-white pb-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                취소
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !date || !time} 
                className="flex-1"
              >
                <Save className="size-4 mr-2" />
                {isSubmitting ? '저장 중...' : '저장'}
              </Button>
            </div>
          </aside>

          {/* 우측: 과거 상담 내역 - 메인 무대 (70%) */}
          <main className="overflow-y-auto space-y-4">
            {/* 검색 바 */}
            <div className="sticky top-0 bg-white z-10 pb-3 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">
                  {client.name} 고객의 과거 상담
                </h3>
                <Badge variant="outline">
                  총 {clientConsultations.length}건
                </Badge>
              </div>
              <Input
                placeholder="🔍 과거 상담 검색 (예: 세금, 신고, 연말정산)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* 과거 기록 카드 */}
            {filteredConsultations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? `"${searchQuery}"에 대한 검색 결과가 없습니다`
                    : `${client.name} 고객의 상담 내역이 아직 없습니다`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConsultations.map((consultation) => {
                  const isExpanded = expandedConsultation === consultation.id;
                  const contentText = stripHtml(consultation.content);
                  const isLong = contentText.length > 200;

                  return (
                    <Card 
                      key={consultation.id} 
                      className={cn(
                        "hover:shadow-md transition-shadow",
                        consultation.isImportant && 'border-yellow-500 bg-yellow-50/50'
                      )}
                    >
                      <CardContent className="p-4">
                        {/* 헤더: 날짜 + Quick Copy */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {consultation.isImportant && (
                              <Star className="size-4 text-yellow-500 fill-yellow-500" />
                            )}
                            <Calendar className="size-4 text-primary" />
                            <span className="font-semibold">
                              {new Date(consultation.date).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'short',
                              })}
                            </span>
                            {consultation.time && (
                              <span className="text-sm text-muted-foreground">
                                {consultation.time}
                              </span>
                            )}
                          </div>

                          {/* Quick Copy 버튼 */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToEditor(consultation.content)}
                            className="gap-1"
                          >
                            <Copy className="size-4" />
                            복사
                          </Button>
                        </div>

                        {/* 내용 (클릭으로 확장) */}
                        <div
                          className={cn(
                            "prose prose-sm max-w-none cursor-pointer",
                            !isExpanded && isLong && 'line-clamp-3'
                          )}
                          onClick={() =>
                            setExpandedConsultation(
                              isExpanded ? null : consultation.id
                            )
                          }
                          dangerouslySetInnerHTML={{ 
                            __html: DOMPurify.sanitize(consultation.content) 
                          }}
                        />

                        {isLong && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() =>
                              setExpandedConsultation(
                                isExpanded ? null : consultation.id
                              )
                            }
                          >
                            {isExpanded ? '접기 ▲' : '더보기 ▼'}
                          </Button>
                        )}

                        {/* 첨부파일 섹션 */}
                        {consultation.attachments && consultation.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-semibold mb-2 text-muted-foreground">
                              📎 첨부파일 {consultation.attachments.length}개
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {consultation.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-xs transition-colors"
                                >
                                  <Paperclip className="size-3" />
                                  <span>{att.fileName}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          작성: {new Date(consultation.createdAt).toLocaleString('ko-KR')}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}