import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import KakaoProvider from 'next-auth/providers/kakao'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { generateTempEmail } from './config'

// 쿠키 도메인 설정 (환경변수 또는 undefined)
const cookieDomain = process.env.COOKIE_DOMAIN || undefined

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // 타입 불일치 문제로 제거
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'profile_nickname profile_image',
        },
      },
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        // 사용자 찾기
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }

        // 관리자만 로그인 허용 (선택사항)
        // if (user.role !== 'admin') {
        //   throw new Error('관리자만 로그인할 수 있습니다.')
        // }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          profileCompleted: user.profileCompleted,
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? cookieDomain : undefined,
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? cookieDomain : undefined,
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.pkce.code_verifier`
        : `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? cookieDomain : undefined,
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.state`
        : `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? cookieDomain : undefined,
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials 로그인은 이미 처리됨
      if (account?.provider === 'credentials') {
        return true
      }

      // Kakao OAuth 로그인 처리
      if (account?.provider === 'kakao') {
        try {
          // 카카오 프로필에서 정보 추출
          const kakaoId = account.providerAccountId
          const userEmail = user.email || generateTempEmail('kakao', kakaoId)
          const userName = user.name || (profile as any)?.kakao_account?.profile?.nickname || ''
          const userImage = user.image || (profile as any)?.kakao_account?.profile?.profile_image_url || null

          let dbUser = await prisma.user.findUnique({
            where: { email: userEmail }
          })

          if (!dbUser) {
            // 첫 번째 가입자인지 확인 (첫 가입자는 관리자로 설정)
            const userCount = await prisma.user.count()
            const isFirstUser = userCount === 0

            // 새 사용자 생성 - 프로필 미완성 상태로
            dbUser = await prisma.user.create({
              data: {
                email: userEmail,
                name: userName,
                nickname: userName, // 카카오 닉네임을 기본 닉네임으로
                image: userImage,
                role: isFirstUser ? 'admin' : 'customer', // 첫 가입자는 관리자
                profileCompleted: false, // 프로필 완성 필요
              }
            })

            if (isFirstUser) {
              console.log(`🎉 첫 번째 사용자 ${userEmail}이(가) 관리자로 등록되었습니다.`)
            }
          } else {
            // 기존 사용자 - 이미지와 이름 업데이트 (변경되었을 경우)
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                image: userImage,
                name: userName || dbUser.name,
              }
            })
          }

          // Account 정보 저장 (이미 있으면 업데이트)
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              }
            }
          })

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | null,
              }
            })
          }

          return true
        } catch (error) {
          console.error('Kakao OAuth signIn error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, trigger, account }) {
      // Credentials 로그인
      if (user && account?.provider === 'credentials') {
        token.role = user.role
        token.id = user.id
        token.profileCompleted = user.profileCompleted
        return token
      }

      // Kakao OAuth 로그인
      if (user && account?.provider === 'kakao') {
        const kakaoId = account.providerAccountId
        const userEmail = user.email || generateTempEmail('kakao', kakaoId)

        const dbUser = await prisma.user.findUnique({
          where: { email: userEmail }
        })
        if (dbUser) {
          token.role = dbUser.role
          token.id = dbUser.id.toString()
          token.profileCompleted = dbUser.profileCompleted
          token.name = dbUser.name
          token.email = dbUser.email
        }
        return token
      }

      // 세션 업데이트 시 (프로필 완성 후)
      if (trigger === 'update') {
        const updatedUser = await prisma.user.findUnique({
          where: { id: parseInt(token.id as string) },
        })
        if (updatedUser) {
          token.profileCompleted = updatedUser.profileCompleted
          token.role = updatedUser.role
        }
      }

      // 매 요청마다 최신 profileCompleted 상태 확인 (middleware에서 사용)
      if (token.id && !trigger) {
        const currentUser = await prisma.user.findUnique({
          where: { id: parseInt(token.id as string) },
          select: { profileCompleted: true, role: true }
        })
        if (currentUser) {
          token.profileCompleted = currentUser.profileCompleted
          token.role = currentUser.role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.profileCompleted = token.profileCompleted as boolean
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
