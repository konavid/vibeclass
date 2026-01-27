'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AuthModalContextType {
  isLoginModalOpen: boolean
  callbackUrl: string
  openLoginModal: (callbackUrl?: string) => void
  closeLoginModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState('/')

  const openLoginModal = useCallback((url?: string) => {
    setCallbackUrl(url || window.location.pathname)
    setIsLoginModalOpen(true)
  }, [])

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false)
  }, [])

  return (
    <AuthModalContext.Provider value={{ isLoginModalOpen, callbackUrl, openLoginModal, closeLoginModal }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}
