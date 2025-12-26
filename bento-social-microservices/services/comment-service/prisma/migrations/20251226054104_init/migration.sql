-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('pending', 'approved', 'rejected', 'deleted', 'spam');

-- CreateTable
CREATE TABLE "comments" (
    "id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "post_id" VARCHAR(36) NOT NULL,
    "parent_id" VARCHAR(36),
    "content" TEXT NOT NULL,
    "liked_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "status" "CommentStatus" NOT NULL DEFAULT 'approved',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_post_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "comment_parent_idx" ON "comments"("parent_id");

-- CreateIndex
CREATE INDEX "comment_user_idx" ON "comments"("user_id");
