"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export default function Home() {
  const [group, setGroup] = useState("O+");
  const [cityId, setCityId] = useState<number | "">("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const q = new URLSearchParams({ group });
    if (cityId) q.set("cityId", String(cityId));
    fetch(`/api/public?${q}`).then((r) => r.json()).then(setData).catch(() => {});
  }, [group, cityId]);

  const totalFree = data?.results?.reduce((s: number, c: any) => s + c.banks.reduce((x: number, b: any) => x + b.totalFree, 0), 0) ?? "–";

  return (
    <div>
      <section className="hero">
        <span className="drop">🩸</span>
        <h1>An empty drop is a life waiting. <em>Fill it.</em></h1>
        <p className="muted" style={{ maxWidth: 640, margin: "0 auto", fontSize: "1.02rem" }}>
          In Sindh, someone is waiting right now. Search free, paid and exchange blood —
          nearest city first — and request it from your own account.
        </p>
        <p style={{ marginTop: 14 }}>
          <strong style={{ color: "var(--crimson)", fontSize: "1.3rem" }}>{totalFree}</strong>
          <span className="muted"> free units ready across Sindh right now</span>
        </p>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2 style={{ textAlign: "center", marginTop: 4 }}>Which blood group do you need?</h2>
        <div className="chips">
          {GROUPS.map((g) => (
            <button key={g} className={`chip ${group === g ? "selected" : ""}`} onClick={() => setGroup(g)} aria-pressed={group === g}>{g}</button>
          ))}
        </div>
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <label htmlFor="city">Your city (results start nearest to you)</label>
          <select id="city" value={cityId} onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Select your city…</option>
            {data?.cities?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </section>

      {!data && <p className="muted" style={{ textAlign: "center" }}>Loading blood banks…</p>}
      {data?.results?.map((c: any) => (
        <section key={c.cityId} style={{ marginTop: 26 }}>
          <h2>{c.city} {c.distanceKm > 0 && <span className="muted" style={{ fontSize: ".9rem" }}>· ~{c.distanceKm} km away</span>}</h2>
          <div className="grid grid-2">
            {c.banks.map((b: any) => (
              <article key={b.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px" }}>{b.name}</h3>
                    <p className="muted" style={{ margin: 0 }}>{b.address}<br />{b.phone} · {b.hours}</p>
                  </div>
                  <span className="tag red">{b.totalFree} free units</span>
                </div>
                {b.selected && (
                  <div style={{ background: "var(--crimson-light)", borderRadius: 12, padding: "12px 14px", margin: "14px 0", fontFamily: "system-ui" }}>
                    <strong>{group} at this branch:</strong>{" "}
                    <span className="pill-free">{b.selected.free} Free</span>{" "}
                    · {b.selected.paid} Paid{b.selected.paid > 0 ? ` (Rs ${b.selected.paidPrice}/unit)` : ""} · {b.selected.exchange} Exchange
                    <div style={{ marginTop: 10 }}>
                      <Link className="btn btn-primary btn-sm" href={`/register?bank=${b.id}&group=${group}`}>Request {group}</Link>
                    </div>
                  </div>
                )}
                <details>
                  <summary style={{ cursor: "pointer", fontFamily: "system-ui", fontSize: ".9rem" }}>All blood groups at this branch</summary>
                  <table>
                    <thead><tr><th>Group</th><th>Free</th><th>Paid</th><th>Exchange</th><th>Price / unit</th></tr></thead>
                    <tbody>
                      {b.groups.map((g: any) => (
                        <tr key={g.group} style={g.group === group ? { background: "#fdf1f3", fontWeight: 600 } : undefined}>
                          <td>{g.group}</td>
                          <td>{g.free > 0 ? <span className="pill-free">{g.free}</span> : <span className="pill-zero">0</span>}</td>
                          <td>{g.paid}</td><td>{g.exchange}</td><td>{g.paid > 0 ? `Rs ${g.paidPrice}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="card" style={{ marginTop: 30, textAlign: "center", background: "linear-gradient(160deg,#c21847,#7f0e2e)", color: "#fff" }}>
        <h2 style={{ margin: "6px 0" }}>GIVE BLOOD. GIVE TIME BACK.</h2>
        <p style={{ opacity: .92 }}>Time with a mother. Time to grow up. Fifteen minutes of yours can become years for someone else.</p>
        <p>
          <Link className="btn" href="/register">Become a donor</Link>{" "}
          <Link className="btn" href="/login" style={{ background: "transparent", color: "#fff", border: "2px solid #fff", boxShadow: "none" }}>Sign in</Link>
        </p>
      </section>
    </div>
  );
}
