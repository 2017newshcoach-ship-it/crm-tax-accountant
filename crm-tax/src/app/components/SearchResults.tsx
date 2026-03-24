import { useMemo } from 'react';
import { Client, Consultation } from '../types/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Search, User, Calendar, FileText, Star, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface SearchResultsProps {
  searchQuery: string;
  clients: Client[];
  consultations: Consultation[];
  onSelectConsultation?: (consultation: Consultation, client: Client) => void;
  onBack: () => void;
}

export function SearchResults({
  searchQuery,
  clients,
  consultations,
  onSelectConsultation,
  onBack,
}: SearchResultsProps) {
  // Strip HTML tags for search
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: Array<{
      consultation: Consultation;
      client: Client;
      matchType: 'content' | 'clientName' | 'date';
      excerpt?: string;
      matchScore: number;
    }> = [];

    consultations.forEach((consultation) => {
      const client = clients.find(c => c.id === consultation.clientId);
      if (!client) return;

      const contentText = stripHtml(consultation.content).toLowerCase();
      const clientName = client.name.toLowerCase();
      const dateStr = format(new Date(consultation.date), 'yyyy년 M월 d일', { locale: ko }).toLowerCase();

      // Calculate match score
      let matchScore = 0;
      let matchType: 'content' | 'clientName' | 'date' | null = null;
      let excerpt = '';

      // Content match (highest priority)
      if (contentText.includes(query)) {
        matchType = 'content';
        matchScore = 3;
        
        // Get excerpt around the match
        const index = contentText.indexOf(query);
        const start = Math.max(0, index - 60);
        const end = Math.min(contentText.length, index + query.length + 60);
        excerpt = (start > 0 ? '...' : '') + 
                  contentText.substring(start, end) + 
                  (end < contentText.length ? '...' : '');
      } 
      // Client name match
      else if (clientName.includes(query)) {
        matchType = 'clientName';
        matchScore = 2;
      } 
      // Date match
      else if (dateStr.includes(query)) {
        matchType = 'date';
        matchScore = 1;
      }

      if (matchType) {
        // Boost score for important consultations
        if (consultation.isImportant) matchScore += 0.5;
        // Boost score for VIP clients
        if (client.isVip) matchScore += 0.3;

        results.push({
          consultation,
          client,
          matchType,
          excerpt,
          matchScore,
        });
      }
    });

    // Sort by match score (descending) then by date (descending)
    results.sort((a, b) => {
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return new Date(b.consultation.date).getTime() - new Date(a.consultation.date).getTime();
    });

    return results;
  }, [searchQuery, consultations, clients]);

  // Group results by client
  const groupedResults = useMemo(() => {
    const groups = new Map<string, typeof searchResults>();
    
    searchResults.forEach((result) => {
      const clientId = result.client.id;
      if (!groups.has(clientId)) {
        groups.set(clientId, []);
      }
      groups.get(clientId)!.push(result);
    });

    return Array.from(groups.entries()).map(([clientId, results]) => ({
      client: results[0].client,
      results,
    }));
  }, [searchResults]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="rounded-xl px-4 h-12"
        >
          <ArrowLeft className="size-4 mr-2" />
          뒤로
        </Button>
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="size-6 text-primary" />
            검색 결과
          </h1>
          <p className="text-sm text-muted-foreground font-normal">
            '<span className="font-semibold text-foreground">{searchQuery}</span>' 검색 결과 {searchResults.length}건
          </p>
        </div>
      </div>

      {/* No Results */}
      {searchResults.length === 0 && (
        <Card className="border-2">
          <CardContent className="p-12 text-center">
            <Search className="size-16 mx-auto text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              '<span className="font-semibold">{searchQuery}</span>'에 대한 상담 기록을 찾을 수 없습니다.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              다른 검색어로 시도해보세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results grouped by client */}
      {groupedResults.map(({ client, results }) => (
        <Card key={client.id} className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="size-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {client.name}
                    {client.isVip && <span className="text-base">👑</span>}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {client.email || client.phone}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => onSelectConsultation ? onSelectConsultation(results[0].consultation, results[0].client) : null}
                className="rounded-xl"
              >
                상세보기
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {results.map((result, index) => (
              <div
                key={`${result.consultation.id}-${index}`}
                className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => onSelectConsultation ? onSelectConsultation(result.consultation, result.client) : null}
              >
                {/* Date and Time */}
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="size-4 text-primary" />
                  <span className="text-sm font-semibold">
                    {format(new Date(result.consultation.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                  </span>
                  {result.consultation.time && (
                    <span className="text-sm text-muted-foreground">
                      {result.consultation.time}
                    </span>
                  )}
                  {result.consultation.isImportant && (
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>

                {/* Match Type Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {result.matchType === 'content' && '상담 내용 일치'}
                    {result.matchType === 'clientName' && '고객 이름 일치'}
                    {result.matchType === 'date' && '날짜 일치'}
                  </span>
                </div>

                {/* Excerpt */}
                {result.matchType === 'content' && result.excerpt && (
                  <div className="text-sm text-muted-foreground line-clamp-3 pl-6">
                    <FileText className="size-3 inline mr-2" />
                    {result.excerpt}
                  </div>
                )}

                {/* Attachments count */}
                {result.consultation.attachments && result.consultation.attachments.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-2 pl-6">
                    📎 첨부파일 {result.consultation.attachments.length}개
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}