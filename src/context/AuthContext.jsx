import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`)
          setUser(response.data.user)
        } catch (error) {
          console.error('Auth check failed:', error)
          // Clear invalid token
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
          delete axios.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [token])

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password })
      const { token: newToken, user: userData } = response.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  // Google login with authorization code
  const loginWithGoogle = async (code) => {
    try {
      console.log('Sending Google authorization code to backend...');
      
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: code,
          redirect_uri: "postmessage",
        }),
      });

      console.log('Backend response status:', response.status);

      const data = await response.json();
      console.log('Backend response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        // User exists - login successful
        const { token: newToken, user: userData } = data;
        
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        
        return { 
          success: true,
          message: 'Login successful' 
        };
      } else if (data.needsRegistration) {
        // New user - needs registration
        console.log('New Google user, needs registration:', data.googleUser);
        return {
          success: false,
          needsRegistration: true,
          googleUser: data.googleUser,
          message: data.message
        };
      } else {
        // Other error
        return {
          success: false,
          message: data.message || 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { 
        success: false, 
        message: error.message || 'Google authentication failed'
      };
    }
  }

  // Register function with googleId support
  const register = async (username, email, password, googleId = null) => {
    try {
      const payload = {
        username, 
        email, 
        ...(password && { password }) // Only include password if it exists
      };
      
      // Add googleId if provided
      if (googleId) {
        payload.googleId = googleId;
      }

      console.log('Sending registration payload:', { ...payload, password: password ? '***' : 'NO_PASSWORD' });

      const response = await axios.post(`${API_URL}/api/auth/register`, payload);
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return { 
        success: false, 
        message: error.response?.data?.message || 
                 error.response?.data?.error || 
                 'Registration failed' 
      };
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const updateUserProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API_URL}/api/users/profile`, profileData)
      setUser(prev => ({ ...prev, ...response.data.user }))
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      }
    }
  }

  const refreshUserData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`)
      setUser(response.data.user)
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    updateUserProfile,
    refreshUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}