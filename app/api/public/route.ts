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
  const result = ordered.map((city) => ({
    city: city.name, cityId: city.id,
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
  return NextResponse.json({ cities, groups: BLOOD_GROUPS, originCity: origin?.name, results: result });
}
