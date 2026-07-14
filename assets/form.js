/* =========================================================================
   KING LONG – Ankieta rekrutacyjna (Pracownik Obsługi)
   Renderowanie formularza + automatyczna ocena + wysyłka do Google Sheet.

   Aby zmienić pytania / punktację – edytuj obiekt FORM_CONFIG poniżej.
   Punktacja odpowiedzi (radio):
     - score: liczba punktów (0–2)
     - knockout: true  -> odpowiedź dyskwalifikująca (od razu "Nieodpowiedni")
   Pytanie typu "checkbox" (wybór dni) ma własną funkcję evaluate().
   ========================================================================= */

const FORM_CONFIG = {
  intro:
    "Cześć! Dziękujemy za Twoje zgłoszenie. Szanujemy czas naszych kandydatów, " +
    "dlatego przed zaproszeniem na płatny dzień próbny w naszej restauracji azjatyckiej " +
    "chcemy upewnić się, że nasze oczekiwania są zbieżne. Wypełnienie ankiety zajmie Ci " +
    "tylko 2 minuty. Do usłyszenia!",

  // Kluczowe wymagania (pokazywane na górze, aby kandydat sam ocenił dopasowanie)
  requirements: [
    "doświadczenie w gastronomii lub obsłudze klienta",
    "dobry język polski (rozmowy telefoniczne z klientami)",
    "dyspozycyjność w OBA dni weekendu (sobota i niedziela) + min. 2 dni w tygodniu",
    "ukończone 18 lat oraz prawo do legalnej pracy w Polsce",
  ],

  sections: [
    {
      title: "1. Dane kontaktowe",
      questions: [
        { id: "imie", type: "text", sheetLabel: "Imię i nazwisko",
          label: "Imię i nazwisko", required: true, autocomplete: "name" },
        { id: "telefon", type: "tel", sheetLabel: "Telefon",
          label: "Numer telefonu", required: true, autocomplete: "tel",
          note: "Skontaktujemy się z Tobą pod tym numerem." },
        { id: "email", type: "email", sheetLabel: "E-mail",
          label: "Adres e-mail", required: false, autocomplete: "email" },

        { id: "pelnoletni", type: "radio", sheetLabel: "Ukończone 18 lat",
          label: "Czy masz ukończone 18 lat?", required: true, scored: false,
          options: [
            { label: "Tak, mam ukończone 18 lat.", score: 0 },
            { label: "Nie, jestem osobą niepełnoletnią.", score: 0, knockout: true }
          ] },

        { id: "prawo_pracy", type: "radio", sheetLabel: "Prawo do pracy w PL",
          label: "Czy masz prawo do legalnej pracy w Polsce (PESEL / ważne dokumenty pobytowe)?",
          required: true, scored: true,
          options: [
            { label: "Tak, mam pełne prawo do pracy i wymagane dokumenty.", score: 2 },
            { label: "Jestem obecnie w trakcie załatwiania dokumentów.", score: 1 },
            { label: "Nie mam prawa do legalnej pracy w Polsce.", score: 0, knockout: true }
          ] }
      ]
    },

    {
      title: "2. Lokalizacja i dyspozycyjność",
      questions: [
        { id: "lokalizacja", type: "radio", sheetLabel: "Lokalizacja",
          label: "Którą lokalizację wybierasz?", required: true, scored: false,
          options: [
            { label: "Oława (ul. Strzelna 7)", score: 0 },
            { label: "Wrocław (ul. Kiełczowska 64c)", score: 0 }
          ] },

        { id: "dni", type: "checkbox", sheetLabel: "Dostępne dni",
          label: "Zaznacz wszystkie dni tygodnia, w które możesz i chcesz pracować.",
          note: "Wymagamy dyspozycyjności w OBA dni weekendu (sobota i niedziela) oraz co najmniej 2 dni w tygodniu.",
          required: true, scored: true, max: 2,
          options: [
            { label: "Poniedziałek" }, { label: "Wtorek" }, { label: "Środa" },
            { label: "Czwartek" }, { label: "Piątek" },
            { label: "Sobota" }, { label: "Niedziela" }
          ],
          // indeksy: 0-4 = dni robocze, 5 = sobota, 6 = niedziela
          evaluate: function (sel) {
            var hasWeekend = sel.indexOf(5) > -1 && sel.indexOf(6) > -1;
            var weekdays = sel.filter(function (i) { return i < 5; }).length;
            if (!hasWeekend)
              return { score: 0, knockout: true, reason: "Brak dyspozycyjności w oba dni weekendu (sobota + niedziela)" };
            if (weekdays < 2)
              return { score: 0, knockout: true, reason: "Za mało dni w tygodniu (wymagane min. 2 + weekend)" };
            return { score: 2, knockout: false };
          }
        },

        { id: "godziny", type: "radio", sheetLabel: "Godziny pracy",
          label: "Czy godziny pracy w wybranej lokalizacji Ci odpowiadają?",
          note: "Oława: 11:00–21:00 • Wrocław: 11:00–19:00",
          required: true, scored: true,
          options: [
            { label: "Tak, całkowicie mi odpowiadają.", score: 2 },
            { label: "Tak, ale tylko w wybrane dni tygodnia.", score: 1 },
            { label: "Nie, te godziny mi nie odpowiadają.", score: 0, knockout: true }
          ] },

        { id: "dojazd", type: "radio", sheetLabel: "Dojazd",
          label: "Czy masz zapewniony stabilny i punktualny dojazd do wybranej restauracji?",
          required: true, scored: true,
          options: [
            { label: "Tak, mieszkam blisko / mam własny transport.", score: 2 },
            { label: "Tak, dojeżdżam komunikacją i rozkład pozwala mi na punktualność.", score: 2 },
            { label: "Dojazd może być dla mnie problemem.", score: 0 }
          ] },

        { id: "start", type: "radio", sheetLabel: "Możliwy start",
          label: "Kiedy możesz rozpocząć pracę?", required: true, scored: true,
          options: [
            { label: "Od zaraz / w ciągu tygodnia.", score: 2 },
            { label: "W ciągu 2–4 tygodni.", score: 1 },
            { label: "Dopiero za ponad miesiąc.", score: 0 }
          ] },

        { id: "dlugosc", type: "radio", sheetLabel: "Planowany okres pracy",
          label: "Jak długo planujesz u nas pracować?", required: true, scored: true,
          options: [
            { label: "Szukam stałej pracy na dłużej (min. rok).", score: 2 },
            { label: "Kilka miesięcy / praca sezonowa.", score: 1 },
            { label: "Tylko tymczasowo / dorywczo.", score: 0 }
          ] }
      ]
    },

    {
      title: "3. Doświadczenie i komunikacja",
      questions: [
        { id: "doswiadczenie", type: "radio", sheetLabel: "Doświadczenie",
          label: "Czy masz doświadczenie w gastronomii lub bezpośredniej obsłudze klienta?",
          note: "Na tym stanowisku wymagamy wcześniejszego doświadczenia.",
          required: true, scored: true,
          options: [
            { label: "Tak, mam doświadczenie w gastronomii / restauracji.", score: 2 },
            { label: "Mam doświadczenie w obsłudze klienta / handlu (nie w gastronomii).", score: 1 },
            { label: "Nie mam żadnego doświadczenia.", score: 0, knockout: true }
          ] },

        { id: "jezyk_polski", type: "radio", sheetLabel: "Język polski",
          label: "Jak oceniasz swój poziom języka polskiego (rozmowy telefoniczne z klientami)?",
          required: true, scored: true,
          options: [
            { label: "Bardzo dobry / ojczysty – swobodnie rozmawiam przez telefon.", score: 2 },
            { label: "Dobry / komunikatywny – poradzę sobie z zamówieniami.", score: 1 },
            { label: "Podstawowy / słaby – mam trudności w rozmowie.", score: 0, knockout: true }
          ] },

        { id: "telefon_obsluga", type: "radio", sheetLabel: "Rozmowy telefoniczne",
          label: "Jak czujesz się przy przyjmowaniu zamówień telefonicznych od klientów?",
          required: true, scored: true,
          options: [
            { label: "Bardzo dobrze – jestem otwarta/-y, komunikatywna/-y i nie stresuję się.", score: 2 },
            { label: "Dobrze – poradzę sobie, szybko się uczę.", score: 1 },
            { label: "Stresuję się podczas rozmów telefonicznych.", score: 0 }
          ] },

        { id: "multitasking", type: "radio", sheetLabel: "Multitasking",
          label:
            "Nasze stanowisko to multitasking: obsługa kasy, odbieranie telefonów, " +
            "pakowanie dań oraz dbanie o czystość sali i pomoc przy zmywaniu. Jak do tego podchodzisz?",
          required: true, scored: true,
          options: [
            { label: "Świetnie! Lubię dynamiczną pracę i chętnie pomagam we wszystkim.", score: 2 },
            { label: "Poradzę sobie z kasą i telefonami, ale nie chcę sprzątać ani zmywać.", score: 0, knockout: true },
            { label: "Wolę spokojniejszą pracę, skupioną tylko na jednej czynności.", score: 0, knockout: true }
          ] }
      ]
    },

    {
      title: "4. Standardy pracy (kluczowe)",
      questions: [
        { id: "zasady", type: "radio", sheetLabel: "Zasady (punktualność + kultura)",
          label:
            "W naszej restauracji kluczowe są dwie zasady: absolutna punktualność oraz bycie " +
            "zawsze miłym i komunikatywnym dla klientów. Czy w pełni to akceptujesz?",
          required: true, scored: true,
          options: [
            { label: "Tak, punktualność i wysoka kultura obsługi to dla mnie podstawa.", score: 2 },
            { label: "Mam problem z punktualnością lub nie lubię intensywnego kontaktu z klientem.", score: 0, knockout: true }
          ] },

        { id: "organizacja", type: "radio", sheetLabel: "Organizacja sali / lodówka",
          label:
            "Ważnym zadaniem jest pilnowanie, aby lodówka z napojami była ZAWSZE pełna — gdy klienci " +
            "wezmą napoje, na bieżąco uzupełniasz je z magazynu, aby klient miał zawsze wybór. Do tego " +
            "dochodzi przecieranie i dokładanie sztućców oraz nalewanie sosów do dzbanków. Jak do tego podchodzisz?",
          required: true, scored: true,
          options: [
            { label: "Rozumiem, że to ważne dla klienta — będę na bieżąco tego pilnować.", score: 2 },
            { label: "Wolę skupić się wyłącznie na kasie, nie chcę pilnować takich rzeczy.", score: 0, knockout: true }
          ] },

        { id: "czystosc", type: "radio", sheetLabel: "Czystość / sprzątanie",
          label:
            "Nasz standard to nienaganna czystość: wycieranie stolików, polerowanie szklanek, mycie " +
            "naczyń, porządek w toalecie (papier), mycie parapetów na zewnątrz oraz sprzątanie wokół " +
            "kasy i wydawki. Czy jesteś na to gotowa/-y?",
          required: true, scored: true,
          options: [
            { label: "Tak, czystość miejsca pracy jest dla mnie ważna i naturalna.", score: 2 },
            { label: "Mogę wyczyścić stanowisko kasowe, ale nie chcę myć naczyń / sprzątać toalet.", score: 0, knockout: true }
          ] },

        { id: "sanepid", type: "radio", sheetLabel: "Książeczka sanepidowska",
          label: "Czy posiadasz aktualną książeczkę sanepidowską (do celów sanitarno-epidemiologicznych)?",
          required: true, scored: true,
          options: [
            { label: "Tak, posiadam aktualną.", score: 2 },
            { label: "Nie, ale jestem w trakcie wyrabiania / mogę ją szybko wyrobić.", score: 1 },
            { label: "Nie mam i nie planuję wyrabiać.", score: 0, knockout: true }
          ] }
      ]
    },

    {
      title: "5. Dodatkowo",
      questions: [
        { id: "uwagi", type: "textarea", sheetLabel: "Uwagi kandydata",
          label: "Chcesz coś dodać? (nieobowiązkowe)", required: false }
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
  return FORM_CONFIG.sections.flatMap(function (s) { return s.questions; });
}

function renderForm() {
  document.getElementById("form-intro").textContent = FORM_CONFIG.intro;

  var root = document.getElementById("form-root");

  // Blok wymagań
  if (FORM_CONFIG.requirements && FORM_CONFIG.requirements.length) {
    var reqs = document.createElement("div");
    reqs.className = "reqs";
    reqs.innerHTML =
      '<p class="reqs__title">⚠️ Zanim zaczniesz — na tym stanowisku wymagamy:</p><ul>' +
      FORM_CONFIG.requirements.map(function (r) { return "<li>" + r + "</li>"; }).join("") +
      "</ul>";
    root.appendChild(reqs);
  }

  FORM_CONFIG.sections.forEach(function (section) {
    var sec = document.createElement("section");
    sec.className = "section";
    sec.innerHTML =
      '<h2 class="section__title">' + section.title + '</h2><hr class="section__rule" />';
    section.questions.forEach(function (q) { sec.appendChild(renderQuestion(q)); });
    root.appendChild(sec);
  });
}

function renderQuestion(q) {
  var wrap = document.createElement("div");
  wrap.className = "q";
  wrap.dataset.qid = q.id;

  var req = q.required ? '<span class="q__req">*</span>' : "";
  var html = '<label class="q__label" for="f_' + q.id + '">' + q.label + req + "</label>";
  if (q.note) html += '<div class="q__note">' + q.note + "</div>";
  wrap.innerHTML = html;

  if (q.type === "radio" || q.type === "checkbox") {
    var inputType = q.type === "checkbox" ? "checkbox" : "radio";
    var opts = document.createElement("div");
    opts.className = "opts";
    q.options.forEach(function (opt, i) {
      var id = "f_" + q.id + "_" + i;
      var label = document.createElement("label");
      label.className = "opt";
      label.setAttribute("for", id);
      label.innerHTML =
        '<input type="' + inputType + '" id="' + id + '" name="' + q.id + '" value="' + i + '" />' +
        '<span class="opt__text">' + opt.label + "</span>";
      opts.appendChild(label);
    });
    wrap.appendChild(opts);
  } else if (q.type === "textarea") {
    var ta = document.createElement("textarea");
    ta.className = "field"; ta.id = "f_" + q.id; ta.name = q.id; ta.rows = 3;
    wrap.appendChild(ta);
  } else {
    var inp = document.createElement("input");
    inp.className = "field";
    inp.type = q.type; inp.id = "f_" + q.id; inp.name = q.id;
    if (q.autocomplete) inp.autocomplete = q.autocomplete;
    wrap.appendChild(inp);
  }
  return wrap;
}

/* ------------------------------------------------------------------ */
/* Odczyt + walidacja                                                  */
/* ------------------------------------------------------------------ */
function collectAnswers() {
  var answers = {};
  allQuestions().forEach(function (q) {
    if (q.type === "radio") {
      var checked = document.querySelector('input[name="' + q.id + '"]:checked');
      answers[q.id] = checked ? parseInt(checked.value, 10) : null;
    } else if (q.type === "checkbox") {
      var boxes = document.querySelectorAll('input[name="' + q.id + '"]:checked');
      answers[q.id] = Array.prototype.map.call(boxes, function (b) { return parseInt(b.value, 10); });
    } else {
      var el = document.getElementById("f_" + q.id);
      answers[q.id] = el ? el.value.trim() : "";
    }
  });
  return answers;
}

function validate(answers) {
  var missing = [];
  document.querySelectorAll(".q.invalid").forEach(function (el) { el.classList.remove("invalid"); });
  allQuestions().forEach(function (q) {
    if (!q.required) return;
    var v = answers[q.id];
    var empty;
    if (q.type === "radio") empty = (v === null);
    else if (q.type === "checkbox") empty = (!v || v.length === 0);
    else empty = (!v);
    if (empty) {
      missing.push(q);
      var el = document.querySelector('.q[data-qid="' + q.id + '"]');
      if (el) el.classList.add("invalid");
    }
  });
  return missing;
}

/* ------------------------------------------------------------------ */
/* Ocena / punktacja                                                   */
/* ------------------------------------------------------------------ */
function computeResult(answers) {
  var score = 0, maxScore = 0;
  var knockoutReasons = [];

  allQuestions().forEach(function (q) {
    if (q.type === "radio") {
      var idx = answers[q.id];
      if (q.scored) {
        var maxOpt = Math.max.apply(null, q.options.map(function (o) { return o.score; }));
        maxScore += maxOpt;
        if (idx !== null && idx !== undefined) score += q.options[idx].score;
      }
      // Knockout obowiązuje także w pytaniach bez punktacji (np. wiek 18+).
      if (idx !== null && idx !== undefined && q.options[idx].knockout) {
        knockoutReasons.push(q.sheetLabel + ": „" + q.options[idx].label + "”");
      }
    } else if (q.type === "checkbox" && q.scored && typeof q.evaluate === "function") {
      maxScore += (q.max || 2);
      var res = q.evaluate(answers[q.id] || []);
      score += res.score;
      if (res.knockout) knockoutReasons.push(q.sheetLabel + ": " + res.reason);
    }
  });

  var percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
  var klasyfikacja;
  if (knockoutReasons.length > 0) {
    klasyfikacja = "Nieodpowiedni";
  } else if (percent >= THRESHOLDS.odpowiedni * 100) {
    klasyfikacja = "Odpowiedni";
  } else if (percent >= THRESHOLDS.doRozwazenia * 100) {
    klasyfikacja = "Do rozważenia";
  } else {
    klasyfikacja = "Nieodpowiedni";
  }

  return { score: score, maxScore: maxScore, percent: percent,
           klasyfikacja: klasyfikacja, knockoutReasons: knockoutReasons };
}

/* ------------------------------------------------------------------ */
/* Budowa rekordu do arkusza (kolejność = kolumny w arkuszu)           */
/* ------------------------------------------------------------------ */
function buildRecord(answers, result) {
  var record = {};
  var now = new Date();
  var pad = function (n) { return String(n).padStart(2, "0"); };
  record["Znacznik czasu"] =
    now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " +
    pad(now.getHours()) + ":" + pad(now.getMinutes());

  allQuestions().forEach(function (q) {
    var v = answers[q.id];
    if (q.type === "radio") {
      record[q.sheetLabel] = (v === null || v === undefined) ? "" : q.options[v].label;
    } else if (q.type === "checkbox") {
      record[q.sheetLabel] = (v || []).map(function (i) { return q.options[i].label; }).join(", ");
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
    var key = "kelner_zgloszenia";
    var arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.push(record);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) { /* ignore */ }
}

async function sendToSheet(record) {
  var url = ((window.KELNER_CONFIG && window.KELNER_CONFIG.endpointUrl) || "").trim();
  if (!url) {
    console.warn("[KELNER] Brak endpointUrl w assets/config.js – odpowiedź nie została wysłana do arkusza.");
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ record: record })
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
  var form = document.getElementById("ankieta");
  var errBox = document.getElementById("form-error");
  var btn = document.getElementById("submit-btn");

  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    errBox.hidden = true;

    // Honeypot: jeśli wypełnione -> bot, cicho udajemy sukces
    if (form.company && form.company.value) { showThanks(); return; }

    var answers = collectAnswers();
    var missing = validate(answers);
    if (missing.length > 0) {
      errBox.hidden = false;
      errBox.textContent =
        "Uzupełnij wymagane pola (" + missing.length + "). Zaznaczone są na czerwono.";
      var first = document.querySelector(".q.invalid");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    var result = computeResult(answers);
    var record = buildRecord(answers, result);

    btn.disabled = true;
    btn.textContent = "Wysyłanie…";
    backupLocal(record);
    await sendToSheet(record);
    showThanks();
  });
}

function showThanks() {
  document.getElementById("ankieta").hidden = true;
  var t = document.getElementById("thank-you");
  t.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", initForm);
