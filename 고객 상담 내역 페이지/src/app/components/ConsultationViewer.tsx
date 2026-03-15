import { Consultation, Client, Attachment } from '../types/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Edit, Calendar, Clock, Star, Paperclip, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import { motion } from 'motion/react';

interface ConsultationViewerProps {
  consultation: Consultation;
  client: Client;
  consultations: Consultation[];
  onBack: () => void;
  onEdit: () => void;
  onSelectConsultation?: (consultation: Consultation) => void;
}

export function ConsultationViewer({
  consultation,
  client,
  consultations,
  onBack,
  onEdit,
  onSelectConsultation,
}: ConsultationViewerProps) {
  const sanitizedContent = DOMPurify.sanitize(consultation.content || '');

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="size-4" />;
    return <FileText className="size-4" />;
  };

  // Sort consultations by date (most recent first)
  const sortedConsultations = [...consultations]
    .filter(c => c.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-[1fr,320px] gap-6 max-w-7xl mx-auto"
    >
      {/* Left: Consultation Content */}
      <Card className="shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="hover:bg-secondary"
                >
                  <ArrowLeft className="size-4 mr-2" />
                  뒤로
                </Button>
                {consultation.isImportant && (
                  <Badge variant="default" className="bg-yellow-500 text-white">
                    <Star className="size-3 mr-1 fill-white" />
                    중요
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-2xl">
                {client.name} {client.isVip && '👑'}
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  {format(new Date(consultation.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                </span>
                {consultation.time && (
                  <span className="flex items-center gap-2">
                    <Clock className="size-4" />
                    {consultation.time}
                  </span>
                )}
              </CardDescription>
            </div>
            
            <Button
              onClick={onEdit}
              className="bg-primary hover:bg-primary/90 text-white shadow-md"
            >
              <Edit className="size-4 mr-2" />
              수정
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Consultation Content */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">상담 내용</h3>
            <div 
              className="prose prose-sm max-w-none bg-secondary/30 rounded-xl p-6 border min-h-[400px]"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </div>

          {/* Attachments */}
          {consultation.attachments && consultation.attachments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Paperclip className="size-4" />
                첨부 파일 ({consultation.attachments.length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {consultation.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl border hover:bg-secondary/70 transition-colors group"
                  >
                    <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                      {getFileIcon(attachment.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={attachment.fileName}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Button variant="ghost" size="sm">
                        <Download className="size-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Info Summary */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">고객 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {client.email && (
                <div>
                  <span className="text-muted-foreground">이메일:</span>
                  <p className="font-medium">{client.email}</p>
                </div>
              )}
              {client.phone && (
                <div>
                  <span className="text-muted-foreground">연락처:</span>
                  <p className="font-medium">{client.phone}</p>
                </div>
              )}
              {client.businessNumber && (
                <div>
                  <span className="text-muted-foreground">사업자번호:</span>
                  <p className="font-medium">{client.businessNumber}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Past Consultations */}
      <Card className="shadow-lg h-fit sticky top-6">
        <CardHeader>
          <CardTitle className="text-lg">과거 상담</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {sortedConsultations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              상담 기록이 없습니다.
            </p>
          ) : (
            sortedConsultations.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectConsultation?.(c)}
                disabled={c.id === consultation.id}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  c.id === consultation.id
                    ? 'bg-primary text-white shadow-md cursor-default'
                    : 'bg-secondary/30 hover:bg-secondary/50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">
                    {format(new Date(c.date), 'M월 d일', { locale: ko })}
                  </span>
                  {c.time && (
                    <span className={`text-xs ${
                      c.id === consultation.id ? 'text-white/80' : 'text-muted-foreground'
                    }`}>
                      {c.time}
                    </span>
                  )}
                </div>
                {c.isImportant && (
                  <Star className={`size-3 ${
                    c.id === consultation.id ? 'text-white fill-white' : 'text-yellow-500 fill-yellow-500'
                  }`} />
                )}
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}