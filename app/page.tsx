"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Drop from "@/components/Drop";

const GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
type Mode = "FREE" | "PAID" | "EXCHANGE";
const MODE_LABEL: Record<Mode, string> = { FREE: "Free", PAID: "Paid", EXCHANGE: "Exchange" };

const STORIES = [
  {
    quote: "The nurse just said, “the blood has arrived.” I never learned the donor’s name. I say a prayer for them every single night.",
    by: "A mother in Karachi",
  },
  {
    quote: "My son needs blood every few weeks, for thalassemia. Knowing which bank has his group before we even leave home changed everything for us.",
    by: "A father in Sukkur",
  },
  {
    quote: "I don’t know whose blood is running in me now. I only know I got to go home to my kids. Whoever you are — thank you.",
    by: "An accident patient in Hyderabad",
  },
];

const JOURNEY = [
  {
    title: "It starts with a pinprick",
    text: "A tiny drop on a fingertip. Fifteen quiet minutes in a chair. That’s all it asks of you — a moment so small you’ll forget it by lunch.",
    icon: (
      <svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="#A4133C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 7 C17 7 7.5 20 7.5 28 a9.5 9.5 0 0 0 19 0 C26.5 20 17 7 17 7 Z" />
        <path d="M40 5 L29.5 15.5" />
        <circle cx="41.5" cy="3.8" r="2.4" />
        <path d="M31 24.5 L38.5 32" opacity=".55" />
      </svg>
    ),
  },
  {
    title: "Then it travels — bag to heart",
    text: "Sealed, tested, and carried to the one ward in Sindh where a heart is beating a little weaker tonight. Your drop becomes the reason it steadies.",
    icon: (
      <svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="#A4133C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="13" y="4.5" width="22" height="39" rx="4.5" />
        <path d="M20.5 39.5 h7" />
        <path d="M24 29.8 C24 29.8 17.3 24.9 17.3 20.9 C17.3 18.6 19 17.2 20.6 17.2 C22.1 17.2 23.4 18.1 24 19.4 C24.6 18.1 25.9 17.2 27.4 17.2 C29 17.2 30.7 18.6 30.7 20.9 C30.7 24.9 24 29.8 24 29.8 Z" fill="#A4133C" stroke="none" />
      </svg>
    ),
  },
  {
    title: "And a life goes on",
    text: "A mother goes home to her children. A grandfather makes it to another Eid. Someone’s whole world keeps turning — because a drop that was empty is full again.",
    icon: (
      <svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="#A4133C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M24 4.5 C24 4.5 10.5 21 10.5 30 a13.5 13 0 0 0 27 0 C37.5 21 24 4.5 24 4.5 Z" fill="#FBE3E1" />
        <circle cx="19.5" cy="29" r="1.7" fill="#A4133C" stroke="none" />
        <circle cx="28.5" cy="29" r="1.7" fill="#A4133C" stroke="none" />
        <path d="M18.5 34.5 Q24 39.5 29.5 34.5" />
      </svg>
    ),
  },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function Home() {
  const router = useRouter();
  const [group, setGroup] = useState("O+");
  const [cityId, setCityId] = useState<number | "">("");
  const [data, setData] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [scrollFill, setScrollFill] = useState(0.12);
  const [boost, setBoost] = useState(false);
  const [expandedBank, setExpandedBank] = useState<number | null>(null);

  // Request modal state
  const [modal, setModal] = useState<{ bank: any; group: string; mode: Mode } | null>(null);
  const [mUnits, setMUnits] = useState(1);
  const [mUrgency, setMUrgency] = useState("Normal");
  const [mHospital, setMHospital] = useState("");
  const [mBusy, setMBusy] = useState(false);
  const [mErr, setMErr] = useState("");
  const [mDone, setMDone] = useState(false);

  // Session (for the Request button behaviour)
  useEffect(() => {
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((j) => setMe(j?.user || null)).catch(() => {});
  }, []);

  // Mascot fills as the visitor scrolls
  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollFill(Math.min(0.9, (window.scrollY / max) * 1.35));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const citiesById = useMemo(() => {
    const m = new Map<number, any>();
    (data?.cities || []).forEach((c: any) => m.set(c.id, c));
    return m;
  }, [data]);

  useEffect(() => {
    const q = new URLSearchParams({ group });
    if (cityId) {
      const c = citiesById.get(Number(cityId));
      if (c) { q.set("lat", String(c.lat)); q.set("lng", String(c.lng)); }
      q.set("cityId", String(cityId));
    }
    fetch(`/api/public?${q}`).then((r) => r.json()).then(setData).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, cityId, data?.cities?.length]);

  const stats = data?.stats;
  const results: any[] = data?.results || [];
  const sortedCities = useMemo(() => [...results].sort((a, b) => a.city.localeCompare(b.city)), [data]);
  const selCity = results.find((c: any) => c.cityId === Number(cityId)) || results[0];
  const fill = boost ? 1 : scrollFill;

  function startRequest(bank: any, g: string, mode: Mode) {
    if (me?.role === "PATIENT") {
      setModal({ bank, group: g, mode });
      setMUnits(1);
      setMUrgency("Normal");
      setMHospital(me.hospital || "");
      setMErr("");
      setMDone(false);
    } else if (me) {
      router.push("/dashboard");
    } else {
      router.push(`/register?bank=${bank.id}&group=${g}&mode=${mode}`);
    }
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setMBusy(true); setMErr("");
    try {
      const r = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankId: Number(modal.bank.id), bloodGroup: modal.group, mode: modal.mode, units: Number(mUnits), hospital: mHospital, urgency: mUrgency }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not send your request. Please try again.");
      setMDone(true);
    } catch (err: any) {
      setMErr(err.message || "Could not send your request. Please try again.");
    } finally {
      setMBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation || !data?.cities?.length) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let best: any = null; let bestKm = Infinity;
        data.cities.forEach((c: any) => {
          const km = haversineKm(pos.coords.latitude, pos.coords.longitude, c.lat, c.lng);
          if (km < bestKm) { bestKm = km; best = c; }
        });
        if (best) setCityId(best.id);
      },
      () => {}
    );
  }

  return (
    <div>
      {/* 1 — Hero */}
      <section className="hp-hero">
        <div className="hp-hero-left">
          <p className="hp-eyebrow">SINDH BLOOD NETWORK</p>
          <h1 className="hp-h1">An empty drop is a life waiting. Fill it.</h1>
          <p className="hp-lede">
            Right now, families across Sindh — in Karachi, Sukkur, Ghotki, Hyderabad — are going hospital to
            hospital looking for one thing: a blood group that matches someone they love. Here you can see, city by
            city, where free blood is waiting — and ask for it in less than a minute. No middlemen. Just people
            keeping each other alive.
          </p>
          <p className="hp-live">
            <span className="hp-live-dot" />
            <strong>
              {stats?.pendingRequests ?? "–"} requests are waiting right now · {stats?.openDemand ?? "–"} units still needed across Sindh
            </strong>
          </p>
          <div className="hp-hero-btns">
            <a className="btn btn-primary" href="#search">Find blood near me</a>
            <button
              className="btn"
              onMouseEnter={() => setBoost(true)}
              onMouseLeave={() => setBoost(false)}
              onClick={() => router.push("/register?role=donor")}
            >
              I want to donate
            </button>
          </div>
        </div>
        <div className="hp-hero-right">
          <Drop fill={fill} size={230} />
          <p className="hp-mascot-caption">Empty, and a little scared. Too many shelves in Sindh look like this tonight.</p>
          <div className="hp-fill-track"><div className="hp-fill-bar" style={{ width: `${Math.round(fill * 100)}%` }} /></div>
          <p className="hp-fill-note">Scroll, hover, or tap “I want to donate” — watch it fill.</p>
        </div>
      </section>

      {/* 2 — Waiting */}
      <section className="hp-waiting">
        <div className="hp-waiting-body">
          <h2 className="hp-h2">In Sindh, someone is waiting right now.</h2>
          <p>
            Not a statistic from somewhere else — these are this network’s own numbers, counted live from the
            requests and shelves of the 12 blood banks in 8 Sindh cities right now. Behind every “waiting” is a family
            refreshing a phone, hoping a stranger says yes.
          </p>
          <div className="hp-tiles">
            <div className="hp-tile t-cream"><div className="lbl">Requests waiting now</div><div className="num">{stats?.pendingRequests ?? "–"}</div></div>
            <div className="hp-tile t-pink"><div className="lbl">Units still needed</div><div className="num">{stats?.openDemand ?? "–"}</div></div>
            <div className="hp-tile t-sand"><div className="lbl">Free units ready to give</div><div className="num">{stats?.totalFree ?? "–"}</div></div>
            <div className="hp-tile t-mint"><div className="lbl">Requests already fulfilled</div><div className="num">{stats?.fulfilledRequests ?? "–"}</div></div>
          </div>
          <p className="hp-smallprint">
            {stats?.totalDonations ?? "–"} donations recorded so far by {stats?.donorCount ?? "–"} registered donors. Every
            fulfilled request started exactly where you are now — with someone deciding to look.
          </p>
        </div>
        <img className="cover" src="/cover.jpg" alt="A young thalassemia patient smiling with the male doctor holding his hand during a transfusion" />
      </section>

      {/* 3 — Search */}
      <section className="hp-search" id="search">
        <h3 className="hp-h3">Which blood group do you need?</h3>
        <div className="hp-gchips">
          {GROUPS.map((g) => (
            <button key={g} className={`hp-gchip ${group === g ? "selected" : ""}`} onClick={() => setGroup(g)} aria-pressed={group === g}>{g}</button>
          ))}
        </div>
        <p className="hp-choose-label">Or choose your city</p>
        <div className="hp-loc-row">
          <button className="btn btn-primary" onClick={useMyLocation}>Use my location</button>
          <div className="hp-select-wrap">
            <select value={selCity?.cityId ?? ""} onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : "")} aria-label="Your city">
              <option value="">Select your city...</option>
              {(data?.cities || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <span className="hp-helper">Share your location or pick a city so we can show the nearest blood first.</span>
        </div>
      </section>

      {!data && <p className="muted" style={{ textAlign: "center", marginTop: 22 }}>Loading blood banks…</p>}

      {/* 4 — Cities */}
      {data && (
        <>
          <h3 className="hp-h3 hp-section-title">Cities in Sindh</h3>
          <div className="hp-city-grid">
            {sortedCities.map((c: any) => {
              const freeTotal = c.banks.reduce((s: number, b: any) => s + b.totalFree, 0);
              const isSel = selCity && c.cityId === selCity.cityId;
              return (
                <button key={c.cityId} className={`hp-city-card ${isSel ? "sel" : ""}`} onClick={() => setCityId(c.cityId)}>
                  <div className="hp-city-name">{c.city}</div>
                  <div className="hp-city-sub">{c.banks.length} blood bank{c.banks.length === 1 ? "" : "s"}</div>
                  <div className="hp-city-line">
                    <span className="free">{freeTotal} free units</span>
                    {c.openDemand > 0 && <> · <span className="need">{c.openDemand} needed</span></>}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 5 — Banks of the selected city */}
      {selCity && (
        <>
          <h3 className="hp-h3 hp-section-title">Blood banks in {selCity.city}</h3>
          <div className="hp-bank-grid">
            {selCity.banks.map((b: any) => {
              const sel = b.selected || { group, free: 0, paid: 0, paidPrice: 0, exchange: 0 };
              const open = expandedBank === b.id;
              return (
                <article key={b.id} className="hp-bank">
                  <div className="hp-bank-top">
                    <h4 className="hp-bank-name">{b.name}</h4>
                    <span className="hp-bank-badge">{b.totalFree} free units</span>
                  </div>
                  <p className="hp-bank-meta">{b.address}<br />{b.phone} · {b.hours}</p>
                  <div className="hp-bank-inner">
                    <span className="lbl">{group} at this branch</span>
                    <div className="hp-sel-row">
                      <div className="hp-sel-box free"><div className="num">{sel.free}</div><div className="cap">FREE</div></div>
                      <div className="hp-sel-box paid"><div className="num">{sel.paid}</div><div className="cap">Paid · Rs {sel.paidPrice}/unit</div></div>
                      <div className="hp-sel-box exch"><div className="num">{sel.exchange}</div><div className="cap">Exchange</div></div>
                    </div>
                  </div>
                  <div className="hp-bank-btns">
                    <button className="btn btn-primary btn-sm" onClick={() => startRequest(b, group, "FREE")}>Request free {group}</button>
                    <button className="btn btn-sm" onClick={() => startRequest(b, group, "PAID")}>Buy {group} · Rs {sel.paidPrice}</button>
                    <button className="btn btn-sm" onClick={() => startRequest(b, group, "EXCHANGE")}>Exchange {group}</button>
                  </div>
                  <p className="hp-bank-note">Requests are made from a free recipient account — it keeps the patient’s details and request history in one place.</p>
                  <button className="hp-expander-btn" onClick={() => setExpandedBank(open ? null : b.id)} aria-expanded={open}>
                    {open ? "▼" : "▶"} All blood groups at this branch
                  </button>
                  {open && (
                    <div className="table-scroll" style={{ marginTop: 10 }}>
                      <table>
                        <thead><tr><th>Group</th><th>Free</th><th>Paid</th><th>Price</th><th>Exchange</th><th></th></tr></thead>
                        <tbody>
                          {b.groups.map((g: any) => (
                            <tr key={g.group} className={g.group === group ? "hp-row-sel" : ""}>
                              <td><strong>{g.group}</strong></td>
                              <td>{g.free > 0 ? <span className="pill-free">{g.free}</span> : <span className="pill-zero">0</span>}</td>
                              <td>{g.paid}</td>
                              <td>{g.paid > 0 ? `Rs ${g.paidPrice}` : "—"}</td>
                              <td>{g.exchange}</td>
                              <td><button className="hp-row-action" onClick={() => startRequest(b, g.group, "FREE")}>Request</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* 6 — Journey */}
      <section className="hp-journey">
        <h2>Fifteen minutes. Three heartbeats.</h2>
        <p className="sub">This is the whole journey of one donation — yours could start it today.</p>
        <svg className="hp-ecg-line" viewBox="0 0 1200 42" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 24 H300 L322 24 L332 10 L344 38 L354 24 H560 L582 24 L592 12 L604 36 L614 24 H840 L862 24 L872 10 L884 38 L894 24 H1200" fill="none" stroke="#EAD9CF" strokeWidth="2.5" />
          <path d="M300 24 L322 24 L332 10 L344 38 L354 24 H400" fill="none" stroke="#C01430" strokeWidth="2.5" />
        </svg>
        <div className="hp-jgrid">
          {JOURNEY.map((s, i) => (
            <div key={s.title} className="hp-jcard">
              <span className="hp-jnum">{i + 1}</span>
              {s.icon}
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7 — Stories */}
      <div className="hp-stories-head">
        <h2>The people on the other side of a drop</h2>
        <span className="hp-badge">Sample stories — written to show why this matters</span>
      </div>
      <section className="hp-story-grid">
        {STORIES.map((s) => (
          <article key={s.by} className="hp-story">
            <span className="hp-quote-mark">“</span>
            <p className="hp-quote">{s.quote}</p>
            <p className="hp-attrib">— {s.by}</p>
          </article>
        ))}
      </section>

      {/* 8 — Closing banner */}
      <section className="hp-banner">
        <div>
          <div className="l1">GIVE BLOOD.</div>
          <div className="l2">GIVE TIME BACK.</div>
          <p>Time with a mother. Time to grow up. Time that a hospital ward cannot manufacture — but you are carrying it right now.</p>
          <div className="hp-banner-btns">
            <Link className="btn hp-btn-white" href="/register?role=donor">Donate blood</Link>
            <a className="btn hp-btn-ghost" href="#search">Find blood</a>
          </div>
        </div>
        <svg className="hp-banner-art" width="250" height="190" viewBox="0 0 260 200" aria-hidden="true">
          <defs>
            <linearGradient id="banner-drop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0567A" />
              <stop offset="55%" stopColor="#D81F47" />
              <stop offset="100%" stopColor="#A30E30" />
            </linearGradient>
          </defs>
          <ellipse cx="105" cy="184" rx="52" ry="7" fill="rgba(0,0,0,.18)" />
          <path d="M105 12 C105 12 48 84 48 122 a57 55 0 0 0 114 0 C162 84 105 12 105 12 Z" fill="url(#banner-drop)" />
          <ellipse cx="82" cy="112" rx="9" ry="20" fill="#ffffff" opacity="0.38" transform="rotate(-16 82 112)" />
          <g>
            <rect x="162" y="82" width="64" height="24" rx="4" fill="rgba(0,0,0,.15)" />
            <rect x="182" y="62" width="24" height="64" rx="4" fill="rgba(0,0,0,.15)" />
            <rect x="158" y="78" width="64" height="24" rx="4" fill="#ffffff" />
            <rect x="178" y="58" width="24" height="64" rx="4" fill="#ffffff" />
          </g>
        </svg>
      </section>

      {/* 9 — Footer block */}
      <section className="hp-foot">
        <Drop fill={1} size={34} />
        <svg className="hp-foot-hairline" viewBox="0 0 560 26" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 13 H238 L250 13 L257 5 L266 21 L273 13 H560" fill="none" stroke="#E7D5C8" strokeWidth="1.5" />
          <path d="M250 13 L257 5 L266 21 L273 13" fill="none" stroke="#C01430" strokeWidth="1.5" />
        </svg>
        <p className="hp-foot-quote">“The blood you donate gives someone another chance at life. One day that someone may be a close relative, a friend, a loved one — or even you.”</p>
        <p className="hp-foot-small">Blood Bank Platform · Sindh, Pakistan · In an emergency, always call the hospital and the branch directly.</p>
        <p className="hp-foot-tag">Give blood. Give time back.</p>
      </section>

      {/* Request modal (logged-in patients) */}
      {modal && (
        <div className="hp-modal-overlay" onClick={() => setModal(null)}>
          <div className="hp-modal" role="dialog" aria-modal="true" aria-label="Request blood" onClick={(e) => e.stopPropagation()}>
            {mDone ? (
              <div style={{ textAlign: "center" }}>
                <Drop fill={1} size={72} />
                <h3>Request sent</h3>
                <p className="muted" style={{ fontFamily: "system-ui" }}>
                  Your {modal.group} request ({MODE_LABEL[modal.mode]}) is with {modal.bank.name}. They can see it now —
                  watch its progress in your dashboard.
                </p>
                <p style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link className="btn btn-primary" href="/dashboard">View my requests</Link>
                  <button className="btn" onClick={() => setModal(null)}>Keep looking</button>
                </p>
              </div>
            ) : (
              <>
                <h3>Request {modal.group} — {MODE_LABEL[modal.mode]}</h3>
                <p className="muted" style={{ marginTop: 0, fontFamily: "system-ui" }}>From {modal.bank.name}</p>
                <form onSubmit={submitRequest}>
                  <div className="hp-form-grid">
                    <div>
                      <label>Mode</label>
                      <div className="mode-seg" role="radiogroup" aria-label="Request mode">
                        {(["FREE", "PAID", "EXCHANGE"] as Mode[]).map((m) => (
                          <button key={m} type="button" role="radio" aria-checked={modal.mode === m} className={modal.mode === m ? "selected" : ""} onClick={() => setModal({ ...modal, mode: m })}>
                            {MODE_LABEL[m]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label>Units</label>
                      <input type="number" min={1} value={mUnits} onChange={(e) => setMUnits(Number(e.target.value))} required />
                    </div>
                    <div>
                      <label>Urgency</label>
                      <select value={mUrgency} onChange={(e) => setMUrgency(e.target.value)}>
                        <option>Normal</option><option>Urgent</option><option>Critical</option>
                      </select>
                    </div>
                    <div>
                      <label>Hospital</label>
                      <input value={mHospital} onChange={(e) => setMHospital(e.target.value)} placeholder="Where is the patient admitted?" />
                    </div>
                  </div>
                  {mErr && <p className="err" style={{ marginTop: 12 }}>{mErr}</p>}
                  <p style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                    <button className="btn btn-primary" type="submit" disabled={mBusy}>{mBusy ? "Sending…" : "Send request"}</button>
                    <button className="btn" type="button" onClick={() => setModal(null)}>Cancel</button>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
