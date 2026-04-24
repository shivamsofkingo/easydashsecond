import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:8000/api/admin';

const getHeaders = () => ({
  'devicetype': 'WEB',
  'deviceid': 'admin-panel',
  'Authorization': `Bearer ${authService.getToken()}`
});

const adminService = {
  // Accommodation Endpoints
  getAccommodationCount: async () => {
    try {
      const response = await axios.get(`${API_URL}/getTotalAccommodationCount`, {
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload.totalAccommodation : 0;
    } catch (error) {
      console.error('Error fetching accommodation count:', error);
      return 0;
    }
  },

  getMarketplaceCount: async () => {
    try {
      const response = await axios.get(`${API_URL}/getTotalMarketplaceCount`, {
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload.totalMarketplace : 0;
    } catch (error) {
      console.error('Error fetching marketplace count:', error);
      return 0;
    }
  },

  getEventCount: async () => {
    try {
      const response = await axios.get(`${API_URL}/getTotalEventCount`, {
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload.totalEvents : 0;
    } catch (error) {
      console.error('Error fetching event count:', error);
      return 0;
    }
  },

  getGiveawaysCount: async () => {
    try {
      const response = await axios.get(`${API_URL}/getTotalGiveawaysCount`, {
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload.totalGiveaways : 0;
    } catch (error) {
      console.error('Error fetching giveaways count:', error);
      return 0;
    }
  },

  getAccommodations: async (page = 1, limit = 10, region = '') => {
    try {
      const response = await axios.get(`${API_URL}/getAllAccommodations`, {
        params: { pages: page, limit, ...(region && { region }) },
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload : { accommodations: [], meta: {} };
    } catch (error) {
      console.error('Error fetching accommodations:', error);
      return { accommodations: [], meta: {} };
    }
  },

  getAccommodationRegions: async () => {
    try {
      const response = await axios.get(`${API_URL}/getAccommodationRegions`, {
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload.regions : [];
    } catch (error) {
      console.error('Error fetching accommodation regions:', error);
      return [];
    }
  },

  deleteAccommodation: async (adsId) => {
    try {
      const response = await axios.post(`${API_URL}/deleteAccommodationPost`, null, {
        params: { adsId },
        headers: getHeaders()
      });
      return response.data.status === 1;
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      return false;
    }
  },

  searchAccommodations: async (keyword, page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/getSearchAds`, {
        params: { adsType: 'Accommodation', keyword, page },
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload : { results: [], meta: {} };
    } catch (error) {
      console.error('Error searching accommodations:', error);
      return { results: [], meta: {} };
    }
  },

  // Event Endpoints
  getEventDashboardStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/getEventDashboardStats`, {
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload : null;
    } catch (error) {
      console.error('Error fetching event dashboard stats:', error);
      return null;
    }
  },

  getEvents: async (page = 1, type = 'all') => {
    try {
      const response = await axios.get(`${API_URL}/getAllEvents`, {
        params: { pages: page, type },
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload : { events: [], meta: {} };
    } catch (error) {
      console.error('Error fetching events:', error);
      return { events: [], meta: {} };
    }
  },

  // Subscription Plans
  getAllPlans: async () => {
    try {
      const response = await axios.get(`${API_URL}/getAllPlans`, {
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload.plans : [];
    } catch (error) {
      console.error('Error fetching all plans:', error);
      return [];
    }
  },

  updatePlan: async (id, price) => {
    try {
      const response = await axios.patch(`${API_URL}/updatePlan/${id}`, { price }, {
        headers: getHeaders()
      });
      return response.data.status === 1;
    } catch (error) {
      console.error('Error updating plan:', error);
      return false;
    }
  },

  // Boost Plans
  getBoostPlans: async () => {
    try {
      const response = await axios.get(`${API_URL}/getBoostPlans`, {
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload.plans : [];
    } catch (error) {
      console.error('Error fetching boost plans:', error);
      return [];
    }
  },

  updateBoostPlan: async (id, price) => {
    try {
      const response = await axios.patch(`${API_URL}/updateBoostPlan/${id}`, { price }, {
        headers: getHeaders()
      });
      return response.data.status === 1;
    } catch (error) {
      console.error('Error updating boost plan:', error);
      return false;
    }
  },

  initializeBoostPlans: async () => {
    try {
      const response = await axios.post(`${API_URL}/initializeBoostPlans`, null, {
        headers: getHeaders()
      });
      return response.data.status === 1;
    } catch (error) {
      console.error('Error initializing boost plans:', error);
      return false;
    }
  },

  // Accommodation Plans
  getAccomodationPlans: async () => {
    try {
      const response = await axios.get(`${API_URL}/getAccomodationPlans`, {
        headers: getHeaders()
      });
      return response.data.status === 1 ? response.data.payload.plans : [];
    } catch (error) {
      console.error('Error fetching accommodation plans:', error);
      return [];
    }
  },

  updateAccomodationPlan: async (id, price) => {
    try {
      const response = await axios.patch(`${API_URL}/updateAccomodationPlan/${id}`, { price }, {
        headers: getHeaders()
      });
      return response.data.status === 1;
    } catch (error) {
      console.error('Error updating accommodation plan:', error);
      return false;
    }
  },

  initializeAccomodationPlans: async () => {
    try {
      const response = await axios.post(`${API_URL}/initializeAccomodationPlans`, null, {
        headers: getHeaders()
      });
      return response.data.status === 1;
    } catch (error) {
      console.error('Error initializing accommodation plans:', error);
      return false;
    }
  }
};

export default adminService;
