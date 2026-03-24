import { useState, useEffect } from 'react';
import { Client, Consultation, Attachment } from './types/client';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { ForgotPassword } from './components/ForgotPassword';
import { AdminPanel } from './components/AdminPanel';
import { CalendarView } from './components/CalendarView';
import { ClientList } from './components/ClientList';
import { ClientDetail } from './components/ClientDetail';
import { ClientForm } from './components/ClientForm';
import { ConsultationFormNew } from './components/ConsultationFormNew';
import { ConsultationDialog } from './components/ConsultationDialog';
import { ConsultationViewer } from './components/ConsultationViewer';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { SearchResults } from './components/SearchResults';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { API_BASE_URL, fetchWithAuth, getAuthHeadersForUpload } from './utils/api';
import { BrandingSettings } from './components/BrandingSettings';
import { Button } from './components/ui/button';
import { LogOut, Calendar, Users, UserPlus, Plus, Settings } from 'lucide-react';
import { TenantProvider, useTenant } from './context/TenantContext';
import { SuperAdminPanel } from './pages/SuperAdminPanel';

type View =
  | { type: 'calendar' }
  | { type: 'list' }
  | { type: 'search'; query: string }
  | { type: 'detail'; client: Client; expandedConsultationId?: string }
  | { type: 'newClient' }
  | { type: 'editClient'; client: Client }
  | { type: 'newConsultation'; client: Client }
  | { type: 'viewConsultation'; client: Client; consultation: Consultation }
  | { type: 'editConsultation'; client: Client; consultation: Consultation }
  | { type: 'settings' };

type AuthView = 'login' | 'signup' | 'forgotPassword' | 'admin';

function AppContent() {
  const { isLoading: isTenantLoading, error: tenantError } = useTenant();

  if (isTenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">사무소 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 max-w-sm px-4">
          <p className="text-xl font-semibold">{tenantError}</p>
          <p className="text-muted-foreground text-sm">URL을 다시 확인해주세요.</p>
        </div>
      </div>
    );
  }

  return <AppInner />;
}

export default function App() {
  const isAdminPath = window.location.pathname.startsWith('/admin');
  if (isAdminPath) {
    return (
      <>
        <SuperAdminPanel />
        <Toaster />
      </>
    );
  }
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}

function AppInner() {
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>({ type: 'calendar' });

  // Fetch data on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch clients and consultations in parallel
        const [clientsRes, consultationsRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/clients`),
          fetchWithAuth(`${API_BASE_URL}/consultations`),
        ]);

        if (!clientsRes.ok || !consultationsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const clientsData = await clientsRes.json();
        const consultationsData = await consultationsRes.json();

        setClients(clientsData.clients || []);
        setConsultations(consultationsData.consultations || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    // tenantSlug는 유지 — 다음 로그인을 위해
    setIsAuthenticated(false);
    setClients([]);
    setConsultations([]);
    setView({ type: 'list' });
    toast.success('로그아웃되었습니다.');
  };

  // Client operations
  const handleCreateClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      const data = await response.json();
      setClients((prev) => [...prev, data.client]);
      setView({ type: 'detail', client: data.client });
      toast.success('고객이 등록되었습니다.');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('고객 등록에 실패했습니다.');
    }
  };

  const handleUpdateClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (view.type !== 'editClient') return;

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/clients/${view.client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        throw new Error('Failed to update client');
      }

      const data = await response.json();
      setClients((prev) => prev.map((c) => (c.id === data.client.id ? data.client : c)));
      setView({ type: 'detail', client: data.client });
      toast.success('고객 정보가 수정되었습니다.');
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('고객 정보 수정에 실패했습니다.');
    }
  };

  // Consultation operations
  const handleCreateAppointment = async (appointmentData: {
    clientId: string;
    date: string;
    time: string;
    status?: 'scheduled';
    color?: string;
  }) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/clients/${appointmentData.clientId}/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...appointmentData, status: 'scheduled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }

      const data = await response.json();
      setConsultations((prev) => [...prev, data.consultation]);
      toast.success('상담 예약이 완료되었습니다.');
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('상담 예약에 실패했습니다.');
    }
  };

  const handleCreateConsultation = async (consultationData: {
    clientId: string;
    date: string;
    time: string;
    content: string;
    isImportant: boolean;
    color?: string;
    attachments?: Attachment[];
  }) => {
    try {
      // First create the consultation
      const response = await fetchWithAuth(`${API_BASE_URL}/clients/${consultationData.clientId}/consultations`, {
        method: 'POST',
        body: JSON.stringify({
          date: consultationData.date,
          time: consultationData.time,
          content: consultationData.content,
          color: consultationData.color,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create consultation');
      }

      const data = await response.json();
      const consultationId = data.consultation.id;

      // If there are pending attachments, upload them now
      if (consultationData.attachments && consultationData.attachments.length > 0) {
        console.log('[handleCreateConsultation] Processing attachments:', consultationData.attachments);
        
        const uploadedAttachments: Attachment[] = [];
        
        for (const attachment of consultationData.attachments) {
          if (attachment.id.startsWith('pending-')) {
            console.log('[handleCreateConsultation] Uploading pending attachment:', attachment.id);
            
            // Get the file from sessionStorage
            const fileData = sessionStorage.getItem(`pending-file-${attachment.id}`);
            if (fileData) {
              // Convert base64 back to File
              const response = await fetch(fileData);
              const blob = await response.blob();
              const file = new File([blob], attachment.fileName, { type: attachment.fileType });

              // Upload the file
              const formData = new FormData();
              formData.append('file', file);

              const uploadResponse = await fetch(
                `${API_BASE_URL}/clients/${consultationData.clientId}/consultations/${consultationId}/attachments`,
                {
                  method: 'POST',
                  headers: getAuthHeadersForUpload(),
                  body: formData,
                }
              );

              if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                console.log('[handleCreateConsultation] File uploaded successfully:', uploadData.attachment);
                uploadedAttachments.push(uploadData.attachment);
              } else {
                console.error('[handleCreateConsultation] File upload failed:', await uploadResponse.text());
              }

              // Clean up sessionStorage
              sessionStorage.removeItem(`pending-file-${attachment.id}`);
            }
          } else {
            uploadedAttachments.push(attachment);
          }
        }

        console.log('[handleCreateConsultation] All attachments processed. Total:', uploadedAttachments.length);
        console.log('[handleCreateConsultation] Uploaded attachments:', uploadedAttachments);

        // Update consultation with attachments
        const updateResponse = await fetchWithAuth(
          `${API_BASE_URL}/clients/${consultationData.clientId}/consultations/${consultationId}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              ...consultationData,
              attachments: uploadedAttachments,
            }),
          }
        );

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          console.log('[handleCreateConsultation] Consultation updated with attachments:', updateData.consultation);
          setConsultations((prev) => [...prev, updateData.consultation]);
        } else {
          console.error('[handleCreateConsultation] Failed to update consultation:', await updateResponse.text());
          // Fallback: use local data if update fails
          const updatedConsultation = {
            ...data.consultation,
            isImportant: consultationData.isImportant,
            attachments: uploadedAttachments,
          };
          setConsultations((prev) => [...prev, updatedConsultation]);
        }
      } else {
        console.log('[handleCreateConsultation] No attachments to process');
        
        // Just update with isImportant flag
        if (consultationData.isImportant) {
          const importantResponse = await fetchWithAuth(
            `${API_BASE_URL}/clients/${consultationData.clientId}/consultations/${consultationId}/important`,
            {
              method: 'PATCH',
            }
          );

          if (importantResponse.ok) {
            const importantData = await importantResponse.json();
            setConsultations((prev) => [...prev, importantData.consultation]);
          } else {
            // Fallback
            const updatedConsultation = {
              ...data.consultation,
              isImportant: consultationData.isImportant,
            };
            setConsultations((prev) => [...prev, updatedConsultation]);
          }
        } else {
          setConsultations((prev) => [...prev, data.consultation]);
        }
      }

      toast.success('상담 기록이 저장되었습니다.');
    } catch (error) {
      console.error('Error creating consultation:', error);
      toast.error('상담 기록 저장에 실패했습니다.');
    }
  };

  const handleUpdateConsultationInline = async (consultationId: string, consultationData: { 
    clientId: string;
    date: string; 
    time: string;
    content: string;
    isImportant: boolean;
    color?: string;
    attachments?: any[];
  }) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/clients/${consultationData.clientId}/consultations/${consultationId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            date: consultationData.date,
            time: consultationData.time,
            content: consultationData.content,
            isImportant: consultationData.isImportant,
            color: consultationData.color,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update consultation');
      }

      const data = await response.json();
      setConsultations((prev) =>
        prev.map((c) => (c.id === data.consultation.id ? data.consultation : c))
      );
      toast.success('상담 기록이 수정되었습니다.');
    } catch (error) {
      console.error('Error updating consultation:', error);
      toast.error('상담 기록 수정에 실패했습니다.');
    }
  };

  const handleUpdateConsultation = async (consultationId: string, consultationData: {
    clientId: string;
    date: string;
    time: string;
    content: string;
    isImportant: boolean;
    status?: 'scheduled';
    color?: string;
    attachments?: any[];
  }): Promise<boolean> => {
    try {
      console.log('[handleUpdateConsultation] Updating consultation:', consultationId);
      console.log('[handleUpdateConsultation] Attachments:', consultationData.attachments);

      // If there are pending attachments, upload them first
      let finalAttachments = consultationData.attachments || [];

      if (finalAttachments.some(att => att.id.startsWith('pending-'))) {
        console.log('[handleUpdateConsultation] Found pending attachments, uploading...');
        const uploadedAttachments: Attachment[] = [];

        for (const attachment of finalAttachments) {
          if (attachment.id.startsWith('pending-')) {
            console.log('[handleUpdateConsultation] Uploading pending attachment:', attachment.id);
            
            // Get the file from sessionStorage
            const fileData = sessionStorage.getItem(`pending-file-${attachment.id}`);
            if (fileData) {
              // Convert base64 back to File
              const response = await fetch(fileData);
              const blob = await response.blob();
              const file = new File([blob], attachment.fileName, { type: attachment.fileType });

              // Upload the file
              const formData = new FormData();
              formData.append('file', file);

              const uploadResponse = await fetch(
                `${API_BASE_URL}/clients/${consultationData.clientId}/consultations/${consultationId}/attachments`,
                {
                  method: 'POST',
                  headers: getAuthHeadersForUpload(),
                  body: formData,
                }
              );

              if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                console.log('[handleUpdateConsultation] File uploaded successfully:', uploadData.attachment);
                uploadedAttachments.push(uploadData.attachment);
              } else {
                console.error('[handleUpdateConsultation] File upload failed:', await uploadResponse.text());
              }

              // Clean up sessionStorage
              sessionStorage.removeItem(`pending-file-${attachment.id}`);
            }
          } else {
            uploadedAttachments.push(attachment);
          }
        }

        finalAttachments = uploadedAttachments;
        console.log('[handleUpdateConsultation] Final attachments after upload:', finalAttachments);
      }

      const response = await fetchWithAuth(
        `${API_BASE_URL}/clients/${consultationData.clientId}/consultations/${consultationId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            date: consultationData.date,
            time: consultationData.time,
            content: consultationData.content,
            isImportant: consultationData.isImportant,
            status: consultationData.status,
            color: consultationData.color,
            attachments: finalAttachments,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update consultation');
      }

      const data = await response.json();
      console.log('[handleUpdateConsultation] Consultation updated:', data.consultation);

      setConsultations((prev) =>
        prev.map((c) => (c.id === data.consultation.id ? data.consultation : c))
      );
      toast.success('상담 기록이 수정되었습니다.');
      return true;
    } catch (error) {
      console.error('Error updating consultation:', error);
      toast.error('상담 기록 수정에 실패했습니다.');
      return false;
    }
  };

  const handleCancelAppointment = async (consultationId: string) => {
    try {
      const consultation = consultations.find((c) => c.id === consultationId);
      if (!consultation) return;

      const response = await fetchWithAuth(
        `${API_BASE_URL}/clients/${consultation.clientId}/consultations/${consultationId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      setConsultations((prev) => prev.filter((c) => c.id !== consultationId));
      toast.success('예약이 취소되었습니다.');
    } catch (error) {
      console.error('Error canceling appointment:', error);
      toast.error('예약 취소에 실패했습니다.');
    }
  };

  const handleToggleImportant = async (consultationId: string) => {
    if (view.type !== 'detail') return;

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/clients/${view.client.id}/consultations/${consultationId}/important`,
        {
          method: 'PATCH',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle consultation importance');
      }

      const data = await response.json();
      setConsultations((prev) =>
        prev.map((c) => (c.id === data.consultation.id ? data.consultation : c))
      );
      toast.success(data.consultation.isImportant ? '중요 상담으로 표시되었습니다.' : '중요 표시가 해제되었습니다.');
    } catch (error) {
      console.error('Error toggling consultation importance:', error);
      toast.error('중요 표시 변경에 실패했습니다.');
    }
  };

  const handleDeleteConsultation = async (consultationId: string) => {
    if (view.type !== 'detail') return;

    const consultation = consultations.find((c) => c.id === consultationId);
    if (!consultation) return;

    if (!confirm('이 상담 기록을 삭제하시겠습니까?')) return;

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/clients/${view.client.id}/consultations/${consultationId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete consultation');
      }

      setConsultations((prev) => prev.filter((c) => c.id !== consultationId));
      toast.success('상담 기록이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting consultation:', error);
      toast.error('상담 기록 삭제에 실패했습니다.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    if (!confirm(`"${client.name}" 고객을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 상담 기록도 함께 삭제됩니다.`)) return;

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/clients/${clientId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setConsultations((prev) => prev.filter((c) => c.clientId !== clientId));
      toast.success('고객이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('고객 삭제에 실패했습니다.');
    }
  };

  const handleToggleVip = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/clients/${clientId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...client,
            isVip: !client.isVip,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle VIP status');
      }

      const data = await response.json();
      setClients((prev) => prev.map((c) => (c.id === data.client.id ? data.client : c)));
      toast.success(data.client.isVip ? 'VIP 고객으로 설정되었습니다.' : 'VIP 설정이 해제되었습니다.');
    } catch (error) {
      console.error('Error toggling VIP status:', error);
      toast.error('VIP 설정 변경에 실패했습니다.');
    }
  };

  if (!isAuthenticated) {
    if (authView === 'signup') {
      return (
        <>
          <SignUp 
            onBack={() => setAuthView('login')}
            onSignUpSuccess={() => {
              setAuthView('login');
              toast.success('회원가입이 완료되었습니다. 로그인해주세요.');
            }}
          />
          <Toaster />
        </>
      );
    }

    if (authView === 'forgotPassword') {
      return (
        <>
          <ForgotPassword 
            onBack={() => setAuthView('login')}
          />
          <Toaster />
        </>
      );
    }

    if (authView === 'admin') {
      return (
        <>
          <AdminPanel onBack={() => {
            setAuthView('login');
            setIsAdmin(false);
            localStorage.removeItem('isAdmin');
          }} />
          <Toaster />
        </>
      );
    }

    return (
      <>
        <Login 
          onLogin={handleLogin}
          onAdminLogin={() => {
            setIsAdmin(true);
            setAuthView('admin');
          }}
          onSignUpClick={() => setAuthView('signup')}
          onForgotPasswordClick={() => setAuthView('forgotPassword')}
        />
        <Toaster />
      </>
    );
  }

  // Admin panel for logged in admin
  if (isAuthenticated && isAdmin) {
    return (
      <>
        <AdminPanel onBack={() => {
          handleLogout();
          setAuthView('login');
          setIsAdmin(false);
        }} />
        <Toaster />
      </>
    );
  }

  const getClientConsultations = (clientId: string) => {
    return consultations.filter((c) => c.clientId === clientId);
  };

  const renderContent = () => {
    switch (view.type) {
      case 'search':
        return (
          <SearchResults
            searchQuery={view.query}
            clients={clients}
            consultations={consultations}
            onSelectClient={(client) => setView({ type: 'detail', client })}
            onSelectConsultation={(consultation, client) => 
              setView({ type: 'viewConsultation', client, consultation })
            }
            onBack={() => setView({ type: 'calendar' })}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            clients={clients}
            consultations={consultations}
            onSelectClient={(client) => setView({ type: 'detail', client })}
            onCreateAppointment={handleCreateAppointment}
            onCreateConsultation={handleCreateConsultation}
            onUpdateConsultation={handleUpdateConsultation}
            onCancelAppointment={handleCancelAppointment}
            onNewClient={() => setView({ type: 'newClient' })}
          />
        );
      case 'list':
        return (
          <ClientList
            clients={clients}
            consultations={consultations}
            onSelectClient={(client) => setView({ type: 'detail', client })}
            onNewClient={() => setView({ type: 'newClient' })}
            onEditClient={(client) => setView({ type: 'editClient', client })}
            onDeleteClient={handleDeleteClient}
            onToggleVip={handleToggleVip}
            isLoading={isLoading}
          />
        );
      case 'detail':
        return (
          <ClientDetail
            client={view.client}
            consultations={getClientConsultations(view.client.id)}
            clients={clients}
            onBack={() => setView({ type: 'list' })}
            onEdit={() => setView({ type: 'editClient', client: view.client })}
            onNewConsultation={() => setView({ type: 'newConsultation', client: view.client })}
            onEditConsultation={(consultation) =>
              setView({ type: 'editConsultation', client: view.client, consultation })
            }
            onDeleteConsultation={handleDeleteConsultation}
            onSaveConsultation={handleCreateConsultation}
            onCreateAppointment={handleCreateAppointment}
            onUpdateConsultation={handleUpdateConsultationInline}
            onToggleImportant={handleToggleImportant}
            onToggleVip={handleToggleVip}
            initialExpandedConsultationId={view.expandedConsultationId}
          />
        );
      case 'newClient':
        return (
          <ClientForm
            onSave={handleCreateClient}
            onCancel={() => setView({ type: 'list' })}
          />
        );
      case 'editClient':
        return (
          <ClientForm
            client={view.client}
            onSave={handleUpdateClient}
            onCancel={() => setView({ type: 'detail', client: view.client })}
          />
        );
      case 'newConsultation':
        return (
          <ConsultationFormNew
            clientName={view.client.name}
            clientId={view.client.id}
            onSave={(data) => {
              handleCreateConsultation(data);
              setView({ type: 'detail', client: view.client });
            }}
            onCancel={() => setView({ type: 'detail', client: view.client })}
          />
        );
      case 'viewConsultation':
        return (
          <ConsultationFormNew
            clientName={view.client.name}
            clientId={view.client.id}
            consultation={view.consultation}
            consultations={consultations.filter(c => c.clientId === view.client.id)}
            onSave={() => {}} // 읽기 전용이므로 onSave는 빈 함수
            onCancel={() => setView({ type: 'calendar' })}
            readOnly={true}
            onSelectConsultation={(consultation) => 
              setView({ type: 'viewConsultation', client: view.client, consultation })
            }
          />
        );
      case 'editConsultation':
        return (
          <ConsultationFormNew
            clientName={view.client.name}
            clientId={view.client.id}
            consultation={view.consultation}
            onSave={(data) => {
              handleUpdateConsultationInline(view.consultation.id, data);
              setView({ type: 'detail', client: view.client });
            }}
            onCancel={() => setView({ type: 'detail', client: view.client })}
          />
        );
      case 'settings':
        return <BrandingSettings onBack={() => setView({ type: 'calendar' })} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Single Line Apple Style */}
      <header className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-8">
          {/* Left: Navigation Tabs */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setView({ type: 'calendar' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                view.type === 'calendar'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              캘린더
            </button>
            <button
              onClick={() => setView({ type: 'list' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                view.type === 'list' || view.type === 'detail'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              고객 목록
            </button>
            <button
              onClick={() => setView({ type: 'newClient' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                view.type === 'newClient' || view.type === 'editClient'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              신규 고객
            </button>
          </nav>

          {/* Right: Search + Logout */}
          <div className="flex items-center gap-3">
            {/* Compact Search Bar */}
            <div className="w-80">
              <GlobalSearchBar
                clients={clients}
                consultations={consultations}
                onSearch={(query) => setView({ type: 'search', query })}
                onSelectConsultation={(consultation, client) => 
                  setView({ type: 'viewConsultation', client, consultation })
                }
              />
            </div>

            {/* Settings Button */}
            <Button
              variant="ghost"
              onClick={() => setView({ type: 'settings' })}
              className="rounded-lg px-3 h-9 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              <Settings className="size-4 mr-1.5" />
              설정
            </Button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="rounded-lg px-3 h-9 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              <LogOut className="size-4 mr-1.5" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          {view.type !== 'viewConsultation' && renderContent()}
        </div>
      </main>

      {/* Consultation View Dialog */}
      {view.type === 'viewConsultation' && (
        <ConsultationDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setView({ type: 'calendar' });
            }
          }}
          selectedDate={new Date(view.consultation.date)}
          clients={clients}
          consultations={consultations}
          onSave={handleCreateConsultation}
          onUpdate={handleUpdateConsultation}
          onCancelAppointment={handleCancelAppointment}
          prefilledClientId={view.client.id}
          selectedConsultation={view.consultation}
        />
      )}

      <Toaster />
    </div>
  );
}