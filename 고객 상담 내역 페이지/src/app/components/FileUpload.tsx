import { useState } from 'react';
import { Button } from './ui/button';
import { Paperclip, X, FileText, Image as ImageIcon, File, Loader2, Download, Trash2, FileSpreadsheet, FileVideo, FileAudio, Archive } from 'lucide-react';
import { Attachment } from '../types/client';
import { toast } from 'sonner';

interface FileUploadProps {
  clientId: string;
  consultationId?: string; // Optional for new consultations
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  apiBaseUrl: string;
  publicAnonKey: string;
}

export function FileUpload({
  clientId,
  consultationId,
  attachments,
  onAttachmentsChange,
  apiBaseUrl,
  publicAnonKey,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    // 이미지 파일
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="size-5 text-blue-500" />;
    }
    
    // PDF
    if (fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      return <FileText className="size-5 text-red-500" />;
    }
    
    // Excel/Spreadsheet
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || 
        fileName.toLowerCase().match(/\.(xlsx?|csv)$/)) {
      return <FileSpreadsheet className="size-5 text-green-600" />;
    }
    
    // Word/Document
    if (fileType.includes('word') || fileType.includes('document') ||
        fileName.toLowerCase().match(/\.(docx?|txt|rtf)$/)) {
      return <FileText className="size-5 text-blue-600" />;
    }
    
    // 압축 파일
    if (fileName.toLowerCase().match(/\.(zip|rar|7z|tar|gz)$/)) {
      return <Archive className="size-5 text-yellow-600" />;
    }
    
    // 비디오
    if (fileType.startsWith('video/')) {
      return <FileVideo className="size-5 text-purple-500" />;
    }
    
    // 오디오
    if (fileType.startsWith('audio/')) {
      return <FileAudio className="size-5 text-pink-500" />;
    }
    
    // 기타
    return <File className="size-5 text-gray-500" />;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log('[FileUpload] Files selected:', files.length);

    const fileArray = Array.from(files);

    // If consultationId exists, upload immediately
    if (consultationId) {
      console.log('[FileUpload] ConsultationId exists, uploading immediately');
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);

        const tempId = `uploading-${Date.now()}`;
        setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

        const response = await fetch(
          `${apiBaseUrl}/clients/${clientId}/consultations/${consultationId}/attachments`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${publicAnonKey}` },
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('[FileUpload] File uploaded successfully:', data.attachment);
          onAttachmentsChange([...attachments, data.attachment]);
        } else {
          console.error('[FileUpload] Upload failed');
        }

        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[tempId];
          return newProgress;
        });
      }
    } else {
      console.log('[FileUpload] No consultationId, creating pending attachments');
      // No consultationId yet - create pending attachments
      const pendingAttachments: Attachment[] = await Promise.all(
        fileArray.map(async (file) => {
          const id = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Convert file to base64 and store in sessionStorage
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const base64 = await base64Promise;
          sessionStorage.setItem(`pending-file-${id}`, base64);
          
          console.log('[FileUpload] Created pending attachment:', id);

          return {
            id,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            url: base64, // Temporarily use base64 for preview
            uploadedAt: new Date().toISOString(),
          };
        })
      );

      console.log('[FileUpload] Total pending attachments:', pendingAttachments.length);
      console.log('[FileUpload] Calling onAttachmentsChange with:', [...attachments, ...pendingAttachments]);
      
      onAttachmentsChange([...attachments, ...pendingAttachments]);
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveAttachment = async (attachment: Attachment) => {
    // If it's a pending attachment (not yet uploaded), just remove from list
    if (attachment.id.startsWith('pending-')) {
      onAttachmentsChange(attachments.filter((a) => a.id !== attachment.id));
      sessionStorage.removeItem(`pending-file-${attachment.id}`);
      return;
    }

    // If consultationId exists, delete from server
    if (consultationId) {
      try {
        const response = await fetch(
          `${apiBaseUrl}/clients/${clientId}/consultations/${consultationId}/attachments/${attachment.id}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${publicAnonKey}` },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete attachment');
        }

        onAttachmentsChange(attachments.filter((a) => a.id !== attachment.id));
        toast.success('파일이 삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting attachment:', error);
        toast.error('파일 삭제에 실패했습니다.');
      }
    } else {
      onAttachmentsChange(attachments.filter((a) => a.id !== attachment.id));
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      <div>
        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="h-9 text-sm"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {isUploading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Paperclip className="size-4 mr-2" />
            )}
            파일 첨부
          </Button>
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,video/*,audio/*"
        />
      </div>

      {/* Attached Files List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg border border-border/50 transition-colors group"
            >
              {/* File Icon */}
              <div className="flex-shrink-0">
                {getFileIcon(attachment.fileType, attachment.fileName)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.fileSize)}
                  {attachment.id.startsWith('pending-') && (
                    <span className="ml-2 text-amber-600">• 업로드 대기 중</span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Download button for uploaded files */}
                {!attachment.id.startsWith('pending-') && attachment.url && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.fileName}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="size-4" />
                    </Button>
                  </a>
                )}

                {/* Delete button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAttachment(attachment)}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}