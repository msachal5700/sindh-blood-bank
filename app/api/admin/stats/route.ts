import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { BLOOD_GROUPS } from "@/lib/data";

// GET: Master Dashboard aggregates — ADMIN only
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (u.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [cities, inventory, requests, donations, users] = await Promise.all([
    prisma.city.findMany({ include: { banks: true } }),
    prisma.inventory.findMany({ include: { bank: { include: { city: true } } } }),
    prisma.bloodRequest.findMany(),
    prisma.donation.count(),
    prisma.user.groupBy({ by: ["role"], _count: true }),
  ]);

  const perCity = cities.map((city) => {
    const cityInv = inventory.filter((i) => i.bank.cityId === city.id);
    const cityBankIds = city.banks.map((b) => b.id);
    const cityReqs = requests.filter((r) => cityBankIds.includes(r.bankId));
    return {
      city: city.name, banks: city.banks.length,
      free: cityInv.reduce((s, i) => s + i.freeUnits, 0),
      paid: cityInv.reduce((s, i) => s + i.paidUnits, 0),
      exchange: cityInv.reduce((s, i) => s + i.exchangeUnits, 0),
      demand: cityReqs.filter((r) => ["PENDING", "APPROVED"].includes(r.status)).reduce((s, r) => s + r.units, 0),
      requests: cityReqs.length,
    };
  });

  const byGroup = BLOOD_GROUPS.map((g) => {
    const rows = inventory.filter((i) => i.bloodGroup === g);
    return { group: g, free: rows.reduce((s, i) => s + i.freeUnits, 0), paid: rows.reduce((s, i) => s + i.paidUnits, 0), exchange: rows.reduce((s, i) => s + i.exchangeUnits, 0) };
  });

  const totals = {
    free: inventory.reduce((s, i) => s + i.freeUnits, 0),
    paid: inventory.reduce((s, i) => s + i.paidUnits, 0),
    exchange: inventory.reduce((s, i) => s + i.exchangeUnits, 0),
    openDemand: requests.filter((r) => ["PENDING", "APPROVED"].includes(r.status)).reduce((s, r) => s + r.units, 0),
    requests: requests.length,
    fulfilled: requests.filter((r) => r.status === "FULFILLED").length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    donations,
    donors: users.find((x) => x.role === "DONOR")?._count ?? 0,
    patients: users.find((x) => x.role === "PATIENT")?._count ?? 0,
    branches: inventory.length ? new Set(inventory.map((i) => i.bankId)).size : 0,
  };
  return NextResponse.json({ totals, perCity, byGroup });
}
