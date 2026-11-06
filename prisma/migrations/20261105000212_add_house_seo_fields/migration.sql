-- AlterTable
ALTER TABLE "House" ADD COLUMN     "area" DOUBLE PRECISION,
ADD COLUMN     "backGarden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "balcony" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bathroom" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bedroom" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "designStyle" TEXT,
ADD COLUMN     "diningRoom" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "frontGarden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "garage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kitchen" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'bn',
ADD COLUMN     "lengthInches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lift" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "livingRoom" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "servantRoom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stair" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "swimmingPool" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "terrace" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "widthInches" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "HouseImage" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "imageTitle" TEXT,
ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "House_houseType_idx" ON "House"("houseType");

-- CreateIndex
CREATE INDEX "House_folder_idx" ON "House"("folder");

-- CreateIndex
CREATE INDEX "House_foundation_idx" ON "House"("foundation");

-- CreateIndex
CREATE INDEX "House_complete_idx" ON "House"("complete");

-- CreateIndex
CREATE INDEX "House_status_idx" ON "House"("status");

-- CreateIndex
CREATE INDEX "House_isFeatured_idx" ON "House"("isFeatured");

-- CreateIndex
CREATE INDEX "House_createdAt_idx" ON "House"("createdAt");

-- CreateIndex
CREATE INDEX "House_designStyle_idx" ON "House"("designStyle");

-- CreateIndex
CREATE INDEX "House_language_idx" ON "House"("language");

-- CreateIndex
CREATE INDEX "House_houseType_complete_idx" ON "House"("houseType", "complete");

-- CreateIndex
CREATE INDEX "House_houseType_foundation_idx" ON "House"("houseType", "foundation");

-- CreateIndex
CREATE INDEX "House_houseType_status_idx" ON "House"("houseType", "status");

-- CreateIndex
CREATE INDEX "House_houseType_createdAt_idx" ON "House"("houseType", "createdAt");

-- CreateIndex
CREATE INDEX "HouseImage_houseId_idx" ON "HouseImage"("houseId");

-- CreateIndex
CREATE INDEX "HouseImage_type_idx" ON "HouseImage"("type");

-- CreateIndex
CREATE INDEX "HouseImage_houseId_type_idx" ON "HouseImage"("houseId", "type");

-- CreateIndex
CREATE INDEX "HouseKeyword_houseId_idx" ON "HouseKeyword"("houseId");

-- CreateIndex
CREATE INDEX "HouseKeyword_language_idx" ON "HouseKeyword"("language");

-- CreateIndex
CREATE INDEX "HouseKeyword_keyword_idx" ON "HouseKeyword"("keyword");

-- CreateIndex
CREATE INDEX "HouseKeyword_houseId_language_idx" ON "HouseKeyword"("houseId", "language");
