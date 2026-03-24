import { describe, it, expect } from 'vitest';
import type { Client, Consultation, Attachment } from './client';

describe('Type Definitions', () => {
  describe('Client Type', () => {
    it('should have all required properties', () => {
      const client: Client = {
        id: 'test-id',
        name: '테스트 고객',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('name');
      expect(client).toHaveProperty('createdAt');
      expect(client).toHaveProperty('updatedAt');
    });

    it('should allow optional properties', () => {
      const client: Client = {
        id: 'test-id',
        name: '테스트 고객',
        phone: '010-1234-5678',
        email: 'test@example.com',
        businessNumber: '123-45-67890',
        industry: '제조업',
        memo: '테스트 메모',
        isVip: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(client.phone).toBe('010-1234-5678');
      expect(client.isVip).toBe(true);
    });
  });

  describe('Consultation Type', () => {
    it('should have all required properties', () => {
      const consultation: Consultation = {
        id: 'consult-id',
        clientId: 'client-id',
        date: '2026-01-11',
        content: '상담 내용',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(consultation).toHaveProperty('id');
      expect(consultation).toHaveProperty('clientId');
      expect(consultation).toHaveProperty('date');
      expect(consultation).toHaveProperty('content');
    });

    it('should allow optional status field', () => {
      const consultation: Consultation = {
        id: 'consult-id',
        clientId: 'client-id',
        date: '2026-01-11',
        time: '14:30',
        content: '예약된 상담',
        status: 'scheduled',
        isImportant: true,
        color: 'blue',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(consultation.status).toBe('scheduled');
      expect(consultation.isImportant).toBe(true);
      expect(consultation.color).toBe('blue');
    });
  });

  describe('Attachment Type', () => {
    it('should have all required properties', () => {
      const attachment: Attachment = {
        id: 'file-id',
        fileName: 'document.pdf',
        fileSize: 1024000,
        fileType: 'application/pdf',
        url: 'https://example.com/file.pdf',
        uploadedAt: new Date().toISOString(),
      };

      expect(attachment).toHaveProperty('id');
      expect(attachment).toHaveProperty('fileName');
      expect(attachment).toHaveProperty('fileSize');
      expect(attachment).toHaveProperty('fileType');
      expect(attachment).toHaveProperty('url');
      expect(attachment).toHaveProperty('uploadedAt');
    });
  });
});
