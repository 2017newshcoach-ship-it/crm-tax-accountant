import { useState, useEffect, useMemo } from 'react';
import { Client, Consultation } from '../types/client';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Search, X, Calendar, User, FileText, Star, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface GlobalSearchBarProps {
  clients: Client[];
  consultations: Consultation[];
  onSelectConsultation?: (consultation: Consultation, client: Client) => void;
  onSearch?: (query: string) => void;
}

export function GlobalSearchBar({
  clients,
  consultations,
  onSelectConsultation,
  onSearch,
}: GlobalSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-search-container]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      type: 'consultation';
      consultation: Consultation;
      client: Client;
      matchType: 'content' | 'clientName' | 'date';
      excerpt?: string;
    }> = [];

    consultations.forEach((consultation) => {
      const client = clients.find(c => c.id === consultation.clientId);
      if (!client) return;

      const contentText = stripHtml(consultation.content).toLowerCase();
      const clientName = client.name.toLowerCase();
      const dateStr = format(new Date(consultation.date), 'yyyy년 M월 d일', { locale: ko }).toLowerCase();

      // Check if matches
      let matchType: 'content' | 'clientName' | 'date' | null = null;
      let excerpt = '';

      if (contentText.includes(query)) {
        matchType = 'content';
        // Get excerpt around the match
        const index = contentText.indexOf(query);
        const start = Math.max(0, index - 40);
        const end = Math.min(contentText.length, index + query.length + 40);
        excerpt = (start > 0 ? '...' : '') + 
                  contentText.substring(start, end) + 
                  (end < contentText.length ? '...' : '');
      } else if (clientName.includes(query)) {
        matchType = 'clientName';
      } else if (dateStr.includes(query)) {
        matchType = 'date';
      }

      if (matchType) {
        results.push({
          type: 'consultation',
          consultation,
          client,
          matchType,
          excerpt,
        });
      }
    });

    // Sort by date (most recent first)
    results.sort((a, b) => 
      new Date(b.consultation.date).getTime() - new Date(a.consultation.date).getTime()
    );

    return results.slice(0, 10); // Limit to 10 results
  }, [searchQuery, consultations, clients]);

  const handleResultClick = (result: typeof searchResults[0]) => {
    if (onSelectConsultation) {
      onSelectConsultation(result.consultation, result.client);
    }
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div 
      className="relative w-full max-w-3xl mx-auto" 
      data-search-container
    >
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="상담 내용, 고객 이름, 날짜로 검색..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => searchQuery && setIsOpen(true)}
          className="pl-12 pr-12 h-12 text-base bg-white/80 backdrop-blur-sm border-2 border-border hover:border-primary/30 focus:border-primary transition-all shadow-sm"
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-8 p-0 hover:bg-secondary"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {isOpen && searchQuery && searchResults.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-2xl border-2 border-border max-h-[500px] overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[450px]">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.consultation.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-4 hover:bg-secondary/50 transition-colors border-b last:border-b-0 focus:bg-secondary/70 focus:outline-none"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <User className="size-4 text-primary" />
                    <span className="font-semibold text-sm">{result.client.name}</span>
                    {result.client.isVip && <span className="text-xs">👑</span>}
                    {result.consultation.isImportant && (
                      <Star className="size-3 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>
                      {format(new Date(result.consultation.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                    </span>
                    {result.consultation.time && (
                      <span className="text-muted-foreground">
                        {result.consultation.time}
                      </span>
                    )}
                  </div>

                  {/* Excerpt or Match Type */}
                  {result.matchType === 'content' && result.excerpt ? (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {result.excerpt}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="size-3" />
                      <span>
                        {result.matchType === 'clientName' && '고객 이름 일치'}
                        {result.matchType === 'date' && '날짜 일치'}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* View All Link */}
            {onSearch && (
              <div className="border-t bg-secondary/20">
                <button
                  onClick={() => {
                    onSearch(searchQuery);
                    setIsOpen(false);
                  }}
                  className="w-full p-3 text-center text-sm font-semibold text-primary hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
                >
                  전체 검색 결과 보기
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {isOpen && searchQuery && searchResults.length === 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-2xl border-2 border-border">
          <CardContent className="p-8 text-center">
            <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              '<span className="font-semibold">{searchQuery}</span>'에 대한 검색 결과가 없습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}