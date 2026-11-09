import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

// GET: own branch inventory (BANK) or all inventory (ADMIN)
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (u.role === "BANK") {
    const inventory = await prisma.inventory.findMany({ where: { bankId: u.bankId! }, orderBy: { bloodGroup: "asc" } });
    return NextResponse.json({ inventory, bankId: u.bankId });
  }
  if (u.role === "ADMIN") {
    const inventory = await prisma.inventory.findMany({ include: { bank: { include: { city: true } } } });
    return NextResponse.json({ inventory });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// PATCH: bank edits ITS OWN stock only
export async function PATCH(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (u.role !== "BANK") return NextResponse.json({ error: "Only blood bank accounts can edit stock" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const { bloodGroup, freeUnits, paidUnits, paidPrice, exchangeUnits } = b;
  const inv = await prisma.inventory.findUnique({ where: { bankId_bloodGroup: { bankId: u.bankId!, bloodGroup } } });
  if (!inv) return NextResponse.json({ error: "Inventory row not found for your branch" }, { status: 404 });
  const updated = await prisma.inventory.update({
    where: { id: inv.id },
    data: {
      freeUnits: Math.max(0, Number(freeUnits ?? inv.freeUnits)),
      paidUnits: Math.max(0, Number(paidUnits ?? inv.paidUnits)),
      paidPrice: Math.max(0, Number(paidPrice ?? inv.paidPrice)),
      exchangeUnits: Math.max(0, Number(exchangeUnits ?? inv.exchangeUnits)),
    },
  });
  return NextResponse.json({ inventory: updated });
}
