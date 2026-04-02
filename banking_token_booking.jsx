import { useState, useEffect, useRef } from "react";

// ─── Simulated Backend (in-memory store) ──────────────────────────────────────
let tokenStore = [];
let sessionStore = {
  active: true,
  extraMinutes: 0,
  sessionStart: new Date().toISOString(),
  counterOpen: true,
  notice: "",
};
let emailLog = [];
let tokenCounter = 1;

function generateToken() {
  const prefix = "BNK";
  const num = String(tokenCounter++).padStart(4, "0");
  return `${prefix}-${num}`;
}

function estimatedWait(position) {
  const base = (position - 1) * 8 + sessionStore.extraMinutes;
  return base;
}

// ─── Fake Email Sender (logs emails) ─────────────────────────────────────────
function sendEmailNotification(booking) {
  const email = {
    id: Date.now(),
    to: booking.email,
    subject: `Your Banking Token: ${booking.token}`,
    body: `Dear ${booking.name},\n\nYour token has been booked successfully.\n\nToken: ${booking.token}\nPosition: #${booking.position}\nPurpose: ${booking.purpose}\nEstimated Wait: ~${booking.estimatedWait} mins\n\nPlease arrive at the branch and show this token.\n\nRegards,\nBank Token System`,
    sentAt: new Date().toLocaleString(),
    status: "delivered",
  };
  emailLog.push(email);
  return email;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0a1628;
    --navy-mid: #112240;
    --navy-light: #1d3461;
    --gold: #c9a84c;
    --gold-light: #e8c97a;
    --gold-pale: #f5e9c8;
    --cream: #faf7f0;
    --white: #ffffff;
    --red: #d64045;
    --green: #2d936c;
    --text-dim: #8899aa;
    --border: rgba(201,168,76,0.18);
    --shadow: 0 8px 40px rgba(10,22,40,0.18);
    --shadow-gold: 0 4px 24px rgba(201,168,76,0.15);
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--navy);
    min-height: 100vh;
  }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* ── Header ── */
  .header {
    background: var(--navy);
    padding: 0 2rem;
    display: flex; align-items: center; justify-content: space-between;
    height: 68px;
    border-bottom: 2px solid var(--gold);
    position: sticky; top: 0; z-index: 100;
  }
  .header-brand { display: flex; align-items: center; gap: 12px; }
  .header-logo {
    width: 38px; height: 38px; background: var(--gold);
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-weight: 900; color: var(--navy); font-size: 18px;
  }
  .header-title { font-family: 'Playfair Display', serif; color: var(--white); font-size: 1.15rem; font-weight: 700; }
  .header-sub { color: var(--gold); font-size: 0.7rem; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; }
  .header-nav { display: flex; gap: 8px; }
  .nav-btn {
    padding: 7px 18px; border-radius: 6px; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.2s; letter-spacing: 0.5px;
  }
  .nav-btn.active { background: var(--gold); color: var(--navy); }
  .nav-btn:not(.active) { background: transparent; color: var(--gold); border: 1.5px solid rgba(201,168,76,0.4); }
  .nav-btn:not(.active):hover { background: rgba(201,168,76,0.1); }

  /* ── Session Banner ── */
  .session-banner {
    padding: 10px 2rem; display: flex; align-items: center; justify-content: center;
    gap: 10px; font-size: 0.82rem; font-weight: 600;
  }
  .session-banner.open { background: #e8f5ef; color: var(--green); border-bottom: 1px solid #b5ddd0; }
  .session-banner.closed { background: #fcecea; color: var(--red); border-bottom: 1px solid #f5c6c4; }
  .pulse-dot {
    width: 8px; height: 8px; border-radius: 50%;
    animation: pulse 1.5s infinite;
  }
  .open .pulse-dot { background: var(--green); }
  .closed .pulse-dot { background: var(--red); }
  @keyframes pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.3); }
  }

  /* ── Main Content ── */
  .main { flex: 1; padding: 2.5rem 2rem; max-width: 1100px; margin: 0 auto; width: 100%; }

  /* ── Booking Form ── */
  .booking-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
  @media (max-width: 700px) { .booking-grid { grid-template-columns: 1fr; } }

  .card {
    background: var(--white); border-radius: 16px; padding: 2rem;
    border: 1px solid var(--border); box-shadow: var(--shadow);
  }
  .card-title {
    font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700;
    color: var(--navy); margin-bottom: 0.3rem;
  }
  .card-sub { color: var(--text-dim); font-size: 0.85rem; margin-bottom: 1.5rem; }

  .field { margin-bottom: 1.1rem; }
  .field label { display: block; font-size: 0.78rem; font-weight: 600; color: var(--navy-light); margin-bottom: 5px; letter-spacing: 0.8px; text-transform: uppercase; }
  .field input, .field select, .field textarea {
    width: 100%; padding: 11px 14px; border: 1.5px solid #dde2ea;
    border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.92rem;
    color: var(--navy); background: var(--cream); transition: border 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .field input:focus, .field select:focus, .field textarea:focus {
    border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
    background: var(--white);
  }
  .field textarea { resize: vertical; min-height: 80px; }

  .submit-btn {
    width: 100%; padding: 13px; background: var(--navy); color: var(--gold);
    border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
    letter-spacing: 0.5px; margin-top: 0.5rem;
    position: relative; overflow: hidden;
  }
  .submit-btn:hover:not(:disabled) { background: var(--navy-light); transform: translateY(-1px); box-shadow: var(--shadow-gold); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Token Queue ── */
  .queue-list { display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; padding-right: 4px; }
  .queue-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 14px;
    background: var(--cream); border-radius: 10px; border: 1px solid var(--border);
    transition: transform 0.15s;
  }
  .queue-item:hover { transform: translateX(3px); }
  .queue-badge {
    font-family: 'DM Mono', monospace; font-size: 0.78rem; font-weight: 500;
    padding: 4px 10px; border-radius: 6px; white-space: nowrap;
  }
  .queue-badge.waiting { background: #fef9ec; color: #b08a2a; border: 1px solid #edd98a; }
  .queue-badge.serving { background: #e8f5ef; color: var(--green); border: 1px solid #b5ddd0; }
  .queue-badge.done { background: #f0f0f0; color: #888; border: 1px solid #ddd; }
  .queue-info { flex: 1; min-width: 0; }
  .queue-name { font-weight: 600; font-size: 0.9rem; color: var(--navy); }
  .queue-token { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--text-dim); }
  .queue-purpose { font-size: 0.78rem; color: var(--text-dim); margin-top: 1px; }
  .queue-wait { font-size: 0.75rem; color: var(--text-dim); white-space: nowrap; }

  /* ── Success Modal ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(10,22,40,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 999; backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal {
    background: var(--white); border-radius: 20px; padding: 2.5rem;
    max-width: 460px; width: 90%; box-shadow: 0 20px 80px rgba(10,22,40,0.3);
    border: 2px solid var(--gold); text-align: center;
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .modal-icon { font-size: 3rem; margin-bottom: 1rem; }
  .modal-token {
    font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 900;
    color: var(--navy); letter-spacing: 3px; margin: 0.5rem 0;
  }
  .modal-token span { color: var(--gold); }
  .token-details { background: var(--cream); border-radius: 10px; padding: 1.2rem; margin: 1rem 0; text-align: left; }
  .token-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 0; border-bottom: 1px solid var(--border); }
  .token-row:last-child { border-bottom: none; }
  .token-row .label { color: var(--text-dim); font-weight: 500; }
  .token-row .value { font-weight: 600; color: var(--navy); font-family: 'DM Mono', monospace; font-size: 0.82rem; }
  .email-note { font-size: 0.8rem; color: var(--green); margin-top: 0.5rem; }
  .modal-close {
    margin-top: 1.2rem; padding: 10px 28px; background: var(--navy); color: var(--gold);
    border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.9rem;
  }

  /* ── Admin Panel ── */
  .admin-login { max-width: 380px; margin: 3rem auto; }
  .admin-layout { display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; }
  @media (max-width: 768px) { .admin-layout { grid-template-columns: 1fr; } }

  .admin-sidebar {
    background: var(--navy); border-radius: 16px; padding: 1.5rem;
    color: var(--white); height: fit-content; position: sticky; top: 90px;
  }
  .admin-sidebar h3 { font-family: 'Playfair Display', serif; color: var(--gold); font-size: 1rem; margin-bottom: 1.2rem; }
  .sidebar-menu { display: flex; flex-direction: column; gap: 6px; }
  .sidebar-item {
    padding: 9px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem;
    font-weight: 500; transition: all 0.15s; display: flex; align-items: center; gap: 8px;
    color: rgba(255,255,255,0.7); border: none; background: transparent; width: 100%; text-align: left;
  }
  .sidebar-item:hover { background: rgba(255,255,255,0.08); color: var(--white); }
  .sidebar-item.active { background: rgba(201,168,76,0.18); color: var(--gold); }

  .admin-content { display: flex; flex-direction: column; gap: 1.2rem; }

  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  .stat-card {
    background: var(--white); border-radius: 12px; padding: 1.2rem;
    border: 1px solid var(--border); text-align: center;
  }
  .stat-num { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; color: var(--navy); }
  .stat-label { font-size: 0.75rem; color: var(--text-dim); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

  .control-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
  @media (max-width: 600px) { .control-grid { grid-template-columns: 1fr; } }

  .control-card {
    background: var(--white); border-radius: 12px; padding: 1.3rem;
    border: 1px solid var(--border);
  }
  .control-card h4 { font-weight: 700; font-size: 0.9rem; margin-bottom: 0.4rem; color: var(--navy); }
  .control-card p { font-size: 0.78rem; color: var(--text-dim); margin-bottom: 1rem; }

  .btn {
    padding: 9px 18px; border-radius: 8px; font-weight: 600; cursor: pointer;
    border: none; font-size: 0.82rem; transition: all 0.2s;
  }
  .btn-danger { background: #fcecea; color: var(--red); border: 1px solid #f5c6c4; }
  .btn-danger:hover { background: var(--red); color: var(--white); }
  .btn-success { background: #e8f5ef; color: var(--green); border: 1px solid #b5ddd0; }
  .btn-success:hover { background: var(--green); color: var(--white); }
  .btn-primary { background: var(--navy); color: var(--gold); }
  .btn-primary:hover { background: var(--navy-light); }
  .btn-gold { background: var(--gold); color: var(--navy); }
  .btn-gold:hover { background: var(--gold-light); }

  .input-group { display: flex; gap: 8px; }
  .input-group input {
    flex: 1; padding: 9px 12px; border: 1.5px solid #dde2ea; border-radius: 8px;
    font-size: 0.85rem; outline: none; background: var(--cream);
  }
  .input-group input:focus { border-color: var(--gold); }

  .admin-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
  .admin-table th {
    text-align: left; padding: 10px 12px; background: var(--navy); color: var(--gold);
    font-size: 0.72rem; letter-spacing: 1px; text-transform: uppercase;
  }
  .admin-table th:first-child { border-radius: 8px 0 0 0; }
  .admin-table th:last-child { border-radius: 0 8px 0 0; }
  .admin-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--navy); }
  .admin-table tr:last-child td { border-bottom: none; }
  .admin-table tr:hover td { background: var(--cream); }
  .status-chip {
    padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600;
    font-family: 'DM Mono', monospace;
  }
  .chip-waiting { background: #fef9ec; color: #b08a2a; }
  .chip-serving { background: #e8f5ef; color: var(--green); }
  .chip-done { background: #f0f0f0; color: #888; }

  .notice-input {
    width: 100%; padding: 10px 12px; border: 1.5px solid #dde2ea;
    border-radius: 8px; margin-bottom: 8px; font-size: 0.85rem;
    font-family: 'DM Sans', sans-serif; outline: none;
  }
  .notice-input:focus { border-color: var(--gold); }

  .email-item {
    padding: 12px; background: var(--cream); border-radius: 10px;
    border: 1px solid var(--border); margin-bottom: 8px;
  }
  .email-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .email-to { font-weight: 600; font-size: 0.85rem; color: var(--navy); }
  .email-time { font-size: 0.72rem; color: var(--text-dim); }
  .email-subj { font-size: 0.8rem; color: var(--navy-light); font-weight: 500; }
  .email-pre { font-size: 0.75rem; color: var(--text-dim); white-space: pre-wrap; margin-top: 6px; font-family: 'DM Mono', monospace; background: var(--white); padding: 8px; border-radius: 6px; border: 1px solid var(--border); }

  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    padding: 12px 20px; border-radius: 10px; font-size: 0.85rem; font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: toastIn 0.3s ease;
  }
  @keyframes toastIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .toast-success { background: #2d936c; color: var(--white); }
  .toast-error { background: var(--red); color: var(--white); }
  .toast-info { background: var(--navy); color: var(--gold); }

  .empty { text-align: center; padding: 2rem; color: var(--text-dim); font-size: 0.9rem; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--navy); margin-bottom: 1rem; }
  
  .action-btn {
    padding: 5px 12px; font-size: 0.74rem; font-weight: 600; border-radius: 6px;
    cursor: pointer; border: none; transition: all 0.15s; margin-right: 4px;
  }
  .ab-serve { background: #e8f5ef; color: var(--green); }
  .ab-serve:hover { background: var(--green); color: var(--white); }
  .ab-done { background: #f0f0f0; color: #555; }
  .ab-done:hover { background: #555; color: var(--white); }
  .ab-del { background: #fcecea; color: var(--red); }
  .ab-del:hover { background: var(--red); color: var(--white); }
`;

// ─── Purposes ─────────────────────────────────────────────────────────────────
const PURPOSES = [
  "Account Opening", "Loan Application", "Fixed Deposit",
  "Fund Transfer", "Cheque Deposit", "KYC Update",
  "Credit Card", "Internet Banking", "Complaint / Grievance", "Other",
];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return <div className={`toast toast-${type}`}>{msg}</div>;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("book"); // book | admin
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [session, setSession] = useState({ ...sessionStore });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [emails, setEmails] = useState([]);

  // Sync from store
  const refresh = () => {
    setTokens([...tokenStore]);
    setSession({ ...sessionStore });
    setEmails([...emailLog]);
  };

  useEffect(() => { refresh(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Booking Submit ──
  const handleBook = (data) => {
    if (!sessionStore.active || !sessionStore.counterOpen) {
      showToast("Counter is currently closed. Please try later.", "error"); return;
    }
    const position = tokenStore.filter(t => t.status !== "done").length + 1;
    const wait = estimatedWait(position);
    const booking = {
      id: Date.now(),
      token: generateToken(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      purpose: data.purpose,
      position,
      estimatedWait: wait,
      status: position === 1 ? "serving" : "waiting",
      bookedAt: new Date().toLocaleString(),
    };
    tokenStore.push(booking);
    const emailSent = sendEmailNotification(booking);
    refresh();
    setModal({ booking, emailSent });
    showToast(`Token ${booking.token} booked! Email sent.`, "success");
  };

  // ── Admin Actions ──
  const adminAction = (action, payload) => {
    if (action === "endSession") {
      sessionStore.active = false;
      sessionStore.counterOpen = false;
      showToast("Session ended. Counter is now closed.", "info");
    } else if (action === "openSession") {
      sessionStore.active = true;
      sessionStore.counterOpen = true;
      showToast("Session opened! Counter is live.", "success");
    } else if (action === "addTime") {
      sessionStore.extraMinutes += payload;
      showToast(`+${payload} mins added to all wait times.`, "success");
    } else if (action === "setNotice") {
      sessionStore.notice = payload;
      showToast("Notice updated.", "info");
    } else if (action === "serve") {
      const t = tokenStore.find(x => x.id === payload);
      if (t) { t.status = "serving"; showToast(`Now serving ${t.token}`, "success"); }
    } else if (action === "done") {
      const t = tokenStore.find(x => x.id === payload);
      if (t) { t.status = "done"; showToast(`${t.token} marked done.`, "info"); }
    } else if (action === "delete") {
      tokenStore = tokenStore.filter(x => x.id !== payload);
      showToast("Token removed.", "error");
    } else if (action === "clearAll") {
      tokenStore = [];
      tokenCounter = 1;
      showToast("All tokens cleared.", "info");
    }
    refresh();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="header-brand">
            <div className="header-logo">B</div>
            <div>
              <div className="header-title">PrimeBank Token System</div>
              <div className="header-sub">Branch Queue Management</div>
            </div>
          </div>
          <nav className="header-nav">
            <button className={`nav-btn ${view === "book" ? "active" : ""}`} onClick={() => setView("book")}>📋 Book Token</button>
            <button className={`nav-btn ${view === "admin" ? "active" : ""}`} onClick={() => setView("admin")}>🔐 Admin</button>
          </nav>
        </header>

        <div className={`session-banner ${session.active && session.counterOpen ? "open" : "closed"}`}>
          <div className="pulse-dot" />
          {session.active && session.counterOpen
            ? `Counter is OPEN — ${tokens.filter(t => t.status === "waiting").length} in queue`
            : "Counter is CLOSED — No new bookings accepted"}
          {session.notice && <span style={{ marginLeft: 12, fontStyle: "italic" }}>| {session.notice}</span>}
        </div>

        <main className="main">
          {view === "book"
            ? <BookingView tokens={tokens} onBook={handleBook} session={session} />
            : adminAuthed
              ? <AdminPanel tokens={tokens} session={session} emails={emails} onAction={adminAction} onLogout={() => setAdminAuthed(false)} />
              : <AdminLogin onLogin={(ok) => ok ? setAdminAuthed(true) : showToast("Wrong credentials", "error")} />
          }
        </main>

        {modal && <SuccessModal data={modal} onClose={() => setModal(null)} />}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </>
  );
}

// ─── Booking View ─────────────────────────────────────────────────────────────
function BookingView({ tokens, onBook, session }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", purpose: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "10-digit number required";
    if (!form.purpose) e.purpose = "Select a purpose";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 700)); // simulate API
    onBook(form);
    setForm({ name: "", email: "", phone: "", purpose: "", notes: "" });
    setLoading(false);
  };

  const active = tokens.filter(t => t.status !== "done");

  return (
    <div className="booking-grid">
      {/* Form */}
      <div className="card">
        <div className="card-title">Book Your Token</div>
        <div className="card-sub">Fill in your details to get a queue number</div>

        <div className="field">
          <label>Full Name</label>
          <input placeholder="e.g. Arjun Sharma" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          {errors.name && <span style={{ color: "#d64045", fontSize: "0.75rem" }}>{errors.name}</span>}
        </div>
        <div className="field">
          <label>Email Address</label>
          <input type="email" placeholder="arjun@example.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          {errors.email && <span style={{ color: "#d64045", fontSize: "0.75rem" }}>{errors.email}</span>}
        </div>
        <div className="field">
          <label>Phone Number</label>
          <input placeholder="9876543210" value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          {errors.phone && <span style={{ color: "#d64045", fontSize: "0.75rem" }}>{errors.phone}</span>}
        </div>
        <div className="field">
          <label>Purpose of Visit</label>
          <select value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}>
            <option value="">-- Select Purpose --</option>
            {PURPOSES.map(p => <option key={p}>{p}</option>)}
          </select>
          {errors.purpose && <span style={{ color: "#d64045", fontSize: "0.75rem" }}>{errors.purpose}</span>}
        </div>
        <div className="field">
          <label>Additional Notes (optional)</label>
          <textarea placeholder="Any specific requirements..." value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>

        <button className="submit-btn" onClick={handleSubmit}
          disabled={loading || !session.active}>
          {loading ? "⏳ Processing..." : "🎫 Get Token Number"}
        </button>
        {!session.active && <p style={{ color: "#d64045", fontSize: "0.78rem", marginTop: 8, textAlign: "center" }}>Counter is closed. Booking unavailable.</p>}
      </div>

      {/* Queue */}
      <div className="card">
        <div className="card-title">Live Queue</div>
        <div className="card-sub">{active.length} customer(s) in queue</div>
        {active.length === 0
          ? <div className="empty">🎉 No one in queue — you'll be served immediately!</div>
          : <div className="queue-list">
            {active.map((t, i) => (
              <div className="queue-item" key={t.id}>
                <div style={{ textAlign: "center", minWidth: 28 }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>#{i + 1}</div>
                </div>
                <div className="queue-info">
                  <div className="queue-name">{t.name}</div>
                  <div className="queue-token">{t.token}</div>
                  <div className="queue-purpose">{t.purpose}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span className={`queue-badge ${t.status}`}>{t.status === "serving" ? "🟢 Serving" : "⏳ Waiting"}</span>
                  <span className="queue-wait">~{t.estimatedWait + sessionStore.extraMinutes} min</span>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ data, onClose }) {
  const { booking } = data;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-icon">🎫</div>
        <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Your Token</div>
        <div className="modal-token"><span>{booking.token.split("-")[0]}-</span>{booking.token.split("-")[1]}</div>
        <div className="token-details">
          {[
            ["Name", booking.name],
            ["Position", `#${booking.position} in queue`],
            ["Purpose", booking.purpose],
            ["Est. Wait", `~${booking.estimatedWait} minutes`],
            ["Booked At", booking.bookedAt],
          ].map(([l, v]) => (
            <div className="token-row" key={l}>
              <span className="label">{l}</span>
              <span className="value">{v}</span>
            </div>
          ))}
        </div>
        <div className="email-note">✅ Confirmation email sent to {booking.email}</div>
        <button className="modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ─── Admin Login ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [u, setU] = useState(""); const [p, setP] = useState("");
  return (
    <div className="admin-login">
      <div className="card">
        <div className="card-title">Admin Access</div>
        <div className="card-sub">Enter credentials to manage the branch session</div>
        <div className="field"><label>Username</label>
          <input placeholder="admin" value={u} onChange={e => setU(e.target.value)} /></div>
        <div className="field"><label>Password</label>
          <input type="password" placeholder="••••••••" value={p} onChange={e => setP(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onLogin(u === "admin" && p === "bank@123")} /></div>
        <button className="submit-btn" onClick={() => onLogin(u === "admin" && p === "bank@123")}>
          🔐 Login to Admin Panel
        </button>
        <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: 10, textAlign: "center" }}>
          Demo: username <b>admin</b> / password <b>bank@123</b>
        </p>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({ tokens, session, emails, onAction, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [extraMin, setExtraMin] = useState(10);
  const [notice, setNotice] = useState(session.notice || "");
  const [expandEmail, setExpandEmail] = useState(null);

  const waiting = tokens.filter(t => t.status === "waiting").length;
  const serving = tokens.filter(t => t.status === "serving").length;
  const done = tokens.filter(t => t.status === "done").length;
  const total = tokens.length;

  const menu = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "queue", icon: "🎫", label: "Token Queue" },
    { id: "session", icon: "⚙️", label: "Session Control" },
    { id: "emails", icon: "📧", label: "Email Logs" },
  ];

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <h3>Admin Panel</h3>
        <div className="sidebar-menu">
          {menu.map(m => (
            <button key={m.id} className={`sidebar-item ${tab === m.id ? "active" : ""}`} onClick={() => setTab(m.id)}>
              {m.icon} {m.label}
            </button>
          ))}
          <button className="sidebar-item" onClick={onLogout} style={{ marginTop: 16, color: "#f09090" }}>
            🚪 Logout
          </button>
        </div>
        <div style={{ marginTop: 20, padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: 10, fontSize: "0.78rem" }}>
          <div style={{ color: "var(--gold)", fontWeight: 600, marginBottom: 4 }}>Session Status</div>
          <div style={{ color: session.active ? "#6be6b0" : "#f09090" }}>
            {session.active ? "🟢 Counter Open" : "🔴 Counter Closed"}
          </div>
        </div>
      </div>

      <div className="admin-content">
        {tab === "dashboard" && (
          <>
            <div className="stats-grid">
              {[["Total Tokens", total, "🎫"], ["Waiting", waiting, "⏳"], ["Serving", serving, "🟢"], ["Done", done, "✅"]].map(([l, n, i]) => (
                <div className="stat-card" key={l}>
                  <div style={{ fontSize: "1.5rem" }}>{i}</div>
                  <div className="stat-num">{n}</div>
                  <div className="stat-label">{l}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="section-title">Recent Bookings</div>
              {tokens.length === 0 ? <div className="empty">No tokens yet.</div> :
                <table className="admin-table">
                  <thead><tr><th>Token</th><th>Name</th><th>Purpose</th><th>Status</th><th>Time</th></tr></thead>
                  <tbody>
                    {[...tokens].reverse().slice(0, 6).map(t => (
                      <tr key={t.id}>
                        <td style={{ fontFamily: "DM Mono, monospace", fontWeight: 600 }}>{t.token}</td>
                        <td>{t.name}</td>
                        <td>{t.purpose}</td>
                        <td><span className={`status-chip chip-${t.status}`}>{t.status}</span></td>
                        <td style={{ color: "var(--text-dim)" }}>{t.bookedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          </>
        )}

        {tab === "queue" && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div className="section-title" style={{ margin: 0 }}>Token Queue Management</div>
              <button className="btn btn-danger" onClick={() => { if (confirm("Clear all tokens?")) onAction("clearAll"); }}>🗑 Clear All</button>
            </div>
            {tokens.length === 0 ? <div className="empty">No tokens in the system.</div> :
              <table className="admin-table">
                <thead><tr><th>Token</th><th>Name</th><th>Email</th><th>Phone</th><th>Purpose</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {tokens.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: "DM Mono, monospace", fontWeight: 600 }}>{t.token}</td>
                      <td>{t.name}</td>
                      <td style={{ fontSize: "0.78rem" }}>{t.email}</td>
                      <td style={{ fontFamily: "DM Mono, monospace" }}>{t.phone}</td>
                      <td>{t.purpose}</td>
                      <td><span className={`status-chip chip-${t.status}`}>{t.status}</span></td>
                      <td>
                        {t.status === "waiting" && <button className="action-btn ab-serve" onClick={() => onAction("serve", t.id)}>▶ Serve</button>}
                        {t.status === "serving" && <button className="action-btn ab-done" onClick={() => onAction("done", t.id)}>✓ Done</button>}
                        <button className="action-btn ab-del" onClick={() => onAction("delete", t.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </div>
        )}

        {tab === "session" && (
          <>
            <div className="control-grid">
              <div className="control-card">
                <h4>🔴 End Session</h4>
                <p>Close the counter. No new tokens will be accepted.</p>
                <button className="btn btn-danger" onClick={() => { if (confirm("End the session?")) onAction("endSession"); }}>End Session Now</button>
              </div>
              <div className="control-card">
                <h4>🟢 Open Session</h4>
                <p>Reopen the counter to accept new token bookings.</p>
                <button className="btn btn-success" onClick={() => onAction("openSession")}>Open Counter</button>
              </div>
              <div className="control-card">
                <h4>⏱ Add Extra Time</h4>
                <p>Add buffer time to all estimated wait times.</p>
                <div className="input-group">
                  <input type="number" value={extraMin} min={5} max={120} step={5}
                    onChange={e => setExtraMin(Number(e.target.value))} />
                  <button className="btn btn-primary" onClick={() => onAction("addTime", extraMin)}>+{extraMin} min</button>
                </div>
              </div>
              <div className="control-card">
                <h4>📢 Branch Notice</h4>
                <p>Set a notice shown in the session banner.</p>
                <input className="notice-input" placeholder="e.g. Limited staff today..." value={notice}
                  onChange={e => setNotice(e.target.value)} />
                <button className="btn btn-gold" onClick={() => onAction("setNotice", notice)}>Update Notice</button>
              </div>
            </div>
            <div className="card">
              <div className="section-title">Session Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", fontSize: "0.85rem" }}>
                {[
                  ["Status", session.active ? "🟢 Open" : "🔴 Closed"],
                  ["Extra Time Added", `${session.extraMinutes} minutes`],
                  ["Session Started", session.sessionStart ? new Date(session.sessionStart).toLocaleString() : "—"],
                  ["Current Notice", session.notice || "None"],
                ].map(([l, v]) => (
                  <div key={l} style={{ padding: "10px 12px", background: "var(--cream)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
                    <div style={{ fontWeight: 600, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "emails" && (
          <div className="card">
            <div className="section-title">Email Notification Logs ({emails.length})</div>
            {emails.length === 0 ? <div className="empty">No emails sent yet.</div> :
              [...emails].reverse().map(e => (
                <div className="email-item" key={e.id}>
                  <div className="email-header">
                    <div className="email-to">📧 {e.to}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--green)", fontWeight: 600 }}>✅ {e.status}</span>
                      <div className="email-time">{e.sentAt}</div>
                    </div>
                  </div>
                  <div className="email-subj">{e.subject}</div>
                  <button onClick={() => setExpandEmail(expandEmail === e.id ? null : e.id)}
                    style={{ fontSize: "0.72rem", color: "var(--gold)", background: "none", border: "none", cursor: "pointer", marginTop: 4, fontWeight: 600 }}>
                    {expandEmail === e.id ? "▲ Hide" : "▼ Show Email Body"}
                  </button>
                  {expandEmail === e.id && <pre className="email-pre">{e.body}</pre>}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
