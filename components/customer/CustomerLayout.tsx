'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import ReviewReminderModal from './ReviewReminderModal'

interface Props {
  children: ReactNode
}

export default function CustomerLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <ReviewReminderModal />
    </div>
  )
}
