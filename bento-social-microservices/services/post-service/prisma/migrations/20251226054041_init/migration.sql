-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('text', 'media');

-- CreateTable
CREATE TABLE "posts" (
    "id" VARCHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "image" VARCHAR(255),
    "author_id" VARCHAR(36) NOT NULL,
    "topic_id" VARCHAR(36) NOT NULL,
    "is_featured" BOOLEAN DEFAULT false,
    "comment_count" INTEGER DEFAULT 0,
    "liked_count" INTEGER DEFAULT 0,
    "type" "PostType" DEFAULT 'text',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "authorIdIdx" ON "posts"("author_id");

-- CreateIndex
CREATE INDEX "topicIdIdx" ON "posts"("topic_id");

-- CreateIndex
CREATE INDEX "isFeaturedIdx" ON "posts"("is_featured");
