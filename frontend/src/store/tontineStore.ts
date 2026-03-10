import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
};

export interface Tontine {
  id: string;
  name: string;
  contribution_amount: number;
  frequency: 'weekly' | 'monthly';
  max_members: number;
  current_members: number;
  start_date: string;
  description?: string;
  status: 'draft' | 'active' | 'completed';
  creator_id: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  tontine_id: string;
  tontine_name: string;
  inviter_id: string;
  inviter_name: string;
  invited_email: string;
  invited_user_id?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  responded_at?: string;
}

export interface Member {
  id: string;
  tontine_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  joined_at: string;
  beneficiary_order?: number;
}

export interface Cycle {
  id: string;
  tontine_id: string;
  cycle_number: number;
  beneficiary_id: string;
  beneficiary_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_completed: boolean;
}

export interface Contribution {
  id: string;
  tontine_id: string;
  cycle_id: string;
  member_id: string;
  member_name: string;
  status: 'not_announced' | 'announced' | 'confirmed' | 'contested';
  declared_at?: string;
  confirmed_at?: string;
  contested_at?: string;
  contest_reason?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  tontine_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Dashboard {
  active_tontines_count: number;
  pending_invitations_count: number;
  next_beneficiary: { tontine_name: string; cycle_number: number } | null;
  pending_confirmations_count: number;
  recent_tontines: Tontine[];
}

interface TontineState {
  tontines: Tontine[];
  currentTontine: Tontine | null;
  invitations: Invitation[];
  members: Member[];
  cycles: Cycle[];
  contributions: Contribution[];
  notifications: Notification[];
  dashboard: Dashboard | null;
  unreadCount: number;
  isLoading: boolean;

  fetchDashboard: () => Promise<void>;
  fetchTontines: () => Promise<void>;
  fetchTontine: (id: string) => Promise<void>;
  createTontine: (data: any) => Promise<void>;
  updateTontine: (id: string, data: any) => Promise<void>;
  deleteTontine: (id: string) => Promise<void>;
  startTontine: (id: string) => Promise<void>;
  
  fetchInvitations: () => Promise<void>;
  sendInvitation: (tontineId: string, email: string) => Promise<void>;
  acceptInvitation: (id: string) => Promise<void>;
  rejectInvitation: (id: string) => Promise<void>;
  
  fetchMembers: (tontineId: string) => Promise<void>;
  setBeneficiaryOrder: (tontineId: string, memberIds: string[]) => Promise<void>;
  randomizeBeneficiaryOrder: (tontineId: string) => Promise<void>;
  
  fetchCycles: (tontineId: string) => Promise<void>;
  fetchCurrentCycle: (tontineId: string) => Promise<{ cycle: Cycle; contributions: Contribution[] } | null>;
  
  declarePayment: (cycleId: string) => Promise<void>;
  confirmPayment: (declarationId: string) => Promise<void>;
  contestPayment: (declarationId: string, reason: string) => Promise<void>;
  fetchContributions: (tontineId: string) => Promise<void>;
  
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  fetchHistory: (tontineId: string) => Promise<any[]>;
}

export const useTontineStore = create<TontineState>((set, get) => ({
  tontines: [],
  currentTontine: null,
  invitations: [],
  members: [],
  cycles: [],
  contributions: [],
  notifications: [],
  dashboard: null,
  unreadCount: 0,
  isLoading: false,

  fetchDashboard: async () => {
    try {
      set({ isLoading: true });
      const response = await axios.get(`${API_URL}/api/dashboard`, {
        headers: getAuthHeader(),
      });
      set({ dashboard: response.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      set({ isLoading: false });
    }
  },

  fetchTontines: async () => {
    try {
      set({ isLoading: true });
      const response = await axios.get(`${API_URL}/api/tontines`, {
        headers: getAuthHeader(),
      });
      set({ tontines: response.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching tontines:', error);
      set({ isLoading: false });
    }
  },

  fetchTontine: async (id: string) => {
    try {
      set({ isLoading: true });
      const response = await axios.get(`${API_URL}/api/tontines/${id}`, {
        headers: getAuthHeader(),
      });
      set({ currentTontine: response.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching tontine:', error);
      set({ isLoading: false });
    }
  },

  createTontine: async (data: any) => {
    try {
      const response = await axios.post(`${API_URL}/api/tontines`, data, {
        headers: getAuthHeader(),
      });
      const newTontine = response.data;
      set((state) => ({ tontines: [...state.tontines, newTontine] }));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de création');
    }
  },

  updateTontine: async (id: string, data: any) => {
    try {
      const response = await axios.put(`${API_URL}/api/tontines/${id}`, data, {
        headers: getAuthHeader(),
      });
      set((state) => ({
        tontines: state.tontines.map((t) => (t.id === id ? response.data : t)),
        currentTontine: state.currentTontine?.id === id ? response.data : state.currentTontine,
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de mise à jour');
    }
  },

  deleteTontine: async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/tontines/${id}`, {
        headers: getAuthHeader(),
      });
      set((state) => ({
        tontines: state.tontines.filter((t) => t.id !== id),
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de suppression');
    }
  },

  startTontine: async (id: string) => {
    try {
      await axios.post(`${API_URL}/api/tontines/${id}/start`, {}, {
        headers: getAuthHeader(),
      });
      await get().fetchTontine(id);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de démarrage');
    }
  },

  fetchInvitations: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/invitations/received`, {
        headers: getAuthHeader(),
      });
      set({ invitations: response.data });
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  },

  sendInvitation: async (tontineId: string, email: string) => {
    try {
      await axios.post(`${API_URL}/api/invitations`, {
        tontine_id: tontineId,
        invited_email: email,
      }, {
        headers: getAuthHeader(),
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Erreur d'envoi d'invitation");
    }
  },

  acceptInvitation: async (id: string) => {
    try {
      await axios.post(`${API_URL}/api/invitations/${id}/accept`, {}, {
        headers: getAuthHeader(),
      });
      set((state) => ({
        invitations: state.invitations.map((inv) =>
          inv.id === id ? { ...inv, status: 'accepted' as const } : inv
        ),
      }));
      await get().fetchTontines();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Erreur d'acceptation");
    }
  },

  rejectInvitation: async (id: string) => {
    try {
      await axios.post(`${API_URL}/api/invitations/${id}/reject`, {}, {
        headers: getAuthHeader(),
      });
      set((state) => ({
        invitations: state.invitations.map((inv) =>
          inv.id === id ? { ...inv, status: 'rejected' as const } : inv
        ),
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de refus');
    }
  },

  fetchMembers: async (tontineId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/tontines/${tontineId}/members`, {
        headers: getAuthHeader(),
      });
      set({ members: response.data });
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  },

  setBeneficiaryOrder: async (tontineId: string, memberIds: string[]) => {
    try {
      await axios.put(`${API_URL}/api/tontines/${tontineId}/beneficiary-order`, {
        member_ids: memberIds,
      }, {
        headers: getAuthHeader(),
      });
      await get().fetchMembers(tontineId);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Erreur de mise à jour de l'ordre");
    }
  },

  randomizeBeneficiaryOrder: async (tontineId: string) => {
    try {
      await axios.post(`${API_URL}/api/tontines/${tontineId}/randomize-order`, {}, {
        headers: getAuthHeader(),
      });
      await get().fetchMembers(tontineId);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de tirage aléatoire');
    }
  },

  fetchCycles: async (tontineId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/tontines/${tontineId}/cycles`, {
        headers: getAuthHeader(),
      });
      set({ cycles: response.data });
    } catch (error) {
      console.error('Error fetching cycles:', error);
    }
  },

  fetchCurrentCycle: async (tontineId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/tontines/${tontineId}/current-cycle`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching current cycle:', error);
      return null;
    }
  },

  declarePayment: async (cycleId: string) => {
    try {
      await axios.post(`${API_URL}/api/contributions/declare`, {
        cycle_id: cycleId,
      }, {
        headers: getAuthHeader(),
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de déclaration');
    }
  },

  confirmPayment: async (declarationId: string) => {
    try {
      await axios.post(`${API_URL}/api/contributions/confirm`, {
        declaration_id: declarationId,
      }, {
        headers: getAuthHeader(),
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de confirmation');
    }
  },

  contestPayment: async (declarationId: string, reason: string) => {
    try {
      await axios.post(`${API_URL}/api/contributions/contest`, {
        declaration_id: declarationId,
        reason,
      }, {
        headers: getAuthHeader(),
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de contestation');
    }
  },

  fetchContributions: async (tontineId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/tontines/${tontineId}/contributions`, {
        headers: getAuthHeader(),
      });
      set({ contributions: response.data });
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: getAuthHeader(),
      });
      set({ notifications: response.data });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/unread-count`, {
        headers: getAuthHeader(),
      });
      set({ unreadCount: response.data.count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await axios.post(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: getAuthHeader(),
      });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await axios.post(`${API_URL}/api/notifications/read-all`, {}, {
        headers: getAuthHeader(),
      });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  fetchHistory: async (tontineId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/tontines/${tontineId}/history`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  },
}));
