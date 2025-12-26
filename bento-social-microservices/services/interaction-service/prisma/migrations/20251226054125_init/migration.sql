-- CreateTable
CREATE TABLE "post_likes" (
    "post_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("post_id","user_id")
);

-- CreateTable
CREATE TABLE "post_saves" (
    "post_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_saves_pkey" PRIMARY KEY ("post_id","user_id")
);

-- CreateTable
CREATE TABLE "followers" (
    "follower_id" VARCHAR(36) NOT NULL,
    "following_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "followers_pkey" PRIMARY KEY ("following_id","follower_id")
);

-- CreateIndex
CREATE INDEX "post_like_user_idx" ON "post_likes"("user_id");

-- CreateIndex
CREATE INDEX "post_save_user_idx" ON "post_saves"("user_id");

-- CreateIndex
CREATE INDEX "follower_idx" ON "followers"("follower_id");
