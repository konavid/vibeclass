-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "nickname" TEXT,
    "privacyAgreed" BOOLEAN NOT NULL DEFAULT false,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "termsAgreed" BOOLEAN NOT NULL DEFAULT false,
    "deactivatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "bio" TEXT,
    "expertise" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "consultingPrice" INTEGER NOT NULL DEFAULT 0,
    "consultingEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "curriculum" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "categoryId" INTEGER NOT NULL,
    "instructorId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "level" TEXT NOT NULL DEFAULT 'basic',
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" INTEGER,
    "instructions" TEXT,
    "approvalNote" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'approved',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "courseType" TEXT NOT NULL DEFAULT 'online',
    "location" TEXT,
    "locationAddress" TEXT,
    "locationMapUrl" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "locationNote" TEXT,
    "youtubeUrls" JSONB,
    "descriptionImages" JSONB,
    "curriculumImages" JSONB,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_prerequisites" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "prerequisiteId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_schedules" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cohort" INTEGER NOT NULL DEFAULT 1,
    "meetId" TEXT,
    "meetLink" TEXT,
    "kakaoTalkLink" TEXT,

    CONSTRAINT "course_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_sessions" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionNumber" INTEGER NOT NULL,
    "meetId" TEXT,
    "meetLink" TEXT,

    CONSTRAINT "course_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "paymentId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'kakao',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payssamBillId" TEXT,
    "payssamTxId" TEXT,
    "billUrl" TEXT,
    "cashReceiptIssued" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apprCardType" TEXT,
    "apprDt" TIMESTAMP(3),
    "apprIssuer" TEXT,
    "apprIssuerNum" TEXT,
    "apprNum" TEXT,
    "apprOriginNum" TEXT,
    "apprPayType" TEXT,
    "apprPrice" TEXT,
    "apprResCd" TEXT,
    "apprState" TEXT,
    "billId" TEXT,
    "daysAdded" INTEGER,
    "description" TEXT,
    "failMessage" TEXT,
    "kakaoPhone" TEXT,
    "months" INTEGER,
    "newEndDate" TIMESTAMP(3),
    "previousEndDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerMemo" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_callback_logs" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER,
    "apikey" TEXT,
    "billId" TEXT,
    "apprState" TEXT,
    "apprPayType" TEXT,
    "apprCardType" TEXT,
    "apprDt" TIMESTAMP(3),
    "apprOriginDt" TIMESTAMP(3),
    "apprPrice" TEXT,
    "apprIssuer" TEXT,
    "apprIssueCd" TEXT,
    "apprIssuerNum" TEXT,
    "apprAcquirerCd" TEXT,
    "apprAcquirerNm" TEXT,
    "apprNum" TEXT,
    "apprOriginNum" TEXT,
    "apprResCd" TEXT,
    "apprMonthly" TEXT,
    "message" TEXT,
    "rawData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_callback_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "messages" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "cohort" INTEGER,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_consultations" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "respondedAt" TIMESTAMP(3),
    "title" TEXT,
    "hiddenReason" TEXT,
    "hiddenAt" TIMESTAMP(3),

    CONSTRAINT "instructor_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "categoryId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "tags" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "sentBy" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" SERIAL NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientPhone" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "sentBy" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_notification_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "referenceType" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "smsSuccess" BOOLEAN NOT NULL DEFAULT false,
    "kakaoSuccess" BOOLEAN NOT NULL DEFAULT false,
    "smsMessage" TEXT NOT NULL,
    "kakaoMessage" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_posts" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isNotice" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohort_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_comments" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohort_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_materials" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileUrl" TEXT,

    CONSTRAINT "cohort_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_videos" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "driveUrl" TEXT NOT NULL,
    "embedUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohort_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_slides" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slideUrl" TEXT NOT NULL,
    "embedUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohort_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_qnas" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredBy" INTEGER,
    "answeredAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohort_qnas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_applications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "privacyAgreed" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "revenue" TEXT,
    "bio" TEXT NOT NULL,
    "photoUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "kakaoUrl" TEXT,
    "preferredContactTime" TEXT,
    "reviewedBy" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "adminNote" TEXT,
    "docName" TEXT,
    "docAddress" TEXT,
    "docPhone" TEXT,
    "docBankName" TEXT,
    "docBankAccount" TEXT,
    "docBankHolder" TEXT,
    "docBankCopyUrl" TEXT,
    "docIdCopyUrl" TEXT,
    "docYoutubeEmail" TEXT,
    "docAdditionalInfo" TEXT,
    "docAdditionalFiles" TEXT,
    "documentsSubmittedAt" TIMESTAMP(3),
    "contractSignedAt" TIMESTAMP(3),
    "contractFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contractPeriodMonths" INTEGER DEFAULT 12,
    "contractType" TEXT DEFAULT 'independent',
    "signatureImage" TEXT,
    "contractContent" TEXT,

    CONSTRAINT "instructor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "videoUrl" TEXT NOT NULL,
    "embedUrl" TEXT,
    "duration" INTEGER,
    "price" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER,
    "instructorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_purchases" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "paymentId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_products" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'ebook',
    "thumbnailUrl" TEXT,
    "fileUrl" TEXT,
    "externalUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "price" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER,
    "instructorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_product_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ebook',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_product_purchases" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "paymentId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_product_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_tasks" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "solution" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_task_progress" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "helpRequested" BOOLEAN NOT NULL DEFAULT false,
    "helpMessage" TEXT,
    "helpRequestedAt" TIMESTAMP(3),
    "helpResponse" TEXT,
    "helpRespondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_task_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exec_diaries" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "todayGoal" TEXT,
    "todayWork" TEXT,
    "todayLearn" TEXT,
    "tomorrow" TEXT,
    "feeling" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exec_diaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_email_key" ON "instructors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_userId_key" ON "instructors"("userId");

-- CreateIndex
CREATE INDEX "courses_categoryId_idx" ON "courses"("categoryId");

-- CreateIndex
CREATE INDEX "courses_instructorId_idx" ON "courses"("instructorId");

-- CreateIndex
CREATE INDEX "courses_parentId_idx" ON "courses"("parentId");

-- CreateIndex
CREATE INDEX "course_prerequisites_courseId_idx" ON "course_prerequisites"("courseId");

-- CreateIndex
CREATE INDEX "course_prerequisites_prerequisiteId_idx" ON "course_prerequisites"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "course_prerequisites_courseId_prerequisiteId_key" ON "course_prerequisites"("courseId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "course_schedules_courseId_idx" ON "course_schedules"("courseId");

-- CreateIndex
CREATE INDEX "course_sessions_scheduleId_idx" ON "course_sessions"("scheduleId");

-- CreateIndex
CREATE INDEX "enrollments_userId_idx" ON "enrollments"("userId");

-- CreateIndex
CREATE INDEX "enrollments_courseId_idx" ON "enrollments"("courseId");

-- CreateIndex
CREATE INDEX "enrollments_scheduleId_idx" ON "enrollments"("scheduleId");

-- CreateIndex
CREATE INDEX "enrollments_paymentId_idx" ON "enrollments"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payssamBillId_key" ON "payments"("payssamBillId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payssamTxId_key" ON "payments"("payssamTxId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_billId_key" ON "payments"("billId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_billId_idx" ON "payments"("billId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payment_callback_logs_billId_idx" ON "payment_callback_logs"("billId");

-- CreateIndex
CREATE INDEX "payment_callback_logs_paymentId_idx" ON "payment_callback_logs"("paymentId");

-- CreateIndex
CREATE INDEX "consultations_userId_idx" ON "consultations"("userId");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE INDEX "reviews_courseId_idx" ON "reviews"("courseId");

-- CreateIndex
CREATE INDEX "instructor_consultations_userId_idx" ON "instructor_consultations"("userId");

-- CreateIndex
CREATE INDEX "instructor_consultations_instructorId_idx" ON "instructor_consultations"("instructorId");

-- CreateIndex
CREATE INDEX "instructor_consultations_courseId_idx" ON "instructor_consultations"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_categoryId_idx" ON "blog_posts"("categoryId");

-- CreateIndex
CREATE INDEX "blog_posts_authorId_idx" ON "blog_posts"("authorId");

-- CreateIndex
CREATE INDEX "blog_posts_published_idx" ON "blog_posts"("published");

-- CreateIndex
CREATE INDEX "email_logs_sentBy_idx" ON "email_logs"("sentBy");

-- CreateIndex
CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- CreateIndex
CREATE INDEX "sms_logs_sentBy_idx" ON "sms_logs"("sentBy");

-- CreateIndex
CREATE INDEX "sms_logs_sentAt_idx" ON "sms_logs"("sentAt");

-- CreateIndex
CREATE INDEX "sms_notification_logs_sessionId_idx" ON "sms_notification_logs"("sessionId");

-- CreateIndex
CREATE INDEX "sms_notification_logs_sentAt_idx" ON "sms_notification_logs"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "sms_notification_logs_userId_sessionId_type_key" ON "sms_notification_logs"("userId", "sessionId", "type");

-- CreateIndex
CREATE INDEX "notification_logs_userId_idx" ON "notification_logs"("userId");

-- CreateIndex
CREATE INDEX "notification_logs_type_idx" ON "notification_logs"("type");

-- CreateIndex
CREATE INDEX "notification_logs_referenceId_referenceType_idx" ON "notification_logs"("referenceId", "referenceType");

-- CreateIndex
CREATE INDEX "notification_logs_sentAt_idx" ON "notification_logs"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "cohort_posts_scheduleId_idx" ON "cohort_posts"("scheduleId");

-- CreateIndex
CREATE INDEX "cohort_posts_userId_idx" ON "cohort_posts"("userId");

-- CreateIndex
CREATE INDEX "cohort_posts_createdAt_idx" ON "cohort_posts"("createdAt");

-- CreateIndex
CREATE INDEX "cohort_comments_postId_idx" ON "cohort_comments"("postId");

-- CreateIndex
CREATE INDEX "cohort_comments_scheduleId_idx" ON "cohort_comments"("scheduleId");

-- CreateIndex
CREATE INDEX "cohort_comments_userId_idx" ON "cohort_comments"("userId");

-- CreateIndex
CREATE INDEX "cohort_comments_parentId_idx" ON "cohort_comments"("parentId");

-- CreateIndex
CREATE INDEX "cohort_materials_scheduleId_idx" ON "cohort_materials"("scheduleId");

-- CreateIndex
CREATE INDEX "cohort_materials_order_idx" ON "cohort_materials"("order");

-- CreateIndex
CREATE INDEX "cohort_videos_scheduleId_idx" ON "cohort_videos"("scheduleId");

-- CreateIndex
CREATE INDEX "cohort_videos_order_idx" ON "cohort_videos"("order");

-- CreateIndex
CREATE INDEX "cohort_slides_scheduleId_idx" ON "cohort_slides"("scheduleId");

-- CreateIndex
CREATE INDEX "cohort_slides_order_idx" ON "cohort_slides"("order");

-- CreateIndex
CREATE INDEX "cohort_qnas_scheduleId_idx" ON "cohort_qnas"("scheduleId");

-- CreateIndex
CREATE INDEX "cohort_qnas_userId_idx" ON "cohort_qnas"("userId");

-- CreateIndex
CREATE INDEX "cohort_qnas_answeredBy_idx" ON "cohort_qnas"("answeredBy");

-- CreateIndex
CREATE INDEX "cohort_qnas_createdAt_idx" ON "cohort_qnas"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_applications_userId_key" ON "instructor_applications"("userId");

-- CreateIndex
CREATE INDEX "instructor_applications_status_idx" ON "instructor_applications"("status");

-- CreateIndex
CREATE INDEX "instructor_applications_reviewedBy_idx" ON "instructor_applications"("reviewedBy");

-- CreateIndex
CREATE INDEX "instructor_applications_createdAt_idx" ON "instructor_applications"("createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_scheduleId_idx" ON "chat_messages"("scheduleId");

-- CreateIndex
CREATE INDEX "chat_messages_userId_idx" ON "chat_messages"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "videos_categoryId_idx" ON "videos"("categoryId");

-- CreateIndex
CREATE INDEX "videos_instructorId_idx" ON "videos"("instructorId");

-- CreateIndex
CREATE INDEX "videos_isPublished_idx" ON "videos"("isPublished");

-- CreateIndex
CREATE INDEX "videos_order_idx" ON "videos"("order");

-- CreateIndex
CREATE UNIQUE INDEX "video_categories_slug_key" ON "video_categories"("slug");

-- CreateIndex
CREATE INDEX "video_purchases_userId_idx" ON "video_purchases"("userId");

-- CreateIndex
CREATE INDEX "video_purchases_videoId_idx" ON "video_purchases"("videoId");

-- CreateIndex
CREATE INDEX "video_purchases_paymentId_idx" ON "video_purchases"("paymentId");

-- CreateIndex
CREATE INDEX "video_purchases_status_idx" ON "video_purchases"("status");

-- CreateIndex
CREATE UNIQUE INDEX "video_purchases_userId_videoId_key" ON "video_purchases"("userId", "videoId");

-- CreateIndex
CREATE INDEX "digital_products_categoryId_idx" ON "digital_products"("categoryId");

-- CreateIndex
CREATE INDEX "digital_products_instructorId_idx" ON "digital_products"("instructorId");

-- CreateIndex
CREATE INDEX "digital_products_type_idx" ON "digital_products"("type");

-- CreateIndex
CREATE INDEX "digital_products_isPublished_idx" ON "digital_products"("isPublished");

-- CreateIndex
CREATE INDEX "digital_products_order_idx" ON "digital_products"("order");

-- CreateIndex
CREATE UNIQUE INDEX "digital_product_categories_slug_key" ON "digital_product_categories"("slug");

-- CreateIndex
CREATE INDEX "digital_product_categories_type_idx" ON "digital_product_categories"("type");

-- CreateIndex
CREATE INDEX "digital_product_purchases_userId_idx" ON "digital_product_purchases"("userId");

-- CreateIndex
CREATE INDEX "digital_product_purchases_productId_idx" ON "digital_product_purchases"("productId");

-- CreateIndex
CREATE INDEX "digital_product_purchases_paymentId_idx" ON "digital_product_purchases"("paymentId");

-- CreateIndex
CREATE INDEX "digital_product_purchases_status_idx" ON "digital_product_purchases"("status");

-- CreateIndex
CREATE UNIQUE INDEX "digital_product_purchases_userId_productId_key" ON "digital_product_purchases"("userId", "productId");

-- CreateIndex
CREATE INDEX "curriculum_tasks_courseId_idx" ON "curriculum_tasks"("courseId");

-- CreateIndex
CREATE INDEX "curriculum_tasks_category_idx" ON "curriculum_tasks"("category");

-- CreateIndex
CREATE INDEX "curriculum_tasks_order_idx" ON "curriculum_tasks"("order");

-- CreateIndex
CREATE INDEX "student_task_progress_taskId_idx" ON "student_task_progress"("taskId");

-- CreateIndex
CREATE INDEX "student_task_progress_userId_idx" ON "student_task_progress"("userId");

-- CreateIndex
CREATE INDEX "student_task_progress_isCompleted_idx" ON "student_task_progress"("isCompleted");

-- CreateIndex
CREATE INDEX "student_task_progress_helpRequested_idx" ON "student_task_progress"("helpRequested");

-- CreateIndex
CREATE UNIQUE INDEX "student_task_progress_taskId_userId_key" ON "student_task_progress"("taskId", "userId");

-- CreateIndex
CREATE INDEX "exec_diaries_userId_idx" ON "exec_diaries"("userId");

-- CreateIndex
CREATE INDEX "exec_diaries_courseId_idx" ON "exec_diaries"("courseId");

-- CreateIndex
CREATE INDEX "exec_diaries_scheduleId_idx" ON "exec_diaries"("scheduleId");

-- CreateIndex
CREATE INDEX "exec_diaries_date_idx" ON "exec_diaries"("date");

-- CreateIndex
CREATE INDEX "exec_diaries_isPublic_idx" ON "exec_diaries"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "exec_diaries_userId_courseId_date_key" ON "exec_diaries"("userId", "courseId", "date");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_schedules" ADD CONSTRAINT "course_schedules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_callback_logs" ADD CONSTRAINT "payment_callback_logs_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_consultations" ADD CONSTRAINT "instructor_consultations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_consultations" ADD CONSTRAINT "instructor_consultations_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_consultations" ADD CONSTRAINT "instructor_consultations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_notification_logs" ADD CONSTRAINT "sms_notification_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "course_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_notification_logs" ADD CONSTRAINT "sms_notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_posts" ADD CONSTRAINT "cohort_posts_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_posts" ADD CONSTRAINT "cohort_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_comments" ADD CONSTRAINT "cohort_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "cohort_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_comments" ADD CONSTRAINT "cohort_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "cohort_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_comments" ADD CONSTRAINT "cohort_comments_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_comments" ADD CONSTRAINT "cohort_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_materials" ADD CONSTRAINT "cohort_materials_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_videos" ADD CONSTRAINT "cohort_videos_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_slides" ADD CONSTRAINT "cohort_slides_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_qnas" ADD CONSTRAINT "cohort_qnas_answeredBy_fkey" FOREIGN KEY ("answeredBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_qnas" ADD CONSTRAINT "cohort_qnas_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_qnas" ADD CONSTRAINT "cohort_qnas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "video_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_purchases" ADD CONSTRAINT "video_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_purchases" ADD CONSTRAINT "video_purchases_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_purchases" ADD CONSTRAINT "video_purchases_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_products" ADD CONSTRAINT "digital_products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "digital_product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_products" ADD CONSTRAINT "digital_products_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_product_purchases" ADD CONSTRAINT "digital_product_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_product_purchases" ADD CONSTRAINT "digital_product_purchases_productId_fkey" FOREIGN KEY ("productId") REFERENCES "digital_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_product_purchases" ADD CONSTRAINT "digital_product_purchases_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_tasks" ADD CONSTRAINT "curriculum_tasks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_task_progress" ADD CONSTRAINT "student_task_progress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "curriculum_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_task_progress" ADD CONSTRAINT "student_task_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_diaries" ADD CONSTRAINT "exec_diaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_diaries" ADD CONSTRAINT "exec_diaries_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_diaries" ADD CONSTRAINT "exec_diaries_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
