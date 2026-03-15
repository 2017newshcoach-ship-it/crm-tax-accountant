import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { RichTextEditor } from './RichTextEditor';
import { Client, Consultation } from '../types/client';
import { Save, ChevronRight, Search, Paperclip, ChevronDown, Star, FileText, AlertCircle, UserPlus, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { cn } from './ui/utils';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import DOMPurify from 'dompurify';
import { FileUpload, Attachment } from './FileUpload';
import { ColorPicker } from './ColorPicker';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

// 자동저장 키 생성
const getAutoSaveKey = (clientId: string, consultationId?: string) => {
  if (consultationId) {
    return `consultation-autosave-edit-${consultationId}`;
  }
  return `consultation-autosave-new-${clientId}`;
};

interface ConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  clients: Client[];
  consultations: Consultation[];
  onSave: (data: {
    clientId: string;
    date: string;
    time: string;
    content: string;
    isImportant: boolean;
    color?: string;
    attachments?: Attachment[];
  }) => Promise<void>;
  onUpdate?: (consultationId: string, data: {
    clientId: string;
    date: string;
    time: string;
    content: string;
    isImportant: boolean;
    status?: 'scheduled';
    color?: string;
    attachments?: Attachment[];
  }) => Promise<void>;
  onNewClient?: () => void;
  onCancelAppointment?: (consultationId: string) => Promise<void>;
  prefilledClientId?: string | null;
  selectedConsultation?: Consultation | null;
}

export function ConsultationDialog({
  open,
  onOpenChange,
  selectedDate,
  clients,
  consultations,
  onSave,
  onUpdate,
  onNewClient,
  onCancelAppointment,
  prefilledClientId,
  selectedConsultation,
}: ConsultationDialogProps) {
  const [clientId, setClientId] = useState('');
  const [time, setTime] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [color, setColor] = useState('teal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedConsultations, setExpandedConsultations] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [date, setDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 자동저장을 위한 참조
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (selectedConsultation) {
        setClientId(selectedConsultation.clientId);
        setDate(selectedConsultation.date);
        setTime(selectedConsultation.time || '');
        setContent(selectedConsultation.content || '');
        setIsImportant(selectedConsultation.isImportant || false);
        setColor(selectedConsultation.color || 'blue');
        setAttachments(selectedConsultation.attachments || []);
      } else {
        // 신규 작성 시 자동저장 데이터 로드
        const key = getAutoSaveKey(prefilledClientId || 'temp');
        const savedData = localStorage.getItem(key);
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            setClientId(data.clientId || prefilledClientId || '');
            setDate(data.date || '');
            setTime(data.time || '');
            setContent(data.content || '');
            setIsImportant(data.isImportant || false);
            setColor(data.color || 'blue');
            setAttachments(data.attachments || []);
            setLastSaved(new Date(data.savedAt));
          } catch (e) {
            console.error('Failed to load autosaved data:', e);
          }
        } else {
          setClientId(prefilledClientId || '');
          setTime('');
          setContent('');
          setIsImportant(false);
          setColor('blue');
          setAttachments([]);
        }
      }
      setExpandedConsultations([]);
      setSearchQuery('');
    }
  }, [open, prefilledClientId, selectedConsultation]);

  // 자동저장 - content, time, isImportant, color, attachments 변경 시
  useEffect(() => {
    if (!open || selectedConsultation) return; // 수정 모드에서는 자동저장 안 함

    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }

    // 내용이 있을 때만 자동저장
    if (clientId && (content || time || attachments.length > 0)) {
      autoSaveRef.current = setTimeout(() => {
        const key = getAutoSaveKey(clientId);
        const data = {
          clientId,
          date: date || format(selectedDate, 'yyyy-MM-dd'),
          time,
          content,
          isImportant,
          color,
          attachments,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(data));
        setLastSaved(new Date());
      }, 2000); // 2초 디바운스
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [open, clientId, content, time, isImportant, color, attachments, date, selectedDate, selectedConsultation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !time) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedConsultation) {
        if (onUpdate) {
          // 예약 상담인 경우 상태 유지
          const status = selectedConsultation.status === 'scheduled' ? 'scheduled' : undefined;
          await onUpdate(selectedConsultation.id, {
            clientId,
            date: date || format(selectedDate, 'yyyy-MM-dd'),
            time,
            content,
            isImportant,
            status,
            color,
            attachments,
          });
        }
      } else {
        await onSave({
          clientId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time,
          content,
          isImportant,
          color,
          attachments,
        });
        // 저장 성공 시 자동저장 데이터 삭제
        const key = getAutoSaveKey(clientId);
        localStorage.removeItem(key);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save consultation:', error);
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

  // Sort clients by name
  const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  // 선택된 고객의 과거 상담 내역
  const selectedClient = clients.find(c => c.id === clientId);
  const clientConsultations = clientId 
    ? consultations
        .filter(c => c.clientId === clientId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  
  // 검색 필터링
  const filteredConsultations = searchQuery
    ? clientConsultations.filter(c => {
        const textContent = stripHtml(c.content).toLowerCase();
        return textContent.includes(searchQuery.toLowerCase());
      })
    : clientConsultations;

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[1400px] h-[90vh] overflow-hidden flex flex-col">
        {/* 저장 버튼 - X 버튼 왼쪽에 절대 위치 */}
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !clientId || !time}
          variant="ghost"
          size="icon"
          className="absolute top-6 right-[60px] h-8 w-8 rounded-xl opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-30 p-2"
          title="저장"
        >
          <Save className="size-4" />
          <span className="sr-only">저장</span>
        </Button>
        
        <DialogHeader className="space-y-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {selectedConsultation?.status === 'scheduled' ? (
                  // 예약 상담인 경우 고객명 고정 표시
                  <>
                    <span className="font-bold text-xl">
                      {sortedClients.find(c => c.id === clientId)?.name}
                      {sortedClients.find(c => c.id === clientId)?.isVip && ' 👑'}
                    </span>
                  </>
                ) : (
                  // 일반 상담인 경우 고객 선택 가능
                  <Select value={clientId} onValueChange={setClientId} required>
                    <SelectTrigger className="h-auto w-auto min-w-[60px] border-0 bg-transparent shadow-none font-bold text-xl p-0 gap-1 focus:ring-0 text-foreground [&>svg]:size-4">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}{client.isVip && ' 👑'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <span>상담 기록 작성</span>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1.5 flex-wrap">
                {/* 예약 상담인 경우 날짜 선택 드롭다운 */}
                {selectedConsultation?.status === 'scheduled' ? (
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-auto w-auto border-0 bg-transparent shadow-none text-sm p-0 focus:ring-0 text-foreground cursor-pointer"
                  />
                ) : (
                  format(selectedDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
                )}
                <span>•</span>
                
                {/* 시간 선택 - 항상 수정 가능 */}
                <Select value={time} onValueChange={setTime} required>
                  <SelectTrigger className="h-auto w-auto min-w-[60px] border-0 bg-transparent shadow-none text-sm p-0 gap-1 focus:ring-0 text-foreground [&>svg]:size-3">
                    <SelectValue placeholder="시간" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* 색상 선택 */}
                <span>•</span>
                <ColorPicker
                  value={color}
                  onChange={setColor}
                />
                
                {selectedConsultation?.status === 'scheduled' && (
                  <>
                    <span>•</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={async () => {
                        if (!onCancelAppointment || !confirm('예약을 정말로 취소하시겠습니까?')) return;
                        setIsSubmitting(true);
                        try {
                          await onCancelAppointment(selectedConsultation.id);
                          onOpenChange(false);
                        } catch (error) {
                          console.error('Failed to cancel appointment:', error);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      예약 취소
                    </Button>
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {/* No Clients Alert */}
        {sortedClients.length === 0 ? (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription className="flex flex-col gap-3">
              <p>등록된 고객이 없습니다. 먼저 고객을 등록해주세요.</p>
              {onNewClient && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    onNewClient();
                  }}
                >
                  <UserPlus className="size-4 mr-2" />
                  신규 고객 등록하기
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 flex-1 overflow-hidden">
            {/* 좌측: 상담 작성 폼 (70%) */}
            <Card className="overflow-hidden flex flex-col">
              <CardContent className="p-6 h-full overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
                  {/* 상담 내용 에디터 - 메인 영역 */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <h3 className="font-bold text-base">상담 내용</h3>
                      {!selectedConsultation && lastSaved && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle className="size-3" />
                          <span>
                            {new Date().getTime() - lastSaved.getTime() < 5000
                              ? '방금 자동저장됨'
                              : `${Math.floor((new Date().getTime() - lastSaved.getTime()) / 60000)}분 전 자동저장됨`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-h-0">
                      <RichTextEditor
                        content={content}
                        onChange={setContent}
                      />
                    </div>
                  </div>

                  {/* 첨부 파일 */}
                  <div className="flex-shrink-0">
                    <h3 className="font-bold text-base mb-3">첨부 파일</h3>
                    <FileUpload
                      clientId={clientId || 'temp'}
                      consultationId={undefined}
                      attachments={attachments}
                      onAttachmentsChange={setAttachments}
                      apiBaseUrl={API_BASE_URL}
                      publicAnonKey={publicAnonKey}
                    />
                  </div>

                  {/* 중요 표시 체크박스 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Checkbox
                      id="important"
                      checked={isImportant}
                      onCheckedChange={(checked) => setIsImportant(checked as boolean)}
                    />
                    <Label
                      htmlFor="important"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      중요 상담으로 표시
                    </Label>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 우측: 과거 상담 내역 (30%) */}
            <Card className="overflow-hidden flex flex-col">
              <CardContent className="p-6 h-full overflow-y-auto">
                <div className="sticky top-0 bg-card z-10 pb-4 -mt-6 pt-3 -mx-6 px-6 border-b shadow-sm">
                  <h3 className="font-bold text-base mb-2">
                    과거 상담
                  </h3>
                  
                  {clientId && clientConsultations.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        placeholder="상담 내용 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                  )}
                </div>

                {!clientId ? (
                  <div className="text-center py-12">
                    <FileText className="size-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      고객을 선택하면<br />과거 상담 내역을 확인할 수 있습니다
                    </p>
                  </div>
                ) : clientConsultations.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="size-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {selectedClient?.name} 님의<br />상담 내역이 아직 없습니다
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 mt-6">{/* mt-4 → mt-6로 변경 */}
                    {filteredConsultations.map((past) => {
                      const isExpanded = expandedConsultations.includes(past.id);

                      return (
                        <Card 
                          key={past.id} 
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-sm",
                            past.isImportant && 'border-yellow-500 bg-yellow-50/30',
                            isExpanded && 'shadow-md'
                          )}
                          onClick={() => setExpandedConsultations(isExpanded ? expandedConsultations.filter(id => id !== past.id) : [...expandedConsultations, past.id])}
                        >
                          <CardContent className="p-3">
                            {/* 헤더 - 항상 표시 */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="size-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="size-4 text-muted-foreground" />
                                )}
                                {past.isImportant && (
                                  <Star className="size-3 text-yellow-500 fill-yellow-500" />
                                )}
                                <span className="font-semibold text-sm">
                                  {new Date(past.date).toLocaleDateString('ko-KR', {
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </span>
                                <span className="text-xs text-muted-foreground">{past.time}</span>
                              </div>
                              {past.attachments && past.attachments.length > 0 && (
                                <Paperclip className="size-3 text-muted-foreground" />
                              )}
                            </div>

                            {/* 전체 내용 - 펼쳐졌을 때만 */}
                            {isExpanded && (
                              <div className="space-y-3 pt-2">
                                <div 
                                  className="text-sm prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ 
                                    __html: DOMPurify.sanitize(past.content) 
                                  }}
                                />

                                {/* 첨부파일 */}
                                {past.attachments && past.attachments.length > 0 && (
                                  <div className="pt-2 border-t">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                                      📎 첨부파일 {past.attachments.length}개
                                    </p>
                                    <div className="space-y-1">
                                      {past.attachments.map((att) => (
                                        <a
                                          key={att.id}
                                          href={att.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 px-2 py-1.5 bg-muted rounded-md hover:bg-muted/80 text-xs transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Paperclip className="size-3" />
                                          <span className="flex-1 truncate">{att.fileName}</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="text-[10px] text-muted-foreground pt-2 border-t">
                                  작성: {new Date(past.createdAt).toLocaleString('ko-KR')}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}