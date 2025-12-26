-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'pending', 'inactive', 'banned', 'deleted');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "cover" VARCHAR(255),
    "avatar" VARCHAR(255),
    "username" VARCHAR(100) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "salt" VARCHAR(50) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "bio" VARCHAR(255),
    "website_url" VARCHAR(255),
    "follower_count" INTEGER DEFAULT 0,
    "post_count" INTEGER DEFAULT 0,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers" (
    "follower_id" VARCHAR(36) NOT NULL,
    "following_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "followers_pkey" PRIMARY KEY ("following_id","follower_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "role" ON "users"("role");

-- CreateIndex
CREATE INDEX "status" ON "users"("status");

-- CreateIndex
CREATE INDEX "followerIdIdx" ON "followers"("follower_id");
