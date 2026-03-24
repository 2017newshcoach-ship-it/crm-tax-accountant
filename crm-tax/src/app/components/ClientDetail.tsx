import { useState } from 'react';
import { Client, Consultation } from '../types/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RichTextEditor } from './RichTextEditor';
import { AppointmentDialog } from './AppointmentDialog';
import { ConsultationDialog } from './ConsultationDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  ArrowLeft,
  Edit,
  Plus,
  FileText,
  Calendar,
  Trash2,
  Save,
  X,
  Star,
  Clock,
  Download,
  Paperclip,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';

interface ClientDetailProps {
  client: Client;
  consultations: Consultation[];
  clients: Client[]; // 전체 고객 목록 (AppointmentDialog에서 필요)
  onBack: () => void;
  onEdit: () => void;
  onNewConsultation: () => void;
  onEditConsultation: (consultation: Consultation) => void;
  onDeleteConsultation: (consultationId: string) => void;
  onSaveConsultation?: (data: {
    clientId: string;
    date: string;
    time: string;
    content: string;
    isImportant: boolean;
    status: 'completed';
    attachments?: any[];
  }) => void;
  onCreateAppointment?: (data: {
    clientId: string;
    date: string;
    time: string;
    status?: 'scheduled';
    color?: string;
  }) => Promise<void>;
  onUpdateConsultation?: (consultationId: string, data: { 
    clientId: string;
    date: string;
    time: string;
    content: string;
    isImportant: boolean;
    attachments?: any[];
  }) => void;
  onToggleImportant?: (consultationId: string) => void;
  onToggleVip?: (clientId: string) => void;
  initialExpandedConsultationId?: string; // 초기에 펼쳐질 상담 기록 ID
}

export function ClientDetail({
  client,
  consultations,
  clients,
  onBack,
  onEdit,
  onNewConsultation,
  onEditConsultation,
  onDeleteConsultation,
  onSaveConsultation,
  onCreateAppointment,
  onUpdateConsultation,
  onToggleImportant,
  onToggleVip,
  initialExpandedConsultationId,
}: ClientDetailProps) {
  const [expandedConsultation, setExpandedConsultation] = useState<string | null>(
    initialExpandedConsultationId || null
  );
  const [showConsultationDialog, setShowConsultationDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [formContent, setFormContent] = useState('');

  const sortedConsultations = [...consultations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleNewConsultation = () => {
    setShowNewForm(true);
    setEditingId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormContent('');
  };

  const handleEditConsultationInline = (consultation: Consultation) => {
    setShowNewForm(true);
    setEditingId(consultation.id);
    setFormDate(consultation.date);
    setFormContent(consultation.content);
  };

  const handleCancelForm = () => {
    setShowNewForm(false);
    setEditingId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormContent('');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    if (editingId) {
      // Update existing
      onUpdateConsultation?.(editingId, { 
        clientId: client.id,
        date: formDate, 
        time: '', 
        content: formContent, 
        isImportant: false, 
        status: 'completed' 
      });
    } else {
      // Create new
      onSaveConsultation?.({ clientId: client.id, date: formDate, time: '', content: formContent, isImportant: false, status: 'completed' });
    }
    
    handleCancelForm();
  };

  return (
    <div className="space-y-4 h-full">
      {/* 상단: 고객 기본 정보 (간결한 헤더) */}
      <Card>
        <CardHeader className="pb-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="size-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{client.name}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onToggleVip?.(client.id)}
                  >
                    <Star className={`size-5 ${client.isVip ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                  </Button>
                  <Badge variant="secondary">상담 {consultations.length}건</Badge>
                </div>
              </div>
              
              {!showNewForm && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowConsultationDialog(true)}>
                    <Edit className="size-4 mr-1" />
                    상담 기록
                  </Button>
                  <Button onClick={() => setShowAppointmentDialog(true)}>
                    <Clock className="size-4 mr-1" />
                    예약 등록
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 하단: 좌우 분할 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[calc(100vh-250px)]">
        {showNewForm ? (
          <>
            {/* 좌측: 새 상담 작성 폼 (고정) */}
            <div className="lg:sticky lg:top-0 lg:self-start">
              <Card className="h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {editingId ? '상담 기록 수정' : '새 상담 기록'}
                      </CardTitle>
                      <CardDescription>
                        {client.name} 고객의 상담을 기록합니다
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCancelForm}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitForm} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">상담 날짜</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>상담 내용</Label>
                      <RichTextEditor content={formContent} onChange={setFormContent} />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleCancelForm} className="flex-1">
                        취소
                      </Button>
                      <Button type="submit" className="flex-1" disabled={!formContent.trim()}>
                        <Save className="size-4 mr-2" />
                        {editingId ? '수정하기' : '저장하기'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* 우측: 과거 상담 내역 (스크롤) */}
            <div className="lg:overflow-y-auto lg:h-full">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>과거 상담 내역</CardTitle>
                  <CardDescription>총 {consultations.length}건의 상담 기록</CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedConsultations.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">상담 내역이 없습니다</h3>
                      <p className="text-sm text-muted-foreground">
                        첫 번째 상담 기록을 작성해보세요
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedConsultations.map((consultation) => {
                        const isExpanded = expandedConsultation === consultation.id;
                        const contentText = stripHtml(consultation.content);
                        const isLong = contentText.length > 200;

                        // 날짜 기반 상태 판단
                        const consultationDate = new Date(consultation.date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        consultationDate.setHours(0, 0, 0, 0);
                        
                        const isFuture = consultationDate > today;
                        const isPast = consultationDate < today;
                        const hasContent = consultation.content && consultation.content.trim().length > 0;

                        return (
                          <Card key={consultation.id} className={`${consultation.isImportant ? 'border-yellow-500 bg-yellow-50/50' : ''} ${isPast && !hasContent ? 'border-red-500 bg-red-50/30' : ''}`}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {consultation.isImportant && (
                                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                                  )}
                                  {isFuture ? (
                                    <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600 bg-blue-50">
                                      <Clock className="size-3" />
                                      예약
                                    </Badge>
                                  ) : isPast && !hasContent ? (
                                    <Badge variant="outline" className="gap-1 border-red-500 text-red-600 bg-red-50">
                                      <AlertCircle className="size-3" />
                                      기록 필요
                                    </Badge>
                                  ) : null}
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onToggleImportant?.(consultation.id)}>
                                      <Star className={`size-4 mr-2 ${consultation.isImportant ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                      {consultation.isImportant ? '중요 표시 해제' : '중요 표시'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditConsultationInline(consultation)}>
                                      <Edit className="size-4 mr-2" />
                                      수정
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => onDeleteConsultation(consultation.id)}
                                    >
                                      <Trash2 className="size-4 mr-2" />
                                      삭제
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {consultation.content ? (
                                <div
                                  className={`prose prose-sm max-w-none ${
                                    !isExpanded && isLong ? 'line-clamp-3' : ''
                                  }`}
                                  dangerouslySetInnerHTML={{ __html: consultation.content }}
                                />
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  상담 내용이 작성되지 않았습니다
                                </p>
                              )}

                              {/* Attachments */}
                              {consultation.attachments && consultation.attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Paperclip className="size-4" />
                                    <span>{consultation.attachments.length}개 첨부파일</span>
                                  </div>
                                  <div className="space-y-1">
                                    {consultation.attachments.map((attachment) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 rounded border bg-card hover:bg-accent/50 transition-colors text-sm"
                                      >
                                        <FileText className="size-4 text-muted-foreground" />
                                        <span className="flex-1 truncate">{attachment.fileName}</span>
                                        <Download className="size-4 text-muted-foreground" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {isLong && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() =>
                                    setExpandedConsultation(
                                      isExpanded ? null : consultation.id
                                    )
                                  }
                                >
                                  {isExpanded ? '접기' : '더보기'}
                                </Button>
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
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          // 상담 작성 중이 아닐 때는 전체 화면으로 과거 상담 내역 표시
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>상담 내역</CardTitle>
              <CardDescription>총 {consultations.length}건의 상담 기록</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedConsultations.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">상담 내역이 없습니다</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    첫 번째 상담 기록을 작성해보세요
                  </p>
                  <Button onClick={() => setShowConsultationDialog(true)}>
                    <Plus className="size-4 mr-2" />
                    첫 상담 기록하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedConsultations.map((consultation) => {
                    const isExpanded = expandedConsultation === consultation.id;
                    const contentText = stripHtml(consultation.content);

                    // 날짜 기반 상태 판단
                    const consultationDate = new Date(consultation.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    consultationDate.setHours(0, 0, 0, 0);
                    
                    const isFuture = consultationDate > today;
                    const isPast = consultationDate < today;
                    const hasContent = consultation.content && consultation.content.trim().length > 0;

                    return (
                      <Card key={consultation.id} className={`${consultation.isImportant ? 'border-yellow-500 bg-yellow-50/50' : ''} ${isPast && !hasContent ? 'border-red-500 bg-red-50/30' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div 
                              className="flex items-center gap-2 flex-wrap flex-1 cursor-pointer"
                              onClick={() => {
                                setSelectedConsultation(consultation);
                                setSelectedDate(new Date(consultation.date));
                                setShowConsultationDialog(true);
                              }}
                            >
                              {consultation.isImportant && (
                                <Star className="size-4 text-yellow-500 fill-yellow-500" />
                              )}
                              {isFuture ? (
                                <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600 bg-blue-50">
                                  <Clock className="size-3" />
                                  예약
                                </Badge>
                              ) : isPast && !hasContent ? (
                                <Badge variant="outline" className="gap-1 border-red-500 text-red-600 bg-red-50">
                                  <AlertCircle className="size-3" />
                                  기록 필요
                                </Badge>
                              ) : null}
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
                              {consultation.attachments && consultation.attachments.length > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <Paperclip className="size-3" />
                                  {consultation.attachments.length}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="size-8"
                                onClick={() => onToggleImportant?.(consultation.id)}
                              >
                                <Star className={`size-4 ${consultation.isImportant ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => onDeleteConsultation(consultation.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="space-y-3 mt-4 pt-4 border-t">
                              {consultation.content ? (
                                <div
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: consultation.content }}
                                />
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  상담 내용이 작성되지 않았습니다
                                </p>
                              )}

                              {/* Attachments */}
                              {consultation.attachments && consultation.attachments.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Paperclip className="size-4" />
                                    <span>{consultation.attachments.length}개 첨부파일</span>
                                  </div>
                                  <div className="space-y-1">
                                    {consultation.attachments.map((attachment) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 rounded border bg-card hover:bg-accent/50 transition-colors text-sm"
                                      >
                                        <FileText className="size-4 text-muted-foreground" />
                                        <span className="flex-1 truncate">{attachment.fileName}</span>
                                        <Download className="size-4 text-muted-foreground" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="text-xs text-muted-foreground">
                                작성: {new Date(consultation.createdAt).toLocaleString('ko-KR')}
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
        )}
      </div>

      {/* Dialogs */}
      {onSaveConsultation && (
        <ConsultationDialog
          open={showConsultationDialog}
          onOpenChange={(open) => {
            setShowConsultationDialog(open);
            if (!open) {
              setSelectedConsultation(null);
            }
          }}
          selectedDate={selectedDate}
          clients={[client]}
          consultations={consultations}
          onSave={onSaveConsultation}
          onUpdate={onUpdateConsultation}
          prefilledClientId={client.id}
          selectedConsultation={selectedConsultation}
        />
      )}

      {onCreateAppointment && (
        <AppointmentDialog
          open={showAppointmentDialog}
          onOpenChange={setShowAppointmentDialog}
          selectedDate={selectedDate}
          clients={clients}
          onSave={onCreateAppointment}
          prefilledClientId={client.id}
        />
      )}
    </div>
  );
}