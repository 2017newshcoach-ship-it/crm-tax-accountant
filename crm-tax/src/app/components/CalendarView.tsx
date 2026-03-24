import { useState } from 'react';
import { Client, Consultation } from '../types/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Calendar as CalendarIcon, Users, FileText, Crown, ChevronLeft, ChevronRight, Plus, Clock, CheckCircle, XCircle, Edit, Save, X, Star, MoreVertical, Trash2, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AppointmentDialog } from './AppointmentDialog';
import { ConsultationDialog } from './ConsultationDialog';
import { RichTextEditor } from './RichTextEditor';

interface CalendarViewProps {
  clients: Client[];
  consultations: Consultation[];
  onSelectClient: (client: Client) => void;
  onCreateAppointment: (data: {
    clientId: string;
    date: string;
    time: string;
    status?: 'scheduled';
    color?: string;
  }) => Promise<void>;
  onCreateConsultation: (data: {
    clientId: string;
    date: string;
    time: string;
    content: string;
    isImportant: boolean;
    color?: string;
  }) => Promise<void>;
  onUpdateConsultation?: (consultationId: string, data: {
    clientId: string;
    date: string;
    time: string;
    content: string;
    isImportant: boolean;
    status?: 'scheduled';
    color?: string;
    attachments?: any[];
  }) => Promise<void>;
  onCancelAppointment?: (consultationId: string) => Promise<void>;
  onNewClient: () => void;
}

export function CalendarView({
  clients,
  consultations,
  onSelectClient,
  onCreateAppointment,
  onCreateConsultation,
  onUpdateConsultation,
  onCancelAppointment,
  onNewClient,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [consultationDialogOpen, setConsultationDialogOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [prefilledClientId, setPrefilledClientId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 첫 날의 요일 계산 (일요일 = 0)
  const firstDayOfWeek = monthStart.getDay();

  // 빈 셀 생성
  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  // 특정 날짜의 상담 건수
  const getConsultationsForDate = (date: Date) => {
    return consultations.filter((c) => {
      const consultDate = new Date(c.date);
      return isSameDay(consultDate, date);
    });
  };

  // 선택된 날짜의 상담 목록
  const selectedDateConsultations = selectedDate
    ? getConsultationsForDate(selectedDate)
    : [];

  // 고객 정보 가져오기
  const getClientById = (clientId: string) => {
    return clients.find((c) => c.id === clientId);
  };

  // 이전 달
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  // 다음 달
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  // 오늘로 이동
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 좌측: 캘린더 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {format(currentMonth, 'yyyy년 M월', { locale: ko })}
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleToday}>
                  오늘
                </Button>
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* 요일 헤더 */}
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <div
                  key={day}
                  className={`text-center text-sm font-semibold py-2 ${
                    i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''
                  }`}
                >
                  {day}
                </div>
              ))}

              {/* 빈 셀 */}
              {emptyCells.map((i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* 날짜 셀 */}
              {daysInMonth.map((day) => {
                const dayConsultations = getConsultationsForDate(day);
                const hasConsultations = dayConsultations.length > 0;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                // 시간 순으로 정렬
                const sortedConsultations = [...dayConsultations].sort((a, b) => {
                  const timeA = a.time || '00:00';
                  const timeB = b.time || '00:00';
                  return timeA.localeCompare(timeB);
                });

                // 최대 3개만 표시
                const displayConsultations = sortedConsultations.slice(0, 3);
                const remainingCount = sortedConsultations.length - 3;

                // 색상 매핑
                const getColorClass = (color?: string) => {
                  const colorMap: Record<string, string> = {
                    red: 'bg-red-500 text-white',
                    pink: 'bg-pink-500 text-white',
                    orange: 'bg-orange-500 text-white',
                    yellow: 'bg-yellow-500 text-white',
                    teal: 'bg-teal-500 text-white',
                    green: 'bg-green-600 text-white',
                    blue: 'bg-blue-500 text-white',
                    indigo: 'bg-indigo-600 text-white',
                    lavender: 'bg-purple-400 text-white',
                    purple: 'bg-purple-600 text-white',
                    gray: 'bg-gray-500 text-white',
                    slate: 'bg-slate-600 text-white',
                  };
                  return colorMap[color || 'teal'] || 'bg-teal-500 text-white';
                };

                const getColorBorderClass = (color?: string) => {
                  const colorMap: Record<string, string> = {
                    red: 'border-red-500',
                    pink: 'border-pink-500',
                    orange: 'border-orange-500',
                    yellow: 'border-yellow-500',
                    teal: 'border-teal-500',
                    green: 'border-green-600',
                    blue: 'border-blue-500',
                    indigo: 'border-indigo-600',
                    lavender: 'border-purple-400',
                    purple: 'border-purple-600',
                    gray: 'border-gray-500',
                    slate: 'border-slate-600',
                  };
                  return colorMap[color || 'teal'] || 'border-teal-500';
                };

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[120px] p-1.5 rounded-lg border transition-all relative flex flex-col
                      ${isSelected ? 'bg-primary/5 border-primary border-2' : hasConsultations ? 'bg-white hover:bg-accent' : 'hover:bg-accent'}
                      ${isTodayDate && !isSelected ? 'border-primary border-2 bg-blue-50' : ''}
                      ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}
                    `}
                  >
                    <div className={`text-xs font-semibold mb-1 ${isTodayDate ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* 예약/상담 목록 */}
                    {hasConsultations && (
                      <div className="space-y-0.5 w-full flex-1 overflow-hidden">
                        {displayConsultations.map((consultation) => {
                          const client = getClientById(consultation.clientId);
                          return (
                            <div
                              key={consultation.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded bg-muted/30 border-l-2 truncate ${getColorBorderClass(consultation.color)}`}
                              title={`${consultation.time || ''} ${client?.name || ''}`}
                            >
                              <div className="font-medium truncate text-foreground">
                                {consultation.time && <span>{consultation.time}</span>}
                                {consultation.time && client?.name && <span> </span>}
                                {client?.name && <span>{client.name}</span>}
                              </div>
                            </div>
                          );
                        })}
                        {remainingCount > 0 && (
                          <div className="text-[10px] text-muted-foreground font-medium px-1">
                            +{remainingCount}개 더
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 우측: 선택된 날짜의 상담 내역 */}
        <Card className="lg:h-[600px] flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">
                  {selectedDate ? format(selectedDate, 'M월 d일 (EEE)', { locale: ko }) : '날짜를 선택하세요'}
                </CardTitle>
                <CardDescription className="text-sm font-normal">
                  {selectedDate && `${selectedDateConsultations.length}건의 상담`}
                </CardDescription>
              </div>
              {selectedDate && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConsultationDialogOpen(true)}
                  >
                    <Edit className="size-4 mr-1" />
                    상담 기록
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setAppointmentDialogOpen(true)}
                  >
                    <Clock className="size-4 mr-1" />
                    예약 등록
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {!selectedDate ? (
              <div className="text-center py-12">
                <CalendarIcon className="size-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  캘린더에서 날짜를 선택하면<br />상담 내역을 확인할 수 있습니다
                </p>
              </div>
            ) : selectedDateConsultations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  이 날짜에 등록된<br />상담 내역이 없습니다
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateConsultations
                  .sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                    const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((consultation) => {
                    const client = getClientById(consultation.clientId);
                    if (!client) return null;

                    // 날짜 기반 상태 판단
                    const consultationDate = new Date(consultation.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    consultationDate.setHours(0, 0, 0, 0);
                    
                    const isFuture = consultationDate > today;
                    const isPast = consultationDate < today;
                    const hasContent = consultation.content && consultation.content.trim().length > 0;

                    return (
                      <Card
                        key={consultation.id}
                        className={`cursor-pointer hover:shadow-md transition-all ${
                          consultation.isImportant ? 'border-yellow-500 bg-yellow-50/50' : ''
                        } ${isPast && !hasContent ? 'border-red-500 bg-red-50/30' : ''}`}
                        onClick={() => {
                          // 모든 상담에 대해 상담 기록 다이얼로그 열기
                          setSelectedConsultation(consultation);
                          setPrefilledClientId(client.id);
                          setConsultationDialogOpen(true);
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
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
                              <span className="text-sm font-semibold">{client.name}</span>
                              {client.isVip && <Crown className="size-4 text-yellow-500" />}
                            </div>
                            {consultation.time && (
                              <span className="text-xs text-muted-foreground">
                                {consultation.time}
                              </span>
                            )}
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

      {/* Appointment Dialog */}
      {selectedDate && (
        <AppointmentDialog
          open={appointmentDialogOpen}
          onOpenChange={setAppointmentDialogOpen}
          selectedDate={selectedDate}
          clients={clients}
          onSave={onCreateAppointment}
          onNewClient={onNewClient}
        />
      )}

      {/* Consultation Dialog */}
      {selectedDate && (
        <ConsultationDialog
          open={consultationDialogOpen}
          onOpenChange={(open) => {
            setConsultationDialogOpen(open);
            if (!open) {
              setPrefilledClientId(null);
              setSelectedConsultation(null);
            }
          }}
          selectedDate={selectedDate}
          clients={clients}
          consultations={consultations}
          onSave={onCreateConsultation}
          onUpdate={onUpdateConsultation}
          onCancelAppointment={onCancelAppointment}
          onNewClient={onNewClient}
          prefilledClientId={prefilledClientId}
          selectedConsultation={selectedConsultation}
        />
      )}
    </div>
  );
}