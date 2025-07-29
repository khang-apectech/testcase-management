"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/db"

interface AuthContextType {
  user: User | null
  loading: boolean
  selectedProject: { id: string; name: string } | null
  setSelectedProject: (project: { id: string; name: string } | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null)
  
  // Custom setter for selectedProject that also updates localStorage
  const updateSelectedProject = (project: { id: string; name: string } | null) => {
    if (project) {
      // Update localStorage
      localStorage.setItem("selectedProjectId", project.id)
      localStorage.setItem("selectedProjectName", project.name)
      
      // Update state
      setSelectedProject(project)
      
      // Trigger storage event for other components
      window.dispatchEvent(new Event('storage'))
    } else {
      // Clear project
      localStorage.removeItem("selectedProjectId")
      localStorage.removeItem("selectedProjectName")
      setSelectedProject(null)
      
      // Trigger storage event for other components
      window.dispatchEvent(new Event('storage'))
    }
  }
  
  // Initialize selected project from localStorage and listen for changes
  useEffect(() => {
    const loadProjectFromStorage = () => {
      const storedProjectId = localStorage.getItem("selectedProjectId")
      const storedProjectName = localStorage.getItem("selectedProjectName")
      
      if (storedProjectId && storedProjectName) {
        setSelectedProject({
          id: storedProjectId,
          name: storedProjectName
        })
      }
    }
    
    // Load initially
    loadProjectFromStorage()
    
    // Listen for changes (when project is selected from dialog)
    window.addEventListener('storage', loadProjectFromStorage)
    
    return () => {
      window.removeEventListener('storage', loadProjectFromStorage)
    }
  }, [])

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token")
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      "Authorization": token ? `Bearer ${token}` : ""
    }
    return fetch(url, { ...options, headers })
  }

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setUser(null)
        setLoading(false)  // Fix: Set loading false khi không có token
        return
      }

      const response = await fetchWithAuth("/api/auth/me")

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        localStorage.removeItem("token")
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("token")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!response.ok) {
        let errorMessage = "Đăng nhập thất bại"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.success && data.token && data.user) {
        localStorage.setItem("token", data.token)
        // Also set cookie for server-side access
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
        setUser(data.user)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetchWithAuth("/api/auth/logout", { method: "POST" })
      localStorage.removeItem("token")
      localStorage.removeItem("selectedProjectId")
      localStorage.removeItem("selectedProjectName")
      // Clear cookie
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      setUser(null)
      setSelectedProject(null)
    } catch (error) {
      console.error("Logout error:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("selectedProjectId")
      localStorage.removeItem("selectedProjectName")
      // Clear cookie
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      setUser(null)
      setSelectedProject(null)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        selectedProject,
        setSelectedProject: updateSelectedProject, // Use the custom setter
        login, 
        logout, 
        checkAuth,
        fetchWithAuth 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
