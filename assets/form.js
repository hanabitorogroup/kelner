/* =========================================================================
   KING LONG – Ankieta rekrutacyjna (Pracownik Obsługi)
   Renderowanie formularza + automatyczna ocena + wysyłka do Google Sheet.

   Aby zmienić pytania / punktację – edytuj obiekt FORM_CONFIG poniżej.
   Punktacja:
     - score: liczba punktów za daną odpowiedź (0–2)
     - knockout: true  -> odpowiedź dyskwalifikująca (od razu "Nieodpowiedni")
   ========================================================================= */

const FORM_CONFIG = {
  intro:
    "Cześć! Dziękujemy za Twoje zgłoszenie. Szanujemy czas naszych kandydatów, " +
    "dlatego przed zaproszeniem na płatny dzień próbny w naszej restauracji azjatyckiej " +
    "chcemy upewnić się, że nasze oczekiwania są zbieżne. Wypełnienie ankiety zajmie Ci " +
    "tylko 2 minuty. Do usłyszenia!",

  sections: [
    {
      title: "1. Kontakt i dyspozycyjność",
      questions: [
        {
          id: "imie", type: "text", sheetLabel: "Imię i nazwisko",
          label: "Imię i nazwisko", required: true, autocomplete: "name"
        },
        {
          id: "telefon", type: "tel", sheetLabel: "Telefon",
          label: "Numer telefonu", required: true, autocomplete: "tel",
          note: "Skontaktujemy się z Tobą pod tym numerem."
        },
        {
          id: "email", type: "email", sheetLabel: "E-mail",
          label: "Adres e-mail", required: false, autocomplete: "email"
        },
        {
          id: "lokalizacja", type: "radio", sheetLabel: "Lokalizacja",
          label: "Którą lokalizację wybierasz?", required: true, scored: false,
          options: [
            { label: "Oława (ul. Strzelna 7)", score: 0 },
            { label: "Wrocław (ul. Kiełczowska 64c)", score: 0 }
          ]
        },
        {
          id: "dni", type: "radio", sheetLabel: "Dni w tygodniu",
          label: "Ile dni w tygodniu chcesz i możesz pracować?", required: true, scored: true,
          options: [
            { label: "2–3 dni w tygodniu (praca dodatkowa)", score: 1 },
            { label: "4–5 dni w tygodniu", score: 2 },
            { label: "Pełny wymiar / ponad 5 dni (szukam stałego zatrudnienia)", score: 2 }
          ]
        },
        {
          id: "godziny", type: "radio", sheetLabel: "Godziny pracy",
          label: "Czy godziny pracy w wybranej lokalizacji Ci odpowiadają?",
          note: "Oława: 11:00–21:00 • Wrocław: 11:00–19:00",
          required: true, scored: true,
          options: [
            { label: "Tak, całkowicie mi odpowiadają.", score: 2 },
            { label: "Tak, ale tylko w wybrane dni tygodnia.", score: 1 },
            { label: "Nie, te godziny mi nie odpowiadają.", score: 0, knockout: true }
          ]
        },
        {
          id: "dojazd", type: "radio", sheetLabel: "Dojazd",
          label: "Czy masz zapewniony stabilny i punktualny dojazd do wybranej restauracji?",
          required: true, scored: true,
          options: [
            { label: "Tak, mieszkam blisko / mam własny transport.", score: 2 },
            { label: "Tak, dojeżdżam komunikacją i rozkład pozwala mi na punktualność.", score: 2 },
            { label: "Dojazd może być dla mnie problemem.", score: 0 }
          ]
        }
      ]
    },

    {
      title: "2. Dopasowanie do stanowiska",
      questions: [
        {
          id: "doswiadczenie", type: "radio", sheetLabel: "Doświadczenie",
          label: "Czy masz już doświadczenie w gastronomii lub bezpośredniej obsłudze klienta?",
          required: true, scored: true,
          options: [
            { label: "Tak, mam doświadczenie na podobnym stanowisku.", score: 2 },
            { label: "Nie w gastronomii, ale mam doświadczenie w handlu / obsłudze klienta.", score: 1 },
            { label: "Nie mam doświadczenia, ale bardzo szybko się uczę.", score: 1 }
          ]
        },
        {
          id: "telefon_obsluga", type: "radio", sheetLabel: "Obsługa telefoniczna",
          label: "Jak oceniasz swoją komunikatywność przy przyjmowaniu zamówień telefonicznych?",
          required: true, scored: true,
          options: [
            { label: "Bardzo dobrze – jestem otwarta/-y, komunikatywna/-y i nie stresuję się.", score: 2 },
            { label: "Dobrze – poradzę sobie, szybko się uczę.", score: 1 },
            { label: "Stresuję się podczas rozmów telefonicznych.", score: 0 }
          ]
        },
        {
          id: "multitasking", type: "radio", sheetLabel: "Multitasking",
          label:
            "Nasze stanowisko to multitasking: obsługa kasy, odbieranie telefonów, " +
            "pakowanie dań oraz dbanie o czystość sali i pomoc przy zmywaniu. Jak do tego podchodzisz?",
          required: true, scored: true,
          options: [
            { label: "Świetnie! Lubię dynamiczną pracę i chętnie pomagam we wszystkim.", score: 2 },
            { label: "Poradzę sobie z kasą i telefonami, ale nie chcę sprzątać ani zmywać.", score: 0, knockout: true },
            { label: "Wolę spokojniejszą pracę, skupioną tylko na jednej czynności.", score: 0, knockout: true }
          ]
        }
      ]
    },

    {
      title: "3. Standardy pracy (kluczowe)",
      questions: [
        {
          id: "zasady", type: "radio", sheetLabel: "Zasady (punktualność + kultura)",
          label:
            "W naszej restauracji kluczowe są dwie zasady: absolutna punktualność oraz bycie " +
            "zawsze miłym i komunikatywnym dla klientów. Czy w pełni to akceptujesz?",
          required: true, scored: true,
          options: [
            { label: "Tak, punktualność i wysoka kultura obsługi to dla mnie podstawa.", score: 2 },
            { label: "Mam problem z punktualnością lub nie lubię intensywnego kontaktu z klientem.", score: 0, knockout: true }
          ]
        },
        {
          id: "organizacja", type: "radio", sheetLabel: "Organizacja sali",
          label:
            "Praca wiąże się z bieżącą organizacją sali (pełna lodówka z napojami, przecieranie i " +
            "dokładanie sztućców, nalewanie sosów do dzbanków). Jak do tego podchodzisz?",
          required: true, scored: true,
          options: [
            { label: "Rozumiem to i będę rzetelnie dbać o te szczegóły.", score: 2 },
            { label: "Wolę skupić się wyłącznie na kasie, nie chcę zajmować się takimi rzeczami.", score: 0, knockout: true }
          ]
        },
        {
          id: "czystosc", type: "radio", sheetLabel: "Czystość / sprzątanie",
          label:
            "Nasz standard to nienaganna czystość: wycieranie stolików, polerowanie szklanek, mycie " +
            "naczyń, porządek w toalecie (papier), mycie parapetów na zewnątrz oraz sprzątanie wokół " +
            "kasy i wydawki. Czy jesteś na to gotowa/-y?",
          required: true, scored: true,
          options: [
            { label: "Tak, czystość miejsca pracy jest dla mnie ważna i naturalna.", score: 2 },
            { label: "Mogę wyczyścić stanowisko kasowe, ale nie chcę myć naczyń / sprzątać toalet.", score: 0, knockout: true }
          ]
        },
        {
          id: "sanepid", type: "radio", sheetLabel: "Książeczka sanepidowska",
          label: "Czy posiadasz aktualną książeczkę sanepidowską (do celów sanitarno-epidemiologicznych)?",
          required: true, scored: true,
          options: [
            { label: "Tak, posiadam aktualną.", score: 2 },
            { label: "Nie, ale jestem w trakcie wyrabiania / mogę ją szybko wyrobić.", score: 1 },
            { label: "Nie mam i nie planuję wyrabiać.", score: 0, knockout: true }
          ]
        }
      ]
    },

    {
      title: "4. Dodatkowo",
      questions: [
        {
          id: "uwagi", type: "textarea", sheetLabel: "Uwagi kandydata",
          label: "Chcesz coś dodać? (nieobowiązkowe)", required: false
        }
      ]
    }
  ]
};

/* Progi klasyfikacji (procent maksymalnej liczby punktów) */
const THRESHOLDS = {
  odpowiedni: 0.80,     // >= 80%
  doRozwazenia: 0.55    // 55% – 79%
};

/* ------------------------------------------------------------------ */
/* Renderowanie                                                        */
/* ------------------------------------------------------------------ */
function allQuestions() {
  return FORM_CONFIG.sections.flatMap(s => s.questions);
}

function renderForm() {
  document.getElementById("form-intro").textContent = FORM_CONFIG.intro;
  const root = document.getElementById("form-root");

  FORM_CONFIG.sections.forEach(section => {
    const sec = document.createElement("section");
    sec.className = "section";
    sec.innerHTML =
      `<h2 class="section__title">${section.title}</h2><hr class="section__rule" />`;

    section.questions.forEach(q => sec.appendChild(renderQuestion(q)));
    root.appendChild(sec);
  });
}

function renderQuestion(q) {
  const wrap = document.createElement("div");
  wrap.className = "q";
  wrap.dataset.qid = q.id;

  const req = q.required ? '<span class="q__req">*</span>' : "";
  let html = `<label class="q__label" for="f_${q.id}">${q.label}${req}</label>`;
  if (q.note) html += `<div class="q__note">${q.note}</div>`;
  wrap.innerHTML = html;

  if (q.type === "radio") {
    const opts = document.createElement("div");
    opts.className = "opts";
    q.options.forEach((opt, i) => {
      const id = `f_${q.id}_${i}`;
      const label = document.createElement("label");
      label.className = "opt";
      label.setAttribute("for", id);
      label.innerHTML =
        `<input type="radio" id="${id}" name="${q.id}" value="${i}" />` +
        `<span class="opt__text">${opt.label}</span>`;
      opts.appendChild(label);
    });
    wrap.appendChild(opts);
  } else if (q.type === "textarea") {
    const ta = document.createElement("textarea");
    ta.className = "field"; ta.id = `f_${q.id}`; ta.name = q.id;
    ta.rows = 3;
    wrap.appendChild(ta);
  } else {
    const inp = document.createElement("input");
    inp.className = "field";
    inp.type = q.type; inp.id = `f_${q.id}`; inp.name = q.id;
    if (q.autocomplete) inp.autocomplete = q.autocomplete;
    wrap.appendChild(inp);
  }
  return wrap;
}

/* ------------------------------------------------------------------ */
/* Odczyt + walidacja                                                  */
/* ------------------------------------------------------------------ */
function collectAnswers() {
  const answers = {};
  allQuestions().forEach(q => {
    if (q.type === "radio") {
      const checked = document.querySelector(`input[name="${q.id}"]:checked`);
      answers[q.id] = checked ? parseInt(checked.value, 10) : null;
    } else {
      const el = document.getElementById(`f_${q.id}`);
      answers[q.id] = el ? el.value.trim() : "";
    }
  });
  return answers;
}

function validate(answers) {
  const missing = [];
  document.querySelectorAll(".q.invalid").forEach(el => el.classList.remove("invalid"));
  allQuestions().forEach(q => {
    if (!q.required) return;
    const v = answers[q.id];
    const empty = (q.type === "radio") ? (v === null) : (!v);
    if (empty) {
      missing.push(q);
      const el = document.querySelector(`.q[data-qid="${q.id}"]`);
      if (el) el.classList.add("invalid");
    }
  });
  return missing;
}

/* ------------------------------------------------------------------ */
/* Ocena / punktacja                                                   */
/* ------------------------------------------------------------------ */
function computeResult(answers) {
  let score = 0, maxScore = 0;
  const knockoutReasons = [];

  allQuestions().forEach(q => {
    if (q.type !== "radio" || !q.scored) return;
    const maxOpt = Math.max(...q.options.map(o => o.score));
    maxScore += maxOpt;
    const idx = answers[q.id];
    if (idx === null || idx === undefined) return;
    const opt = q.options[idx];
    score += opt.score;
    if (opt.knockout) knockoutReasons.push(`${q.sheetLabel}: „${opt.label}”`);
  });

  const percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
  let klasyfikacja;
  if (knockoutReasons.length > 0) {
    klasyfikacja = "Nieodpowiedni";
  } else if (percent >= THRESHOLDS.odpowiedni * 100) {
    klasyfikacja = "Odpowiedni";
  } else if (percent >= THRESHOLDS.doRozwazenia * 100) {
    klasyfikacja = "Do rozważenia";
  } else {
    klasyfikacja = "Nieodpowiedni";
  }

  return { score, maxScore, percent, klasyfikacja, knockoutReasons };
}

/* ------------------------------------------------------------------ */
/* Budowa rekordu do arkusza (kolejność = kolumny w arkuszu)           */
/* ------------------------------------------------------------------ */
function buildRecord(answers, result) {
  const record = {};
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  record["Znacznik czasu"] =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  allQuestions().forEach(q => {
    const v = answers[q.id];
    if (q.type === "radio") {
      record[q.sheetLabel] = (v === null || v === undefined) ? "" : q.options[v].label;
    } else {
      record[q.sheetLabel] = v || "";
    }
  });

  record["Punkty"] = result.score;
  record["Maks."] = result.maxScore;
  record["Wynik %"] = result.percent;
  record["Klasyfikacja"] = result.klasyfikacja;
  record["Powód odrzucenia"] = result.knockoutReasons.join(" | ");
  return record;
}

/* ------------------------------------------------------------------ */
/* Wysyłka                                                             */
/* ------------------------------------------------------------------ */
function backupLocal(record) {
  try {
    const key = "kelner_zgloszenia";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.push(record);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) { /* ignore */ }
}

async function sendToSheet(record) {
  const url = (window.KELNER_CONFIG && window.KELNER_CONFIG.endpointUrl || "").trim();
  if (!url) {
    console.warn("[KELNER] Brak endpointUrl w assets/config.js – odpowiedź nie została wysłana do arkusza.");
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ record })
    });
  } catch (e) {
    console.warn("[KELNER] Błąd wysyłki:", e);
  }
}

/* ------------------------------------------------------------------ */
/* Obsługa formularza                                                  */
/* ------------------------------------------------------------------ */
function initForm() {
  renderForm();
  const form = document.getElementById("ankieta");
  const errBox = document.getElementById("form-error");
  const btn = document.getElementById("submit-btn");

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    errBox.hidden = true;

    // Honeypot: jeśli wypełnione -> bot, cicho udajemy sukces
    if (form.company && form.company.value) {
      showThanks();
      return;
    }

    const answers = collectAnswers();
    const missing = validate(answers);
    if (missing.length > 0) {
      errBox.hidden = false;
      errBox.textContent =
        `Uzupełnij wymagane pola (${missing.length}). Zaznaczone są na czerwono.`;
      const first = document.querySelector(".q.invalid");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const result = computeResult(answers);
    const record = buildRecord(answers, result);

    btn.disabled = true;
    btn.textContent = "Wysyłanie…";
    backupLocal(record);
    await sendToSheet(record);
    showThanks();
  });
}

function showThanks() {
  document.getElementById("ankieta").hidden = true;
  const t = document.getElementById("thank-you");
  t.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", initForm);
