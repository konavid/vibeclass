'use client'

import { ReactNode } from 'react'
import SessionProvider from '@/components/SessionProvider'
import { AuthModalProvider } from '@/contexts/AuthModalContext'
import LoginModal from '@/components/auth/LoginModal'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthModalProvider>
        {children}
        <LoginModal />
      </AuthModalProvider>
    </SessionProvider>
  )
}
