import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seedData";

export const dynamic = "force-dynamic";

// One-time production bootstrap: creates tables if missing, then seeds.
// Guarded by the SESSION_SECRET value in the x-seed-key header.
// This route is removed (stubbed to 404) immediately after the seed runs.
const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS "City" ("id" SERIAL NOT NULL, "name" TEXT NOT NULL, "lat" DOUBLE PRECISION NOT NULL, "lng" DOUBLE PRECISION NOT NULL, CONSTRAINT "City_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "City_name_key" ON "City"("name")`,
  `CREATE TABLE IF NOT EXISTS "BloodBank" ("id" SERIAL NOT NULL, "name" TEXT NOT NULL, "address" TEXT NOT NULL, "phone" TEXT NOT NULL, "hours" TEXT NOT NULL DEFAULT '9:00 AM – 8:00 PM', "cityId" INTEGER NOT NULL, CONSTRAINT "BloodBank_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "User" ("id" SERIAL NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "phone" TEXT NOT NULL DEFAULT '', "role" TEXT NOT NULL, "bloodGroup" TEXT, "hospital" TEXT, "cityId" INTEGER, "bankId" INTEGER, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "User_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE TABLE IF NOT EXISTS "Inventory" ("id" SERIAL NOT NULL, "bankId" INTEGER NOT NULL, "bloodGroup" TEXT NOT NULL, "freeUnits" INTEGER NOT NULL DEFAULT 0, "paidUnits" INTEGER NOT NULL DEFAULT 0, "paidPrice" INTEGER NOT NULL DEFAULT 0, "exchangeUnits" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Inventory_bankId_bloodGroup_key" ON "Inventory"("bankId", "bloodGroup")`,
  `CREATE TABLE IF NOT EXISTS "BloodRequest" ("id" SERIAL NOT NULL, "patientId" INTEGER NOT NULL, "bankId" INTEGER NOT NULL, "bloodGroup" TEXT NOT NULL, "mode" TEXT NOT NULL, "units" INTEGER NOT NULL DEFAULT 1, "hospital" TEXT NOT NULL DEFAULT '', "urgency" TEXT NOT NULL DEFAULT 'Normal', "status" TEXT NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "BloodRequest_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Donation" ("id" SERIAL NOT NULL, "donorId" INTEGER NOT NULL, "bankId" INTEGER NOT NULL, "bloodGroup" TEXT NOT NULL, "units" INTEGER NOT NULL DEFAULT 1, "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Donation_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Appointment" ("id" SERIAL NOT NULL, "donorId" INTEGER NOT NULL, "bankId" INTEGER NOT NULL, "date" TIMESTAMP(3) NOT NULL, "status" TEXT NOT NULL DEFAULT 'BOOKED', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"))`,
];

const FKS: string[] = [
  `ALTER TABLE "BloodBank" ADD CONSTRAINT "BloodBank_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "User" ADD CONSTRAINT "User_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "User" ADD CONSTRAINT "User_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "BloodBank"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "BloodBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "BloodBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Donation" ADD CONSTRAINT "Donation_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "BloodBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "BloodBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
];

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-seed-key");
  if (!process.env.SESSION_SECRET || key !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const passwords = body?.passwords as Record<string, string> | undefined;
  if (!passwords) {
    return NextResponse.json({ error: "passwords map required" }, { status: 400 });
  }

  for (const stmt of DDL) await prisma.$executeRawUnsafe(stmt);
  for (const stmt of FKS) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch {
      // constraint already exists — fine
    }
  }
  const counts = await seedDatabase(passwords);
  return NextResponse.json({ ok: true, counts });
}
