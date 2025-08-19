-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "uid" VARCHAR(16) NOT NULL,
    "name" VARCHAR(16) NOT NULL,
    "region" VARCHAR(32) NOT NULL,
    "messages" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
