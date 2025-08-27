-- CreateTable
CREATE TABLE "public"."Pixel_data" (
    "id" SERIAL NOT NULL,
    "total_pixel_count" INTEGER NOT NULL,
    "total_processed_files" INTEGER NOT NULL,
    "color_data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pixel_data_pkey" PRIMARY KEY ("id")
);
