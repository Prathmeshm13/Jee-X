import { useState, useEffect, useRef, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Flame, Lightbulb, ArrowRight, Bot, AlertTriangle, MonitorCheck, Microscope, BarChart3, FileText, Trophy, TrendingUp, Target, CheckCircle2, BookOpen, Sparkles, Zap, User } from "lucide-react";
import { INK, INK_2, PAPER, PAPER_LINE, SLATE, AMBER, GRAPHITE, WHITE, PHYSICS, CHEM, MATHS, GOOD, BAD, fontDisplay, fontMono } from "./ui.js";

/* ================================================================
   DATA — Questions, Fun Facts, Trivia
   ================================================================ */
const HERO_QUESTIONS = [
  { q: "The de Broglie wavelength of an electron accelerated through 100V is approximately:", ops: ["0.123 nm", "1.23 nm", "0.0123 nm", "12.3 nm"], ans: 0, year: "JEE Advanced 2019", funFact: "When this was asked, only 14% of students got it right. The concept was proposed by Louis de Broglie in his PhD thesis — the shortest PhD thesis to ever win a Nobel Prize.", chapter: "Modern Physics", diff: "Medium" },
  { q: "The number of sp² hybridized carbon atoms in Aspirin (C₉H₈O₄) is:", ops: ["6", "7", "9", "3"], ans: 1, year: "JEE Advanced 2023", funFact: "Aspirin was originally derived from willow bark, used medicinally for over 3,500 years — and JEE still expects you to know its structure.", chapter: "Organic Chemistry", diff: "Hard" },
  { q: "If f(x) = x·[x], where [·] is the greatest integer function, then f(x) is:", ops: ["Continuous at x=2", "Discontinuous at x=2", "Differentiable at x=2", "None of these"], ans: 1, year: "IIT-JEE 1995", funFact: "This question appeared around the time Sundar Pichai was preparing for the IIT entrance. He went on to top his batch at IIT Kharagpur.", chapter: "Limits & Continuity", diff: "Medium" },
  { q: "A charged particle moves in a helical path. It must be under:", ops: ["Electric field only", "Magnetic field only", "Both E and B fields", "Magnetic field with velocity at angle"], ans: 3, year: "JEE Main 2024", funFact: "This is the exact principle behind the Large Hadron Collider at CERN — the machine that confirmed the Higgs boson.", chapter: "Magnetic Effects", diff: "Easy" },
  { q: "The compound that does NOT show optical isomerism:", ops: ["[Co(en)₃]³⁺", "[Co(en)₂Cl₂]⁺", "[Co(NH₃)₆]³⁺", "[Cr(ox)₃]³⁻"], ans: 2, year: "JEE Advanced 2018", funFact: "Coordination chemistry has appeared in every JEE Advanced paper since 2010 — reliable marks once you master it.", chapter: "Coordination Compounds", diff: "Hard" },
  { q: "The value of lim(n→∞) (1 + 1/n)ⁿ equals:", ops: ["1", "∞", "e", "0"], ans: 2, year: "IIT-JEE 1998", funFact: "Euler's number 'e' shows up in compound interest, population growth, and radioactive decay alike.", chapter: "Limits", diff: "Easy" },
  { q: "The nuclear reaction ²H + ²H → ³He + n is an example of:", ops: ["Nuclear fission", "Nuclear fusion", "Radioactive decay", "Artificial transmutation"], ans: 1, year: "JEE Main 2022", funFact: "This reaction powers the Sun, which converts roughly 600 million tonnes of hydrogen every second.", chapter: "Nuclear Physics", diff: "Easy" },
  { q: "Benzene reacts with CH₃Cl/AlCl₃. This reaction is called:", ops: ["Wurtz reaction", "Friedel-Crafts alkylation", "Kolbe reaction", "Sandmeyer reaction"], ans: 1, year: "IIT-JEE 2001", funFact: "Friedel and Crafts discovered this in 1877. It is among the most frequently asked named reactions in JEE history.", chapter: "Organic Chemistry", diff: "Easy" },
  { q: "A matrix A satisfies A² = I. Then A is called:", ops: ["Nilpotent", "Idempotent", "Involutory", "Orthogonal"], ans: 2, year: "JEE Advanced 2020", funFact: "Matrices contribute 8–12 marks most years and are among the most formulaic topics in the paper.", chapter: "Matrices", diff: "Medium" },
  { q: "The Gibbs free energy change for a spontaneous process is:", ops: ["Positive", "Zero", "Negative", "Can be anything"], ans: 2, year: "JEE Main 2023", funFact: "Josiah Willard Gibbs' work was so far ahead of its time that few contemporaries fully understood it.", chapter: "Thermodynamics", diff: "Easy" },
];

const SUBJECTS = ["Physics", "Chemistry", "Mathematics"];
const SUBJECT_COLOR = { Physics: PHYSICS, Chemistry: CHEM, Mathematics: MATHS };
const NTA_COLORS = { notVisited: "#c0c0c0", notAnswered: "#e74c3c", answered: "#27ae60", markedReview: "#9b59b6", answeredMarked: "#7d3c98" };
const diffColorMap = { Easy: GOOD, Medium: AMBER, Hard: BAD };

/* ================================================================
   STYLES (injected via <style> tag by useCrackJeeStyles)
   ================================================================ */
export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
@keyframes cj-fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes cj-slideLeft { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
@keyframes cj-pop { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes cj-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
.crackjee-root { font-family:'Inter', system-ui, sans-serif; background:${PAPER}; min-height:100vh; color:${GRAPHITE}; -webkit-font-smoothing:antialiased; }
.crackjee-root * { box-sizing:border-box; }
.crackjee-root h1,.crackjee-root h2,.crackjee-root h3,.crackjee-root h4 { font-family:${fontDisplay}; letter-spacing:-0.01em; }
.crackjee-root button { font-family:'Inter', sans-serif; }
.crackjee-root ::-webkit-scrollbar { width:8px; height:8px; }
.crackjee-root ::-webkit-scrollbar-track { background:transparent; }
.crackjee-root ::-webkit-scrollbar-thumb { background:${PAPER_LINE}; border-radius:4px; }
.cj-card-hover { transition:transform 0.15s ease, box-shadow 0.15s ease; }
.cj-card-hover:hover { transform:translateY(-3px); box-shadow:0 12px 30px rgba(16,24,43,0.08); }
@media (prefers-reduced-motion: reduce) { .crackjee-root *, .crackjee-root *::before { animation:none !important; transition:none !important; } }
`;

/* Injects the JeeX animation/font CSS once, app-wide. */
export function useCrackJeeStyles() {
  useEffect(() => {
    if (document.getElementById("crackjee-global-css")) return;
    const s = document.createElement("style");
    s.id = "crackjee-global-css";
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
  }, []);
}

/* Small reusable brand wordmark */
function Brand({ size = 20 }) {
  return <span style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: size, color: INK }}>Jee<span style={{ color: AMBER }}>X</span></span>;
}

/* ================================================================
   QUESTION CARD SLIDER — hero interactive card
   ================================================================ */
function QuestionSlider({ streak, setStreak, totalSolved, setTotalSolved }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [showFact, setShowFact] = useState(false);
  const current = HERO_QUESTIONS[idx % HERO_QUESTIONS.length];

  const handleSelect = (oi) => {
    if (revealed) return;
    setSelected(oi);
    setRevealed(true);
    setTotalSolved(p => p + 1);
    if (oi === current.ans) setStreak(p => p + 1); else setStreak(0);
    setTimeout(() => setShowFact(true), 400);
  };

  const handleNext = () => {
    setIdx(p => p + 1);
    setSelected(null);
    setRevealed(false);
    setShowFact(false);
  };

  const handleSkip = () => { setStreak(0); handleNext(); };
  const diffColor = diffColorMap[current.diff] || SLATE;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      {/* Streak + progress bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Flame size={16} color={streak > 0 ? AMBER : PAPER_LINE} fill={streak > 0 ? AMBER : "none"} />
          <span style={{ fontSize: 13, fontWeight: 600, color: streak > 0 ? GRAPHITE : SLATE }}>{streak > 0 ? `${streak} in a row` : "Start a streak"}</span>
        </div>
        <div style={{ fontSize: 12, color: SLATE, fontFamily: fontMono }}>
          {(idx % HERO_QUESTIONS.length) + 1}/{HERO_QUESTIONS.length} · {totalSolved} solved
        </div>
      </div>

      <div key={idx} style={{
        background: WHITE, borderRadius: 6, padding: "26px 24px",
        border: `1px solid ${revealed ? (selected === current.ans ? GOOD : BAD) : PAPER_LINE}`,
        boxShadow: "0 10px 30px rgba(16,24,43,0.06)", animation: "cj-slideLeft 0.35s ease",
      }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 3, background: "rgba(232,163,61,0.14)", color: "#9a6a1c", fontWeight: 600, fontFamily: fontMono }}>{current.year}</span>
          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 3, background: `${diffColor}18`, color: diffColor, fontWeight: 600 }}>{current.diff}</span>
          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 3, background: PAPER, color: SLATE, fontWeight: 500 }}>{current.chapter}</span>
        </div>

        <p style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 500, margin: "0 0 18px", color: GRAPHITE, fontFamily: fontDisplay }}>{current.q}</p>

        <div style={{ display: "grid", gap: 8 }}>
          {current.ops.map((op, oi) => {
            const isCorrect = oi === current.ans;
            const isSelected = oi === selected;
            let bg = PAPER, border = PAPER_LINE, textCol = GRAPHITE;
            if (revealed) {
              if (isCorrect) { bg = "rgba(46,125,79,0.08)"; border = GOOD; textCol = "#1F5C39"; }
              else if (isSelected) { bg = "rgba(180,64,42,0.08)"; border = BAD; textCol = "#92321E"; }
            } else if (isSelected) { bg = "rgba(232,163,61,0.1)"; border = AMBER; }
            return (
              <button key={oi} onClick={() => handleSelect(oi)} disabled={revealed}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 4, background: bg, border: `1px solid ${border}`, cursor: revealed ? "default" : "pointer", transition: "all 0.15s", textAlign: "left", fontSize: 14, color: textCol, fontWeight: isSelected || (revealed && isCorrect) ? 600 : 400 }}>
                <span style={{ width: 26, height: 26, borderRadius: 4, flexShrink: 0, background: revealed && isCorrect ? GOOD : revealed && isSelected ? BAD : isSelected ? AMBER : WHITE, color: (revealed && (isCorrect || isSelected)) || isSelected ? WHITE : SLATE, border: `1px solid ${revealed && isCorrect ? GOOD : revealed && isSelected ? BAD : isSelected ? AMBER : PAPER_LINE}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, fontFamily: fontMono }}>
                  {String.fromCharCode(65 + oi)}
                </span>
                {op}
              </button>
            );
          })}
        </div>

        {showFact && (
          <div style={{ marginTop: 16, padding: "13px 15px", borderRadius: 4, background: PAPER, borderLeft: `3px solid ${AMBER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#9a6a1c", marginBottom: 5, fontFamily: fontMono, letterSpacing: "0.04em" }}><Lightbulb size={13} /> DID YOU KNOW</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: SLATE, margin: 0 }}>{current.funFact}</p>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          {revealed ? (
            <button onClick={handleNext} style={{ width: "100%", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "12px", borderRadius: 4, background: INK, color: PAPER, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Next question <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSkip} style={{ width: "100%", padding: "12px", borderRadius: 4, background: "transparent", color: SLATE, border: `1px dashed ${PAPER_LINE}`, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Skip
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
        {HERO_QUESTIONS.map((_, i) => (
          <div key={i} style={{ width: i === idx % HERO_QUESTIONS.length ? 20 : 6, height: 6, borderRadius: 3, background: i === idx % HERO_QUESTIONS.length ? AMBER : i < idx % HERO_QUESTIONS.length ? GOOD : PAPER_LINE, transition: "all 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   ANIMATED COUNTER
   ================================================================ */
function AnimCounter({ end, suffix = "", prefix = "", dur = 1400 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    const steps = 40; const inc = end / steps; let cur = 0;
    const t = setInterval(() => { cur += inc; if (cur >= end) { setVal(end); clearInterval(t); } else setVal(Math.floor(cur)); }, dur / steps);
    return () => clearInterval(t);
  }, [started, end, dur]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ================================================================
   HOME PAGE — landing
   ================================================================ */
export function HomePage({ onStart, onDashboard, onBuddy, onFreeTest, onLogin, onLogout, isAuthenticated, streak, setStreak, totalSolved, setTotalSolved }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, []);
  const navGhost = { padding: "8px 14px", background: "transparent", border: `1px solid ${PAPER_LINE}`, borderRadius: 4, fontSize: 13.5, fontWeight: 600, cursor: "pointer", color: GRAPHITE };
  const navText = { padding: "8px 10px", background: "none", border: "none", fontSize: 13.5, fontWeight: 500, cursor: "pointer", color: SLATE };

  const stats = [
    { icon: BookOpen, value: 15000, suffix: "+", label: "Classified PYQs" },
    { icon: Target, value: 98, suffix: "%", label: "NTA-pattern accuracy" },
    { icon: Sparkles, value: 50, suffix: "+", label: "Insights per test" },
    { icon: TrendingUp, value: 340, suffix: "+", label: "Avg. rank gain" },
    { icon: Zap, value: 75, suffix: "", label: "Questions per mock" },
  ];
  const features = [
    { Icon: MonitorCheck, title: "NTA-identical interface", desc: "The same palette, timer and question layout as the real exam, so nothing is unfamiliar on test day.", tag: "No surprises", color: PHYSICS },
    { Icon: Microscope, title: "Question-level analysis", desc: "Every question dissected — time spent, difficulty versus your accuracy, and chapter-wise heatmaps.", tag: "Deep insight", color: CHEM },
    { Icon: BarChart3, title: "Live rank prediction", desc: "Your score mapped to a predicted JEE rank using historical percentile-to-rank data.", tag: "Data driven", color: AMBER },
    { Icon: Bot, title: "AI study assistant", desc: "Knows your weak chapters, suggests what to revise next, and answers doubts on demand.", tag: "Personalised", color: MATHS },
  ];

  return (
    <div>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(242,239,230,0.85)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${PAPER_LINE}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 64, maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
          <Brand />
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {onFreeTest && <button onClick={onFreeTest} style={navText}>Free test</button>}
            <button onClick={onDashboard} style={navText}>Dashboard</button>
            {isAuthenticated
              ? (onLogout && <button onClick={onLogout} style={navGhost}>Log out</button>)
              : (onLogin && <button onClick={onLogin} style={navGhost}>Log in</button>)}
            <button onClick={onStart} style={{ padding: "9px 16px", background: AMBER, border: "none", borderRadius: 4, fontSize: 13.5, fontWeight: 600, cursor: "pointer", color: INK }}>Start mock test</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 24px 64px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
        <div style={{ animation: visible ? "cj-fadeUp 0.5s ease" : "none", opacity: visible ? 1 : 0 }}>
          <span style={{ fontFamily: fontMono, fontSize: 13, color: "#9a6a1c", fontWeight: 600 }}>5,000 questions · fully classified · JEE Main &amp; Advanced</span>
          <h1 style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.1, margin: "16px 0 0", color: INK }}>
            Prepare for JEE<br />with data, not guesswork.
          </h1>
          <p style={{ fontSize: 17, color: SLATE, lineHeight: 1.6, margin: "18px 0 0", maxWidth: 460 }}>
            Sit full-length mocks on a paper-accurate interface, see exactly which chapters cost you rank, and get every next test tuned to your weakest topics.
          </p>
          <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 30, flexWrap: "wrap" }}>
            <button onClick={onStart} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", background: AMBER, color: INK, border: "none", borderRadius: 4, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
              Take a full mock test <ArrowRight size={17} />
            </button>
            {onFreeTest && <button onClick={onFreeTest} style={{ background: "none", border: "none", color: SLATE, fontSize: 14, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4 }}>Try a free 10-question diagnostic</button>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 34 }}>
            <div style={{ display: "flex" }}>
              {[PHYSICS, CHEM, MATHS, AMBER].map((c, i) => (
                <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: c, marginLeft: i > 0 ? -8 : 0, border: `2px solid ${PAPER}` }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: SLATE }}><b style={{ color: GRAPHITE }}>2,340+</b> aspirants practising this week</span>
          </div>
        </div>

        <div style={{ animation: visible ? "cj-slideLeft 0.55s ease 0.15s both" : "none" }}>
          <QuestionSlider streak={streak} setStreak={setStreak} totalSolved={totalSolved} setTotalSolved={setTotalSolved} />
        </div>
      </section>

      {/* STATS STRIP */}
      <section style={{ background: INK }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <s.icon size={20} color={AMBER} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 30, fontWeight: 600, color: PAPER, fontFamily: fontMono }}><AnimCounter end={s.value} suffix={s.suffix} /></div>
              <div style={{ fontSize: 12.5, color: "rgba(242,239,230,0.6)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ maxWidth: 560, marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: GRAPHITE, margin: 0 }}>Built for the exam you're actually sitting.</h2>
          <p style={{ fontSize: 16, color: SLATE, margin: "14px 0 0", lineHeight: 1.6 }}>Every feature exists to turn a mock score into a clear next action.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} className="cj-card-hover" style={{ background: WHITE, borderRadius: 6, padding: "26px 22px", border: `1px solid ${PAPER_LINE}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 36, height: 3, background: f.color }} />
              <div style={{ width: 40, height: 40, borderRadius: 6, background: `${f.color}18`, color: f.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><f.Icon size={20} /></div>
              <div style={{ fontFamily: fontMono, fontSize: 11, color: SLATE, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{f.tag}</div>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 8px", color: GRAPHITE }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: SLATE, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px 72px" }}>
        <div style={{ background: INK, borderRadius: 8, padding: "48px 40px", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: PAPER, margin: "0 0 10px" }}>See your predicted rank before you commit.</h2>
          <p style={{ fontSize: 15, color: "rgba(242,239,230,0.6)", margin: "0 0 26px" }}>Your first diagnostic is free — no card, no clutter.</p>
          <button onClick={onFreeTest || onStart} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 30px", background: AMBER, color: INK, border: "none", borderRadius: 4, fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
            Take a free test <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <footer style={{ background: INK, borderTop: "1px solid rgba(242,239,230,0.1)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(242,239,230,0.45)", fontSize: 13 }}>
          <Brand size={17} />
          <span>Built for JEE Main &amp; Advanced aspirants</span>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================
   NTA TEST INTERFACE  (deliberately mimics the real exam portal)
   ================================================================ */
const QUESTIONS = {
  Physics: { A: [
    { id:1, text:"A particle of mass 2 kg moves with velocity 3 m/s. A force of 6N acts for 3s. Final velocity is:", options:["12 m/s","6 m/s","9 m/s","15 m/s"], correct:0, chapter:"Laws of Motion", difficulty:"Easy" },
    { id:2, text:"Two blocks (3 kg, 5 kg) connected by string over frictionless pulley. Acceleration is (g=10):", options:["2.5 m/s²","3.75 m/s²","1.25 m/s²","5.0 m/s²"], correct:0, chapter:"Laws of Motion", difficulty:"Medium" },
    { id:3, text:"Work done moving 5 μC charge across 20V potential difference:", options:["100 μJ","50 μJ","200 μJ","10 μJ"], correct:0, chapter:"Electrostatics", difficulty:"Easy" },
    { id:4, text:"Convex lens (f=20cm) gives real image 3× object size. Object distance:", options:["26.67 cm","30 cm","40 cm","13.33 cm"], correct:0, chapter:"Ray Optics", difficulty:"Medium" },
    { id:5, text:"de Broglie wavelength of electron through 100V:", options:["0.123 nm","1.23 nm","0.0123 nm","12.3 nm"], correct:0, chapter:"Dual Nature", difficulty:"Medium" },
    { id:6, text:"Body projected vertically at 40 m/s. Max height (g=10):", options:["80 m","40 m","160 m","60 m"], correct:0, chapter:"Kinematics", difficulty:"Easy" },
    { id:7, text:"Ideal gas undergoes isothermal expansion. Internal energy:", options:["Remains constant","Increases","Decreases","First increases then decreases"], correct:0, chapter:"Thermodynamics", difficulty:"Easy" },
    { id:8, text:"YDSE fringe width 0.5mm. Screen distance doubled. New fringe width:", options:["1.0 mm","0.25 mm","0.5 mm","2.0 mm"], correct:0, chapter:"Wave Optics", difficulty:"Medium" },
    { id:9, text:"MI of solid sphere about diameter is (2/5)MR². About tangent:", options:["(7/5)MR²","(2/5)MR²","(3/5)MR²","(9/5)MR²"], correct:0, chapter:"Rotational Motion", difficulty:"Medium" },
    { id:10, text:"12Ω wire bent into circle. Resistance between diametrically opposite points:", options:["3 Ω","6 Ω","12 Ω","24 Ω"], correct:0, chapter:"Current Electricity", difficulty:"Easy" },
    { id:11, text:"Binding energy per nucleon is maximum for:", options:["Fe-56","U-238","He-4","H-1"], correct:0, chapter:"Nuclei", difficulty:"Easy" },
    { id:12, text:"Charge Q at centre of cube. Flux through one face:", options:["Q/6ε₀","Q/ε₀","Q/2ε₀","Q/4ε₀"], correct:0, chapter:"Electrostatics", difficulty:"Medium" },
    { id:13, text:"Simple pendulum time period on moon (g/6) compared to earth:", options:["√6 times","6 times","1/6 times","1/√6 times"], correct:0, chapter:"Oscillations", difficulty:"Easy" },
    { id:14, text:"Transformer: 500 primary, 5000 secondary turns. Input 220V, output:", options:["2200 V","22 V","220 V","1100 V"], correct:0, chapter:"EMI & AC", difficulty:"Easy" },
    { id:15, text:"Sound speed at 0°C is 332 m/s. At 546°C approximately:", options:["574 m/s","664 m/s","498 m/s","332 m/s"], correct:0, chapter:"Waves", difficulty:"Medium" },
    { id:16, text:"Two capacitors C in series. Dielectric K in one. Net capacitance:", options:["KC/(K+1)","2KC","C(K+1)/2","C/2K"], correct:0, chapter:"Electrostatics", difficulty:"Hard" },
    { id:17, text:"Ball dropped from h, hits ground at v. At what height is speed v/2?", options:["3h/4","h/2","h/4","3h/2"], correct:0, chapter:"Kinematics", difficulty:"Medium" },
    { id:18, text:"Escape velocity v from planet M,R. If R→4R, M→16M:", options:["2v","v","4v","v/2"], correct:0, chapter:"Gravitation", difficulty:"Medium" },
    { id:19, text:"Photoelectric effect: max KE depends on:", options:["Frequency","Intensity","Both","Neither"], correct:0, chapter:"Dual Nature", difficulty:"Easy" },
    { id:20, text:"Magnetic field at center of circular loop (radius R, current I):", options:["μ₀I/2R","μ₀I/R","μ₀I/4R","2μ₀I/R"], correct:0, chapter:"Magnetic Effects", difficulty:"Easy" },
  ], B: [
    { id:21, text:"F=(3î+4ĵ)N moves body from origin to (3,4)m. Work done = ___ J.", correct:"25", chapter:"WEP", difficulty:"Easy" },
    { id:22, text:"Car accelerates from rest at 2 m/s². Distance in 5th second = ___ m.", correct:"9", chapter:"Kinematics", difficulty:"Medium" },
    { id:23, text:"Equivalent resistance of 3Ω and 6Ω in parallel = ___ Ω.", correct:"2", chapter:"Current Electricity", difficulty:"Easy" },
    { id:24, text:"Spring k=200 N/m compressed 0.1m. PE stored = ___ J.", correct:"1", chapter:"WEP", difficulty:"Easy" },
    { id:25, text:"Frequencies 256 Hz and 260 Hz together. Beats/sec = ___.", correct:"4", chapter:"Waves", difficulty:"Easy" },
  ]},
  Chemistry: { A: [
    { id:26, text:"Hybridization of carbon in methane:", options:["sp³","sp²","sp","dsp²"], correct:0, chapter:"Chemical Bonding", difficulty:"Easy" },
    { id:27, text:"Strongest acid:", options:["HClO₄","HClO₃","HClO₂","HClO"], correct:0, chapter:"Chemical Bonding", difficulty:"Easy" },
    { id:28, text:"IUPAC name of CH₃CH(OH)CH₃:", options:["Propan-2-ol","Propan-1-ol","2-Methylethanol","Isopropanol"], correct:0, chapter:"GOC & Isomerism", difficulty:"Easy" },
    { id:29, text:"Sigma and pi bonds in CH₂=CH-CH=CH₂:", options:["9σ, 2π","7σ, 2π","8σ, 2π","10σ, 2π"], correct:0, chapter:"Chemical Bonding", difficulty:"Medium" },
    { id:30, text:"Highest lattice energy:", options:["NaF","NaCl","NaBr","NaI"], correct:0, chapter:"Chemical Bonding", difficulty:"Medium" },
    { id:31, text:"Oxidation state of Cr in K₂Cr₂O₇:", options:["+6","+3","+7","+2"], correct:0, chapter:"Redox", difficulty:"Easy" },
    { id:32, text:"Most stable carbocation:", options:["(CH₃)₃C⁺","CH₃CH₂⁺","CH₃⁺","C₆H₅CH₂⁺"], correct:0, chapter:"GOC", difficulty:"Easy" },
    { id:33, text:"Quantum number determining orbital shape:", options:["Azimuthal (l)","Principal (n)","Magnetic (mₗ)","Spin (mₛ)"], correct:0, chapter:"Atomic Structure", difficulty:"Easy" },
    { id:34, text:"pH of 0.01 M HCl:", options:["2","1","3","0.01"], correct:0, chapter:"Equilibrium", difficulty:"Easy" },
    { id:35, text:"Highest electronegativity:", options:["Fluorine","Chlorine","Oxygen","Nitrogen"], correct:0, chapter:"Periodic Table", difficulty:"Easy" },
    { id:36, text:"Shows geometrical isomerism:", options:["2-Butene","2-Butyne","Propene","Ethene"], correct:0, chapter:"GOC", difficulty:"Medium" },
    { id:37, text:"First order reaction rate depends on:", options:["First power","Square","Independent","Cube"], correct:0, chapter:"Kinetics", difficulty:"Easy" },
    { id:38, text:"Frenkel defect shown by:", options:["AgBr","NaCl","KCl","CsCl"], correct:0, chapter:"Solid State", difficulty:"Medium" },
    { id:39, text:"Reagent in Wurtz reaction:", options:["Na/dry ether","Zn/HCl","LiAlH₄","NaBH₄"], correct:0, chapter:"Hydrocarbons", difficulty:"Easy" },
    { id:40, text:"Coordination number of Na⁺ in NaCl:", options:["6","4","8","12"], correct:0, chapter:"Solid State", difficulty:"Easy" },
    { id:41, text:"Ore of aluminium:", options:["Bauxite","Galena","Calamine","Haematite"], correct:0, chapter:"p-Block", difficulty:"Easy" },
    { id:42, text:"Bond order of O₂:", options:["2","1","3","2.5"], correct:0, chapter:"Chemical Bonding", difficulty:"Medium" },
    { id:43, text:"Lucas test distinguishes:", options:["1°,2°,3° alcohols","Aldehydes/ketones","Acids/bases","Alkanes/alkenes"], correct:0, chapter:"Alcohols", difficulty:"Medium" },
    { id:44, text:"Shape of XeF₄:", options:["Square planar","Tetrahedral","See-saw","T-shaped"], correct:0, chapter:"p-Block", difficulty:"Medium" },
    { id:45, text:"Nessler's reagent is:", options:["K₂HgI₄","K₂Cr₂O₇","KMnO₄","K₄[Fe(CN)₆]"], correct:0, chapter:"Coordination", difficulty:"Medium" },
  ], B: [
    { id:46, text:"d-orbital electrons in Fe²⁺ (Z=26) = ___.", correct:"6", chapter:"d-Block", difficulty:"Easy" },
    { id:47, text:"Molarity: 4g NaOH in 500mL = ___ M.", correct:"0.2", chapter:"Solutions", difficulty:"Easy" },
    { id:48, text:"Lone pairs in H₂O = ___.", correct:"2", chapter:"Chemical Bonding", difficulty:"Easy" },
    { id:49, text:"Degree of unsaturation in benzene = ___.", correct:"4", chapter:"Hydrocarbons", difficulty:"Easy" },
    { id:50, text:"If Kc(A⇌B)=4, then Kc(B⇌A) = ___.", correct:"0.25", chapter:"Equilibrium", difficulty:"Easy" },
  ]},
  Mathematics: { A: [
    { id:51, text:"f(x)=x²+2x+1, f'(1) =", options:["4","2","3","1"], correct:0, chapter:"Differentiation", difficulty:"Easy" },
    { id:52, text:"∫₀¹ x² dx =", options:["1/3","1/2","1","2/3"], correct:0, chapter:"Integration", difficulty:"Easy" },
    { id:53, text:"Eccentricity of x²/25 + y²/16 = 1:", options:["3/5","4/5","5/3","4/3"], correct:0, chapter:"Conics", difficulty:"Medium" },
    { id:54, text:"|A|=5 for 3×3 matrix. |2A| =", options:["40","10","20","80"], correct:0, chapter:"Matrices", difficulty:"Medium" },
    { id:55, text:"Arrangements of MISSISSIPPI:", options:["34650","11!","5040","39916800"], correct:0, chapter:"P&C", difficulty:"Medium" },
    { id:56, text:"General solution of sin x = 1/2:", options:["nπ+(-1)ⁿπ/6","2nπ±π/6","nπ+π/6","nπ±π/3"], correct:0, chapter:"Trigonometry", difficulty:"Medium" },
    { id:57, text:"Distance between 3x+4y=9 and 6x+8y=15:", options:["3/10","3/5","6/5","1/2"], correct:0, chapter:"Straight Lines", difficulty:"Medium" },
    { id:58, text:"lim(x→0) sin(x)/x =", options:["1","0","∞","-1"], correct:0, chapter:"Limits", difficulty:"Easy" },
    { id:59, text:"Sum of first 20 AP terms (a=1, d=3):", options:["590","580","600","610"], correct:0, chapter:"Sequences", difficulty:"Easy" },
    { id:60, text:"P(A)=0.4, P(B)=0.3, independent. P(A∩B):", options:["0.12","0.7","0.1","0.42"], correct:0, chapter:"Probability", difficulty:"Easy" },
    { id:61, text:"Derivative of eˣ·sin x:", options:["eˣ(sinx+cosx)","eˣcosx","eˣsinx","eˣ(sinx-cosx)"], correct:0, chapter:"Differentiation", difficulty:"Easy" },
    { id:62, text:"Circle with center (1,2), radius 3:", options:["(x-1)²+(y-2)²=9","x²+y²=9","(x+1)²+(y+2)²=9","(x-1)²+(y-2)²=3"], correct:0, chapter:"Circles", difficulty:"Easy" },
    { id:63, text:"Vector ⊥ to î+ĵ and î+k̂:", options:["î-ĵ-k̂","î+ĵ+k̂","-î+ĵ-k̂","ĵ-k̂"], correct:0, chapter:"Vectors", difficulty:"Medium" },
    { id:64, text:"Area bounded by y=x², x-axis, x=2:", options:["8/3","4","2","4/3"], correct:0, chapter:"Area Under Curves", difficulty:"Easy" },
    { id:65, text:"Degree of d²y/dx²+(dy/dx)³+y=0:", options:["1","2","3","Not defined"], correct:0, chapter:"Diff. Equations", difficulty:"Easy" },
    { id:66, text:"Coefficient of x³ in (1+x)¹⁰:", options:["120","45","210","10"], correct:0, chapter:"Binomial", difficulty:"Easy" },
    { id:67, text:"Angle between direction ratios (1,1,0) and (0,1,1):", options:["60°","90°","45°","30°"], correct:0, chapter:"3D Geometry", difficulty:"Medium" },
    { id:68, text:"If z=3+4i, |z|=", options:["5","7","4","3"], correct:0, chapter:"Complex Numbers", difficulty:"Easy" },
    { id:69, text:"sin⁻¹(sin(π/6)):", options:["π/6","1/2","√3/2","π/3"], correct:0, chapter:"Inverse Trig", difficulty:"Easy" },
    { id:70, text:"Variance of 2,4,6,8,10:", options:["8","4","10","6"], correct:0, chapter:"Statistics", difficulty:"Medium" },
  ], B: [
    { id:71, text:"∫₀^(π/2) sin²x dx = π/___.", correct:"4", chapter:"Integration", difficulty:"Medium" },
    { id:72, text:"³C₂+⁴C₂+⁵C₂=ⁿC₃, n=___.", correct:"6", chapter:"P&C", difficulty:"Medium" },
    { id:73, text:"Real roots of x³-3x+2=0: ___.", correct:"2", chapter:"Quadratics", difficulty:"Medium" },
    { id:74, text:"A=[[1,2],[3,4]], tr(A)=___.", correct:"5", chapter:"Matrices", difficulty:"Easy" },
    { id:75, text:"Sum 1+1/2+1/4+... (infinite GP)=___.", correct:"2", chapter:"Sequences", difficulty:"Easy" },
  ]}
};

export function TestInterface({ onFinish, onBack }) {
  const allQ = {}; SUBJECTS.forEach(s => { allQ[s] = [...QUESTIONS[s].A, ...QUESTIONS[s].B]; });
  const totalQ = SUBJECTS.reduce((a, s) => a + allQ[s].length, 0);
  const [curSub, setCurSub] = useState("Physics");
  const [curIdx, setCurIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [statuses, setStatuses] = useState({});
  const [timeLeft, setTimeLeft] = useState(180*60);
  const [started, setStarted] = useState(false);
  const [showInst, setShowInst] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sel, setSel] = useState(null);
  const [timePerQ, setTimePerQ] = useState({});
  const qTimer = useRef(Date.now());

  useEffect(() => { if (!started) return; const t = setInterval(() => setTimeLeft(p => { if (p<=0){clearInterval(t);doSubmit();return 0;} return p-1; }),1000); return ()=>clearInterval(t); }, [started]);

  const curQs = allQ[curSub]; const curQ = curQs[curIdx]; const qk = `${curSub}-${curQ.id}`; const isNum = curIdx >= 20;
  useEffect(() => { setSel(answers[qk]?.selected ?? null); if(!statuses[qk]) setStatuses(p=>({...p,[qk]:"notAnswered"})); }, [qk]);
  useEffect(() => { qTimer.current = Date.now(); }, [qk]);

  const recTime = () => { const e=(Date.now()-qTimer.current)/1000; setTimePerQ(p=>({...p,[qk]:(p[qk]||0)+e})); qTimer.current=Date.now(); };
  const saveNext = () => { recTime(); if(sel!==null){setAnswers(p=>({...p,[qk]:{selected:sel,isNumerical:isNum}}));setStatuses(p=>({...p,[qk]:p[qk]==="markedReview"?"answeredMarked":"answered"}));} if(curIdx<curQs.length-1)setCurIdx(i=>i+1); };
  const markReview = () => { recTime(); if(sel!==null){setAnswers(p=>({...p,[qk]:{selected:sel,isNumerical:isNum}}));setStatuses(p=>({...p,[qk]:"answeredMarked"}));}else{setStatuses(p=>({...p,[qk]:"markedReview"}));} if(curIdx<curQs.length-1)setCurIdx(i=>i+1); };
  const clearResp = () => { setSel(null); setAnswers(p=>{const n={...p};delete n[qk];return n;}); setStatuses(p=>({...p,[qk]:"notAnswered"})); };

  const doSubmit = () => {
    recTime(); let score=0,correct=0,incorrect=0,unattempted=0; const subScores={}; const chapScores={}; const qDets=[];
    SUBJECTS.forEach(sub => { subScores[sub]={correct:0,incorrect:0,unattempted:0,score:0,total:allQ[sub].length,time:0};
      allQ[sub].forEach((q,idx)=>{ const k=`${sub}-${q.id}`; const a=answers[k]; const iN=idx>=20; const tt=timePerQ[k]||0; subScores[sub].time+=tt; let st="unattempted",ic=false;
        if(a){if(iN){ic=String(a.selected).trim()===String(q.correct).trim();}else{ic=parseInt(a.selected)===q.correct;} if(ic){score+=4;correct++;subScores[sub].correct++;subScores[sub].score+=4;st="correct";}else{score-=1;incorrect++;subScores[sub].incorrect++;subScores[sub].score-=1;st="incorrect";}}else{unattempted++;subScores[sub].unattempted++;st="unattempted";}
        if(!chapScores[q.chapter])chapScores[q.chapter]={correct:0,total:0,subject:sub}; chapScores[q.chapter].total++; if(st==="correct")chapScores[q.chapter].correct++;
        qDets.push({...q,subject:sub,userAnswer:a?.selected,status:st,timeTaken:tt,isNum:iN}); }); });
    onFinish({score,correct,incorrect,unattempted,total:totalQ,maxScore:totalQ*4,subjectScores:subScores,chapterScores:chapScores,qDetails:qDets,totalTime:180*60-timeLeft,timePerQ});
  };

  const fmt = s => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const stColor = k => NTA_COLORS[statuses[k]||"notVisited"];
  const cnt = st => Object.values(statuses).filter(s=>s===st).length;

  if (showInst) return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"36px 20px"}}>
      <div style={{background:"#1a3a5c",color:"#fff",padding:"14px 20px",borderRadius:"6px 6px 0 0",fontWeight:700,fontSize:15,fontFamily:fontDisplay}}>JEE (Main) 2025 — Mock Test</div>
      <div style={{background:WHITE,border:`1px solid ${PAPER_LINE}`,borderTop:0,borderRadius:"0 0 6px 6px",padding:26}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"#1a3a5c",margin:"0 0 16px"}}>General Instructions</h2>
        <div style={{fontSize:13.5,lineHeight:1.8,color:SLATE}}>
          <p style={{margin:"0 0 8px"}}>1. Total duration: <b>180 minutes</b>. Paper: <b>75 questions</b> (25 per subject).</p>
          <p style={{margin:"0 0 8px"}}>2. Each subject: <b>Section A (20 MCQs)</b> + <b>Section B (5 Numerical)</b>.</p>
          <p style={{margin:"0 0 8px"}}>3. Marking: <b>+4 correct, −1 incorrect</b>.</p>
          <p style={{margin:"0 0 16px"}}>4. Question palette colour codes:</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8,marginBottom:16}}>
            {[{c:NTA_COLORS.notVisited,l:"Not Visited"},{c:NTA_COLORS.notAnswered,l:"Not Answered"},{c:NTA_COLORS.answered,l:"Answered"},{c:NTA_COLORS.markedReview,l:"Marked for Review"},{c:NTA_COLORS.answeredMarked,l:"Answered & Marked"}].map(x=>(
              <div key={x.l} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:22,height:22,borderRadius:4,background:x.c}}/><span style={{fontSize:12.5}}>{x.l}</span></div>
            ))}
          </div>
          <p style={{margin:0}}>5. Click <b>Save &amp; Next</b> to record your answer.</p>
        </div>
        <div style={{display:"flex",gap:12,marginTop:24}}>
          <button onClick={()=>{setShowInst(false);setStarted(true);}} style={{padding:"12px 30px",background:AMBER,color:INK,border:"none",borderRadius:4,fontWeight:600,fontSize:14,cursor:"pointer"}}>Start test</button>
          <button onClick={onBack} style={{padding:"12px 22px",background:"transparent",color:SLATE,border:`1px solid ${PAPER_LINE}`,borderRadius:4,fontWeight:600,fontSize:14,cursor:"pointer"}}>Go back</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#eef1f5",overflow:"hidden"}}>
      <div style={{background:"#1a3a5c",color:"#fff",padding:"9px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <span style={{fontSize:14,fontWeight:700,fontFamily:fontDisplay}}>JEE (Main) 2025 — Mock</span>
        <div style={{textAlign:"right"}}><div style={{fontSize:10,opacity:0.7}}>Time left</div><div style={{fontSize:20,fontWeight:700,fontFamily:fontMono,color:timeLeft<600?"#ff8f8f":"#7ee0a0"}}>{fmt(timeLeft)}</div></div>
      </div>
      <div style={{background:"#2c5282",display:"flex",flexShrink:0}}>
        {SUBJECTS.map(s=><button key={s} onClick={()=>{recTime();setCurSub(s);setCurIdx(0);}} style={{padding:"10px 26px",background:curSub===s?WHITE:"transparent",color:curSub===s?"#2c5282":"#fff",border:"none",fontWeight:600,fontSize:13,cursor:"pointer",borderRadius:curSub===s?"6px 6px 0 0":0}}>{s}</button>)}
      </div>
      <div style={{background:"#e2e8f0",padding:"6px 16px",display:"flex",gap:16,flexShrink:0,borderBottom:"1px solid #cbd5e0"}}>
        <span onClick={()=>{recTime();setCurIdx(0);}} style={{fontSize:12,fontWeight:700,color:!isNum?"#2c5282":"#666",cursor:"pointer",borderBottom:!isNum?"2px solid #2c5282":"none",paddingBottom:2}}>Section A (MCQ)</span>
        <span onClick={()=>{recTime();setCurIdx(20);}} style={{fontSize:12,fontWeight:700,color:isNum?"#2c5282":"#666",cursor:"pointer",borderBottom:isNum?"2px solid #2c5282":"none",paddingBottom:2}}>Section B (Numerical)</span>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,padding:"16px 20px",overflowY:"auto",background:WHITE}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:700,color:"#1a3a5c"}}>Q {curIdx+1}/{curQs.length}</span>
            <span style={{fontSize:10,padding:"3px 8px",borderRadius:4,background:curQ.difficulty==="Easy"?"#d1fae5":curQ.difficulty==="Medium"?"#fef3c7":"#fee2e2",color:curQ.difficulty==="Easy"?"#065f46":curQ.difficulty==="Medium"?"#92400e":"#991b1b",fontWeight:600}}>{curQ.difficulty}</span>
          </div>
          <div style={{fontSize:15,lineHeight:1.7,padding:"16px",background:"#f8fafc",borderRadius:6,border:"1px solid #e2e8f0",marginBottom:16}}>{curQ.text}</div>
          {isNum?(
            <div><label style={{fontSize:13,fontWeight:600,color:"#555"}}>Enter your answer:</label>
            <input type="text" value={sel||""} onChange={e=>setSel(e.target.value)} style={{display:"block",marginTop:8,width:"100%",maxWidth:300,padding:"12px 16px",fontSize:16,border:"1px solid #cbd5e0",borderRadius:6,outline:"none",fontFamily:fontMono}} placeholder="Type answer…"/></div>
          ):(
            <div style={{display:"grid",gap:8}}>
              {curQ.options.map((op,oi)=>(
                <label key={oi} onClick={()=>setSel(oi)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:6,border:`1px solid ${sel===oi?AMBER:"#e2e8f0"}`,background:sel===oi?"rgba(232,163,61,0.08)":WHITE,cursor:"pointer",transition:"all 0.15s"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${sel===oi?AMBER:"#aaa"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {sel===oi&&<div style={{width:11,height:11,borderRadius:"50%",background:AMBER}}/>}
                  </div>
                  <span style={{fontSize:14}}>({String.fromCharCode(65+oi)}) {op}</span>
                </label>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:8,marginTop:20,flexWrap:"wrap",borderTop:"1px solid #e2e8f0",paddingTop:16}}>
            <button onClick={saveNext} style={{padding:"10px 18px",background:"#27ae60",color:"#fff",border:"none",borderRadius:4,fontWeight:600,fontSize:12,cursor:"pointer"}}>Save &amp; Next</button>
            <button onClick={markReview} style={{padding:"10px 18px",background:"#7d3c98",color:"#fff",border:"none",borderRadius:4,fontWeight:600,fontSize:12,cursor:"pointer"}}>Mark for Review</button>
            <button onClick={clearResp} style={{padding:"10px 18px",background:"transparent",color:BAD,border:`1px solid ${BAD}`,borderRadius:4,fontWeight:600,fontSize:12,cursor:"pointer"}}>Clear</button>
            <button onClick={()=>{recTime();if(curIdx>0)setCurIdx(i=>i-1);}} disabled={curIdx===0} style={{padding:"10px 18px",background:curIdx===0?"#ccc":"#3498db",color:"#fff",border:"none",borderRadius:4,fontWeight:600,fontSize:12,cursor:curIdx===0?"default":"pointer"}}>← Prev</button>
            <button onClick={()=>setShowConfirm(true)} style={{padding:"10px 18px",background:"#1a3a5c",color:"#fff",border:"none",borderRadius:4,fontWeight:600,fontSize:12,cursor:"pointer",marginLeft:"auto"}}>Submit</button>
          </div>
        </div>
        <div style={{width:210,background:"#f8fafc",borderLeft:"1px solid #ddd",padding:12,overflowY:"auto",flexShrink:0}}>
          <div style={{fontSize:12,fontWeight:700,color:"#1a3a5c",marginBottom:8,textAlign:"center"}}>Question Palette</div>
          {SUBJECTS.map(sub=>(
            <div key={sub} style={{marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"#555",marginBottom:4,borderBottom:"1px solid #ddd",paddingBottom:3}}>{sub}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3}}>
                {allQ[sub].map((q,idx)=>{const k=`${sub}-${q.id}`;const ic=curSub===sub&&curIdx===idx;return(
                  <div key={q.id} onClick={()=>{recTime();setCurSub(sub);setCurIdx(idx);}} style={{width:30,height:30,borderRadius:4,background:stColor(k),color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,cursor:"pointer",border:ic?"2px solid #1a3a5c":"1px solid transparent"}}>{idx+1}</div>
                );})}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(16,24,43,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
        <div style={{background:WHITE,borderRadius:8,padding:32,maxWidth:420,width:"90%",textAlign:"center"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><AlertTriangle size={34} color={AMBER} /></div><h3 style={{margin:"0 0 8px",fontSize:19}}>Submit test?</h3>
          <div style={{fontSize:13,color:SLATE,marginBottom:16}}>Answered: <b style={{color:GOOD}}>{cnt("answered")+cnt("answeredMarked")}</b> · Unanswered: <b style={{color:BAD}}>{totalQ-cnt("answered")-cnt("answeredMarked")}</b></div>
          <div style={{display:"flex",gap:12,justifyContent:"center"}}>
            <button onClick={doSubmit} style={{padding:"10px 28px",background:AMBER,color:INK,border:"none",borderRadius:4,fontWeight:600,cursor:"pointer"}}>Submit</button>
            <button onClick={()=>setShowConfirm(false)} style={{padding:"10px 28px",background:"transparent",color:SLATE,border:`1px solid ${PAPER_LINE}`,borderRadius:4,fontWeight:600,cursor:"pointer"}}>Go back</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

/* ================================================================
   ANALYSIS DASHBOARD
   ================================================================ */
export function AnalysisDashboard({ result, onHome, onBuddy }) {
  const [tab, setTab] = useState("overview");
  if (!result) return <div style={{padding:60,textAlign:"center"}}><p style={{color:SLATE}}>No test data to show.</p><button onClick={onHome} style={{padding:"10px 24px",background:AMBER,color:INK,border:"none",borderRadius:4,cursor:"pointer",fontWeight:600}}>Back to dashboard</button></div>;
  const {score,correct,incorrect,unattempted,total,maxScore,subjectScores,chapterScores,qDetails,totalTime}=result;
  const pct=((score/maxScore)*100).toFixed(1); const acc=correct>0?((correct/(correct+incorrect))*100).toFixed(1):0;
  const rank=s=>s>=280?"< 100":s>=250?"100–500":s>=220?"500–2K":s>=190?"2K–5K":s>=160?"5K–15K":s>=130?"15K–35K":s>=100?"35K–75K":s>=70?"75K–1.5L":"1.5L+";
  const pctile=s=>s>=280?"99.99+":s>=250?"99.95+":s>=220?"99.8+":s>=190?"99.5+":s>=160?"99+":s>=130?"98+":s>=100?"96+":s>=70?"92+":"<90";
  const subData=SUBJECTS.map(s=>({name:s.slice(0,4),correct:subjectScores[s].correct,incorrect:subjectScores[s].incorrect,unattempted:subjectScores[s].unattempted}));
  const pieD=[{name:"Correct",value:correct,color:GOOD},{name:"Incorrect",value:incorrect,color:BAD},{name:"Skipped",value:unattempted,color:PAPER_LINE}];
  const radarD=Object.entries(chapterScores).slice(0,8).map(([c,d])=>({ch:c.length>12?c.slice(0,12)+"..":c,v:d.total>0?Math.round(d.correct/d.total*100):0}));
  const weakC=Object.entries(chapterScores).filter(([,d])=>d.total>0&&d.correct/d.total<0.5).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total);
  const strongC=Object.entries(chapterScores).filter(([,d])=>d.total>0&&d.correct/d.total>=0.5).sort((a,b)=>b[1].correct/b[1].total-a[1].correct/a[1].total);
  const cardBox = {background:WHITE,borderRadius:6,padding:20,border:`1px solid ${PAPER_LINE}`};

  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"28px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:12,color:"#9a6a1c",fontWeight:600,letterSpacing:"0.14em",fontFamily:fontMono}}>TEST ANALYSIS</div><h2 style={{margin:"6px 0 0",fontSize:24,fontWeight:700,color:INK}}>Performance report</h2></div>
        <div style={{display:"flex",gap:8}}><button onClick={onBuddy} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 16px",background:INK,color:PAPER,border:"none",borderRadius:4,fontWeight:600,fontSize:13,cursor:"pointer"}}><Bot size={15}/> AI assistant</button><button onClick={onHome} style={{padding:"9px 16px",background:"transparent",color:GRAPHITE,border:`1px solid ${PAPER_LINE}`,borderRadius:4,fontWeight:600,fontSize:13,cursor:"pointer"}}>Dashboard</button></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:22}}>
        {[{l:"Score",v:`${score}/${maxScore}`,c:AMBER,s:pct+"%"},{l:"Predicted rank",v:rank(score),c:MATHS,s:"JEE 2025"},{l:"Percentile",v:pctile(score),c:CHEM,s:"Estimated"},{l:"Accuracy",v:acc+"%",c:PHYSICS,s:`${correct}/${correct+incorrect}`},{l:"Time",v:`${Math.round(totalTime/60)}m`,c:SLATE,s:"of 180min"}].map(c=>(
          <div key={c.l} style={{...cardBox,padding:16,borderLeft:`3px solid ${c.c}`}}>
            <div style={{fontSize:10.5,color:SLATE,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>{c.l}</div>
            <div style={{fontSize:22,fontWeight:700,color:c.c,margin:"5px 0 2px",fontFamily:fontMono}}>{c.v}</div>
            <div style={{fontSize:10.5,color:"#aaa"}}>{c.s}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:4,marginBottom:16,background:WHITE,borderRadius:6,padding:4,border:`1px solid ${PAPER_LINE}`}}>
        {["overview","subjects","chapters","questions"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"9px 16px",borderRadius:4,border:"none",background:tab===t?INK:"transparent",color:tab===t?PAPER:SLATE,fontWeight:600,fontSize:12.5,cursor:"pointer",textTransform:"capitalize",flex:1}}>{t}</button>)}
      </div>
      {tab==="overview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={cardBox}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:600}}>Distribution</h4>
          <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={pieD} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{pieD.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
        <div style={cardBox}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:600}}>Subject breakdown</h4>
          <ResponsiveContainer width="100%" height={200}><BarChart data={subData}><CartesianGrid strokeDasharray="3 3" stroke="#eee"/><XAxis dataKey="name" fontSize={11}/><YAxis fontSize={11}/><Tooltip/><Bar dataKey="correct" fill={GOOD} stackId="a"/><Bar dataKey="incorrect" fill={BAD} stackId="a"/><Bar dataKey="unattempted" fill={PAPER_LINE} stackId="a"/></BarChart></ResponsiveContainer></div>
        <div style={{...cardBox,gridColumn:"1/-1"}}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:600}}>Chapter accuracy</h4>
          <ResponsiveContainer width="100%" height={250}><RadarChart data={radarD}><PolarGrid stroke="#e5e0d2"/><PolarAngleAxis dataKey="ch" fontSize={10}/><PolarRadiusAxis angle={30} domain={[0,100]} fontSize={9}/><Radar dataKey="v" stroke={AMBER} fill={AMBER} fillOpacity={0.3}/></RadarChart></ResponsiveContainer></div>
      </div>}
      {tab==="subjects"&&<div style={{display:"grid",gap:12}}>{SUBJECTS.map(sub=>{const d=subjectScores[sub];return(
        <div key={sub} style={cardBox}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h4 style={{margin:0,fontSize:16,fontWeight:600,display:"flex",alignItems:"center",gap:8}}><span style={{width:10,height:10,borderRadius:"50%",background:SUBJECT_COLOR[sub]}}/>{sub}</h4><span style={{fontSize:22,fontWeight:700,fontFamily:fontMono,color:d.score>=60?GOOD:d.score>=30?AMBER:BAD}}>{d.score}/{d.total*4}</span></div>
          <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",background:"#eee",marginBottom:10}}><div style={{width:`${d.correct/d.total*100}%`,background:GOOD}}/><div style={{width:`${d.incorrect/d.total*100}%`,background:BAD}}/></div>
          <div style={{display:"flex",gap:18,fontSize:12.5,color:SLATE}}><span>Correct {d.correct}</span><span>Incorrect {d.incorrect}</span><span>Skipped {d.unattempted}</span><span>{Math.round(d.time/60)}m</span></div>
        </div>);})}</div>}
      {tab==="chapters"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={cardBox}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:600,color:BAD,display:"flex",alignItems:"center",gap:8}}><span style={{width:9,height:9,borderRadius:"50%",background:BAD}}/>Needs work</h4>
          {weakC.length===0?<p style={{fontSize:13,color:SLATE}}>Nothing below 50% — well done.</p>:weakC.map(([c,d])=><div key={c} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f0ede2",fontSize:13}}><span>{c}</span><span style={{fontWeight:600,color:BAD,fontFamily:fontMono}}>{d.correct}/{d.total}</span></div>)}</div>
        <div style={cardBox}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:600,color:GOOD,display:"flex",alignItems:"center",gap:8}}><span style={{width:9,height:9,borderRadius:"50%",background:GOOD}}/>Strong</h4>
          {strongC.length===0?<p style={{fontSize:13,color:SLATE}}>Keep practising.</p>:strongC.map(([c,d])=><div key={c} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f0ede2",fontSize:13}}><span>{c}</span><span style={{fontWeight:600,color:GOOD,fontFamily:fontMono}}>{d.correct}/{d.total}</span></div>)}</div>
      </div>}
      {tab==="questions"&&<div style={{background:WHITE,borderRadius:6,border:`1px solid ${PAPER_LINE}`,overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
          <thead><tr style={{background:PAPER}}>{["#","Sub","Chapter","Status","Yours","Ans","Time"].map(h=><th key={h} style={{padding:"10px 8px",textAlign:"left",borderBottom:`1px solid ${PAPER_LINE}`,fontWeight:600,color:SLATE}}>{h}</th>)}</tr></thead>
          <tbody>{qDetails.map((q,i)=><tr key={i} style={{borderBottom:"1px solid #f0ede2",background:q.status==="correct"?"rgba(46,125,79,0.05)":q.status==="incorrect"?"rgba(180,64,42,0.05)":WHITE}}>
            <td style={{padding:"6px 8px",fontWeight:600}}>{i+1}</td><td style={{padding:"6px 8px"}}>{q.subject?.slice(0,4)}</td><td style={{padding:"6px 8px"}}>{q.chapter}</td>
            <td style={{padding:"6px 8px"}}><span style={{padding:"2px 8px",borderRadius:3,fontSize:11,fontWeight:600,background:q.status==="correct"?"#d1fae5":q.status==="incorrect"?"#fee2e2":"#eee",color:q.status==="correct"?"#065f46":q.status==="incorrect"?"#991b1b":"#6b7280"}}>{q.status==="correct"?"Correct":q.status==="incorrect"?"Wrong":"Skipped"}</span></td>
            <td style={{padding:"6px 8px",fontFamily:fontMono}}>{q.userAnswer!==undefined?(q.isNum?q.userAnswer:String.fromCharCode(65+parseInt(q.userAnswer))):"—"}</td>
            <td style={{padding:"6px 8px",fontFamily:fontMono,fontWeight:600}}>{q.isNum?q.correct:String.fromCharCode(65+q.correct)}</td>
            <td style={{padding:"6px 8px"}}>{q.timeTaken?Math.round(q.timeTaken)+"s":"—"}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </div>
  );
}

/* ================================================================
   DASHBOARD OVERVIEW  (real data via props; demo fallback)
   ================================================================ */
const STAT_ICON = { tests: FileText, best: Trophy, avg: TrendingUp, acc: Target, solved: CheckCircle2 };

export function DashboardOverview({onHome,onStart,onBuddy,onProfile,onLogout,onFreeTest,profile,statCards,history,subjectTrends}) {
  const demoHist=[{t:"M1",s:120},{t:"M2",s:145},{t:"M3",s:138},{t:"M4",s:162},{t:"M5",s:178},{t:"M6",s:171},{t:"M7",s:195}];
  const demoSubT=[{t:"M1",P:42,C:38,M:40},{t:"M2",P:48,C:45,M:52},{t:"M3",P:44,C:50,M:44},{t:"M4",P:56,C:52,M:54},{t:"M5",P:62,C:58,M:58},{t:"M6",P:58,C:55,M:58},{t:"M7",P:68,C:62,M:65}];
  const demoCards=[{v:"7",l:"Tests",k:"tests",c:PHYSICS},{v:"195",l:"Best score",k:"best",c:AMBER},{v:"158",l:"Avg score",k:"avg",c:CHEM},{v:"92%",l:"Best accuracy",k:"acc",c:MATHS},{v:"525",l:"Questions solved",k:"solved",c:SLATE}];
  const hist = history && history.length ? history : demoHist;
  const subT = subjectTrends && subjectTrends.length ? subjectTrends : demoSubT;
  const cards = statCards && statCards.length ? statCards : demoCards;
  const cardBox = {background:WHITE,borderRadius:6,padding:20,border:`1px solid ${PAPER_LINE}`};
  const headBtn = (bg,color,extra={})=>({padding:"9px 15px",background:bg,color,border:"none",borderRadius:4,fontWeight:600,fontSize:12.5,cursor:"pointer",...extra});
  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"28px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:26,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:12,color:"#9a6a1c",fontWeight:600,letterSpacing:"0.14em",fontFamily:fontMono}}>DASHBOARD</div>
          <h2 style={{margin:"6px 0 0",fontSize:24,fontWeight:700,color:INK}}>{profile?.name ? `${profile.name.split(" ")[0]}'s progress` : "Your progress"}</h2>
          {profile?.username&&<div style={{fontSize:13,color:SLATE,marginTop:3}}>@{profile.username}{profile.class_level?` · Class ${profile.class_level==="dropper"?"— Dropper":profile.class_level}`:""}</div>}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={onStart} style={headBtn(AMBER,INK)}>Take test</button>
          {onFreeTest&&<button onClick={onFreeTest} style={headBtn("transparent",GRAPHITE,{border:`1px solid ${PAPER_LINE}`})}>Free test</button>}
          <button onClick={onBuddy} style={headBtn(INK,PAPER,{display:"inline-flex",alignItems:"center",gap:6})}><Bot size={14}/> Assistant</button>
          {onProfile&&<button onClick={onProfile} style={headBtn("transparent",GRAPHITE,{border:`1px solid ${PAPER_LINE}`})}>Profile</button>}
          {onLogout&&<button onClick={onLogout} style={headBtn("transparent",BAD,{border:`1px solid ${BAD}55`})}>Log out</button>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:22}}>
        {cards.map(c=>{const Ic=STAT_ICON[c.k]||FileText;return(
          <div key={c.l} style={{...cardBox,padding:"18px 16px"}}>
            <div style={{width:32,height:32,borderRadius:6,background:`${c.c}18`,color:c.c,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><Ic size={16}/></div>
            <div style={{fontSize:22,fontWeight:700,color:INK,fontFamily:fontMono}}>{c.v}</div>
            <div style={{fontSize:11.5,color:SLATE,marginTop:2}}>{c.l}</div>
          </div>
        );})}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={cardBox}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:600}}>Score trend</h4>
          <ResponsiveContainer width="100%" height={200}><LineChart data={hist}><CartesianGrid strokeDasharray="3 3" stroke="#eee"/><XAxis dataKey="t" fontSize={11}/><YAxis fontSize={11}/><Tooltip/><Line type="monotone" dataKey="s" stroke={AMBER} strokeWidth={2} dot={{r:4}}/></LineChart></ResponsiveContainer></div>
        <div style={cardBox}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:600}}>Subject accuracy</h4>
          <ResponsiveContainer width="100%" height={200}><LineChart data={subT}><CartesianGrid strokeDasharray="3 3" stroke="#eee"/><XAxis dataKey="t" fontSize={11}/><YAxis fontSize={11} domain={[0,100]}/><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize:10}}/>
            <Line type="monotone" dataKey="P" stroke={PHYSICS} strokeWidth={2} name="Phy"/><Line type="monotone" dataKey="C" stroke={CHEM} strokeWidth={2} name="Chem"/><Line type="monotone" dataKey="M" stroke={MATHS} strokeWidth={2} name="Math"/></LineChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}

/* ================================================================
   AI ASSISTANT
   ================================================================ */
export function AIBuddy({onHome,result}) {
  const [msgs,setMsgs]=useState([{r:"b",t:"Hi — I'm your JeeX study assistant. I can see your weak chapters, your timing patterns, and where marks are slipping. Ask me about strategy, what to revise next, or a specific doubt."}]);
  const [inp,setInp]=useState("");const[typing,setTyping]=useState(false);const ref=useRef(null);
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[msgs]);

  const respond=(m)=>{const l=m.toLowerCase();
    if(l.includes("weak")||l.includes("improve")){if(result){const w=Object.entries(result.chapterScores).filter(([,d])=>d.total>0&&d.correct/d.total<0.5).map(([c])=>c);return`Your weakest chapters right now: ${w.join(", ")||"none — you're above 50% everywhere"}. I'd put about two focused hours a day into these. Want a study plan?`;}return"Take a mock test first — I need some data before I can pinpoint your weak areas.";}
    if(l.includes("score")||l.includes("rank")){if(result)return`You scored ${result.score}/${result.maxScore} with ${((result.correct/(result.correct+result.incorrect))*100).toFixed(1)}% accuracy. You left ${result.unattempted} unattempted — that's recoverable marks.`;return"No test data yet. Take a mock and I'll break down your score and predicted rank.";}
    if(l.includes("time")||l.includes("speed"))return"A workable rule: ~55 minutes per subject, 1.5–2 min per MCQ and ~3 min per numerical. If a question runs past 3 minutes, mark it for review and move on. Save the last 15 minutes for the marked ones.";
    if(l.includes("physic"))return"Priority order: Current Electricity and Electrostatics (~25 marks a year), then Mechanics (NLM, WEP, Rotation), Modern Physics for quick marks, and Optics. HC Verma first, then DC Pandey for practice.";
    if(l.includes("chem"))return"Inorganic: read NCERT thoroughly, more than once. Physical: drill numericals. Organic: master the named reactions and mechanisms. NCERT alone accounts for a large share of the Chemistry paper.";
    if(l.includes("math"))return"Highest return: Coordinate Geometry and Calculus (roughly 20–25 marks each), then Algebra — Matrices, Permutations & Combinations, Probability. Work through chapter-wise PYQs from the last five years.";
    if(l.includes("stress")||l.includes("motivat")||l.includes("anxious"))return"Take a breath. Work in 50-minute blocks with 10-minute breaks, keep some daily exercise, and protect 7+ hours of sleep. Consistency beats burnout — you're doing fine.";
    if(l.includes("plan")||l.includes("schedule"))return"A sample day:\n6–8am  Weakest subject\n8–10am  Chapter revision\n10–11am  Break\n11am–1pm  Timed problems\n2–4pm  Mock sections\n4–5pm  PYQs\n5–6pm  Error analysis\n7–8pm  Formula review\nWeekends: one full mock + analysis.";
    return"Focus on why a formula works, not just what it says — if you can explain a concept plainly, you own it. Which topic should we dig into?";
  };

  const send=()=>{if(!inp.trim())return;const m=inp.trim();setMsgs(p=>[...p,{r:"u",t:m}]);setInp("");setTyping(true);setTimeout(()=>{setMsgs(p=>[...p,{r:"b",t:respond(m)}]);setTyping(false);},550+Math.random()*550);};
  const quicks=["How did I do?","Weak chapters","Physics tips","Chemistry tips","Maths strategy","Time management","Feeling stressed","Daily plan"];

  return (
    <div style={{maxWidth:720,margin:"0 auto",padding:"22px 16px",height:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:40,height:40,borderRadius:8,background:AMBER,display:"flex",alignItems:"center",justifyContent:"center",color:INK}}><Bot size={22}/></div>
          <div><h3 style={{margin:0,fontSize:16,fontWeight:600}}>JeeX study assistant</h3><span style={{fontSize:11.5,color:GOOD,display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:GOOD}}/>Online</span></div>
        </div>
        <button onClick={onHome} style={{padding:"9px 16px",background:"transparent",color:GRAPHITE,border:`1px solid ${PAPER_LINE}`,borderRadius:4,fontWeight:600,fontSize:13,cursor:"pointer"}}>Back</button>
      </div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12,flexShrink:0}}>
        {quicks.map(a=><button key={a} onClick={()=>{setMsgs(p=>[...p,{r:"u",t:a}]);setTyping(true);setTimeout(()=>{setMsgs(p=>[...p,{r:"b",t:respond(a)}]);setTyping(false);},650);}}
          style={{padding:"5px 12px",borderRadius:100,border:`1px solid ${PAPER_LINE}`,background:WHITE,fontSize:11.5,color:SLATE,cursor:"pointer",fontWeight:500}}>{a}</button>)}
      </div>
      <div ref={ref} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingBottom:10}}>
        {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.r==="u"?"flex-end":"flex-start",animation:"cj-pop 0.25s ease"}}>
          <div style={{maxWidth:"82%",padding:"12px 15px",borderRadius:m.r==="u"?"12px 12px 3px 12px":"12px 12px 12px 3px",background:m.r==="u"?INK:WHITE,color:m.r==="u"?PAPER:GRAPHITE,fontSize:13.5,lineHeight:1.6,border:m.r==="b"?`1px solid ${PAPER_LINE}`:"none",whiteSpace:"pre-wrap"}}>{m.t}</div>
        </div>)}
        {typing&&<div style={{display:"flex"}}><div style={{padding:"12px 15px",borderRadius:"12px 12px 12px 3px",background:WHITE,border:`1px solid ${PAPER_LINE}`,fontSize:13,color:SLATE}}><span style={{animation:"cj-pulse 1.4s infinite"}}>Thinking…</span></div></div>}
      </div>
      <div style={{display:"flex",gap:8,flexShrink:0,paddingTop:10,borderTop:`1px solid ${PAPER_LINE}`}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about JEE prep…" style={{flex:1,padding:"12px 15px",borderRadius:4,border:`1px solid ${PAPER_LINE}`,fontSize:13.5,outline:"none",fontFamily:"inherit",background:WHITE,color:GRAPHITE}}/>
        <button onClick={send} style={{padding:"12px 20px",background:AMBER,color:INK,border:"none",borderRadius:4,fontWeight:600,fontSize:13.5,cursor:"pointer"}}>Send</button>
      </div>
    </div>
  );
}
