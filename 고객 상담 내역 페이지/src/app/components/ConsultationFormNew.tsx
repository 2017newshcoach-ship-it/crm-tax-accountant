import { useState, useEffect } from 'react';
import { Consultation, Attachment } from '../types/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { RichTextEditor } from './RichTextEditor';
import { FileUpload } from './FileUpload';
import { ArrowLeft, Save, BookOpen, X, Search, Copy, FileText, Paperclip, Download, FileSpreadsheet, FileVideo, FileAudio, Archive, File, Image as ImageIcon } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

interface ConsultationFormNewProps {
  clientName: string;
  clientId: string;
  consultation?: Consultation;
  onSave: (consultationData: { 
    clientId: string; 
    date: string; 
    content: string; 
    color?: string; 
    time: string; 
    isImportant: boolean; 
    status: 'completed';
    attachments?: Attachment[];
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  readOnly?: boolean; // 읽기 전용 모드
  consultations?: Consultation[]; // 과거 상담 목록
  onSelectConsultation?: (consultation: Consultation) => void; // 과거 상담 선택 시
}

export function ConsultationFormNew({
  clientName,
  clientId,
  consultation,
  onSave,
  onCancel,
  isLoading,
  readOnly,
  consultations,
  onSelectConsultation,
}: ConsultationFormNewProps) {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [content, setContent] = useState('');
  const [color, setColor] = useState('teal');
  const [time, setTime] = useState('10:00');
  const [isImportant, setIsImportant] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // 슬라이드 패널 상태
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [pastConsultations, setPastConsultations] = useState<Consultation[]>([]);
  const [isLoadingPast, setIsLoadingPast] = useState(false);
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

  useEffect(() => {
    if (consultation) {
      setDate(consultation.date);
      setContent(consultation.content);
      setColor(consultation.color || 'blue');
      setTime(consultation.time || '10:00');
      setIsImportant(consultation.isImportant || false);
      setAttachments(consultation.attachments || []);
    }
  }, [consultation]);

  // 과거 상담 내역 불러오기
  useEffect(() => {
    if (isPanelOpen && pastConsultations.length === 0) {
      fetchPastConsultations();
    }
  }, [isPanelOpen]);

  const fetchPastConsultations = async () => {
    setIsLoadingPast(true);
    try {
      // consultations prop이 있으면 그것을 사용
      if (consultations && consultations.length > 0) {
        const filtered = consultations
          .filter((c: Consultation) => c.id !== consultation?.id)
          .sort((a: Consultation, b: Consultation) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        setPastConsultations(filtered);
      }
    } catch (error) {
      console.error('Error fetching past consultations:', error);
    } finally {
      setIsLoadingPast(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave({ 
      clientId, 
      date, 
      content, 
      color, 
      time, 
      isImportant, 
      status: 'completed',
      attachments,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // HTML에서 텍스트만 추출
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // 검색 필터
  const filteredConsultations = pastConsultations.filter(c => {
    if (!searchQuery) return true;
    const text = stripHtml(c.content).toLowerCase();
    return text.includes(searchQuery.toLowerCase()) || 
           c.date.includes(searchQuery);
  });

  // 파일 아이콘 가져오기
  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="size-4 text-blue-500" />;
    }
    if (fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      return <FileText className="size-4 text-red-500" />;
    }
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || 
        fileName.toLowerCase().match(/\.(xlsx?|csv)$/)) {
      return <FileSpreadsheet className="size-4 text-green-600" />;
    }
    if (fileType.includes('word') || fileType.includes('document') ||
        fileName.toLowerCase().match(/\.(docx?|txt|rtf)$/)) {
      return <FileText className="size-4 text-blue-600" />;
    }
    if (fileName.toLowerCase().match(/\.(zip|rar|7z|tar|gz)$/)) {
      return <Archive className="size-4 text-yellow-600" />;
    }
    if (fileType.startsWith('video/')) {
      return <FileVideo className="size-4 text-purple-500" />;
    }
    if (fileType.startsWith('audio/')) {
      return <FileAudio className="size-4 text-pink-500" />;
    }
    return <File className="size-4 text-gray-500" />;
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="relative h-full">
      {/* 메인 폼 */}
      <Card className={`h-full transition-all duration-300 ${isPanelOpen ? 'opacity-60' : ''}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <CardTitle>
                {readOnly ? '상담 기록 조회' : consultation ? '상담 기록 수정' : '새 상담 기록'}
              </CardTitle>
              <CardDescription>
                {clientName} 고객의 상담을 {readOnly ? '확인합니다' : '기록합니다'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">상담 날짜</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={readOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>상담 내용</Label>
              <RichTextEditor content={content} onChange={setContent} readOnly={readOnly} />
            </div>

            <div className="space-y-3">
              <Label>캘린더 색상</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !readOnly && setColor(option.value)}
                    disabled={readOnly}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                      color === option.value
                        ? 'border-primary bg-primary/5 scale-105'
                        : 'border-transparent hover:border-muted-foreground/20'
                    } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                    title={option.label}
                  >
                    <div
                      className={`w-full h-6 rounded ${option.class} flex items-center justify-center`}
                    >
                      {color === option.value && (
                        <span className="text-white font-bold text-sm">✓</span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">상담 시간</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={readOnly}
                required
              />
            </div>

            {/* Important Flag */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="important"
                checked={isImportant}
                onCheckedChange={(checked) => !readOnly && setIsImportant(checked as boolean)}
                disabled={readOnly}
              />
              <Label
                htmlFor="important"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                중요 상담으로 표시
              </Label>
            </div>

            {/* File Attachments */}
            {!readOnly && (
              <div className="space-y-2">
                <Label>첨부 파일</Label>
                <FileUpload
                  clientId={clientId}
                  consultationId={undefined}
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  apiBaseUrl={API_BASE_URL}
                  publicAnonKey={publicAnonKey}
                />
              </div>
            )}

            {/* 읽기 모드에서 첨부 파일 표시 */}
            {readOnly && attachments && attachments.length > 0 && (
              <div className="space-y-2">
                <Label>첨부 파일</Label>
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div 
                      key={att.id} 
                      className="flex items-center gap-3 p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg border border-border/50 transition-colors group"
                    >
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        {getFileIcon(att.fileType, att.fileName)}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {att.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(att.fileSize)}
                        </p>
                      </div>

                      {/* Download Button */}
                      <a 
                        href={att.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        download={att.fileName}
                      >
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Download className="size-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                {readOnly ? '닫기' : '취소'}
              </Button>
              {!readOnly && (
                <Button type="submit" className="flex-1" disabled={isLoading || !content.trim()}>
                  <Save className="size-4 mr-2" />
                  {isLoading ? '저장 중...' : consultation ? '수정하기' : '저장하기'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 플로팅 버튼 */}
      {!isPanelOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => setIsPanelOpen(true)}
          className="fixed bottom-8 right-8 bg-primary text-primary-foreground rounded-full shadow-2xl hover:shadow-xl transition-all hover:scale-105 active:scale-95 p-4 flex flex-col items-center gap-1 min-w-[80px]"
          style={{ zIndex: 50 }}
        >
          <BookOpen className="size-6" />
          <span className="text-xs font-semibold">과거 상담</span>
          {pastConsultations.length > 0 && (
            <span className="text-[10px] opacity-90">{pastConsultations.length}건</span>
          )}
        </motion.button>
      )}

      {/* 슬라이드 사이드 패널 */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              style={{ zIndex: 100 }}
            />

            {/* 패널 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[480px] bg-background border-l shadow-2xl flex flex-col"
              style={{ zIndex: 101 }}
            >
              {/* 헤더 */}
              <div className="p-6 border-b bg-muted/30 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    <h3 className="font-bold text-lg">과거 상담 내역</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPanelOpen(false)}
                    className="rounded-full"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* 검색 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="상담 내용 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* 상담 목록 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingPast ? (
                  <div className="text-center text-muted-foreground py-8">
                    불러오는 중...
                  </div>
                ) : filteredConsultations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {searchQuery ? '검색 결과가 없습니다' : '과거 상담 내역이 없습니다'}
                  </div>
                ) : (
                  filteredConsultations.map((past) => (
                    <motion.div
                      key={past.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border rounded-xl p-4 hover:shadow-md transition-all space-y-3"
                    >
                      {/* 날짜 및 시간 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-${past.color || 'blue'}-500`} />
                          <span className="font-semibold text-sm">
                            {new Date(past.date).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{past.time}</span>
                      </div>

                      {/* 상담 내용 미리보기 */}
                      <div 
                        className="text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(past.content, { 
                            ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br'],
                            ALLOWED_ATTR: []
                          }) 
                        }}
                      />

                      {/* 첨부파일 표시 */}
                      {past.attachments && past.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Paperclip className="size-3" />
                          <span>{past.attachments.length}개 파일</span>
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(stripHtml(past.content))}
                          className="flex-1 text-xs"
                        >
                          <Copy className="size-3 mr-1" />
                          텍스트 복사
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(past.content)}
                          className="flex-1 text-xs"
                        >
                          <FileText className="size-3 mr-1" />
                          서식 복사
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}