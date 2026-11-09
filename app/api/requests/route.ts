import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { BLOOD_GROUPS } from "@/lib/data";

// GET: list requests visible to the signed-in role
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where: any = {};
  if (u.role === "PATIENT") where.patientId = u.id;
  else if (u.role === "BANK") where.bankId = u.bankId;
  else if (u.role === "DONOR") return NextResponse.json({ requests: [] });
  const requests = await prisma.bloodRequest.findMany({
    where, orderBy: { createdAt: "desc" },
    include: { patient: { select: { name: true, phone: true, email: true, bloodGroup: true } }, bank: { include: { city: true } } },
  });
  return NextResponse.json({ requests });
}

// POST: patient creates a request
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (u.role !== "PATIENT") return NextResponse.json({ error: "Only patients can create blood requests" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const { bankId, bloodGroup, mode, units, hospital, urgency } = b;
  if (!bankId || !BLOOD_GROUPS.includes(bloodGroup)) return NextResponse.json({ error: "Bank and a valid blood group are required" }, { status: 400 });
  if (!["FREE", "PAID", "EXCHANGE"].includes(mode)) return NextResponse.json({ error: "Mode must be FREE, PAID or EXCHANGE" }, { status: 400 });
  const bank = await prisma.bloodBank.findUnique({ where: { id: Number(bankId) } });
  if (!bank) return NextResponse.json({ error: "Blood bank not found" }, { status: 404 });
  const request = await prisma.bloodRequest.create({
    data: {
      patientId: u.id, bankId: bank.id, bloodGroup, mode,
      units: Math.max(1, Number(units) || 1),
      hospital: hospital || u.hospital || "", urgency: urgency || "Normal",
    },
    include: { bank: { include: { city: true } } },
  });
  return NextResponse.json({ request }, { status: 201 });
}
