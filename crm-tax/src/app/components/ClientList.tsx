import { useState } from 'react';
import { Client, Consultation } from '../types/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, UserPlus, User, Phone, Mail, Briefcase, Crown, Edit, Trash2, Star } from 'lucide-react';
import { CheckCircle, Clock } from 'lucide-react';
import { FileText } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  consultations: Consultation[];
  onSelectClient: (client: Client) => void;
  onNewClient: () => void;
  onEditClient?: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
  onToggleVip?: (clientId: string) => void;
  isLoading: boolean;
}

export function ClientList({
  clients,
  consultations,
  onSelectClient,
  onNewClient,
  onEditClient,
  onDeleteClient,
  onToggleVip,
  isLoading,
}: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getLatestConsultation = (clientId: string) => {
    const clientConsultations = consultations
      .filter((c) => c.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return clientConsultations[0];
  };

  const getConsultationCount = (clientId: string) => {
    return consultations.filter((c) => c.clientId === clientId).length;
  };

  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(term) ||
      client.phone?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.businessNumber?.toLowerCase().includes(term) ||
      client.industry?.toLowerCase().includes(term)
    );
  }).sort((a, b) => {
    const aLatest = getLatestConsultation(a.id);
    const bLatest = getLatestConsultation(b.id);
    if (!aLatest && !bLatest) return b.createdAt.localeCompare(a.createdAt);
    if (!aLatest) return 1;
    if (!bLatest) return -1;
    return bLatest.date.localeCompare(aLatest.date);
  });

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>고객 목록</CardTitle>
        <CardDescription>
          등록된 고객: {clients.length}명
        </CardDescription>
        <div className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="고객명, 연락처, 사업자번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            불러오는 중...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 고객이 없습니다.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => {
              const latestConsultation = getLatestConsultation(client.id);
              const consultationCount = getConsultationCount(client.id);
              
              // 총 상담 건수와 예약 건수
              const clientConsultations = consultations.filter(c => c.clientId === client.id);
              const totalCount = clientConsultations.length;
              
              // 미래 날짜 예약 건수
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const scheduledCount = clientConsultations.filter(c => {
                const consultationDate = new Date(c.date);
                consultationDate.setHours(0, 0, 0, 0);
                return consultationDate > today;
              }).length;
              
              return (
                <Card
                  key={client.id}
                  className="group hover:bg-muted/50 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer" 
                        onClick={() => onSelectClient(client)}
                      >
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="size-4 text-primary" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base">{client.name}</h3>
                            {client.isVip && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                <Crown className="size-3 mr-1" />
                                VIP
                              </Badge>
                            )}
                            {totalCount > 0 && (
                              <Badge variant="secondary" className="gap-1 bg-gray-50 text-gray-700 border-gray-200">
                                <FileText className="size-3" />
                                상담 {totalCount}건
                              </Badge>
                            )}
                            {scheduledCount > 0 && (
                              <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600 bg-blue-50">
                                <Clock className="size-3" />
                                예약 {scheduledCount}건
                              </Badge>
                            )}
                            {consultationCount === 0 && (
                              <span className="text-sm text-muted-foreground">
                                상담 내역 없음
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {latestConsultation && (
                          <span className="text-sm text-muted-foreground font-normal">
                            {new Date(latestConsultation.date).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleVip?.(client.id);
                            }}
                          >
                            <Star className={`size-4 ${client.isVip ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditClient?.(client);
                            }}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteClient?.(client.id);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="space-y-1 text-sm cursor-pointer" 
                      onClick={() => onSelectClient(client)}
                    >
                      {client.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="size-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="size-3" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.industry && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="size-3" />
                          <span>{client.industry}</span>
                        </div>
                      )}
                    </div>

                    {latestConsultation && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">최근 상담</p>
                        <p className="text-sm line-clamp-2">
                          {stripHtml(latestConsultation.content)}
                        </p>
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
  );
}