-- CreateEnum
CREATE TYPE "ElevatorType" AS ENUM ('ELECTRICO', 'HIDRAULICO', 'PANORAMICO', 'MONTACARGAS');

-- CreateEnum
CREATE TYPE "ElevatorStatus" AS ENUM ('ACTIVO', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO');

-- CreateTable
CREATE TABLE "buildings" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "floors" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elevators" (
    "id" UUID NOT NULL,
    "internal_code" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "type" "ElevatorType" NOT NULL,
    "capacity_kg" INTEGER NOT NULL,
    "stops" INTEGER NOT NULL,
    "status" "ElevatorStatus" NOT NULL DEFAULT 'ACTIVO',
    "installed_at" DATE,
    "building_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elevators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buildings_name_key" ON "buildings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "elevators_internal_code_key" ON "elevators"("internal_code");

-- CreateIndex
CREATE INDEX "elevators_building_id_idx" ON "elevators"("building_id");

-- AddForeignKey
ALTER TABLE "elevators" ADD CONSTRAINT "elevators_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

