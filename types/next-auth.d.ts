import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: string
    profileCompleted?: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      profileCompleted?: boolean
      image?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    profileCompleted?: boolean
  }
}
