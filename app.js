(() => {
  "use strict";

  const config = window.SURVEY_CONFIG;
  const form = document.getElementById("survey-form");
  const eventSelect = document.getElementById("event-select");
  const formError = document.getElementById("form-error");
  const submitButton = document.getElementById("submit-button");
  const selectedEvent = () => config.events.find((item) => item.id === eventSelect.value);
  const isLocalEvent = () => !selectedEvent()?.googleAppsScriptUrl?.trim();

  for (const event of config.events) {
    const option = document.createElement("option");
    option.value = event.id;
    option.textContent = event.name;
    eventSelect.append(option);
  }

  const requestedEvent = new URLSearchParams(window.location.search).get("evento");
  if (requestedEvent && config.events.some((event) => event.id === requestedEvent)) {
    eventSelect.value = requestedEvent;
  }

  function updateAccent() {
    const event = selectedEvent();
    document.documentElement.style.setProperty("--event-accent", event?.accent || "#b66546");
    const notice = document.getElementById("local-notice");
    notice.hidden = !isLocalEvent();
    if (isLocalEvent() && !config.localDemo) {
      notice.querySelector("p").innerHTML = "<strong>Raccolta non ancora attiva.</strong> Il questionario sarà disponibile a breve.";
    }
    submitButton.disabled = isLocalEvent() && !config.localDemo;
    const url = new URL(window.location.href);
    url.searchParams.set("evento", eventSelect.value);
    window.history.replaceState(null, "", url);
  }

  eventSelect.addEventListener("change", updateAccent);
  updateAccent();

  for (const container of document.querySelectorAll(".rating-options")) {
    const name = container.dataset.name;
    for (let score = 1; score <= 5; score += 1) {
      const label = document.createElement("label");
      label.className = "rating-pill";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = String(score);
      input.required = true;
      const visual = document.createElement("span");
      visual.innerHTML = `<strong>${score}</strong><small>${["Per niente", "Poco", "Abbastanza", "Molto", "Moltissimo"][score - 1]}</small>`;
      label.append(input, visual);
      container.append(label);
    }
  }

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function saveLocally(answer) {
    const key = "proloco-survey-responses-v1";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(answer);
    localStorage.setItem(key, JSON.stringify(existing));
  }

  async function sendToGoogle(answer, url) {
    // Apps Script non espone una risposta CORS leggibile. La conferma qui indica
    // che il browser ha inviato la richiesta, non che il foglio l'abbia registrata.
    const response = await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(answer),
      keepalive: true
    });
    if (response.type !== "opaque") throw new Error("Invio non riuscito");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formError.hidden = true;

    if (!form.checkValidity()) {
      showError("Completa tutti i campi obbligatori prima di inviare.");
      form.querySelector(":invalid")?.focus();
      return;
    }

    if (isLocalEvent() && !config.localDemo) {
      showError("La raccolta delle risposte non è ancora attiva.");
      return;
    }

    const data = new FormData(form);
    const targetEvent = selectedEvent();
    const isLocal = isLocalEvent();
    const answer = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      eventId: data.get("event"),
      eventName: targetEvent?.name || "",
      overall: Number(data.get("overall")),
      organization: Number(data.get("organization")),
      activities: Number(data.get("activities")),
      returnIntent: data.get("returnIntent"),
      liked: String(data.get("liked") || "").trim(),
      improve: String(data.get("improve") || "").trim(),
      website: ""
    };

    submitButton.disabled = true;
    submitButton.querySelector("span").textContent = "Invio in corso...";
    try {
      if (isLocal) saveLocally(answer);
      else await sendToGoogle(answer, targetEvent.googleAppsScriptUrl.trim());

      document.getElementById("form-view").hidden = true;
      const success = document.getElementById("success-view");
      document.getElementById("success-label").textContent = isLocal ? "RISPOSTA DI PROVA SALVATA" : "RICHIESTA INVIATA";
      document.getElementById("success-message").textContent = isLocal
        ? "Risposta di prova salvata in questo browser. Quando collegheremo Google Sheets, le nuove risposte arriveranno nel foglio."
        : "La richiesta è stata inviata. Grazie: il tuo contributo ci aiuterà a migliorare i prossimi eventi.";
      success.hidden = false;
      success.focus();
    } catch (error) {
      showError("Non siamo riusciti a inviare la risposta. Controlla la connessione e riprova.");
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = "Invia il questionario";
    }
  });

  document.getElementById("another-response").addEventListener("click", () => {
    const currentEvent = eventSelect.value;
    form.reset();
    eventSelect.value = currentEvent;
    updateAccent();
    document.getElementById("success-view").hidden = true;
    document.getElementById("form-view").hidden = false;
    formError.hidden = true;
    if (eventSelect.hidden) form.querySelector('input[name="overall"]')?.focus();
    else eventSelect.focus();
  });
})();
