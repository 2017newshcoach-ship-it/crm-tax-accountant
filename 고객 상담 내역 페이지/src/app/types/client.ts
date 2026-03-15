export interface Client {
  id: string;
  userId: string; // 소유자 사용자 아이디
  name: string;
  phone?: string;
  email?: string;
  businessNumber?: string;
  industry?: string;
  memo?: string;
  isVip?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedAt: string;
}

export interface Consultation {
  id: string;
  userId: string; // 소유자 사용자 아이디
  clientId: string;
  date: string;
  time?: string; // HH:mm 형식 (예: "14:30")
  content: string;
  status?: 'scheduled'; // 예약 여부 (미래 날짜는 scheduled, 과거는 content 유무로 판단)
  isImportant?: boolean;
  color?: string; // 캘린더에 표시될 색상 (예: "blue", "green", "red", "purple", "orange", "pink")
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}