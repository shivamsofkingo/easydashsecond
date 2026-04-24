import axios from 'axios';

const API_URL = 'http://localhost:8000/api/admin';

const authService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/loginWithEmail`, {
        email,
        password,
      }, {
        headers: {
          'devicetype': 'WEB',
          'deviceid': 'admin-panel'
        }
      });
      
      if (response.data.status === 1) {
        const { token, user } = response.data.payload;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(user));
        return { success: true, user };
      }
      
      return { success: false, msg: response.data.msg };
    } catch (error) {
      return { 
        success: false, 
        msg: error.response?.data?.msg || 'Something went wrong. Please try again.' 
      };
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('adminToken');
  },

  getToken: () => {
    return localStorage.getItem('adminToken');
  },

  getUser: () => {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
  }
};

export default authService;
