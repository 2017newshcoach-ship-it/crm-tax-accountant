/**
 * Centralized API Service Layer
 * All API calls should go through this service
 */

import { Client, Consultation, Attachment } from '../types/client';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

// ===== Helper Functions =====

async function fetchJSON<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ===== Client API =====

export const clientAPI = {
  /**
   * Get all clients
   */
  async getAll(): Promise<{ clients: Client[] }> {
    return fetchJSON(`${API_BASE_URL}/clients`);
  },

  /**
   * Get a single client by ID
   */
  async getById(id: string): Promise<{ client: Client }> {
    return fetchJSON(`${API_BASE_URL}/clients/${id}`);
  },

  /**
   * Create a new client
   */
  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ client: Client }> {
    return fetchJSON(`${API_BASE_URL}/clients`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing client
   */
  async update(
    id: string,
    data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ client: Client }> {
    return fetchJSON(`${API_BASE_URL}/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a client
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return fetchJSON(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE',
    });
  },
};

// ===== Consultation API =====

export const consultationAPI = {
  /**
   * Get all consultations for a client
   */
  async getByClient(clientId: string): Promise<{ consultations: Consultation[] }> {
    return fetchJSON(`${API_BASE_URL}/clients/${clientId}/consultations`);
  },

  /**
   * Get all consultations (across all clients)
   */
  async getAll(): Promise<{ consultations: Consultation[] }> {
    return fetchJSON(`${API_BASE_URL}/consultations`);
  },

  /**
   * Create a new consultation
   */
  async create(
    clientId: string,
    data: {
      date: string;
      time: string;
      content: string;
      status?: 'scheduled';
      color?: string;
    }
  ): Promise<{ consultation: Consultation }> {
    return fetchJSON(`${API_BASE_URL}/clients/${clientId}/consultations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a consultation
   */
  async update(
    clientId: string,
    consultationId: string,
    data: {
      date: string;
      time: string;
      content: string;
      isImportant?: boolean;
      status?: 'scheduled';
      color?: string;
      attachments?: Attachment[];
    }
  ): Promise<{ consultation: Consultation }> {
    return fetchJSON(`${API_BASE_URL}/clients/${clientId}/consultations/${consultationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Toggle important status
   */
  async toggleImportant(
    clientId: string,
    consultationId: string
  ): Promise<{ consultation: Consultation }> {
    return fetchJSON(
      `${API_BASE_URL}/clients/${clientId}/consultations/${consultationId}/important`,
      { method: 'PATCH' }
    );
  },

  /**
   * Delete a consultation
   */
  async delete(clientId: string, consultationId: string): Promise<{ success: boolean }> {
    return fetchJSON(`${API_BASE_URL}/clients/${clientId}/consultations/${consultationId}`, {
      method: 'DELETE',
    });
  },
};

// ===== File Upload API =====

export const fileAPI = {
  /**
   * Upload a file to a consultation
   */
  async upload(
    clientId: string,
    consultationId: string,
    file: File
  ): Promise<{ attachment: Attachment }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${API_BASE_URL}/clients/${clientId}/consultations/${consultationId}/attachments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'File upload failed');
    }

    return response.json();
  },

  /**
   * Delete an attachment
   */
  async delete(
    clientId: string,
    consultationId: string,
    attachmentId: string
  ): Promise<{ success: boolean }> {
    return fetchJSON(
      `${API_BASE_URL}/clients/${clientId}/consultations/${consultationId}/attachments/${attachmentId}`,
      { method: 'DELETE' }
    );
  },
};

// ===== Auth API =====

export const authAPI = {
  /**
   * Sign up a new user
   */
  async signup(data: {
    username: string;
    password: string;
    email: string;
  }): Promise<{ success: boolean; message: string }> {
    return fetchJSON(`${API_BASE_URL}/signup`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Login user
   */
  async login(data: {
    username: string;
    password: string;
  }): Promise<{ success: boolean; isAdmin: boolean; username: string }> {
    return fetchJSON(`${API_BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Send verification code
   */
  async sendVerificationCode(data: {
    email: string;
    code: string;
  }): Promise<{ success: boolean; message: string }> {
    return fetchJSON(`${API_BASE_URL}/send-verification`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Reset password
   */
  async resetPassword(data: {
    email: string;
  }): Promise<{ success: boolean; message: string }> {
    return fetchJSON(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ===== Admin API =====

export const adminAPI = {
  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<{ users: Array<{ username: string; email: string; createdAt: string }> }> {
    return fetchJSON(`${API_BASE_URL}/admin/users`);
  },

  /**
   * Delete a user (admin only)
   */
  async deleteUser(username: string): Promise<{ success: boolean; message: string }> {
    return fetchJSON(`${API_BASE_URL}/admin/delete-user`, {
      method: 'DELETE',
      body: JSON.stringify({ username }),
    });
  },
};
