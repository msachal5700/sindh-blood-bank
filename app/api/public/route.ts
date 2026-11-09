import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BLOOD_GROUPS, haversineKm } from "@/lib/data";

// Public search — no login required.
// ?group=O+&cityId=1  → cities ordered nearest-first from the chosen city,
// each with its banks and full inventory.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group") || "";
  const cityId = Number(searchParams.get("cityId") || 0);
  const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });
  const origin = cities.find((c) => c.id === cityId) || cities[0];
  const ordered = [...cities].sort((a, b) =>
    haversineKm(origin.lat, origin.lng, a.lat, a.lng) - haversineKm(origin.lat, origin.lng, b.lat, b.lng));
  const banks = await prisma.bloodBank.findMany({ include: { city: true, inventory: true } });
  // Live network stats shown in the hero / waiting sections (counts only).
  const [pending, fulfilledRequests, totalDonations, donorCount, invAgg] = await Promise.all([
    prisma.bloodRequest.findMany({ where: { status: "PENDING" }, select: { units: true, bankId: true } }),
    prisma.bloodRequest.count({ where: { status: "FULFILLED" } }),
    prisma.donation.count(),
    prisma.user.count({ where: { role: "DONOR" } }),
    prisma.inventory.aggregate({ _sum: { freeUnits: true, paidUnits: true, exchangeUnits: true } }),
  ]);
  const bankCity = new Map(banks.map((b) => [b.id, b.cityId]));
  const demandByCity = new Map<number, number>();
  for (const r of pending) {
    const cid = bankCity.get(r.bankId);
    if (cid) demandByCity.set(cid, (demandByCity.get(cid) ?? 0) + r.units);
  }
  const stats = {
    pendingRequests: pending.length,
    openDemand: pending.reduce((s, r) => s + r.units, 0),
    fulfilledRequests,
    totalDonations,
    donorCount,
    totalFree: invAgg._sum.freeUnits ?? 0,
    totalPaid: invAgg._sum.paidUnits ?? 0,
    totalExchange: invAgg._sum.exchangeUnits ?? 0,
  };
  const result = ordered.map((city) => ({
    city: city.name, cityId: city.id,
    openDemand: demandByCity.get(city.id) ?? 0,
    distanceKm: haversineKm(origin.lat, origin.lng, city.lat, city.lng),
    banks: banks.filter((b) => b.cityId === city.id).map((b) => {
      const inv = Object.fromEntries(b.inventory.map((i) => [i.bloodGroup, i]));
      const groups = BLOOD_GROUPS.map((g) => ({
        group: g,
        free: inv[g]?.freeUnits ?? 0, paid: inv[g]?.paidUnits ?? 0,
        paidPrice: inv[g]?.paidPrice ?? 0, exchange: inv[g]?.exchangeUnits ?? 0,
      }));
      return {
        id: b.id, name: b.name, address: b.address, phone: b.phone, hours: b.hours,
        totalFree: groups.reduce((s, g) => s + g.free, 0),
        selected: group ? groups.find((g) => g.group === group) : null,
        groups,
      };
    }),
  })).filter((c) => c.banks.length > 0);
  return NextResponse.json({ cities, groups: BLOOD_GROUPS, originCity: origin?.name, stats, results: result });
}
