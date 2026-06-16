import { useState, useRef, useEffect, useCallback } from "react";

const C = {
  bg: "#0f0e17", surface: "#1a1828", card: "#221f35",
  accent: "#f4a261", accent2: "#e76f51", teal: "#2ec4b6",
  purple: "#a78bfa", text: "#fffffe", muted: "#a7a3c2",
  border: "#2d2b45", success: "#4ade80", warning: "#fbbf24",
  pink: "#f472b6", blue: "#60a5fa", green: "#34d399",
};
const F = { d: "'Playfair Display', serif", b: "'DM Sans', sans-serif" };
const GCOLS = [C.accent, C.teal, C.purple, C.pink, C.green, C.blue];

// ─── Helpers ────────────────────────────────────────────────────────────────
const btnBase = { border: "none", cursor: "pointer", fontFamily: F.b, transition: "all 0.2s", borderRadius: 10 };
const btnPrimary = { ...btnBase, background: `linear-gradient(135deg,${C.accent},${C.accent2})`, color: "#fff", padding: "11px 24px", fontSize: 14, fontWeight: 600, boxShadow: `0 4px 18px ${C.accent}44` };
const btnGhost = { ...btnBase, background: "none", border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", fontSize: 13 };
const btnDanger = { ...btnBase, background: `${C.accent2}22`, border: `1px solid ${C.accent2}55`, color: C.accent2, padding: "6px 12px", fontSize: 12 };
const input = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontFamily: F.b, fontSize: 14, width: "100%", outline: "none" };

function Spinner({ msg = "Thinking…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 32 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: C.muted, fontSize: 13 }}>{msg}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Ring({ pct, size = 56, sw = 5, color = C.accent }) {
  const r = (size - sw * 2) / 2, circ = 2 * Math.PI * r, off = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset .5s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em" fill={C.text} fontSize={size*.22} fontFamily={F.b} fontWeight="700">{pct}%</text>
    </svg>
  );
}

// ─── Mind Map ────────────────────────────────────────────────────────────────
function MindMap({ goal, onToggleStep, onEditStep }) {
  const svgRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(null);

  const steps = goal.steps || [];
  const cx = 420, cy = 300;
  const nodeR = 22;
  const centerR = 64;

  // arrange steps in a spiral/ellipse
  const nodePositions = steps.map((_, i) => {
    const total = steps.length;
    const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const rx = Math.min(260, 80 + total * 18);
    const ry = Math.min(200, 60 + total * 12);
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
  });

  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2, z - e.deltaY * 0.001)));
  };
  const handleMouseDown = (e) => { setDragging(true); setLastPos({ x: e.clientX, y: e.clientY }); };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPan(p => ({ x: p.x + e.clientX - lastPos.x, y: p.y + e.clientY - lastPos.y }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setDragging(false);

  const donePct = steps.length ? Math.round(steps.filter(s => s.done).length / steps.length * 100) : 0;

  return (
    <div style={{ position: "relative", width: "100%", height: 520, background: C.bg, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", cursor: dragging ? "grabbing" : "grab" }}
      onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      
      {/* Controls */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, display: "flex", gap: 6 }}>
        {[["−", () => setZoom(z => Math.max(0.4, z - 0.15))], ["+", () => setZoom(z => Math.min(2, z + 0.15))], ["⌂", () => { setPan({x:0,y:0}); setZoom(1); }]].map(([lbl, fn]) => (
          <button key={lbl} onClick={fn} style={{ ...btnGhost, width: 32, height: 32, padding: 0, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{lbl}</button>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 10, left: 12, fontSize: 11, color: C.muted }}>Drag to pan · Scroll to zoom · Click node to toggle</div>

      <svg ref={svgRef} width="100%" height="100%" style={{ userSelect: "none" }}>
        <defs>
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={goal.color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={goal.color} stopOpacity="0.08" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`} style={{ transformOrigin: "50% 50%" }}>
          {/* Connection lines */}
          {nodePositions.map((pos, i) => {
            const step = steps[i];
            const strokeColor = step.done ? C.success : hovered === i ? goal.color : C.border;
            return (
              <line key={i} x1={cx} y1={cy} x2={pos.x} y2={pos.y}
                stroke={strokeColor} strokeWidth={hovered === i ? 2 : 1.5}
                strokeDasharray={step.done ? "none" : "5,4"}
                style={{ transition: "stroke 0.2s" }} />
            );
          })}

          {/* Center node */}
          <circle cx={cx} cy={cy} r={centerR} fill="url(#centerGrad)" stroke={goal.color} strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={centerR - 6} fill="none" stroke={goal.color} strokeWidth={1} strokeDasharray="4,6" style={{ animation: "spin 20s linear infinite", transformOrigin: `${cx}px ${cy}px` }} />
          
          {/* Progress arc on center */}
          {(() => {
            const R = centerR - 2, C2 = 2 * Math.PI * R, off = C2 - (donePct / 100) * C2;
            return <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.success} strokeWidth={3}
              strokeDasharray={C2} strokeDashoffset={off} strokeLinecap="round"
              style={{ transform: `rotate(-90deg)`, transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dashoffset .5s" }} />;
          })()}

          <foreignObject x={cx - centerR + 8} y={cy - 30} width={(centerR - 8) * 2} height={60}>
            <div style={{ textAlign: "center", overflow: "hidden" }}>
              <div style={{ fontSize: 9, color: goal.color, fontFamily: F.b, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{donePct}%</div>
              <div style={{ fontSize: 10, color: C.text, fontFamily: F.b, fontWeight: 600, lineHeight: 1.3, wordBreak: "break-word" }}>{goal.title.length > 28 ? goal.title.slice(0, 26) + "…" : goal.title}</div>
            </div>
          </foreignObject>

          {/* Step nodes */}
          {nodePositions.map((pos, i) => {
            const step = steps[i];
            const isOver = !step.done && new Date(step.deadline) < new Date();
            const nodeColor = step.done ? C.success : isOver ? C.accent2 : goal.color;
            const isHov = hovered === i;

            return (
              <g key={i} style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                onClick={(e) => { e.stopPropagation(); onToggleStep(goal.id, step.id); }}>
                
                {/* Halo */}
                {isHov && <circle cx={pos.x} cy={pos.y} r={nodeR + 10} fill={nodeColor} fillOpacity={0.12} />}
                
                {/* Node bg */}
                <circle cx={pos.x} cy={pos.y} r={nodeR + (isHov ? 3 : 0)} fill={step.done ? `${C.success}22` : isHov ? `${nodeColor}33` : C.surface}
                  stroke={nodeColor} strokeWidth={isHov ? 2.5 : 1.5} style={{ transition: "all 0.2s" }}
                  filter={isHov ? "url(#glow)" : ""} />
                
                {/* Step number or checkmark */}
                <text x={pos.x} y={pos.y - 6} textAnchor="middle" fontSize={step.done ? 14 : 11}
                  fill={step.done ? C.success : nodeColor} fontFamily={F.b} fontWeight="700">{step.done ? "✓" : i + 1}</text>
                
                {/* Step label below node */}
                <foreignObject x={pos.x - 60} y={pos.y + nodeR + 4} width={120} height={36}>
                  <div style={{ textAlign: "center", fontSize: 10, color: isHov ? C.text : C.muted, fontFamily: F.b, lineHeight: 1.3, transition: "color 0.2s" }}>
                    {step.text.length > 32 ? step.text.slice(0, 30) + "…" : step.text}
                  </div>
                </foreignObject>

                {/* Deadline badge */}
                {isHov && (
                  <foreignObject x={pos.x - 50} y={pos.y - nodeR - 26} width={100} height={22}>
                    <div style={{ textAlign: "center", fontSize: 9, color: isOver ? C.accent2 : C.muted, background: C.card, borderRadius: 4, padding: "2px 4px", border: `1px solid ${C.border}`, fontFamily: F.b }}>
                      {isOver ? "⚠ " : "📅 "}{step.deadline}
                    </div>
                  </foreignObject>
                )}

                {/* Edit button on hover */}
                {isHov && (
                  <g onClick={(e) => { e.stopPropagation(); onEditStep(step); }}>
                    <circle cx={pos.x + nodeR - 2} cy={pos.y - nodeR + 2} r={9} fill={C.card} stroke={C.border} strokeWidth={1} />
                    <text x={pos.x + nodeR - 2} y={pos.y - nodeR + 6} textAnchor="middle" fontSize={9} fill={C.accent} fontFamily={F.b}>✎</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// ─── Calendar ────────────────────────────────────────────────────────────────
function CalendarView({ goals }) {
  const today = new Date();
  const [vd, setVd] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const yr = vd.getFullYear(), mo = vd.getMonth();
  const firstDay = new Date(yr, mo, 1).getDay();
  const dim = new Date(yr, mo + 1, 0).getDate();
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const byDate = {};
  goals.forEach(g => g.steps?.forEach(s => {
    if (!s.deadline) return;
    const d = new Date(s.deadline);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!byDate[k]) byDate[k] = [];
    byDate[k].push({ ...s, goalColor: g.color });
  }));

  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <button onClick={() => setVd(new Date(yr, mo - 1, 1))} style={btnGhost}>‹</button>
        <span style={{ fontFamily: F.d, fontSize: 18 }}>{MONTHS[mo]} {yr}</span>
        <button onClick={() => setVd(new Date(yr, mo + 1, 1))} style={btnGhost}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 6 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.muted, fontWeight: 700, padding: "3px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const k = `${yr}-${mo}-${day}`;
          const tasks = byDate[k] || [];
          const isToday = today.getDate() === day && today.getMonth() === mo && today.getFullYear() === yr;
          return (
            <div key={i} style={{ minHeight: 54, padding: "5px 3px", borderRadius: 8,
              background: isToday ? `${C.accent}22` : tasks.length ? `${C.teal}11` : C.surface,
              border: `1px solid ${isToday ? C.accent : tasks.length ? C.teal + "88" : C.border}` }}>
              <div style={{ textAlign: "center", fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? C.accent : C.text }}>{day}</div>
              {tasks.slice(0, 2).map((t, ti) => (
                <div key={ti} style={{ fontSize: 8, padding: "1px 3px", borderRadius: 3, marginTop: 2,
                  background: t.done ? C.success + "33" : t.goalColor + "44",
                  color: t.done ? C.success : C.text,
                  overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                  textDecoration: t.done ? "line-through" : "none" }}>{t.text}</div>
              ))}
              {tasks.length > 2 && <div style={{ fontSize: 8, color: C.muted }}>+{tasks.length - 2}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Edit Step Modal ─────────────────────────────────────────────────────────
function EditStepModal({ step, onSave, onDelete, onClose }) {
  const [text, setText] = useState(step.text);
  const [deadline, setDeadline] = useState(step.deadline || "");
  const [hours, setHours] = useState(step.estimatedHours || 1);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, width: "100%", maxWidth: 440 }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: F.d, fontSize: 20, marginBottom: 20 }}>✎ Edit Step</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Step Description</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
              style={{ ...input, resize: "vertical" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Deadline</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={input} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Est. Hours</label>
              <input type="number" min={0.5} max={100} step={0.5} value={hours} onChange={e => setHours(parseFloat(e.target.value))} style={input} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => onSave({ ...step, text, deadline, estimatedHours: hours })} style={{ ...btnPrimary, flex: 1 }}>Save Changes</button>
            <button onClick={onDelete} style={btnDanger}>Delete</button>
            <button onClick={onClose} style={btnGhost}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Goal Modal ─────────────────────────────────────────────────────────
function EditGoalModal({ goal, onSave, onDelete, onClose }) {
  const CATS = ["Personal Growth","Career","Health & Fitness","Learning","Finance","Creativity","Relationships","Travel"];
  const [title, setTitle] = useState(goal.title);
  const [desc, setDesc] = useState(goal.description || "");
  const [category, setCategory] = useState(goal.category);
  const [deadline, setDeadline] = useState(goal.deadline || "");
  const [color, setColor] = useState(goal.color);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, width: "100%", maxWidth: 480 }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: F.d, fontSize: 20, marginBottom: 20 }}>✎ Edit Goal</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Goal Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={input} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Why it matters</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} style={{ ...input, resize: "vertical" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...input }}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Goal Deadline</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={input} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>Color</label>
            <div style={{ display: "flex", gap: 10 }}>
              {GCOLS.map(col => (
                <div key={col} onClick={() => setColor(col)} style={{ width: 28, height: 28, borderRadius: "50%", background: col, cursor: "pointer", border: color === col ? `3px solid ${C.text}` : "3px solid transparent", transition: "border 0.2s" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => onSave({ ...goal, title, description: desc, category, deadline, color })} style={{ ...btnPrimary, flex: 1 }}>Save Changes</button>
            <button onClick={onDelete} style={btnDanger}>Delete Goal</button>
            <button onClick={onClose} style={btnGhost}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI Call ─────────────────────────────────────────────────────────────────
async function callAI(title, category, deadline, apiKey, provider) {
  const deadlineStr = deadline ? `The final deadline is ${deadline}.` : "Spread steps reasonably over a few months.";
  const prompt = `You are a supportive goal coach. Goal: "${title}". Category: ${category}. ${deadlineStr}
Break this into 6-9 realistic, specific micro-steps. Each step should be actionable and clear.
${deadline ? `Distribute deadlines from today through ${deadline} progressively.` : "Spread deadlines across 3 months starting today."}
Respond ONLY with valid JSON, no markdown, no preamble:
{"steps":[{"text":"step description","daysFromNow":number,"estimatedHours":number}]}`;

  if (provider === "google") {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } else {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    const text = data.content?.find(b => b.type === "text")?.text || "{}";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  }
}

// --- API Key Modal ---
function ApiKeyModal({ onSave, onClose, current }) {
  const [provider, setProvider] = React.useState(current.provider || "anthropic");
  const [key, setKey] = React.useState(current.key || "");
  const [show, setShow] = React.useState(false);

  const links = {
    anthropic: { label: "Get Anthropic key", url: "https://console.anthropic.com/", hint: "Free $5 credits on signup · ~$0.01 per plan" },
    google: { label: "Get Gemini key (free)", url: "https://aistudio.google.com/app/apikey", hint: "Free tier available · No credit card needed" },
  };

  return (
    React.createElement("div", { style: { position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }, onClick: onClose },
      React.createElement("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 460 }, onClick: e => e.stopPropagation() },
        React.createElement("h3", { style: { fontFamily: F.d, fontSize: 22, marginBottom: 6, color: C.text } }, "🔑 AI Settings"),
        React.createElement("p", { style: { color: C.muted, fontSize: 13, marginBottom: 22, lineHeight: 1.6 } }, "Choose your AI provider and paste your API key. Saved only in your browser."),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 } },
          [["anthropic", "🤖 Anthropic Claude"], ["google", "✨ Google Gemini"]].map(([p, lbl]) =>
            React.createElement("button", { key: p, onClick: () => setProvider(p), style: { ...btnGhost, padding: "12px", fontSize: 13, textAlign: "center", background: provider === p ? `${C.accent}22` : "none", borderColor: provider === p ? C.accent : C.border, color: provider === p ? C.accent : C.muted } }, lbl)
          )
        ),
        React.createElement("div", { style: { marginBottom: 14 } },
          React.createElement("label", { style: { fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 7 } }, "API Key"),
          React.createElement("div", { style: { position: "relative" } },
            React.createElement("input", { type: show ? "text" : "password", value: key, onChange: e => setKey(e.target.value), placeholder: provider === "google" ? "AIza..." : "sk-ant-...", style: { ...input, paddingRight: 44 } }),
            React.createElement("button", { onClick: () => setShow(s => !s), style: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 } }, show ? "🙈" : "👁")
          )
        ),
        React.createElement("div", { style: { background: C.surface, borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } },
          React.createElement("span", { style: { fontSize: 12, color: C.muted } }, links[provider].hint),
          React.createElement("a", { href: links[provider].url, target: "_blank", rel: "noreferrer", style: { fontSize: 12, color: C.teal, whiteSpace: "nowrap", textDecoration: "none", fontWeight: 600 } }, links[provider].label + " →")
        ),
        React.createElement("div", { style: { display: "flex", gap: 10 } },
          React.createElement("button", { onClick: () => { if (key.trim()) { onSave({ key: key.trim(), provider }); onClose(); } }, style: { ...btnPrimary, flex: 1 } }, "Save & Continue"),
          React.createElement("button", { onClick: onClose, style: btnGhost }, "Cancel")
        )
      )
    )
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editGoal, setEditGoal] = useState(null);
  const [editStep, setEditStep] = useState(null);
  const [detailTab, setDetailTab] = useState("steps"); // steps | mindmap
  const [addingStep, setAddingStep] = useState(false);
  const [newStep, setNewStep] = useState({ text: "", deadline: "", estimatedHours: 1 });
  const [apiConfig, setApiConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dp_api") || "{}"); } catch { return {}; }
  });
  const [showApiModal, setShowApiModal] = useState(false);

  const saveApiConfig = (cfg) => {
    setApiConfig(cfg);
    localStorage.setItem("dp_api", JSON.stringify(cfg));
  };

  const CATS = ["Personal Growth","Career","Health & Fitness","Learning","Finance","Creativity","Relationships","Travel"];
  const [form, setForm] = useState({ title: "", description: "", category: "Personal Growth", deadline: "" });

  const getProgress = (g) => !g.steps?.length ? 0 : Math.round(g.steps.filter(s => s.done).length / g.steps.length * 100);
  const totalDone = goals.reduce((a, g) => a + (g.steps?.filter(s => s.done).length || 0), 0);
  const totalAll = goals.reduce((a, g) => a + (g.steps?.length || 0), 0);

  const syncActive = (updatedGoals) => {
    if (activeGoal) setActiveGoal(updatedGoals.find(g => g.id === activeGoal.id) || null);
  };

  const handleGenerate = async () => {
    if (!form.title.trim()) { setError("Please write your dream first!"); return; }
    if (!apiConfig.key) { setShowApiModal(true); return; }
    setError(""); setLoading(true);
    try {
      const result = await callAI(form.title, form.category, form.deadline, apiConfig.key, apiConfig.provider);
      const today = new Date();
      const steps = result.steps.map((s, i) => {
        const d = new Date(today); d.setDate(d.getDate() + s.daysFromNow);
        return { id: Date.now() + i, text: s.text, estimatedHours: s.estimatedHours || 1, deadline: d.toISOString().split("T")[0], done: false };
      });
      const newGoal = { id: Date.now(), title: form.title, description: form.description, category: form.category, deadline: form.deadline, color: GCOLS[goals.length % GCOLS.length], createdAt: new Date().toISOString(), steps };
      const updated = [...goals, newGoal];
      setGoals(updated);
      setActiveGoal(newGoal);
      setForm({ title: "", description: "", category: "Personal Growth", deadline: "" });
      setScreen("detail");
    } catch (e) { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  const toggleStep = (goalId, stepId) => {
    const updated = goals.map(g => g.id === goalId ? { ...g, steps: g.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s) } : g);
    setGoals(updated); syncActive(updated);
  };

  const saveStep = (updatedStep) => {
    const updated = goals.map(g => g.id === activeGoal.id ? { ...g, steps: g.steps.map(s => s.id === updatedStep.id ? updatedStep : s) } : g);
    setGoals(updated); syncActive(updated); setEditStep(null);
  };

  const deleteStep = (stepId) => {
    const updated = goals.map(g => g.id === activeGoal.id ? { ...g, steps: g.steps.filter(s => s.id !== stepId) } : g);
    setGoals(updated); syncActive(updated); setEditStep(null);
  };

  const addStep = () => {
    if (!newStep.text.trim()) return;
    const step = { id: Date.now(), ...newStep, done: false };
    const updated = goals.map(g => g.id === activeGoal.id ? { ...g, steps: [...g.steps, step] } : g);
    setGoals(updated); syncActive(updated);
    setNewStep({ text: "", deadline: "", estimatedHours: 1 }); setAddingStep(false);
  };

  const saveGoal = (updatedGoal) => {
    const updated = goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    setGoals(updated); syncActive(updated); setEditGoal(null);
  };

  const deleteGoal = (goalId) => {
    const updated = goals.filter(g => g.id !== goalId);
    setGoals(updated); setEditGoal(null); setActiveGoal(null); setScreen("goals");
  };

  const Nav = () => (
    <nav style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setScreen("home")}>
        <span style={{ fontSize: 20 }}>✦</span>
        <span style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, background: `linear-gradient(135deg,${C.accent},${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DreamPlanner</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[["home","🏠","Home"],["goals","🎯","Goals"],["calendar","📅","Calendar"]].map(([s,icon,lbl]) => (
          <button key={s} onClick={() => setScreen(s)} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, background: screen===s ? `${C.accent}22` : "none", borderColor: screen===s ? C.accent : C.border, color: screen===s ? C.accent : C.muted }}>{icon} {lbl}</button>
        ))}
        <button onClick={() => setShowApiModal(true)} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, borderColor: apiConfig.key ? C.teal : C.accent, color: apiConfig.key ? C.teal : C.accent }}>
          {apiConfig.key ? "🔑 API ✓" : "🔑 Set API Key"}
        </button>
      </div>
    </nav>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.b }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        button:hover{opacity:.85;transform:translateY(-1px)}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1);opacity:.4}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .4s ease forwards}
      `}</style>

      <Nav />

      {editStep && <EditStepModal step={editStep} onSave={saveStep} onDelete={() => deleteStep(editStep.id)} onClose={() => setEditStep(null)} />}
      {editGoal && <EditGoalModal goal={editGoal} onSave={saveGoal} onDelete={() => deleteGoal(editGoal.id)} onClose={() => setEditGoal(null)} />}
      {showApiModal && <ApiKeyModal current={apiConfig} onSave={saveApiConfig} onClose={() => setShowApiModal(false)} />}

      <div style={{ width: "100%", padding: "28px 40px" }}>

        {/* HOME */}
        {screen === "home" && (
          <div className="fu">
            <div style={{ textAlign: "center", padding: "36px 0 44px" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🌟</div>
              <h1 style={{ fontFamily: F.d, fontSize: 44, fontWeight: 700, lineHeight: 1.2, marginBottom: 14, color: C.text }}>
                Turn your <span style={{ background: `linear-gradient(135deg,${C.accent},${C.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>dreams</span><br />into daily actions
              </h1>
              <p style={{ color: C.muted, fontSize: 16, maxWidth: 600, margin: "0 auto 28px", lineHeight: 1.7 }}>
                Write any goal, set your deadline — AI breaks it into clear steps on a visual mind map and calendar.
              </p>
              <button onClick={() => setScreen("add")} style={{ ...btnPrimary, fontSize: 15, padding: "13px 32px" }}>✦ Plan a New Dream</button>
            </div>

            {goals.length > 0 && (
              <>
                <div style={{ background: C.surface, borderRadius: 18, padding: 22, border: `1px solid ${C.border}`, marginBottom: 28 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, textAlign: "center" }}>
                    {[
                      { lbl: "Active Goals", val: goals.length, icon: "🎯", col: C.accent },
                      { lbl: "Steps Done", val: `${totalDone}/${totalAll}`, icon: "✅", col: C.teal },
                      { lbl: "Overall", val: `${totalAll ? Math.round(totalDone/totalAll*100) : 0}%`, icon: "📈", col: C.purple },
                    ].map(({ lbl, val, icon, col }) => (
                      <div key={lbl} style={{ background: C.card, borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: col, fontFamily: F.d }}>{val}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {goals.map(g => (
                    <div key={g.id} onClick={() => { setActiveGoal(g); setScreen("detail"); }}
                      style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${g.color}`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                      <Ring pct={getProgress(g)} color={g.color} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{g.title}</div>
                        <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{g.category} · {g.steps?.filter(s=>s.done).length}/{g.steps?.length} steps{g.deadline ? ` · Due ${g.deadline}` : ""}</div>
                      </div>
                      <span style={{ color: C.muted, fontSize: 18 }}>→</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ADD */}
        {screen === "add" && (
          <div className="fu" style={{ maxWidth: "100%" }}>
            <h2 style={{ fontFamily: F.d, fontSize: 30, marginBottom: 6 }}>✦ New Dream</h2>
            <p style={{ color: C.muted, marginBottom: 28, fontSize: 14 }}>Describe your goal and set your deadline — AI will plan the steps.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 7 }}>Your Dream or Goal *</label>
                <textarea value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Grow my SaaS blog to 10,000 monthly readers…" rows={3}
                  style={{ ...input, resize: "vertical" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 7 }}>Why does this matter?</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional — helps AI give more personal steps…" rows={2}
                  style={{ ...input, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 7 }}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...input }}>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 7 }}>
                    Goal Deadline <span style={{ color: C.teal, fontSize: 10 }}>— AI will use this</span>
                  </label>
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={input} />
                </div>
              </div>
              {error && <div style={{ background: `${C.accent2}22`, border: `1px solid ${C.accent2}`, borderRadius: 10, padding: "10px 14px", color: C.accent2, fontSize: 13 }}>{error}</div>}
              {loading ? <Spinner msg="Breaking your dream into steps…" /> : (
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleGenerate} style={{ ...btnPrimary, flex: 1 }}>✦ Generate My Action Plan</button>
                  <button onClick={() => setScreen("home")} style={btnGhost}>Cancel</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DETAIL */}
        {screen === "detail" && activeGoal && (
          <div className="fu">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button onClick={() => setScreen("goals")} style={{ ...btnGhost, fontSize: 12 }}>← Goals</button>
              <button onClick={() => setEditGoal(activeGoal)} style={{ ...btnGhost, fontSize: 12 }}>✎ Edit Goal</button>
            </div>

            {/* Goal header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: activeGoal.color }} />
                  <span style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{activeGoal.category}</span>
                  {activeGoal.deadline && <span style={{ fontSize: 11, color: C.teal, background: `${C.teal}22`, padding: "2px 8px", borderRadius: 6 }}>Due {activeGoal.deadline}</span>}
                </div>
                <h2 style={{ fontFamily: F.d, fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>{activeGoal.title}</h2>
                {activeGoal.description && <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{activeGoal.description}</p>}
              </div>
              <Ring pct={getProgress(activeGoal)} size={76} sw={7} color={activeGoal.color} />
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[["steps","📋 Steps"],["mindmap","🧠 Mind Map"]].map(([t, lbl]) => (
                <button key={t} onClick={() => setDetailTab(t)}
                  style={{ ...btnGhost, fontSize: 13, padding: "8px 18px", background: detailTab===t ? `${C.accent}22` : "none", borderColor: detailTab===t ? C.accent : C.border, color: detailTab===t ? C.accent : C.muted }}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* STEPS TAB */}
            {detailTab === "steps" && (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {activeGoal.steps?.map((step, i) => {
                    const over = !step.done && step.deadline && new Date(step.deadline) < new Date();
                    return (
                      <div key={step.id} style={{ background: step.done ? `${C.success}11` : C.surface, border: `1px solid ${step.done ? C.success+"44" : over ? C.accent2+"55" : C.border}`, borderRadius: 13, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                        {/* Checkbox */}
                        <div onClick={() => toggleStep(activeGoal.id, step.id)} style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: step.done ? C.success : "transparent", border: `2px solid ${step.done ? C.success : over ? C.accent2 : C.border}`, transition: "all .2s", fontSize: 13 }}>
                          {step.done ? "✓" : <span style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>{i+1}</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: 14, textDecoration: step.done ? "line-through" : "none", color: step.done ? C.muted : C.text }}>{step.text}</div>
                          <div style={{ marginTop: 3, display: "flex", gap: 10, fontSize: 11, flexWrap: "wrap" }}>
                            {step.deadline && <span style={{ color: over ? C.accent2 : C.muted }}>{over ? "⚠ " : "📅 "}{step.deadline}</span>}
                            <span style={{ color: C.muted }}>⏱ ~{step.estimatedHours}h</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {over && !step.done && <span style={{ fontSize: 10, color: C.accent2, background: `${C.accent2}22`, padding: "2px 7px", borderRadius: 5 }}>Overdue</span>}
                          {step.done && <span style={{ fontSize: 10, color: C.success, background: `${C.success}22`, padding: "2px 7px", borderRadius: 5 }}>Done ✓</span>}
                          <button onClick={() => setEditStep(step)} style={{ ...btnGhost, padding: "4px 10px", fontSize: 11 }}>✎</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add step */}
                {addingStep ? (
                  <div style={{ background: C.surface, border: `1px dashed ${C.teal}`, borderRadius: 13, padding: "16px 18px", marginTop: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <input value={newStep.text} onChange={e => setNewStep(s => ({ ...s, text: e.target.value }))} placeholder="Describe this step…" style={input} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <input type="date" value={newStep.deadline} onChange={e => setNewStep(s => ({ ...s, deadline: e.target.value }))} style={input} />
                        <input type="number" min={0.5} step={0.5} value={newStep.estimatedHours} onChange={e => setNewStep(s => ({ ...s, estimatedHours: parseFloat(e.target.value) }))} placeholder="Hours" style={input} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={addStep} style={{ ...btnPrimary, padding: "9px 20px", fontSize: 13 }}>Add Step</button>
                        <button onClick={() => setAddingStep(false)} style={btnGhost}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingStep(true)} style={{ ...btnGhost, marginTop: 12, width: "100%", borderStyle: "dashed", color: C.teal, borderColor: C.teal+"66", padding: "10px", fontSize: 13 }}>+ Add a Step Manually</button>
                )}
              </div>
            )}

            {/* MIND MAP TAB */}
            {detailTab === "mindmap" && (
              <div>
                <MindMap goal={activeGoal} onToggleStep={toggleStep} onEditStep={setEditStep} />
                <p style={{ color: C.muted, fontSize: 12, marginTop: 10, textAlign: "center" }}>Click a node to mark done · Hover for edit button · Drag to pan · Scroll to zoom</p>
              </div>
            )}
          </div>
        )}

        {/* GOALS LIST */}
        {screen === "goals" && (
          <div className="fu">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <h2 style={{ fontFamily: F.d, fontSize: 30 }}>Your Goals</h2>
              <button onClick={() => setScreen("add")} style={btnPrimary}>+ New Dream</button>
            </div>
            {goals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "70px 0", color: C.muted }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>🌱</div>
                <p style={{ fontSize: 16, marginBottom: 6 }}>No goals yet</p>
                <p style={{ fontSize: 13 }}>Add your first dream to get started</p>
              </div>
            ) : goals.map(g => {
              const pct = getProgress(g);
              const next = g.steps?.find(s => !s.done);
              return (
                <div key={g.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${g.color}`, borderRadius: 15, padding: 22, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{g.category}</span>
                      {g.deadline && <span style={{ marginLeft: 8, fontSize: 10, color: C.teal }}>Due {g.deadline}</span>}
                      <h3 style={{ fontFamily: F.d, fontSize: 19, marginTop: 4 }}>{g.title}</h3>
                    </div>
                    <Ring pct={pct} color={g.color} />
                  </div>
                  {next && (
                    <div style={{ background: C.card, borderRadius: 9, padding: "9px 13px", fontSize: 12, color: C.muted, marginBottom: 14 }}>
                      <span style={{ color: C.accent, fontWeight: 600 }}>Next: </span>{next.text}{next.deadline && <span style={{ marginLeft: 8, fontSize: 10 }}>· {next.deadline}</span>}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => { setActiveGoal(g); setDetailTab("steps"); setScreen("detail"); }} style={{ ...btnGhost, fontSize: 12 }}>📋 Steps</button>
                    <button onClick={() => { setActiveGoal(g); setDetailTab("mindmap"); setScreen("detail"); }} style={{ ...btnGhost, fontSize: 12 }}>🧠 Mind Map</button>
                    <button onClick={() => setScreen("calendar")} style={{ ...btnGhost, fontSize: 12 }}>📅 Calendar</button>
                    <button onClick={() => setEditGoal(g)} style={{ ...btnGhost, fontSize: 12 }}>✎ Edit</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CALENDAR */}
        {screen === "calendar" && (
          <div className="fu">
            <h2 style={{ fontFamily: F.d, fontSize: 30, marginBottom: 26 }}>📅 Calendar</h2>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 26 }}>
              <CalendarView goals={goals} />
            </div>
            {goals.length === 0 && (
              <div style={{ textAlign: "center", marginTop: 28, color: C.muted }}>
                <p style={{ marginBottom: 14 }}>Add a goal first to see steps on the calendar.</p>
                <button onClick={() => setScreen("add")} style={btnPrimary}>+ Add a Goal</button>
              </div>
            )}
            <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 10 }}>
              {goals.map(g => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: g.color }} />{g.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
