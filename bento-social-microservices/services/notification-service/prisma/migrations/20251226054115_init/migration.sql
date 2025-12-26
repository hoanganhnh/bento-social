-- CreateEnum
CREATE TYPE "NotificationAction" AS ENUM ('liked', 'followed', 'replied');

-- CreateTable
CREATE TABLE "notifications" (
    "id" VARCHAR(36) NOT NULL,
    "receiver_id" VARCHAR(36) NOT NULL,
    "actor_id" VARCHAR(36),
    "content" TEXT,
    "action" "NotificationAction" NOT NULL,
    "is_sent" BOOLEAN DEFAULT false,
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_receiver_idx" ON "notifications"("receiver_id");
