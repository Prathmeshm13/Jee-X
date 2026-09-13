import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, CartesianGrid, Legend } from "recharts";

/* ================================================================
   DATA — Questions, Fun Facts, Trivia
   ================================================================ */
const HERO_QUESTIONS = [
  { q: "The de Broglie wavelength of an electron accelerated through 100V is approximately:", ops: ["0.123 nm", "1.23 nm", "0.0123 nm", "12.3 nm"], ans: 0, year: "JEE Advanced 2019", funFact: "When this was asked, only 14% of students got it right. The concept was proposed by Louis de Broglie in his PhD thesis — the shortest PhD thesis to ever win a Nobel Prize!", chapter: "Modern Physics", diff: "Medium" },
  { q: "The number of sp² hybridized carbon atoms in Aspirin (C₉H₈O₄) is:", ops: ["6", "7", "9", "3"], ans: 1, year: "JEE Advanced 2023", funFact: "Aspirin was originally derived from willow bark. Ancient Egyptians used it 3,500 years ago. And yes, JEE expects you to know its structure!", chapter: "Organic Chemistry", diff: "Hard" },
  { q: "If f(x) = x·[x], where [·] is the greatest integer function, then f(x) is:", ops: ["Continuous at x=2", "Discontinuous at x=2", "Differentiable at x=2", "None of these"], ans: 1, year: "IIT-JEE 1995", funFact: "This question appeared when Sundar Pichai was preparing for IIT entrance. He went on to top the batch at IIT Kharagpur. Think you can match that? 🏆", chapter: "Limits & Continuity", diff: "Medium" },
  { q: "A charged particle moves in a helical path. It must be under:", ops: ["Electric field only", "Magnetic field only", "Both E and B fields", "Magnetic field with velocity at angle"], ans: 3, year: "JEE Main 2024", funFact: "This concept powers the Large Hadron Collider at CERN — the same machine that discovered the Higgs Boson. Your physics chapter = Nobel Prize-winning science!", chapter: "Magnetic Effects", diff: "Easy" },
  { q: "The compound that does NOT show optical isomerism:", ops: ["[Co(en)₃]³⁺", "[Co(en)₂Cl₂]⁺", "[Co(NH₃)₆]³⁺", "[Cr(ox)₃]³⁻"], ans: 2, year: "JEE Advanced 2018", funFact: "Coordination chemistry questions have appeared in EVERY JEE Advanced paper since 2010. This is literally free marks if you master it!", chapter: "Coordination Compounds", diff: "Hard" },
  { q: "The value of lim(n→∞) (1 + 1/n)ⁿ equals:", ops: ["1", "∞", "e", "0"], ans: 2, year: "IIT-JEE 1998", funFact: "Euler's number 'e' was discovered in 1683. It appears in compound interest, population growth, and even in how your phone's battery decays. Math is everywhere! 🌍", chapter: "Limits", diff: "Easy" },
  { q: "The nuclear reaction ²H + ²H → ³He + n is an example of:", ops: ["Nuclear fission", "Nuclear fusion", "Radioactive decay", "Artificial transmutation"], ans: 1, year: "JEE Main 2022", funFact: "This exact reaction powers the Sun. Every second, the Sun converts 600 million tons of hydrogen. And you thought your JEE prep schedule was intense... ☀️", chapter: "Nuclear Physics", diff: "Easy" },
  { q: "Benzene reacts with CH₃Cl/AlCl₃. This reaction is called:", ops: ["Wurtz reaction", "Friedel-Crafts alkylation", "Kolbe reaction", "Sandmeyer reaction"], ans: 1, year: "IIT-JEE 2001", funFact: "Charles Friedel and James Crafts discovered this in 1877. Friedel-Crafts is the most asked named reaction in JEE history — appeared 23 times in 30 years!", chapter: "Organic Chemistry", diff: "Easy" },
  { q: "A matrix A satisfies A² = I. Then A is called:", ops: ["Nilpotent", "Idempotent", "Involutory", "Orthogonal"], ans: 2, year: "JEE Advanced 2020", funFact: "Matrix questions contribute ~8-12 marks every year in JEE Main. Most students skip them thinking they're hard. Spoiler: they're actually the most formulaic!", chapter: "Matrices", diff: "Medium" },
  { q: "The Gibbs free energy change for a spontaneous process is:", ops: ["Positive", "Zero", "Negative", "Can be anything"], ans: 2, year: "JEE Main 2023", funFact: "Josiah Willard Gibbs was so ahead of his time that even his professors couldn't understand his work. He published it anyway. Legend behavior. 🐐", chapter: "Thermodynamics", diff: "Easy" },
];

const FLOATING_SYMBOLS = ["∫", "∑", "π", "∞", "Δ", "λ", "θ", "Ω", "∇", "ε", "μ", "α", "β", "γ", "φ", "ψ", "→", "⊗", "∂", "√", "≈", "≠", "±", "÷"];

const SUBJECTS = ["Physics", "Chemistry", "Mathematics"];
const NTA_COLORS = { notVisited: "#c0c0c0", notAnswered: "#e74c3c", answered: "#27ae60", markedReview: "#9b59b6", answeredMarked: "#7d3c98" };

/* ================================================================
   STYLES (injected via <style> tag in a useEffect)
   ================================================================ */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
@keyframes float { 0%,100%{transform:translateY(0) rotate(0deg);opacity:0.08} 50%{transform:translateY(-30px) rotate(15deg);opacity:0.15} }
@keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes slideLeft { from{transform:translateX(80px);opacity:0} to{transform:translateX(0);opacity:1} }
@keyframes slideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(-120%);opacity:0} }
@keyframes popIn { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes countUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes correctFlash { 0%{box-shadow:0 0 0 0 rgba(39,174,96,0.5)} 70%{box-shadow:0 0 0 15px rgba(39,174,96,0)} 100%{box-shadow:0 0 0 0 rgba(39,174,96,0)} }
@keyframes wrongShake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
@keyframes confetti { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(120px) rotate(720deg);opacity:0} }
@keyframes streakFire { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
body { margin:0; }
* { box-sizing: border-box; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
`;

/* ================================================================
   MAIN APP
   ================================================================ */
export default function App() {
  const [page, setPage] = useState("home");
  const [testResult, setTestResult] = useState(null);
  const [streak, setStreak] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", background: "#f8f9fc", minHeight: "100vh", color: "#12133a" }}>
      {page === "home" && <HomePage onStart={() => setPage("test")} onDashboard={() => setPage("dashboard")} onBuddy={() => setPage("buddy")} streak={streak} setStreak={setStreak} totalSolved={totalSolved} setTotalSolved={setTotalSolved} />}
      {page === "test" && <TestInterface onFinish={(r) => { setTestResult(r); setPage("analysis"); }} onBack={() => setPage("home")} />}
      {page === "analysis" && <AnalysisDashboard result={testResult} onHome={() => setPage("home")} onBuddy={() => setPage("buddy")} />}
      {page === "dashboard" && <DashboardOverview onHome={() => setPage("home")} onStart={() => setPage("test")} onBuddy={() => setPage("buddy")} />}
      {page === "buddy" && <AIBuddy onHome={() => setPage("home")} result={testResult} />}
    </div>
  );
}

/* ================================================================
   FLOATING MATH SYMBOLS BACKGROUND
   ================================================================ */
function FloatingSymbols() {
  const symbols = useMemo(() => FLOATING_SYMBOLS.map((s, i) => ({
    char: s, left: `${(i * 4.16) % 100}%`, top: `${(i * 7.3 + 10) % 90}%`,
    size: 18 + (i % 4) * 10, dur: 6 + (i % 5) * 2, delay: i * 0.4,
  })), []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {symbols.map((s, i) => (
        <span key={i} style={{ position: "absolute", left: s.left, top: s.top, fontSize: s.size, fontFamily: "'JetBrains Mono', monospace", color: "#6c63ff", opacity: 0.08, animation: `float ${s.dur}s ease-in-out ${s.delay}s infinite`, userSelect: "none" }}>{s.char}</span>
      ))}
    </div>
  );
}

/* ================================================================
   QUESTION CARD SLIDER — The Star of the Show
   ================================================================ */
function QuestionSlider({ streak, setStreak, totalSolved, setTotalSolved }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [animState, setAnimState] = useState("idle"); // idle | correct | wrong | sliding
  const [showFact, setShowFact] = useState(false);
  const [confettiParts, setConfettiParts] = useState([]);
  const current = HERO_QUESTIONS[idx % HERO_QUESTIONS.length];

  const handleSelect = (oi) => {
    if (revealed) return;
    setSelected(oi);
    setRevealed(true);
    setTotalSolved(p => p + 1);
    if (oi === current.ans) {
      setAnimState("correct");
      setStreak(p => p + 1);
      setConfettiParts(Array.from({ length: 12 }, (_, i) => ({ id: i, x: Math.random() * 100, color: ["#6c63ff", "#27ae60", "#f1c40f", "#e74c3c", "#3498db"][i % 5] })));
    } else {
      setAnimState("wrong");
      setStreak(0);
    }
    setTimeout(() => setShowFact(true), 600);
  };

  const handleNext = () => {
    setAnimState("sliding");
    setTimeout(() => {
      setIdx(p => p + 1);
      setSelected(null);
      setRevealed(false);
      setAnimState("idle");
      setShowFact(false);
      setConfettiParts([]);
    }, 350);
  };

  const handleSkip = () => {
    setStreak(0);
    handleNext();
  };

  const diffColor = current.diff === "Easy" ? "#27ae60" : current.diff === "Medium" ? "#f39c12" : "#e74c3c";

  return (
    <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
      {/* Streak + Score Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20, animation: streak > 2 ? "streakFire 0.5s ease infinite" : "none" }}>{streak > 0 ? "🔥" : "💤"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: streak > 0 ? "#e17055" : "#999" }}>{streak > 0 ? `${streak} streak!` : "Start a streak!"}</span>
        </div>
        <div style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>
          Question {(idx % HERO_QUESTIONS.length) + 1}/{HERO_QUESTIONS.length} · <b style={{ color: "#6c63ff" }}>{totalSolved} solved today</b>
        </div>
      </div>

      {/* Confetti Layer */}
      {confettiParts.length > 0 && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
          {confettiParts.map(p => (
            <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: 0, width: 8, height: 8, borderRadius: 2, background: p.color, animation: `confetti 1.2s ease-out ${p.id * 0.05}s forwards` }} />
          ))}
        </div>
      )}

      {/* Main Card */}
      <div style={{
        background: "#fff", borderRadius: 20, padding: "28px 24px", border: "1px solid #e5e7f0",
        boxShadow: animState === "correct" ? "0 0 0 3px #27ae6040, 0 12px 40px #27ae6020" : animState === "wrong" ? "0 0 0 3px #e74c3c40" : "0 8px 30px rgba(108,99,255,0.08)",
        animation: animState === "sliding" ? "slideOut 0.35s ease forwards" : animState === "wrong" ? "wrongShake 0.4s ease" : animState === "correct" ? "correctFlash 0.6s ease" : "slideLeft 0.4s ease",
        transition: "box-shadow 0.3s",
        position: "relative", overflow: "hidden",
      }}>
        {/* Card Header Tags */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, background: "#6c63ff10", color: "#6c63ff", fontWeight: 700, letterSpacing: 0.5 }}>{current.year}</span>
          <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, background: `${diffColor}15`, color: diffColor, fontWeight: 700 }}>{current.diff}</span>
          <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, background: "#f8f9fc", color: "#888", fontWeight: 600 }}>{current.chapter}</span>
        </div>

        {/* Question Text */}
        <p style={{ fontSize: 16, lineHeight: 1.7, fontWeight: 500, margin: "0 0 20px", color: "#1a1a2e" }}>{current.q}</p>

        {/* Options */}
        <div style={{ display: "grid", gap: 8 }}>
          {current.ops.map((op, oi) => {
            const isCorrect = oi === current.ans;
            const isSelected = oi === selected;
            let bg = "#f8f9fc", border = "#e5e7f0", textCol = "#333";
            if (revealed) {
              if (isCorrect) { bg = "#d4edda"; border = "#27ae60"; textCol = "#155724"; }
              else if (isSelected && !isCorrect) { bg = "#f8d7da"; border = "#e74c3c"; textCol = "#721c24"; }
            } else if (isSelected) { bg = "#eee8ff"; border = "#6c63ff"; textCol = "#6c63ff"; }

            return (
              <button key={oi} onClick={() => handleSelect(oi)} disabled={revealed}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: bg, border: `2px solid ${border}`, cursor: revealed ? "default" : "pointer", transition: "all 0.2s", textAlign: "left", fontFamily: "inherit", fontSize: 14, color: textCol, fontWeight: isSelected || (revealed && isCorrect) ? 600 : 400, position: "relative" }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 8, background: revealed && isCorrect ? "#27ae60" : isSelected ? "#6c63ff" : "#e5e7f0", color: (revealed && isCorrect) || isSelected ? "#fff" : "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, transition: "all 0.2s" }}>
                  {revealed && isCorrect ? "✓" : revealed && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + oi)}
                </span>
                {op}
              </button>
            );
          })}
        </div>

        {/* Fun Fact Reveal */}
        {showFact && (
          <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "linear-gradient(135deg, #ffecd2, #fcb69f20)", border: "1px solid #f5cba740", animation: "popIn 0.4s ease" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#e17055", marginBottom: 4, letterSpacing: 0.5 }}>💡 DID YOU KNOW?</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#5a3e2b", margin: 0 }}>{current.funFact}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {revealed ? (
            <button onClick={handleNext} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#6c63ff", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "transform 0.1s" }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
              Next Question →
            </button>
          ) : (
            <button onClick={handleSkip} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "transparent", color: "#999", border: "2px dashed #ddd", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* Progress Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
        {HERO_QUESTIONS.map((_, i) => (
          <div key={i} style={{ width: i === idx % HERO_QUESTIONS.length ? 20 : 6, height: 6, borderRadius: 3, background: i === idx % HERO_QUESTIONS.length ? "#6c63ff" : i < idx % HERO_QUESTIONS.length ? "#27ae60" : "#ddd", transition: "all 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   ANIMATED COUNTER
   ================================================================ */
function AnimCounter({ end, suffix = "", prefix = "", dur = 1500 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { setStarted(true); } }, { threshold: 0.3 });
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
   HOME PAGE — The Addictive Landing
   ================================================================ */
function HomePage({ onStart, onDashboard, onBuddy, streak, setStreak, totalSolved, setTotalSolved }) {
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { setTimeout(() => setHeroVisible(true), 100); }, []);

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <FloatingSymbols />

      {/* NAV BAR */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6c63ff, #a29bfe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>C</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#12133a" }}>crack<span style={{ color: "#6c63ff" }}>JEE</span></span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onDashboard} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #e2e5f0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#555", fontFamily: "inherit" }}>Dashboard</button>
          <button onClick={onStart} style={{ padding: "8px 16px", background: "#6c63ff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>Start Mock Test</button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ position: "relative", zIndex: 5, maxWidth: 1100, margin: "0 auto", padding: "20px 24px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", minHeight: 520 }}>
        {/* Left — Text */}
        <div style={{ animation: heroVisible ? "slideUp 0.6s ease" : "none", opacity: heroVisible ? 1 : 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "#ffecd2", marginBottom: 16, fontSize: 12, fontWeight: 600, color: "#e17055" }}>
            🔥 {streak > 0 ? `${streak} question streak — keep going!` : "Warm up with a question →"}
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, margin: "0 0 16px", color: "#12133a" }}>
            Don't just <span style={{ color: "#6c63ff", textDecoration: "underline", textDecorationStyle: "wavy", textUnderlineOffset: 6, textDecorationColor: "#6c63ff50" }}>prepare</span> for JEE.<br/>
            <span style={{ background: "linear-gradient(135deg, #6c63ff, #e17055)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200% 200%", animation: "gradientShift 4s ease infinite" }}>Practice like it's the real exam.</span>
          </h1>
          <p style={{ fontSize: 16, color: "#666", lineHeight: 1.7, margin: "0 0 28px", maxWidth: 420 }}>
            NTA-identical mock tests. AI that knows your weak chapters.
            Rank predictions that actually work. And questions that come with stories.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={onStart} style={{ padding: "14px 28px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 15px #6c63ff30", transition: "transform 0.15s" }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
              Take Full Mock Test
            </button>
            <button onClick={onBuddy} style={{ padding: "14px 28px", background: "#fff", color: "#6c63ff", border: "2px solid #6c63ff30", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
              🤖 Talk to AI Buddy
            </button>
          </div>

          {/* Social Proof */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 28 }}>
            <div style={{ display: "flex" }}>
              {["😎", "🧑‍💻", "👩‍🔬", "🤓"].map((e, i) => (
                <div key={i} style={{ width: 30, height: 30, borderRadius: 15, background: ["#6c63ff20", "#e1705520", "#27ae6020", "#3498db20"][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginLeft: i > 0 ? -8 : 0, border: "2px solid #fff" }}>{e}</div>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#888" }}><b style={{ color: "#12133a" }}>2,340+</b> students practicing today</span>
          </div>
        </div>

        {/* Right — Interactive Question Card */}
        <div style={{ animation: heroVisible ? "slideLeft 0.6s ease 0.2s both" : "none" }}>
          <QuestionSlider streak={streak} setStreak={setStreak} totalSolved={totalSolved} setTotalSolved={setTotalSolved} />
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ position: "relative", zIndex: 5, maxWidth: 1100, margin: "0 auto", padding: "0 24px 40px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 32px", border: "1px solid #e5e7f0", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
          {[
            { icon: "📚", value: 15000, suffix: "+", label: "PYQ Database", color: "#6c63ff" },
            { icon: "🎯", value: 98, suffix: "%", label: "NTA Accuracy", color: "#27ae60" },
            { icon: "🧠", value: 50, suffix: "+", label: "AI Insights/Test", color: "#e17055" },
            { icon: "📈", value: 340, suffix: "+", label: "Rank Improved Avg", color: "#3498db" },
            { icon: "⚡", value: 75, suffix: "", label: "Questions/Mock", color: "#f39c12" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}><AnimCounter end={s.value} suffix={s.suffix} /></div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: "relative", zIndex: 5, maxWidth: 1100, margin: "0 auto", padding: "0 24px 40px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>Built by JEE survivors. For JEE warriors.</h2>
        <p style={{ textAlign: "center", color: "#888", fontSize: 14, marginBottom: 32 }}>Every feature exists because we wished we had it during our prep.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { icon: "🖥️", title: "NTA-Identical Interface", desc: "Same colors, same buttons, same palette, same timer. Your fingers will know the exam before your brain does.", tag: "NO SURPRISES" },
            { icon: "🔬", title: "Question-Level Analysis", desc: "Not just your score — every question dissected. Time spent, difficulty vs your accuracy, chapter heatmaps.", tag: "DEEP INSIGHTS" },
            { icon: "📊", title: "Live Rank Prediction", desc: "Your score → predicted JEE rank using real historical percentile-to-rank mapping data from NTA.", tag: "DATA DRIVEN" },
            { icon: "🤖", title: "AI Study Buddy", desc: "Knows your weak chapters, suggests what to study next, resolves doubts, and reminds you to sleep.", tag: "PERSONALIZED" },
          ].map((f, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", border: "1px solid #e5e7f0", transition: "transform 0.2s, box-shadow 0.2s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6c63ff", letterSpacing: 1, marginBottom: 12 }}>{f.tag}</div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "#777", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FOOTER */}
      <section style={{ position: "relative", zIndex: 5, maxWidth: 1100, margin: "0 auto", padding: "0 24px 50px" }}>
        <div style={{ background: "linear-gradient(135deg, #12133a, #2d1b69)", borderRadius: 20, padding: "40px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 10, right: 30, fontSize: 60, opacity: 0.05, fontFamily: "'JetBrains Mono'" }}>∫∑π</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>Stop scrolling. Start solving.</h2>
          <p style={{ fontSize: 14, color: "#a29bfe", margin: "0 0 24px" }}>Every minute on this page is a minute NOT spent on your preparation.</p>
          <button onClick={onStart} style={{ padding: "14px 36px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px #6c63ff50" }}>
            Take a Mock Test — Free Forever
          </button>
        </div>
      </section>
    </div>
  );
}

/* ================================================================
   NTA TEST INTERFACE (Same as before, compact)
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

function TestInterface({ onFinish, onBack }) {
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
    <div style={{maxWidth:800,margin:"0 auto",padding:"30px 20px",fontFamily:"'Space Grotesk',sans-serif"}}>
      <div style={{background:"#1a3a5c",color:"#fff",padding:"14px 20px",borderRadius:"12px 12px 0 0",fontWeight:700,fontSize:15}}>JEE (Main) 2025 — Mock Test</div>
      <div style={{background:"#fff",border:"1px solid #ccc",borderTop:0,borderRadius:"0 0 12px 12px",padding:24}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"#1a3a5c",margin:"0 0 16px"}}>General Instructions</h2>
        <div style={{fontSize:13,lineHeight:1.8,color:"#333"}}>
          <p style={{margin:"0 0 8px"}}>1. Total duration: <b>180 minutes</b>. Paper: <b>75 questions</b> (25/subject).</p>
          <p style={{margin:"0 0 8px"}}>2. Each subject: <b>Section A (20 MCQs)</b> + <b>Section B (5 Numerical)</b>.</p>
          <p style={{margin:"0 0 8px"}}>3. Marking: <b>+4 correct, -1 incorrect</b>.</p>
          <p style={{margin:"0 0 16px"}}>4. Question palette color codes:</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8,marginBottom:16}}>
            {[{c:NTA_COLORS.notVisited,l:"Not Visited"},{c:NTA_COLORS.notAnswered,l:"Not Answered"},{c:NTA_COLORS.answered,l:"Answered"},{c:NTA_COLORS.markedReview,l:"Marked for Review"},{c:NTA_COLORS.answeredMarked,l:"Answered & Marked"}].map(x=>(
              <div key={x.l} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:24,height:24,borderRadius:4,background:x.c}}/><span style={{fontSize:12}}>{x.l}</span></div>
            ))}
          </div>
          <p style={{margin:0}}>5. Click <b>"Save & Next"</b> to save your answer.</p>
        </div>
        <div style={{display:"flex",gap:12,marginTop:24}}>
          <button onClick={()=>{setShowInst(false);setStarted(true);}} style={{padding:"12px 32px",background:"#27ae60",color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Start Test</button>
          <button onClick={onBack} style={{padding:"12px 24px",background:"#eee",color:"#333",border:"none",borderRadius:8,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Go Back</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#eef1f5",overflow:"hidden",fontFamily:"'Space Grotesk',sans-serif"}}>
      <div style={{background:"#1a3a5c",color:"#fff",padding:"8px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <span style={{fontSize:14,fontWeight:700}}>JEE (Main) 2025 — Mock</span>
        <div style={{textAlign:"right"}}><div style={{fontSize:10,opacity:0.7}}>Time Left</div><div style={{fontSize:20,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:timeLeft<600?"#ff6b6b":"#4ade80"}}>{fmt(timeLeft)}</div></div>
      </div>
      <div style={{background:"#2c5282",display:"flex",flexShrink:0}}>
        {SUBJECTS.map(s=><button key={s} onClick={()=>{recTime();setCurSub(s);setCurIdx(0);}} style={{padding:"10px 28px",background:curSub===s?"#fff":"transparent",color:curSub===s?"#2c5282":"#fff",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",borderRadius:curSub===s?"6px 6px 0 0":0,fontFamily:"inherit"}}>{s}</button>)}
      </div>
      <div style={{background:"#e2e8f0",padding:"6px 16px",display:"flex",gap:16,flexShrink:0,borderBottom:"1px solid #cbd5e0"}}>
        <span onClick={()=>{recTime();setCurIdx(0);}} style={{fontSize:12,fontWeight:700,color:!isNum?"#2c5282":"#666",cursor:"pointer",borderBottom:!isNum?"2px solid #2c5282":"none",paddingBottom:2}}>Section A (MCQ)</span>
        <span onClick={()=>{recTime();setCurIdx(20);}} style={{fontSize:12,fontWeight:700,color:isNum?"#2c5282":"#666",cursor:"pointer",borderBottom:isNum?"2px solid #2c5282":"none",paddingBottom:2}}>Section B (Numerical)</span>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,padding:"16px 20px",overflowY:"auto",background:"#fff"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:700,color:"#1a3a5c"}}>Q {curIdx+1}/{curQs.length}</span>
            <span style={{fontSize:10,padding:"3px 8px",borderRadius:4,background:curQ.difficulty==="Easy"?"#d1fae5":curQ.difficulty==="Medium"?"#fef3c7":"#fee2e2",color:curQ.difficulty==="Easy"?"#065f46":curQ.difficulty==="Medium"?"#92400e":"#991b1b",fontWeight:600}}>{curQ.difficulty}</span>
          </div>
          <div style={{fontSize:15,lineHeight:1.7,padding:"16px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",marginBottom:16}}>{curQ.text}</div>
          {isNum?(
            <div><label style={{fontSize:13,fontWeight:600,color:"#555"}}>Enter your answer:</label>
            <input type="text" value={sel||""} onChange={e=>setSel(e.target.value)} style={{display:"block",marginTop:8,width:"100%",maxWidth:300,padding:"12px 16px",fontSize:16,border:"2px solid #cbd5e0",borderRadius:8,outline:"none",fontFamily:"'JetBrains Mono',monospace"}} placeholder="Type answer..."/></div>
          ):(
            <div style={{display:"grid",gap:8}}>
              {curQ.options.map((op,oi)=>(
                <label key={oi} onClick={()=>setSel(oi)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`2px solid ${sel===oi?"#6c63ff":"#e2e8f0"}`,background:sel===oi?"#f0efff":"#fff",cursor:"pointer",transition:"all 0.15s"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${sel===oi?"#6c63ff":"#aaa"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {sel===oi&&<div style={{width:12,height:12,borderRadius:"50%",background:"#6c63ff"}}/>}
                  </div>
                  <span style={{fontSize:14}}>({String.fromCharCode(65+oi)}) {op}</span>
                </label>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:8,marginTop:20,flexWrap:"wrap",borderTop:"1px solid #e2e8f0",paddingTop:16}}>
            <button onClick={saveNext} style={{padding:"10px 18px",background:"#27ae60",color:"#fff",border:"none",borderRadius:6,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Save & Next</button>
            <button onClick={markReview} style={{padding:"10px 18px",background:"#9b59b6",color:"#fff",border:"none",borderRadius:6,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Mark for Review</button>
            <button onClick={clearResp} style={{padding:"10px 18px",background:"#e74c3c",color:"#fff",border:"none",borderRadius:6,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
            <button onClick={()=>{recTime();if(curIdx>0)setCurIdx(i=>i-1);}} disabled={curIdx===0} style={{padding:"10px 18px",background:curIdx===0?"#ccc":"#3498db",color:"#fff",border:"none",borderRadius:6,fontWeight:700,fontSize:12,cursor:curIdx===0?"default":"pointer",fontFamily:"inherit"}}>← Prev</button>
            <button onClick={()=>setShowConfirm(true)} style={{padding:"10px 18px",background:"#1a3a5c",color:"#fff",border:"none",borderRadius:6,fontWeight:700,fontSize:12,cursor:"pointer",marginLeft:"auto",fontFamily:"inherit"}}>Submit</button>
          </div>
        </div>
        <div style={{width:210,background:"#f8fafc",borderLeft:"1px solid #ddd",padding:12,overflowY:"auto",flexShrink:0}}>
          <div style={{fontSize:12,fontWeight:700,color:"#1a3a5c",marginBottom:8,textAlign:"center"}}>Question Palette</div>
          {SUBJECTS.map(sub=>(
            <div key={sub} style={{marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"#555",marginBottom:4,borderBottom:"1px solid #ddd",paddingBottom:3}}>{sub}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3}}>
                {allQ[sub].map((q,idx)=>{const k=`${sub}-${q.id}`;const ic=curSub===sub&&curIdx===idx;return(
                  <div key={q.id} onClick={()=>{recTime();setCurSub(sub);setCurIdx(idx);}} style={{width:30,height:30,borderRadius:4,background:stColor(k),color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,cursor:"pointer",border:ic?"2px solid #12133a":"1px solid transparent"}}>{idx+1}</div>
                );})}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
        <div style={{background:"#fff",borderRadius:16,padding:32,maxWidth:420,width:"90%",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:8}}>⚠️</div><h3 style={{margin:"0 0 8px"}}>Submit Test?</h3>
          <div style={{fontSize:13,color:"#666",marginBottom:16}}>Answered: <b style={{color:"#27ae60"}}>{cnt("answered")+cnt("answeredMarked")}</b> | Unanswered: <b style={{color:"#e74c3c"}}>{totalQ-cnt("answered")-cnt("answeredMarked")}</b></div>
          <div style={{display:"flex",gap:12,justifyContent:"center"}}>
            <button onClick={doSubmit} style={{padding:"10px 28px",background:"#27ae60",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Submit</button>
            <button onClick={()=>setShowConfirm(false)} style={{padding:"10px 28px",background:"#eee",color:"#333",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Go Back</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

/* ================================================================
   ANALYSIS DASHBOARD
   ================================================================ */
function AnalysisDashboard({ result, onHome, onBuddy }) {
  const [tab, setTab] = useState("overview");
  if (!result) return <div style={{padding:40,textAlign:"center",fontFamily:"'Space Grotesk'"}}><p>No test data.</p><button onClick={onHome} style={{padding:"10px 24px",background:"#6c63ff",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit"}}>Home</button></div>;
  const {score,correct,incorrect,unattempted,total,maxScore,subjectScores,chapterScores,qDetails,totalTime}=result;
  const pct=((score/maxScore)*100).toFixed(1); const acc=correct>0?((correct/(correct+incorrect))*100).toFixed(1):0;
  const rank=s=>s>=280?"< 100":s>=250?"100-500":s>=220?"500-2K":s>=190?"2K-5K":s>=160?"5K-15K":s>=130?"15K-35K":s>=100?"35K-75K":s>=70?"75K-1.5L":"1.5L+";
  const pctile=s=>s>=280?"99.99+":s>=250?"99.95+":s>=220?"99.8+":s>=190?"99.5+":s>=160?"99+":s>=130?"98+":s>=100?"96+":s>=70?"92+":"<90";
  const subData=SUBJECTS.map(s=>({name:s.slice(0,4),correct:subjectScores[s].correct,incorrect:subjectScores[s].incorrect,unattempted:subjectScores[s].unattempted}));
  const pieD=[{name:"Correct",value:correct,color:"#27ae60"},{name:"Incorrect",value:incorrect,color:"#e74c3c"},{name:"Skipped",value:unattempted,color:"#bdc3c7"}];
  const radarD=Object.entries(chapterScores).slice(0,8).map(([c,d])=>({ch:c.length>12?c.slice(0,12)+"..":c,v:d.total>0?Math.round(d.correct/d.total*100):0}));
  const weakC=Object.entries(chapterScores).filter(([,d])=>d.total>0&&d.correct/d.total<0.5).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total);
  const strongC=Object.entries(chapterScores).filter(([,d])=>d.total>0&&d.correct/d.total>=0.5).sort((a,b)=>b[1].correct/b[1].total-a[1].correct/a[1].total);

  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"20px 16px",fontFamily:"'Space Grotesk',sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><div style={{fontSize:12,color:"#6c63ff",fontWeight:600,letterSpacing:2}}>TEST ANALYSIS</div><h2 style={{margin:"4px 0 0",fontSize:22,fontWeight:800}}>Performance Report</h2></div>
        <div style={{display:"flex",gap:8}}><button onClick={onBuddy} style={{padding:"8px 16px",background:"#e17055",color:"#fff",border:"none",borderRadius:8,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🤖 AI Buddy</button><button onClick={onHome} style={{padding:"8px 16px",background:"#eee",color:"#333",border:"none",borderRadius:8,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Home</button></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        {[{l:"Score",v:`${score}/${maxScore}`,c:"#6c63ff",s:pct+"%"},{l:"Predicted Rank",v:rank(score),c:"#e17055",s:"JEE 2025"},{l:"Percentile",v:pctile(score),c:"#27ae60",s:"Estimated"},{l:"Accuracy",v:acc+"%",c:"#f39c12",s:`${correct}/${correct+incorrect}`},{l:"Time",v:`${Math.round(totalTime/60)}m`,c:"#a29bfe",s:"of 180min"}].map(c=>(
          <div key={c.l} style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #e5e7f0",borderLeft:`4px solid ${c.c}`}}>
            <div style={{fontSize:10,color:"#888",fontWeight:600,textTransform:"uppercase"}}>{c.l}</div>
            <div style={{fontSize:22,fontWeight:800,color:c.c,margin:"4px 0 2px"}}>{c.v}</div>
            <div style={{fontSize:10,color:"#aaa"}}>{c.s}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:4,marginBottom:16,background:"#fff",borderRadius:10,padding:4,border:"1px solid #e5e7f0"}}>
        {["overview","subjects","chapters","questions"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",borderRadius:8,border:"none",background:tab===t?"#6c63ff":"transparent",color:tab===t?"#fff":"#666",fontWeight:600,fontSize:12,cursor:"pointer",textTransform:"capitalize",flex:1,fontFamily:"inherit"}}>{t}</button>)}
      </div>
      {tab==="overview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e5e7f0"}}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>Distribution</h4>
          <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={pieD} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}:${value}`}>{pieD.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
        <div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e5e7f0"}}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>Subject Breakdown</h4>
          <ResponsiveContainer width="100%" height={200}><BarChart data={subData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" fontSize={11}/><YAxis fontSize={11}/><Tooltip/><Bar dataKey="correct" fill="#27ae60" stackId="a"/><Bar dataKey="incorrect" fill="#e74c3c" stackId="a"/><Bar dataKey="unattempted" fill="#bdc3c7" stackId="a"/></BarChart></ResponsiveContainer></div>
        <div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e5e7f0",gridColumn:"1/-1"}}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>Chapter Accuracy</h4>
          <ResponsiveContainer width="100%" height={250}><RadarChart data={radarD}><PolarGrid/><PolarAngleAxis dataKey="ch" fontSize={10}/><PolarRadiusAxis angle={30} domain={[0,100]} fontSize={9}/><Radar dataKey="v" stroke="#6c63ff" fill="#6c63ff" fillOpacity={0.3}/></RadarChart></ResponsiveContainer></div>
      </div>}
      {tab==="subjects"&&<div style={{display:"grid",gap:12}}>{SUBJECTS.map(sub=>{const d=subjectScores[sub];return(
        <div key={sub} style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e5e7f0"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><h4 style={{margin:0,fontSize:16,fontWeight:700}}>{sub}</h4><span style={{fontSize:22,fontWeight:800,color:d.score>=60?"#27ae60":d.score>=30?"#f39c12":"#e74c3c"}}>{d.score}/{d.total*4}</span></div>
          <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",background:"#eee",marginBottom:10}}><div style={{width:`${d.correct/d.total*100}%`,background:"#27ae60"}}/><div style={{width:`${d.incorrect/d.total*100}%`,background:"#e74c3c"}}/></div>
          <div style={{display:"flex",gap:16,fontSize:12,color:"#666"}}>✅ {d.correct} | ❌ {d.incorrect} | ⬜ {d.unattempted} | ⏱️ {Math.round(d.time/60)}m</div>
        </div>);})}</div>}
      {tab==="chapters"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e5e7f0"}}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:"#e74c3c"}}>🔴 Weak</h4>
          {weakC.length===0?<p style={{fontSize:13,color:"#888"}}>None! 🎉</p>:weakC.map(([c,d])=><div key={c} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f0f0f0",fontSize:13}}><span>{c}</span><span style={{fontWeight:700,color:"#e74c3c"}}>{d.correct}/{d.total}</span></div>)}</div>
        <div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e5e7f0"}}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:"#27ae60"}}>🟢 Strong</h4>
          {strongC.length===0?<p style={{fontSize:13,color:"#888"}}>Keep trying!</p>:strongC.map(([c,d])=><div key={c} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f0f0f0",fontSize:13}}><span>{c}</span><span style={{fontWeight:700,color:"#27ae60"}}>{d.correct}/{d.total}</span></div>)}</div>
      </div>}
      {tab==="questions"&&<div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7f0",overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#f8fafc"}}>{["#","Sub","Chapter","Status","Yours","Ans","Time"].map(h=><th key={h} style={{padding:"10px 8px",textAlign:"left",borderBottom:"2px solid #e2e8f0",fontWeight:700}}>{h}</th>)}</tr></thead>
          <tbody>{qDetails.map((q,i)=><tr key={i} style={{borderBottom:"1px solid #f0f0f0",background:q.status==="correct"?"#f0fff4":q.status==="incorrect"?"#fff5f5":"#fff"}}>
            <td style={{padding:"6px 8px",fontWeight:600}}>{i+1}</td><td style={{padding:"6px 8px"}}>{q.subject?.slice(0,4)}</td><td style={{padding:"6px 8px"}}>{q.chapter}</td>
            <td style={{padding:"6px 8px"}}><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:q.status==="correct"?"#d1fae5":q.status==="incorrect"?"#fee2e2":"#f3f4f6",color:q.status==="correct"?"#065f46":q.status==="incorrect"?"#991b1b":"#6b7280"}}>{q.status==="correct"?"✓":q.status==="incorrect"?"✗":"—"}</span></td>
            <td style={{padding:"6px 8px",fontFamily:"monospace"}}>{q.userAnswer!==undefined?(q.isNum?q.userAnswer:String.fromCharCode(65+parseInt(q.userAnswer))):"—"}</td>
            <td style={{padding:"6px 8px",fontFamily:"monospace",fontWeight:600}}>{q.isNum?q.correct:String.fromCharCode(65+q.correct)}</td>
            <td style={{padding:"6px 8px"}}>{q.timeTaken?Math.round(q.timeTaken)+"s":"—"}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </div>
  );
}

/* ================================================================
   DASHBOARD OVERVIEW
   ================================================================ */
function DashboardOverview({onHome,onStart,onBuddy}) {
  const hist=[{t:"M1",s:120,d:"Aug 15"},{t:"M2",s:145,d:"Aug 22"},{t:"M3",s:138,d:"Aug 29"},{t:"M4",s:162,d:"Sep 5"},{t:"M5",s:178,d:"Sep 12"},{t:"M6",s:171,d:"Sep 19"},{t:"M7",s:195,d:"Sep 26"}];
  const subT=[{t:"M1",P:42,C:38,M:40},{t:"M2",P:48,C:45,M:52},{t:"M3",P:44,C:50,M:44},{t:"M4",P:56,C:52,M:54},{t:"M5",P:62,C:58,M:58},{t:"M6",P:58,C:55,M:58},{t:"M7",P:68,C:62,M:65}];
  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"24px 16px",fontFamily:"'Space Grotesk',sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div><div style={{fontSize:12,color:"#6c63ff",fontWeight:600,letterSpacing:2}}>DASHBOARD</div><h2 style={{margin:"4px 0 0",fontSize:22,fontWeight:800}}>Your Journey</h2></div>
        <div style={{display:"flex",gap:8}}><button onClick={onStart} style={{padding:"8px 16px",background:"#6c63ff",color:"#fff",border:"none",borderRadius:8,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Take Test</button><button onClick={onBuddy} style={{padding:"8px 16px",background:"#e17055",color:"#fff",border:"none",borderRadius:8,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🤖 Buddy</button><button onClick={onHome} style={{padding:"8px 16px",background:"#eee",color:"#333",border:"none",borderRadius:8,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Home</button></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:20}}>
        {[{v:"7",l:"Tests",i:"📝",c:"#6c63ff"},{v:"195",l:"Best Score",i:"🏆",c:"#f39c12"},{v:"158",l:"Avg Score",i:"📈",c:"#27ae60"},{v:"12🔥",l:"Streak Days",i:"",c:"#e17055"},{v:"525",l:"Qs Solved",i:"✅",c:"#a29bfe"}].map(c=>(
          <div key={c.l} style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #e5e7f0",textAlign:"center"}}><div style={{fontSize:22}}>{c.i}</div><div style={{fontSize:20,fontWeight:800,color:c.c}}>{c.v}</div><div style={{fontSize:10,color:"#888"}}>{c.l}</div></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e5e7f0"}}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>Score Trend</h4>
          <ResponsiveContainer width="100%" height={200}><LineChart data={hist}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="t" fontSize={11}/><YAxis fontSize={11} domain={[0,300]}/><Tooltip/><Line type="monotone" dataKey="s" stroke="#6c63ff" strokeWidth={2} dot={{r:4}}/></LineChart></ResponsiveContainer></div>
        <div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e5e7f0"}}><h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>Subject Trends</h4>
          <ResponsiveContainer width="100%" height={200}><LineChart data={subT}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="t" fontSize={11}/><YAxis fontSize={11} domain={[0,100]}/><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize:10}}/>
            <Line type="monotone" dataKey="P" stroke="#3498db" strokeWidth={2} name="Phy"/><Line type="monotone" dataKey="C" stroke="#27ae60" strokeWidth={2} name="Chem"/><Line type="monotone" dataKey="M" stroke="#e74c3c" strokeWidth={2} name="Math"/></LineChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}

/* ================================================================
   AI BUDDY
   ================================================================ */
function AIBuddy({onHome,result}) {
  const [msgs,setMsgs]=useState([{r:"b",t:"Hey! 👋 I'm your AI Study Buddy. I know your weak chapters, your time patterns, and where those marks are hiding. Ask me anything — doubts, strategy, what to study, or just vent!"}]);
  const [inp,setInp]=useState("");const[typing,setTyping]=useState(false);const ref=useRef(null);
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[msgs]);

  const respond=(m)=>{const l=m.toLowerCase();
    if(l.includes("weak")||l.includes("improve")){if(result){const w=Object.entries(result.chapterScores).filter(([,d])=>d.total>0&&d.correct/d.total<0.5).map(([c])=>c);return`Your weakest chapters: ${w.join(", ")||"None yet"}. Focus 2 hours/day on these. Want a study plan?`;}return"Take a mock test first! I need data to roast— I mean, help you.";}
    if(l.includes("score")||l.includes("rank")){if(result)return`Score: ${result.score}/${result.maxScore}. Accuracy: ${((result.correct/(result.correct+result.incorrect))*100).toFixed(1)}%. You left ${result.unattempted} unattempted — that's free marks on the table!`;return"No test data yet. Go take a test!";}
    if(l.includes("time")||l.includes("speed"))return"Golden rule: 55 min/subject. 1.5-2 min/MCQ, 3 min/numerical. >3 min on a question? Mark for review, MOVE ON. Last 15 min = marked questions only.";
    if(l.includes("physic"))return"Priority: 1) Current Electricity + Electrostatics (~25 marks/yr), 2) Mechanics (NLM, WEP, Rotation), 3) Modern Physics (easy marks), 4) Optics. Start HC Verma → DC Pandey.";
    if(l.includes("chem"))return"Inorganic = read NCERT 3x. Physical = N. Awasthi numericals. Organic = master named reactions from Himanshu Pandey. NCERT alone = 40+ marks in Chemistry!";
    if(l.includes("math"))return"High-ROI: Coordinate Geometry (20-25 marks), Calculus (20-25 marks), Algebra (Matrices, P&C, Probability). Practice: Cengage series + last 5 years PYQs chapter-wise.";
    if(l.includes("stress")||l.includes("motivat")||l.includes("scar"))return"Deep breath. 🧘 JEE is important, but it's not everything. Study 50-min blocks + 10-min breaks. Exercise daily. Sleep 7+ hours. Consistency > burnout. You've got this!";
    if(l.includes("plan")||l.includes("schedule"))return"Daily plan:\n6-8AM → Weakest subject\n8-10AM → Chapter revision\n10-11AM → Break\n11AM-1PM → Timed problems\n2-4PM → Mock sections\n4-5PM → PYQs\n5-6PM → Error analysis\n7-8PM → Formulas\nWeekends → Full mock + analysis";
    return"Focus on understanding WHY formulas work. If you can explain a concept simply, you truly know it. What specific topic should we work on?";
  };

  const send=()=>{if(!inp.trim())return;const m=inp.trim();setMsgs(p=>[...p,{r:"u",t:m}]);setInp("");setTyping(true);setTimeout(()=>{setMsgs(p=>[...p,{r:"b",t:respond(m)}]);setTyping(false);},600+Math.random()*600);};
  const quicks=["How did I do?","Weak chapters","Physics tips","Chemistry tips","Math strategy","Time management","I'm stressed","Daily plan"];

  return (
    <div style={{maxWidth:700,margin:"0 auto",padding:"20px 16px",height:"100vh",display:"flex",flexDirection:"column",fontFamily:"'Space Grotesk',sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#e17055,#fdcb6e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🤖</div>
          <div><h3 style={{margin:0,fontSize:16,fontWeight:700}}>AI Study Buddy</h3><span style={{fontSize:11,color:"#27ae60"}}>Online</span></div>
        </div>
        <button onClick={onHome} style={{padding:"8px 16px",background:"#eee",color:"#333",border:"none",borderRadius:8,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,flexShrink:0}}>
        {quicks.map(a=><button key={a} onClick={()=>{setMsgs(p=>[...p,{r:"u",t:a}]);setTyping(true);setTimeout(()=>{setMsgs(p=>[...p,{r:"b",t:respond(a)}]);setTyping(false);},700);}}
          style={{padding:"4px 12px",borderRadius:16,border:"1px solid #e2e5f0",background:"#fff",fontSize:11,color:"#555",cursor:"pointer",fontWeight:500,fontFamily:"inherit"}}>{a}</button>)}
      </div>
      <div ref={ref} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingBottom:10}}>
        {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.r==="u"?"flex-end":"flex-start"}}>
          <div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:m.r==="u"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.r==="u"?"#6c63ff":"#fff",color:m.r==="u"?"#fff":"#333",fontSize:13,lineHeight:1.6,border:m.r==="b"?"1px solid #e5e7f0":"none",whiteSpace:"pre-wrap"}}>{m.t}</div>
        </div>)}
        {typing&&<div style={{display:"flex"}}><div style={{padding:"12px 16px",borderRadius:"16px 16px 16px 4px",background:"#fff",border:"1px solid #e5e7f0",fontSize:13}}><span style={{animation:"pulse 1.5s infinite"}}>Thinking...</span></div></div>}
      </div>
      <div style={{display:"flex",gap:8,flexShrink:0,paddingTop:10,borderTop:"1px solid #e5e7f0"}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything about JEE prep..." style={{flex:1,padding:"12px 16px",borderRadius:12,border:"1px solid #e2e5f0",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={send} style={{padding:"12px 20px",background:"#6c63ff",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Send</button>
      </div>
    </div>
  );
}