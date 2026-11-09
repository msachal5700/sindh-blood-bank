import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

const fieldForMode = (mode: string) => mode === "FREE" ? "freeUnits" : mode === "PAID" ? "paidUnits" : "exchangeUnits";

// PATCH: bank approves / rejects / fulfils a request for ITS OWN branch.
// Approving reserves stock: the matching inventory decrements in the same transaction.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action } = await req.json().catch(() => ({}));
  const request = await prisma.bloodRequest.findUnique({ where: { id: Number(id) } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (u.role === "PATIENT") {
    if (request.patientId !== u.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (action !== "cancel" || request.status !== "PENDING") return NextResponse.json({ error: "Patients can only cancel a pending request" }, { status: 400 });
    const updated = await prisma.bloodRequest.update({ where: { id: request.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ request: updated });
  }
  if (u.role !== "BANK" && u.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (u.role === "BANK" && request.bankId !== u.bankId) return NextResponse.json({ error: "This request belongs to another branch" }, { status: 403 });

  if (action === "reject") {
    if (request.status !== "PENDING") return NextResponse.json({ error: "Only pending requests can be rejected" }, { status: 400 });
    const updated = await prisma.bloodRequest.update({ where: { id: request.id }, data: { status: "REJECTED" } });
    return NextResponse.json({ request: updated });
  }
  if (action === "approve") {
    if (request.status !== "PENDING") return NextResponse.json({ error: "Only pending requests can be approved" }, { status: 400 });
    const field = fieldForMode(request.mode);
    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findUnique({ where: { bankId_bloodGroup: { bankId: request.bankId, bloodGroup: request.bloodGroup } } });
      if (!inv || (inv as any)[field] < request.units) throw new Error("INSUFFICIENT");
      await tx.inventory.update({ where: { id: inv.id }, data: { [field]: { decrement: request.units } } });
      return tx.bloodRequest.update({ where: { id: request.id }, data: { status: "APPROVED" } });
    }).catch((e) => { if (e.message === "INSUFFICIENT") return null; throw e; });
    if (!result) return NextResponse.json({ error: "Not enough stock to approve this request" }, { status: 409 });
    return NextResponse.json({ request: result });
  }
  if (action === "fulfil") {
    if (request.status !== "APPROVED") return NextResponse.json({ error: "Only approved requests can be fulfilled" }, { status: 400 });
    const updated = await prisma.bloodRequest.update({ where: { id: request.id }, data: { status: "FULFILLED" } });
    return NextResponse.json({ request: updated });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
