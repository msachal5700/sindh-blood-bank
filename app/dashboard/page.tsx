"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const statusTag = (s: string) => s === "FULFILLED" || s === "APPROVED" || s === "COMPLETED" ? "tag green" : s === "PENDING" || s === "BOOKED" ? "tag amber" : s === "REJECTED" || s === "CANCELLED" ? "tag red" : "tag grey";
const Bar = ({ label, value, max, cls }: any) => (
  <div className="bar-row"><span className="lbl">{label}</span>
    <div className="bar-track"><div className={`bar-fill ${cls || ""}`} style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} /></div>
    <strong>{value}</strong></div>
);

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null); const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]); const [inventory, setInventory] = useState<any[]>([]);
  const [appts, setAppts] = useState<any>({ appointments: [], donations: [] });
  const [stats, setStats] = useState<any>(null); const [pub, setPub] = useState<any>(null);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const [reqForm, setReqForm] = useState({ bankId: "", bloodGroup: "O+", mode: "FREE", units: 1, hospital: "", urgency: "Normal" });
  const [bookForm, setBookForm] = useState({ bankId: "", date: "" });
  const [edit, setEdit] = useState<Record<string, any>>({});

  const load = useCallback(async (user: any) => {
    const [rq, inv, ap, st, pb] = await Promise.all([
      fetch("/api/requests").then((r) => r.json()).catch(() => ({})),
      fetch("/api/inventory").then((r) => r.json()).catch(() => ({})),
      fetch("/api/appointments").then((r) => r.json()).catch(() => ({})),
      user.role === "ADMIN" ? fetch("/api/admin/stats").then((r) => r.json()).catch(() => null) : Promise.resolve(null),
      fetch("/api/public").then((r) => r.json()).catch(() => null),
    ]);
    setRequests(rq.requests || []); setInventory(inv.inventory || []); setAppts(ap || { appointments: [], donations: [] });
    setStats(st); setPub(pb);
    if (pb?.results) { const firstBank = pb.results.flatMap((c: any) => c.banks)[0]; if (firstBank) { setReqForm((f) => ({ ...f, bankId: String(firstBank.id) })); setBookForm((f) => ({ ...f, bankId: String(firstBank.id) })); } }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (!r.ok) { router.push("/login"); return; }
      const j = await r.json(); setMe(j.user); setReqForm((f) => ({ ...f, bloodGroup: j.user.bloodGroup || "O+", hospital: j.user.hospital || "" }));
      await load(j.user); setLoading(false);
    });
  }, [load, router]);

  async function act(id: number, action: string) {
    setErr(""); setMsg("");
    const r = await fetch(`/api/requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const j = await r.json(); if (!r.ok) return setErr(j.error || "Action failed");
    setMsg(`Request #${id} ${j.request.status.toLowerCase()}.`); load(me);
  }
  async function createRequest(e: any) {
    e.preventDefault(); setErr(""); setMsg("");
    const r = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...reqForm, bankId: Number(reqForm.bankId), units: Number(reqForm.units) }) });
    const j = await r.json(); if (!r.ok) return setErr(j.error || "Could not create request");
    setMsg("Blood request sent to the blood bank."); load(me);
  }
  async function book(e: any) {
    e.preventDefault(); setErr(""); setMsg("");
    const r = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bankId: Number(bookForm.bankId), date: bookForm.date || undefined }) });
    const j = await r.json(); if (!r.ok) return setErr(j.error || "Could not book appointment");
    setMsg("Donation appointment booked."); load(me);
  }
  async function saveStock(g: string) {
    const row = inventory.find((i) => i.bloodGroup === g); const e2 = edit[g] || {};
    const r = await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bloodGroup: g, freeUnits: e2.free ?? row.freeUnits, paidUnits: e2.paid ?? row.paidUnits, paidPrice: e2.price ?? row.paidPrice, exchangeUnits: e2.exch ?? row.exchangeUnits }) });
    const j = await r.json(); if (!r.ok) return setErr(j.error || "Save failed");
    setMsg(`Stock for ${g} updated.`); load(me);
  }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }

  if (loading) return <p className="muted">Loading your dashboard…</p>;
  if (!me) return null;
  const banks = pub?.results?.flatMap((c: any) => c.banks.map((b: any) => ({ ...b, city: c.city }))) || [];
  const maxCity = stats ? Math.max(1, ...stats.perCity.map((c: any) => Math.max(c.free, c.demand))) : 1;
  const maxGroup = stats ? Math.max(1, ...stats.byGroup.map((g: any) => g.free + g.paid + g.exchange)) : 1;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 2 }}>{me.role === "ADMIN" ? "Master Dashboard" : me.role === "BANK" ? `${me.bank?.name || "Blood Bank"} — Branch Dashboard` : `Assalam-o-Alaikum, ${me.name.split(" ")[0]}`}</h1>
          <p className="muted" style={{ marginTop: 0 }}>{me.email} · <span className="tag">{me.role}</span>{me.bloodGroup ? <> · Blood group <strong>{me.bloodGroup}</strong></> : ""}{me.city ? <> · {me.city}</> : ""}{me.bank ? <> · {me.bank.city}</> : ""}</p>
        </div>
        <button className="btn" onClick={logout}>Sign out</button>
      </div>
      {msg && <p className="ok">{msg}</p>}{err && <p className="err">{err}</p>}

      {me.role === "ADMIN" && stats && (
        <>
          <div className="grid grid-3">
            {[["Free units", stats.totals.free], ["Open demand (units)", stats.totals.openDemand], ["Requests", stats.totals.requests], ["Fulfilled", stats.totals.fulfilled], ["Donations", stats.totals.donations], ["Branches / Donors", `${stats.totals.branches} / ${stats.totals.donors}`]].map(([l, v]: any) => (
              <div key={l} className="card stat"><div className="num">{v}</div><div className="muted">{l}</div></div>
            ))}
          </div>
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card"><h3>Demand vs Free blood — per city</h3>
              {stats.perCity.map((c: any) => (<div key={c.city}><Bar label={`${c.city} free`} value={c.free} max={maxCity} cls="free" /><Bar label={`${c.city} demand`} value={c.demand} max={maxCity} cls="demand" /></div>))}
            </div>
            <div className="card"><h3>Stock by blood group (all Sindh)</h3>
              {stats.byGroup.map((g: any) => <Bar key={g.group} label={g.group} value={g.free + g.paid + g.exchange} max={maxGroup} />)}
              <h3 style={{ marginTop: 18 }}>Free / Paid / Exchange split</h3>
              <Bar label="Free" value={stats.totals.free} max={stats.totals.free + stats.totals.paid + stats.totals.exchange} cls="free" />
              <Bar label="Paid" value={stats.totals.paid} max={stats.totals.free + stats.totals.paid + stats.totals.exchange} cls="demand" />
              <Bar label="Exchange" value={stats.totals.exchange} max={stats.totals.free + stats.totals.paid + stats.totals.exchange} />
            </div>
          </div>
          <div className="card" style={{ marginTop: 16 }}><h3>All requests</h3><ReqTable requests={requests} showPatient /></div>
        </>
      )}

      {me.role === "BANK" && (
        <>
          <div className="card"><h3 style={{ marginTop: 4 }}>Branch stock — edit and save per group</h3>
            <table><thead><tr><th>Group</th><th>Free</th><th>Paid</th><th>Rs / unit</th><th>Exchange</th><th></th></tr></thead>
              <tbody>{GROUPS.map((g) => { const row = inventory.find((i) => i.bloodGroup === g); if (!row) return null; const e2 = edit[g] || {};
                const num = (key: string, val: number) => <input type="number" min={0} style={{ width: 76 }} value={e2[key] ?? val} onChange={(ev) => setEdit({ ...edit, [g]: { ...e2, [key]: Number(ev.target.value) } })} />;
                return (<tr key={g}><td><strong>{g}</strong></td><td>{num("free", row.freeUnits)}</td><td>{num("paid", row.paidUnits)}</td><td>{num("price", row.paidPrice)}</td><td>{num("exch", row.exchangeUnits)}</td>
                  <td><button className="btn btn-primary btn-sm" onClick={() => saveStock(g)}>Save</button></td></tr>); })}
              </tbody></table>
          </div>
          <div className="card" style={{ marginTop: 16 }}><h3>Incoming requests</h3><ReqTable requests={requests} showPatient onAct={act} /></div>
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card"><h3>Upcoming donation appointments</h3>
              {appts.appointments.length === 0 ? <p className="muted">No appointments yet.</p> : appts.appointments.map((a: any) => <p key={a.id} style={{ fontFamily: "system-ui" }}>{new Date(a.date).toLocaleDateString()} — {a.donor?.name} ({a.donor?.bloodGroup}) <span className={statusTag(a.status)}>{a.status}</span></p>)}
            </div>
            <div className="card"><h3>Donations received</h3>
              {appts.donations.length === 0 ? <p className="muted">No donations recorded yet.</p> : appts.donations.slice(0, 8).map((d: any) => <p key={d.id} style={{ fontFamily: "system-ui" }}>{new Date(d.date).toLocaleDateString()} — {d.donor?.name} · {d.bloodGroup} · {d.units} unit(s)</p>)}
            </div>
          </div>
        </>
      )}

      {me.role === "PATIENT" && (
        <>
          <div className="card"><h3 style={{ marginTop: 4 }}>Request blood</h3>
            <form onSubmit={createRequest}><div className="grid grid-3" style={{ gap: 12 }}>
              <div><label>Blood bank</label><select value={reqForm.bankId} onChange={(e) => setReqForm({ ...reqForm, bankId: e.target.value })}>{banks.map((b: any) => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}</select></div>
              <div><label>Blood group</label><select value={reqForm.bloodGroup} onChange={(e) => setReqForm({ ...reqForm, bloodGroup: e.target.value })}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></div>
              <div><label>Mode</label><select value={reqForm.mode} onChange={(e) => setReqForm({ ...reqForm, mode: e.target.value })}><option value="FREE">Free</option><option value="PAID">Paid</option><option value="EXCHANGE">Exchange</option></select></div>
              <div><label>Units</label><input type="number" min={1} value={reqForm.units} onChange={(e) => setReqForm({ ...reqForm, units: Number(e.target.value) })} /></div>
              <div><label>Urgency</label><select value={reqForm.urgency} onChange={(e) => setReqForm({ ...reqForm, urgency: e.target.value })}><option>Normal</option><option>Urgent</option><option>Critical</option></select></div>
              <div><label>Hospital</label><input value={reqForm.hospital} onChange={(e) => setReqForm({ ...reqForm, hospital: e.target.value })} /></div>
            </div><p><button className="btn btn-primary">Send request</button></p></form>
          </div>
          <div className="card" style={{ marginTop: 16 }}><h3>My requests</h3><ReqTable requests={requests} onAct={act} mine /></div>
        </>
      )}

      {me.role === "DONOR" && (
        <>
          <div className="card"><h3 style={{ marginTop: 4 }}>Book a donation</h3>
            <form onSubmit={book}><div className="grid grid-2" style={{ gap: 12 }}>
              <div><label>Blood bank branch</label><select value={bookForm.bankId} onChange={(e) => setBookForm({ ...bookForm, bankId: e.target.value })}>{banks.map((b: any) => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}</select></div>
              <div><label>Date</label><input type="date" value={bookForm.date} onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })} /></div>
            </div><p><button className="btn btn-primary">Book donation visit</button></p></form>
          </div>
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card"><h3>My appointments</h3>
              {appts.appointments.length === 0 ? <p className="muted">No appointments yet — book your first donation above.</p> : appts.appointments.map((a: any) => <p key={a.id} style={{ fontFamily: "system-ui" }}>{new Date(a.date).toLocaleDateString()} — {a.bank?.name} ({a.bank?.city?.name}) <span className={statusTag(a.status)}>{a.status}</span></p>)}
            </div>
            <div className="card"><h3>My donation history</h3>
              {appts.donations.length === 0 ? <p className="muted">No donations recorded yet.</p> : appts.donations.map((d: any) => <p key={d.id} style={{ fontFamily: "system-ui" }}>🩸 {new Date(d.date).toLocaleDateString()} — {d.bloodGroup} · {d.units} unit at {d.bank?.name}</p>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReqTable({ requests, onAct, showPatient, mine }: any) {
  if (!requests?.length) return <p className="muted">No requests yet.</p>;
  return (
    <table><thead><tr><th>#</th><th>Group</th><th>Mode</th><th>Units</th>{showPatient && <th>Patient</th>}<th>Bank</th><th>Urgency</th><th>Status</th><th></th></tr></thead>
      <tbody>{requests.map((r: any) => (
        <tr key={r.id}><td>{r.id}</td><td><strong>{r.bloodGroup}</strong></td><td>{r.mode}</td><td>{r.units}</td>
          {showPatient && <td>{r.patient?.name}<br /><span className="muted">{r.hospital}</span></td>}
          <td>{r.bank?.name}</td><td>{r.urgency}</td><td><span className={statusTag(r.status)}>{r.status}</span></td>
          <td style={{ whiteSpace: "nowrap" }}>
            {onAct && r.status === "PENDING" && !mine && <><button className="btn btn-primary btn-sm" onClick={() => onAct(r.id, "approve")}>Approve</button>{" "}<button className="btn btn-sm" onClick={() => onAct(r.id, "reject")}>Reject</button></>}
            {onAct && r.status === "APPROVED" && !mine && <button className="btn btn-primary btn-sm" onClick={() => onAct(r.id, "fulfil")}>Fulfil</button>}
            {onAct && mine && r.status === "PENDING" && <button className="btn btn-sm" onClick={() => onAct(r.id, "cancel")}>Cancel</button>}
          </td></tr>))}
      </tbody></table>
  );
}
