import { useEffect, useMemo, useState } from 'react';

// ============================================================================
//  Patienten-Anfrageformular (Kampagnen-Landingpage) + Praxis-Ansicht
//  Nur synthetische Beispieldaten. Speicherung lokal im Browser (localStorage).
// ============================================================================

const QUESTIONS = [
  { id: 'brille', text: 'Ich möchte ohne Brille Auto fahren.' },
  { id: 'lesen', text: 'Ich kann nicht mehr so gut lesen wie früher.' },
  { id: 'computer', text: 'Bei Computerarbeit habe ich Kopfschmerzen.' },
  { id: 'linsen', text: 'Ich vertrage meine Kontaktlinsen nicht mehr.' },
];

const FINAL_QUESTION = 'Mir ist bewusst, dass es sich um keine Krankenkassenleistung handelt.';

const VORSORGE_TEXT =
  'Zum Ausschluss einer Augenerkrankung wäre für Sie ein regulärer Augenarzttermin sinnvoll. Möchten Sie diesen in einer unserer Praxen buchen?';

const TYPES = {
  refraktiv: { label: 'Refraktive Beratung', color: '#424b5a', bg: '#dfedf9' },
  vorsorge: { label: 'Vorsorgetermin', color: '#2f855a', bg: '#eef7f1' },
};
const typeOf = (b) => TYPES[b.typ || 'refraktiv'];

const SLOT_TIMES = ['08:30', '09:15', '10:00', '10:45', '13:30', '14:15', '15:00'];
const STORAGE_KEY = 'anfrage-prototyp-buchungen';

// Beispieldaten (klar erfunden) für die Praxis-Ansicht
const SEED = [
  { id: 's1', datum: offsetDate(1), zeit: '09:15', vorname: 'Mara', nachname: 'Beispiel', telefon: '0170 0000001', email: 'mara.beispiel@example.com', alter: '34', erkrankungen: 'keine', antworten: ['brille'], typ: 'refraktiv', erstellt: new Date().toISOString() },
  { id: 's2', datum: offsetDate(2), zeit: '13:30', vorname: 'Tobias', nachname: 'Muster', telefon: '0170 0000002', email: 'tobias.muster@example.com', alter: '51', erkrankungen: 'Trockenes Auge', antworten: ['lesen', 'computer'], typ: 'refraktiv', erstellt: new Date().toISOString() },
  { id: 's3', datum: offsetDate(4), zeit: '10:00', vorname: 'Leyla', nachname: 'Demo', telefon: '0170 0000003', email: 'leyla.demo@example.com', alter: '28', erkrankungen: 'keine', antworten: [], typ: 'vorsorge', erstellt: new Date().toISOString() },
];

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toIso(d);
}
function toIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
function weekdayShort(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short' });
}
function loadBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SEED;
}

export default function App() {
  const [view, setView] = useState('patient');
  const [bookings, setBookings] = useState(loadBookings);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings)); } catch {}
  }, [bookings]);

  function addBooking(b) {
    setBookings((prev) => [...prev, { ...b, id: 'b' + Date.now(), erstellt: new Date().toISOString() }]);
  }

  return (
    <div className="page">
      <div className="infobar">
        <span>Sprechzeiten: Mo–Fr 8–12 Uhr und 14–17 Uhr</span>
        <span>Tel. 0000 000000 · anmeldung@beispiel-augenklinik.de</span>
      </div>
      <header className="topbar">
        <div className="brand"><span className="dot">👁</span><div>Augentagesklinik<small>Brillenfreiheit · Vorsorge</small></div></div>
        <nav className="tabs">
          <button className={view === 'patient' ? 'tab active' : 'tab'} onClick={() => setView('patient')}>Patientenformular</button>
          <button className={view === 'praxis' ? 'tab active' : 'tab'} onClick={() => setView('praxis')}>Praxis-Ansicht</button>
        </nav>
      </header>
      <main className="container">
        {view === 'patient' ? <PatientFlow bookings={bookings} onBook={addBooking} /> : <PraxisView bookings={bookings} />}
      </main>
      <footer className="footer"><strong>Schau gut!</strong> · Prototyp mit Beispieldaten</footer>
    </div>
  );
}

// ---------------------------------------------------------------- Patient
function PatientFlow({ bookings, onBook }) {
  const [answers, setAnswers] = useState({});
  const [finalAnswer, setFinalAnswer] = useState(null);
  const [step, setStep] = useState('fragen'); // fragen | kalender | daten | fertig
  const [slot, setSlot] = useState(null);
  const [done, setDone] = useState(null);
  const [typ, setTyp] = useState('refraktiv');

  const allAnswered = QUESTIONS.every((q) => answers[q.id] !== undefined) && finalAnswer !== null;
  const anyYes = QUESTIONS.some((q) => answers[q.id] === true);
  const eligible = allAnswered && anyYes && finalAnswer === true;
  const notEligible = allAnswered && !eligible;

  function reset() {
    setAnswers({}); setFinalAnswer(null); setStep('fragen'); setSlot(null); setDone(null); setTyp('refraktiv');
  }

  if (step === 'fertig' && done) {
    return (
      <section className="card center">
        <div className="check">✓</div>
        <h1>Ihr Termin ist reserviert</h1>
        <p><span className="chip" style={{ background: typeOf(done).bg, color: typeOf(done).color }}>{typeOf(done).label}</span></p>
        <p className="lead">
          {fmtDate(done.datum)} um {done.zeit} Uhr · {done.vorname} {done.nachname}
        </p>
        <p className="muted">Sie erhalten eine Bestätigung per E-Mail an {done.email}.</p>
        <button className="ghost" onClick={reset}>Neue Anfrage starten</button>
      </section>
    );
  }

  return (
    <>
      <section className="card hero">
        <span className="eyebrow">Brillenfreiheit · Unverbindliche Anfrage</span>
        <h1>Leben ohne Brille – passt das zu Ihnen?</h1>
        <p className="lead">Beantworten Sie fünf kurze Fragen. Wenn eine Behandlung für Sie in Frage kommt, können Sie direkt einen Beratungstermin wählen.</p>
        <Steps current={step} />
      </section>

      {step === 'fragen' && (
        <section className="card">
          <h2>Ihre Situation</h2>
          <div className="questions">
            {QUESTIONS.map((q) => (
              <YesNo key={q.id} text={q.text} value={answers[q.id]} onChange={(v) => setAnswers({ ...answers, [q.id]: v })} />
            ))}
            <div className="divider" />
            <YesNo text={FINAL_QUESTION} value={finalAnswer} onChange={setFinalAnswer} emphasis />
          </div>

          {eligible && (
            <div className="result ok">
              <strong>Gute Nachricht:</strong> Eine Behandlung könnte für Sie in Frage kommen.
              <button onClick={() => { setTyp('refraktiv'); setStep('kalender'); }}>Termin buchen →</button>
            </div>
          )}
          {notEligible && (
            <div className="result info">
              <span>{VORSORGE_TEXT}</span>
              <button className="teal" onClick={() => { setTyp('vorsorge'); setStep('kalender'); }}>Augenarzttermin buchen →</button>
            </div>
          )}
          {!allAnswered && <p className="hint">Bitte beantworten Sie alle Fragen.</p>}
        </section>
      )}

      {step === 'kalender' && (
        <section className="card">
          <h2>Wunschtermin wählen · {TYPES[typ].label}</h2>
          <Calendar bookings={bookings} selected={slot} onSelect={setSlot} />
          <div className="actions">
            <button className="ghost" onClick={() => setStep('fragen')}>← Zurück</button>
            <button disabled={!slot} onClick={() => setStep('daten')}>Weiter zu Ihren Daten →</button>
          </div>
        </section>
      )}

      {step === 'daten' && (
        <ContactForm
          slot={slot}
          onBack={() => setStep('kalender')}
          onSubmit={(data) => {
            const b = { ...data, typ, datum: slot.datum, zeit: slot.zeit, antworten: QUESTIONS.filter((q) => answers[q.id]).map((q) => q.id) };
            onBook(b);
            setDone(b);
            setStep('fertig');
          }}
        />
      )}
    </>
  );
}

function Steps({ current }) {
  const items = [['fragen', 'Fragen'], ['kalender', 'Termin'], ['daten', 'Ihre Daten']];
  const idx = Math.max(0, items.findIndex(([k]) => k === current));
  return (
    <ol className="steps">
      {items.map(([k, label], i) => (
        <li key={k} className={i < idx ? 'done' : i === idx ? 'current' : ''}><span>{i + 1}</span>{label}</li>
      ))}
    </ol>
  );
}

function YesNo({ text, value, onChange, emphasis }) {
  return (
    <div className={emphasis ? 'q emphasis' : 'q'}>
      <p>{text}</p>
      <div className="yn">
        <button type="button" className={value === true ? 'opt on' : 'opt'} onClick={() => onChange(true)}>Ja</button>
        <button type="button" className={value === false ? 'opt on' : 'opt'} onClick={() => onChange(false)}>Nein</button>
      </div>
    </div>
  );
}

function Calendar({ bookings, selected, onSelect, readOnly }) {
  const days = useMemo(() => {
    const out = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (out.length < 7) {
      if (d.getDay() !== 0 && d.getDay() !== 6) out.push(toIso(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, []);
  const taken = (datum, zeit) => bookings.find((b) => b.datum === datum && b.zeit === zeit);

  return (
    <div className="calendar">
      {days.map((datum) => (
        <div key={datum} className="day">
          <div className="dayhead"><strong>{weekdayShort(datum)}</strong><span>{fmtDate(datum).slice(0, 5)}</span></div>
          {SLOT_TIMES.map((zeit) => {
            const b = taken(datum, zeit);
            const isSel = selected && selected.datum === datum && selected.zeit === zeit;
            if (readOnly) {
              const t = b && typeOf(b);
              return (
                <div key={zeit} className={b ? 'slot typed' : 'slot free-ro'} style={b ? { background: t.bg, borderColor: t.color, color: t.color } : undefined} title={b ? `${t.label}: ${b.vorname} ${b.nachname}` : 'frei'}>
                  {zeit}{b && <small style={{ color: t.color }}>{b.nachname}</small>}
                </div>
              );
            }
            return (
              <button key={zeit} type="button" disabled={!!b} className={isSel ? 'slot sel' : b ? 'slot booked' : 'slot'} onClick={() => onSelect({ datum, zeit })}>
                {zeit}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ContactForm({ slot, onBack, onSubmit }) {
  const [f, setF] = useState({ vorname: '', nachname: '', telefon: '', email: '', alter: '', erkrankungen: '' });
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const errors = {};
  if (!f.vorname.trim()) errors.vorname = true;
  if (!f.nachname.trim()) errors.nachname = true;
  if (!/^[+0-9 /-]{6,}$/.test(f.telefon.trim())) errors.telefon = true;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) errors.email = true;
  const age = Number(f.alter);
  if (!f.alter || !Number.isInteger(age) || age < 18 || age > 110) errors.alter = true;
  if (!f.erkrankungen.trim()) errors.erkrankungen = true;
  const valid = Object.keys(errors).length === 0;

  function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onSubmit({ ...f, vorname: f.vorname.trim(), nachname: f.nachname.trim(), telefon: f.telefon.trim(), email: f.email.trim(), erkrankungen: f.erkrankungen.trim() });
  }
  const cls = (k) => (touched && errors[k] ? 'field err' : 'field');

  return (
    <section className="card">
      <h2>Ihre Kontaktdaten</h2>
      <p className="selected">Gewählter Termin: <strong>{fmtDate(slot.datum)} um {slot.zeit} Uhr</strong></p>
      <form className="grid2" onSubmit={submit} noValidate>
        <label className={cls('vorname')}>Vorname *<input value={f.vorname} onChange={set('vorname')} maxLength={60} /></label>
        <label className={cls('nachname')}>Nachname *<input value={f.nachname} onChange={set('nachname')} maxLength={60} /></label>
        <label className={cls('telefon')}>Telefonnummer *<input value={f.telefon} onChange={set('telefon')} maxLength={30} placeholder="z. B. 0170 1234567" /></label>
        <label className={cls('email')}>E-Mail-Adresse *<input type="email" value={f.email} onChange={set('email')} maxLength={120} /></label>
        <label className={cls('alter')}>Alter *<input type="number" min="18" max="110" value={f.alter} onChange={set('alter')} /></label>
        <label className={cls('erkrankungen')}>Bekannte Augenerkrankungen *<input value={f.erkrankungen} onChange={set('erkrankungen')} maxLength={200} placeholder="z. B. keine" /></label>
        {touched && !valid && <p className="hint err full">Bitte füllen Sie alle Felder korrekt aus (Alter ab 18 Jahren).</p>}
        <div className="actions full">
          <button type="button" className="ghost" onClick={onBack}>← Zurück</button>
          <button type="submit">Termin verbindlich buchen</button>
        </div>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------- Praxis
function PraxisView({ bookings }) {
  const sorted = [...bookings].sort((a, b) => (a.datum + a.zeit).localeCompare(b.datum + b.zeit));
  const label = (id) => QUESTIONS.find((q) => q.id === id)?.text.replace(/\.$/, '') || id;
  return (
    <>
      <section className="card">
        <div className="kpis">
          <div><span>Buchungen gesamt</span><strong>{bookings.length}</strong></div>
          <div><span>Diese Woche</span><strong>{bookings.filter((b) => b.datum <= offsetDate(7) && b.datum >= toIso(new Date())).length}</strong></div>
          <div><span>Ø Alter</span><strong>{bookings.length ? Math.round(bookings.reduce((s, b) => s + Number(b.alter), 0) / bookings.length) : '–'}</strong></div>
        </div>
      </section>
      <section className="card">
        <h2>Terminkalender</h2>
        <div className="legend">
          {Object.entries(TYPES).map(([k, t]) => <span key={k}><i style={{ background: t.color }} />{t.label} ({bookings.filter((b) => (b.typ || 'refraktiv') === k).length})</span>)}
        </div>
        <Calendar bookings={bookings} readOnly />
      </section>
      <section className="card wide">
        <h2>Gebuchte Patienten</h2>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Termin</th><th>Art</th><th>Name</th><th>Alter</th><th>Telefon</th><th>E-Mail</th><th>Augenerkrankungen</th><th>Anlass</th></tr></thead>
            <tbody>
              {sorted.map((b) => (
                <tr key={b.id}>
                  <td className="nowrap">{fmtDate(b.datum)} {b.zeit}</td>
                  <td className="nowrap"><span className="chip" style={{ background: typeOf(b).bg, color: typeOf(b).color }}>{typeOf(b).label}</span></td>
                  <td className="nowrap">{b.vorname} {b.nachname}</td>
                  <td>{b.alter}</td>
                  <td className="nowrap">{b.telefon}</td>
                  <td>{b.email}</td>
                  <td>{b.erkrankungen}</td>
                  <td>{(b.antworten || []).length ? b.antworten.map((a) => <span key={a} className="chip">{label(a)}</span>) : <span className="muted">–</span>}</td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={8} className="empty">Noch keine Buchungen.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
