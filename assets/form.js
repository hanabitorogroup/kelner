/* =========================================================================
   KING LONG – Ankieta rekrutacyjna (Pracownik Obsługi)
   Renderowanie formularza + automatyczna ocena + wysyłka do Google Sheet.

   Aby zmienić pytania / punktację – edytuj obiekt FORM_CONFIG poniżej.
   Punktacja odpowiedzi (radio):
     - score: liczba punktów (0–2)
     - knockout: true  -> odpowiedź dyskwalifikująca (od razu "Nieodpowiedni")
   Typy pytań: text, tel, email, textarea, radio, checkbox (wybór dni),
               consent (zgoda RODO – wymagana do wysłania).
   ========================================================================= */

const FORM_CONFIG = {
  intro:
    "Cześć! Dziękujemy za Twoje zgłoszenie. Szanujemy czas naszych kandydatów, " +
    "dlatego przed zaproszeniem na płatny dzień próbny w naszej restauracji azjatyckiej " +
    "chcemy upewnić się, że nasze oczekiwania są zbieżne. Wypełnienie ankiety zajmie Ci " +
    "tylko kilka minut. Do usłyszenia!",

  // Co oferujemy (pozytywny blok – równoważy ton ogłoszenia)
  offer: [
    "Płatny dzień próbny — poznajemy się nawzajem, zanim podejmiesz decyzję",
    "Stabilny, ustalony z góry grafik pracy",
    "Przyjazny zespół i realne wsparcie na początku",
    "Legalne zatrudnienie i możliwość stałej, długoterminowej współpracy",
  ],

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
      title: "3. Doświadczenie i umiejętności",
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

        { id: "komunikacja_tel", type: "radio", sheetLabel: "Polski / rozmowy telefoniczne",
          label: "Jak oceniasz swój język polski w rozmowach telefonicznych z klientami (przyjmowanie zamówień)?",
          required: true, scored: true,
          options: [
            { label: "Bardzo dobry – swobodnie i bez stresu rozmawiam z klientami przez telefon.", score: 2 },
            { label: "Komunikatywny – poradzę sobie z zamówieniami, choć czasem się stresuję.", score: 1 },
            { label: "Słaby polski lub duży stres – rozmowy telefoniczne są dla mnie trudne.", score: 0, knockout: true }
          ] },

        { id: "stanowisko_kasowe", type: "radio", sheetLabel: "Kasa / systemy zamówień",
          label: "Jak oceniasz swoje umiejętności przy stanowisku kasowym — obsługa kasy fiskalnej, " +
            "rozliczanie gotówki (wydawanie reszty) oraz zamówienia z aplikacji dostawczych " +
            "(Pyszne.pl, Glovo, Bolt Food, Uber Eats)?",
          required: true, scored: true,
          options: [
            { label: "Mam doświadczenie z kasą fiskalną, gotówką i aplikacjami dostawczymi.", score: 2 },
            { label: "Nie ze wszystkim, ale dobrze liczę i szybko uczę się nowych systemów.", score: 1 },
            { label: "Nie czuję się pewnie w obsłudze kasy i takich aplikacji.", score: 0 }
          ] },

        { id: "godziny_szczytu", type: "radio", sheetLabel: "Godziny szczytu",
          label: "Jak reagujesz, gdy w restauracji jest bardzo dużo klientów naraz (godziny szczytu)?",
          required: true, scored: true,
          options: [
            { label: "Zachowuję spokój, ustalam priorytety i działam szybko – lubię takie tempo.", score: 2 },
            { label: "Radzę sobie, choć bywa stresująco.", score: 1 },
            { label: "Duży ruch mocno mnie stresuje i się gubię.", score: 0 }
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
      title: "4. Standardy i podejście do pracy",
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

        { id: "utrzymanie", type: "radio", sheetLabel: "Utrzymanie porządku i zaopatrzenia",
          label:
            "Praca obejmuje utrzymanie porządku i zaopatrzenia: pilnowanie, aby lodówka z napojami była " +
            "ZAWSZE pełna (uzupełnianie z magazynu, gdy klienci wezmą napoje), przecieranie i dokładanie " +
            "sztućców, nalewanie sosów do dzbanków, a także wycieranie stolików, polerowanie szklanek, " +
            "mycie naczyń, porządek w toalecie (papier), mycie parapetów na zewnątrz oraz sprzątanie " +
            "wokół kasy i wydawki. Czy jesteś na to gotowa/-y?",
          required: true, scored: true,
          options: [
            { label: "Tak, dbanie o czystość i pełne zaopatrzenie jest dla mnie naturalne.", score: 2 },
            { label: "Wolę zajmować się tylko kasą, nie chcę sprzątać ani uzupełniać zaopatrzenia.", score: 0, knockout: true }
          ] },

        { id: "menu", type: "radio", sheetLabel: "Menu / alergeny",
          label: "Czy jesteś gotowa/-y nauczyć się naszego menu i składników dań (w tym alergenów), aby doradzać klientom?",
          required: true, scored: true,
          options: [
            { label: "Tak, chętnie nauczę się menu i informacji o alergenach.", score: 2 },
            { label: "Nauczę się podstaw, ale wolę nie doradzać w sprawie składników.", score: 1 },
            { label: "Nie chcę uczyć się menu ani składników.", score: 0 }
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
      title: "5. O Tobie",
      questions: [
        { id: "oczekiwania", type: "text", sheetLabel: "Oczekiwania finansowe",
          label: "Jakie są Twoje oczekiwania finansowe?",
          note: "Podaj np. stawkę za godzinę (zł/h) lub kwotę miesięczną.",
          required: true },
        { id: "motywacja", type: "textarea", sheetLabel: "Dlaczego u nas",
          label: "Dlaczego chcesz pracować właśnie u nas? (nieobowiązkowe)", required: false,
          note: "Napisz kilka słów od siebie." }
      ]
    },

    {
      title: "6. Zgoda",
      questions: [
        { id: "rodo", type: "consent", sheetLabel: "Zgoda RODO",
          label: "Zgoda na przetwarzanie danych osobowych (RODO)", required: true,
          consentText:
            "Administratorem Twoich danych osobowych jest HANABI & TORO GROUP Sp. z o.o., " +
            "ul. Radarowa 52, 02-137 Warszawa (NIP 5223373195, KRS 0001240774). Wyrażam zgodę na " +
            "przetwarzanie moich danych osobowych podanych w tej ankiecie w celu przeprowadzenia procesu " +
            "rekrutacji na stanowisko w restauracji KING LONG, zgodnie z RODO (rozporządzenie UE 2016/679). " +
            "Podanie danych jest dobrowolne; mam prawo dostępu do swoich danych, ich sprostowania oraz " +
            "żądania usunięcia." }
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

function buildInfoBlock(cls, titleHtml, items) {
  var el = document.createElement("div");
  el.className = cls;
  el.innerHTML = titleHtml + "<ul>" +
    items.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
  return el;
}

function renderForm() {
  document.getElementById("form-intro").textContent = FORM_CONFIG.intro;

  var root = document.getElementById("form-root");

  // Pasek postępu
  var prog = document.createElement("div");
  prog.className = "progress";
  prog.innerHTML =
    '<div class="progress__bar"><div class="progress__fill" id="prog-fill"></div></div>' +
    '<div class="progress__label" id="prog-label"></div>';
  root.appendChild(prog);

  // Każda sekcja = osobny krok
  FORM_CONFIG.sections.forEach(function (section, si) {
    var step = document.createElement("section");
    step.className = "step";
    step.dataset.step = si;

    // Bloki "co oferujemy" i "wymagamy" tylko na pierwszym kroku
    if (si === 0) {
      if (FORM_CONFIG.offer && FORM_CONFIG.offer.length) {
        step.appendChild(buildInfoBlock("offer", '<p class="offer__title">✅ Co oferujemy:</p>', FORM_CONFIG.offer));
      }
      if (FORM_CONFIG.requirements && FORM_CONFIG.requirements.length) {
        step.appendChild(buildInfoBlock("reqs",
          '<p class="reqs__title">⚠️ Zanim zaczniesz — na tym stanowisku wymagamy:</p>',
          FORM_CONFIG.requirements));
      }
    }

    var title = document.createElement("h2");
    title.className = "section__title";
    title.textContent = section.title;
    var hr = document.createElement("hr");
    hr.className = "section__rule";
    step.appendChild(title);
    step.appendChild(hr);

    section.questions.forEach(function (q) { step.appendChild(renderQuestion(q)); });
    root.appendChild(step);
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
  } else if (q.type === "consent") {
    var box = document.createElement("div");
    box.className = "opts";
    var cid = "f_" + q.id;
    var clabel = document.createElement("label");
    clabel.className = "opt opt--consent";
    clabel.setAttribute("for", cid);
    clabel.innerHTML =
      '<input type="checkbox" id="' + cid + '" name="' + q.id + '" value="1" />' +
      '<span class="opt__text">' + q.consentText + "</span>";
    box.appendChild(clabel);
    wrap.appendChild(box);
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
    } else if (q.type === "consent") {
      var box = document.getElementById("f_" + q.id);
      answers[q.id] = !!(box && box.checked);
    } else {
      var el = document.getElementById("f_" + q.id);
      answers[q.id] = el ? el.value.trim() : "";
    }
  });
  return answers;
}

function clearInvalid() {
  document.querySelectorAll(".q.invalid").forEach(function (el) { el.classList.remove("invalid"); });
}

function validateQuestions(questions, answers) {
  var missing = [];
  questions.forEach(function (q) {
    if (!q.required) return;
    var v = answers[q.id];
    var empty;
    if (q.type === "radio") empty = (v === null);
    else if (q.type === "checkbox") empty = (!v || v.length === 0);
    else if (q.type === "consent") empty = (v !== true);
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
    } else if (q.type === "consent") {
      record[q.sheetLabel] = v ? "Tak" : "Nie";
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
  var submitBtn = document.getElementById("submit-btn");
  var introEl = document.getElementById("form-intro");
  var fill = document.getElementById("prog-fill");
  var label = document.getElementById("prog-label");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var total = steps.length;
  var current = 0;

  // Pasek nawigacji: Wstecz / Dalej + przycisk wysyłki (na ostatnim kroku)
  var nav = document.createElement("div");
  nav.className = "nav";
  var back = document.createElement("button");
  back.type = "button"; back.className = "btn btn--ghost"; back.textContent = "‹ Wstecz";
  var next = document.createElement("button");
  next.type = "button"; next.className = "btn btn--next"; next.textContent = "Dalej ›";
  form.insertBefore(nav, submitBtn);
  nav.appendChild(back);
  nav.appendChild(next);
  nav.appendChild(submitBtn);

  function showStep(i) {
    current = Math.max(0, Math.min(total - 1, i));
    steps.forEach(function (s, idx) { s.classList.toggle("step--active", idx === current); });
    introEl.style.display = current === 0 ? "" : "none";
    back.style.display = current > 0 ? "" : "none";
    next.style.display = current < total - 1 ? "" : "none";
    submitBtn.style.display = current === total - 1 ? "" : "none";
    fill.style.width = Math.round(((current + 1) / total) * 100) + "%";
    label.textContent = "Krok " + (current + 1) + " z " + total;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  back.addEventListener("click", function () { errBox.hidden = true; showStep(current - 1); });
  next.addEventListener("click", function () {
    errBox.hidden = true;
    clearInvalid();
    var answers = collectAnswers();
    var missing = validateQuestions(FORM_CONFIG.sections[current].questions, answers);
    if (missing.length > 0) {
      errBox.hidden = false;
      errBox.textContent = "Uzupełnij wymagane pola (" + missing.length + ").";
      var f = document.querySelector(".q.invalid");
      if (f) f.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    showStep(current + 1);
  });

  showStep(0);

  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    errBox.hidden = true;

    if (form.company && form.company.value) { showThanks(); return; }

    var answers = collectAnswers();
    clearInvalid();
    var missing = validateQuestions(allQuestions(), answers);
    if (missing.length > 0) {
      // Wróć do kroku z pierwszym brakującym polem
      var firstQ = missing[0];
      var stepIdx = FORM_CONFIG.sections.findIndex(function (s) {
        return s.questions.some(function (q) { return q.id === firstQ.id; });
      });
      if (stepIdx > -1) showStep(stepIdx);
      errBox.hidden = false;
      errBox.textContent =
        "Uzupełnij wymagane pola (" + missing.length + "). Zaznaczone są na czerwono.";
      return;
    }

    var result = computeResult(answers);
    var record = buildRecord(answers, result);

    submitBtn.disabled = true;
    submitBtn.textContent = "Wysyłanie…";
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
