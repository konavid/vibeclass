import CustomerLayout from '@/components/customer/CustomerLayout'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import EnrollmentList from '@/components/enrollment/EnrollmentList'

async function getMyEnrollments(userId: number) {
  return await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      course: {
        include: { category: true },
      },
      schedule: true,
      payment: true,
    },
  })
}

export default async function MyEnrollmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const enrollments = await getMyEnrollments(parseInt(session.user.id))

  // Serialize dates for client component
  const serializedEnrollments = enrollments.map(e => ({
    id: e.id,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    course: {
      id: e.course.id,
      title: e.course.title,
      price: e.course.price,
      category: { name: e.course.category.name },
    },
    schedule: {
      id: e.schedule.id,
      cohort: e.schedule.cohort,
      startDate: e.schedule.startDate.toISOString(),
      endDate: e.schedule.endDate.toISOString(),
      meetLink: e.schedule.meetLink,
    },
    payment: e.payment ? {
      status: e.payment.status,
      billUrl: e.payment.billUrl,
    } : null,
  }))

  return (
    <CustomerLayout>
      <section className="relative hero-gradient-bg min-h-screen overflow-hidden">
        {/* 배경 글로우 오브 */}
        <div className="hero-glow-orb w-80 h-80 bg-purple-500/20 -top-40 -right-40" />
        <div className="hero-glow-orb w-64 h-64 bg-blue-500/15 bottom-0 -left-32" style={{ animationDelay: '1.5s' }} />

        {/* 별 반짝임 효과 */}
        <div className="hero-star" style={{ top: '10%', left: '5%', animationDelay: '0s' }} />
        <div className="hero-star" style={{ top: '20%', right: '10%', animationDelay: '0.5s' }} />
        <div className="hero-star" style={{ bottom: '30%', left: '8%', animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10">
          {/* 헤더 */}
          <div className="mb-10 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0 }}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight hero-title-glow">
              나의 강의
            </h1>
            <p className="text-gray-400 mt-2 text-lg">수강 중인 강의와 학습 자료를 확인하세요</p>
          </div>

          {/* 수강 목록 */}
          <div className="animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0, animationDelay: '0.2s' }}>
            <EnrollmentList enrollments={serializedEnrollments} />
          </div>
        </div>
      </section>
    </CustomerLayout>
  )
}
