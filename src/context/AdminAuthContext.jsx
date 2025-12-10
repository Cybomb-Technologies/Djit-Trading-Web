import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
const AdminAuthContext = createContext()

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('adminToken'))

  // Set axios default headers for admin
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Check if admin is logged in
  useEffect(() => {
    const checkAdminAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/api/admin/auth/verify`)
          setAdmin(response.data.admin)
        } catch (error) {
          console.error('Admin auth check failed:', error)
          localStorage.removeItem('adminToken')
          setToken(null)
        }
      }
      setLoading(false)
    }

    checkAdminAuth()
  }, [token])

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/admin/auth/login`, { email, password })
      const { token: newToken, admin: adminData } = response.data
      
      localStorage.setItem('adminToken', newToken)
      setToken(newToken)
      setAdmin(adminData)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Admin login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setToken(null)
    setAdmin(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    admin,
    login,
    logout,
    loading,
    isAuthenticated: !!admin
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}