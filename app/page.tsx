"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Drop from "@/components/Drop";
import Ecg from "@/components/Ecg";

const GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const STORIES = [
  {
    title: "A mother in Karachi",
    text: "After a difficult delivery at Civil Hospital, two units of O+ stood between a young mother and going home to her newborn. A donor she will never meet gave them — and she went home.",
    meta: "Karachi · O+ · Sample story",
  },
  {
    title: "A thalassemia father in Sukkur",
    text: "His little boy needs a transfusion every few weeks, for life. Knowing the Sukkur centre keeps B+ on the shelf means the family plans birthdays, not emergencies.",
    meta: "Sukkur · B+ · Sample story",
  },
  {
    title: "An accident patient in Hyderabad",
    text: "A highway accident, a critical hour, and AB− — one of the rarest groups. The exchange programme at Hyderabad City Blood Bank found a match the same night.",
    meta: "Hyderabad · AB− · Sample story",
  },
];

export default function Home() {
  const router = useRouter();
  const [group, setGroup] = useState("O+");
  const [cityId, setCityId] = useState<number | "">("");
  const [data, setData] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [scrollFill, setScrollFill] = useState(0.12);
  const [boost, setBoost] = useState(false);
  const journeyRef = useRef<HTMLDivElement>(null);
  const [journeyLive, setJourneyLive] = useState(false);

  // Session (for the Request button behaviour)
  useEffect(() => {
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((j) => setMe(j?.user || null)).catch(() => {});
  }, []);

  // Mascot fills as the visitor scrolls
  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollFill(0.12 + Math.min(0.78, (window.scrollY / max) * 1.4));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ECG journey draws when it scrolls into view
  useEffect(() => {
    const el = journeyRef.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setJourneyLive(true)), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
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

  const totalFree = data?.results?.reduce((s: number, c: any) => s + c.banks.reduce((x: number, b: any) => x + b.totalFree, 0), 0);
  const branchCount = data?.results?.reduce((s: number, c: any) => s + c.banks.length, 0);
  const fill = boost ? 1 : scrollFill;

  function donateNow() {
    setBoost(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => router.push("/register"), reduced ? 60 : 750);
  }

  const requestHref = (b: any) => (me ? "/dashboard" : `/register?bank=${b.id}&group=${group}`);

  return (
    <div>
      {/* 1 — Hero */}
      <section className="hero">
        <div className="mascot-wrap" onMouseEnter={() => setBoost(true)} onMouseLeave={() => setBoost(false)} onClick={donateNow} title="I want to donate">
          <Drop fill={fill} size={132} />
        </div>
        <h1>An empty drop is a life waiting. <em>Fill it.</em></h1>
        <p className="muted" style={{ maxWidth: 640, margin: "0 auto", fontSize: "1.02rem" }}>
          In Sindh, someone is waiting right now. Search free, paid and exchange blood —
          nearest city first — and request it from your own account.
        </p>
        <p style={{ marginTop: 18 }}>
          <button className="btn btn-primary" onClick={donateNow}>❤️ I want to donate</button>{" "}
          <a className="btn" href="#find">Find blood near me</a>
        </p>
        <div className="stat-chips">
          <span className="stat-chip"><strong>{totalFree ?? "–"}</strong> free units ready</span>
          <span className="stat-chip"><strong>{branchCount ?? "–"}</strong> branches</span>
          <span className="stat-chip"><strong>{data?.cities?.length ?? "–"}</strong> cities across Sindh</span>
          {data?.originCity && <span className="stat-chip">Showing nearest to <strong>{data.originCity}</strong> first</span>}
        </div>
      </section>

      {/* 2 — Search */}
      <section className="card tilt" id="find" style={{ marginTop: 22 }}>
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

      {!data && <p className="muted" style={{ textAlign: "center", marginTop: 22 }}>Loading blood banks…</p>}
      {data?.results?.map((c: any) => (
        <section key={c.cityId} style={{ marginTop: 26 }}>
          <h2>{c.city} {c.distanceKm > 0 && <span className="muted" style={{ fontSize: ".9rem" }}>· ~{c.distanceKm} km away</span>}</h2>
          <div className="grid grid-2">
            {c.banks.map((b: any) => (
              <article key={b.id} className="card tilt">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px" }}>{b.name}</h3>
                    <p className="muted" style={{ margin: 0 }}>{b.address}<br />📞 {b.phone} · 🕘 {b.hours}</p>
                  </div>
                  <span className="free-badge">{b.totalFree} free units</span>
                </div>
                {b.selected && (
                  <div style={{ background: "var(--crimson-light)", borderRadius: 14, padding: "12px 14px", margin: "14px 0 4px", fontFamily: "system-ui" }}>
                    <strong>{group} at this branch:</strong>{" "}
                    <span className="pill-free">{b.selected.free} Free</span>{" "}
                    · {b.selected.paid} Paid{b.selected.paid > 0 ? ` (Rs ${b.selected.paidPrice}/unit)` : ""} · {b.selected.exchange} Exchange
                    <div style={{ marginTop: 10 }}>
                      <Link className="btn btn-primary btn-sm" href={requestHref(b)}>
                        {me?.role === "PATIENT" ? `Request ${group} at this branch` : `Request ${group}`}
                      </Link>
                    </div>
                  </div>
                )}
                <div className="stock-grid">
                  {b.groups.map((g: any) => (
                    <div key={g.group} className={`stock-cell ${g.group === group ? "sel" : ""}`}>
                      <div className="g">{g.group}</div>
                      <div className="rowline"><span>Free</span>{g.free > 0 ? <span className="pill-free">{g.free}</span> : <span className="pill-zero">0</span>}</div>
                      <div className="rowline"><span>Paid</span><span>{g.paid}{g.paid > 0 ? ` · Rs ${g.paidPrice}` : ""}</span></div>
                      <div className="rowline"><span>Exch.</span><span>{g.exchange}</span></div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* 3 — Waiting */}
      <section className="card waiting" style={{ marginTop: 34 }}>
        <img className="cover" src="/cover.jpg" alt="A young thalassemia patient smiling with the male doctor holding his hand during a transfusion" />
        <div className="waiting-body">
          <h2 style={{ marginTop: 0 }}>In Sindh, someone is waiting right now</h2>
          <p>
            Behind every unit on a shelf is a person counting days — a child with thalassemia, a mother after
            surgery, a father after an accident. These are this platform's own live numbers:
          </p>
          <div className="grid grid-3" style={{ gap: 10, textAlign: "center" }}>
            <div><div className="big-num">{totalFree ?? "–"}</div><div className="muted">free units on shelves</div></div>
            <div><div className="big-num">{branchCount ?? "–"}</div><div className="muted">branches ready to help</div></div>
            <div><div className="big-num">{data?.cities?.length ?? "–"}</div><div className="muted">cities covered</div></div>
          </div>
          <p style={{ marginTop: 16 }}>
            <Link className="btn btn-primary" href="/register">Become a donor</Link>
          </p>
        </div>
      </section>

      {/* 4 — Journey */}
      <section style={{ marginTop: 34 }} ref={journeyRef}>
        <h2 style={{ textAlign: "center" }}>Fifteen minutes. Three heartbeats.</h2>
        <div className={journeyLive ? "ecg-live" : ""} onMouseEnter={() => setJourneyLive(true)}>
          <Ecg height={58} />
        </div>
        <div className="journey-steps">
          {[
            ["Register", "Create your free donor account in a minute — your group, your city, that's all we ask."],
            ["Donate at a branch", "Walk into any of the branches above, give fifteen minutes, and a small part of you stays behind to save a life."],
            ["Blood reaches the patient", "Your unit is tested, shelved, and matched to a waiting patient near you — often the very same week."],
          ].map(([t, d], i) => (
            <div key={t} className="card tilt">
              <div className="step-num">{i + 1}</div>
              <h3 style={{ margin: "2px 0 6px" }}>{t}</h3>
              <p className="muted" style={{ margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 — Stories */}
      <section style={{ marginTop: 34 }}>
        <h2 style={{ textAlign: "center" }}>Stories from the circle <span className="tag amber">Sample stories</span></h2>
        <div className="grid grid-3">
          {STORIES.map((s) => (
            <article key={s.title} className="card tilt story-card">
              <h3 style={{ marginTop: 2 }}>{s.title}</h3>
              <p style={{ margin: "0 0 10px" }}>{s.text}</p>
              <p className="muted" style={{ margin: 0 }}>{s.meta}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 6 — Closing banner */}
      <section className="closing-banner" style={{ marginTop: 36 }}>
        <h2>GIVE BLOOD. <span className="gold">GIVE TIME BACK.</span></h2>
        <p>Time with a mother. Time to grow up. Fifteen minutes of yours can become years for someone else.</p>
        <p style={{ marginTop: 18 }}>
          <Link className="btn btn-gold" href="/register">Join Free — become a donor</Link>{" "}
          <Link className="btn btn-outline-light" href="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
