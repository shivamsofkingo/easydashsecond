import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:8000/api/admin';

const kycService = {
  getKycByStatus: async (status = 'PENDING') => {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/kyc?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching KYC requests for status ${status}:`, error);
      throw error;
    }
  },

  getKycById: async (id) => {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/kyc/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching KYC by ID:', error);
      throw error;
    }
  },

  approveKyc: async (id) => {
    try {
      const token = authService.getToken();
      const response = await axios.put(`${API_URL}/kyc/${id}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error approving KYC:', error);
      throw error;
    }
  },

  rejectKyc: async (id) => {
    try {
      const token = authService.getToken();
      const response = await axios.put(`${API_URL}/kyc/${id}/reject`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      throw error;
    }
  }
};

export default kycService;
