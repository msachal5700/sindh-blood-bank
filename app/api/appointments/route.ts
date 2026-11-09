import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

// GET: donor → own appointments + donation history; bank → appointments/donations for own branch; admin → all
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (u.role === "DONOR") {
    const [appointments, donations] = await Promise.all([
      prisma.appointment.findMany({ where: { donorId: u.id }, orderBy: { date: "desc" }, include: { bank: { include: { city: true } } } }),
      prisma.donation.findMany({ where: { donorId: u.id }, orderBy: { date: "desc" }, include: { bank: { include: { city: true } } } }),
    ]);
    return NextResponse.json({ appointments, donations });
  }
  if (u.role === "BANK") {
    const [appointments, donations] = await Promise.all([
      prisma.appointment.findMany({ where: { bankId: u.bankId! }, orderBy: { date: "desc" }, include: { donor: { select: { name: true, phone: true, bloodGroup: true } } } }),
      prisma.donation.findMany({ where: { bankId: u.bankId! }, orderBy: { date: "desc" }, include: { donor: { select: { name: true, bloodGroup: true } } } }),
    ]);
    return NextResponse.json({ appointments, donations });
  }
  if (u.role === "ADMIN") {
    const [appointments, donations] = await Promise.all([
      prisma.appointment.findMany({ orderBy: { date: "desc" }, include: { donor: { select: { name: true } }, bank: { include: { city: true } } } }),
      prisma.donation.findMany({ orderBy: { date: "desc" }, include: { donor: { select: { name: true } }, bank: { include: { city: true } } } }),
    ]);
    return NextResponse.json({ appointments, donations });
  }
  return NextResponse.json({ appointments: [], donations: [] });
}

// POST: donor books a donation appointment at a branch
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (u.role !== "DONOR") return NextResponse.json({ error: "Only donors can book donation appointments" }, { status: 403 });
  const { bankId, date } = await req.json().catch(() => ({}));
  const bank = await prisma.bloodBank.findUnique({ where: { id: Number(bankId) } });
  if (!bank) return NextResponse.json({ error: "Blood bank not found" }, { status: 404 });
  const when = date ? new Date(date) : new Date(Date.now() + 86400000);
  if (isNaN(when.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  const appointment = await prisma.appointment.create({
    data: { donorId: u.id, bankId: bank.id, date: when },
    include: { bank: { include: { city: true } } },
  });
  return NextResponse.json({ appointment }, { status: 201 });
}
