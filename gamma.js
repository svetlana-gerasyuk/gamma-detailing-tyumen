/* Gamma Detailing: шапка, появление секций, запись в WhatsApp и эффект GAMMA LIGHT REVEAL. Без библиотек. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // шапка: фон после прокрутки
  const bar = document.querySelector("[data-s-bar]");
  const onScroll = () => bar && bar.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // появление секций
  const rev = document.querySelectorAll(".s-reveal");
  if (rev.length && "IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    rev.forEach((el) => io.observe(el));
  } else rev.forEach((el) => el.classList.add("is-in"));

  // ---- GAMMA LIGHT REVEAL: полоса студийного света идёт за мышью или пальцем по кузову
  const lab = document.querySelector("[data-g-lab]");
  if (lab) {
    const REST = 58; let cur = REST, target = REST, raf = 0;
    const paint = () => lab.style.setProperty("--x", cur.toFixed(2) + "%");
    const tick = () => {
      cur += (target - cur) * 0.14;
      if (Math.abs(target - cur) < 0.1) { cur = target; raf = 0; paint(); return; }
      paint(); raf = requestAnimationFrame(tick);
    };
    const go = (x) => { target = x; if (reduce) { cur = x; paint(); return; } if (!raf) raf = requestAnimationFrame(tick); };
    const fromEvent = (e) => { const r = lab.getBoundingClientRect(); return Math.max(-10, Math.min(110, ((e.clientX - r.left) / r.width) * 100)); };
    lab.addEventListener("pointermove", (e) => { lab.classList.add("is-active"); go(fromEvent(e)); });
    lab.addEventListener("pointerdown", (e) => { lab.classList.add("is-active"); go(fromEvent(e)); });
    // мышь ушла – свет возвращается; после касания пальцем остаётся там, где коснулись
    lab.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") go(REST); });
    // клавиатура: стрелки двигают свет
    lab.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); lab.classList.add("is-active"); go(Math.max(0, Math.min(100, target + (e.key === "ArrowLeft" ? -8 : 8)))); } });
    paint();
    // один проход света при загрузке – подсказка, что кузов «живой»; если кадры анимации не идут, свет просто стоит на месте
    if (!reduce) setTimeout(() => requestAnimationFrame(() => { if (lab.classList.contains("is-active")) return; cur = 8; paint(); go(REST); }), 450);
  }

  // ---- запись: несколько услуг, день, время, автомобиль -> заявка в WhatsApp
  const GENERIC = "Здравствуйте! Пишу с сайта Gamma Detailing. Хочу узнать про услуги студии и записаться.";
  const body = document.body;
  const digits = (s) => String(s || "").replace(/\D/g, "");
  const rub = (n) => Math.round(n).toLocaleString("ru-RU").replace(/[   ]/g, " ") + " ₽";
  const booking = document.querySelector("[data-s-booking]");
  const bubble = document.querySelector("[data-s-bubble]");
  let message = GENERIC, ready = false;

  if (booking) {
    const daysBox = booking.querySelector("[data-s-days]"), timesBox = booking.querySelector("[data-s-times]");
    const slots = (booking.dataset.slots || "").split(",").filter(Boolean);
    const car = booking.querySelector("[data-g-car]");
    const countEl = booking.querySelector("[data-d-count]"), sumEl = booking.querySelector("[data-d-sum]"), warn = booking.querySelector("[data-d-warn]");
    const sendBtns = booking.querySelectorAll("[data-s-msg], [data-g-copy]");
    const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"], mon = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    const monFull = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    const today = new Date();
    for (let i = 0; i < +booking.dataset.days; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const label = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : wd[d.getDay()] + ", " + d.getDate() + " " + mon[d.getMonth()];
      const full = d.getDate() + " " + monFull[d.getMonth()] + " (" + (i < 2 ? label.toLowerCase() + ", " : "") + wd[d.getDay()] + ")";
      daysBox.insertAdjacentHTML("beforeend", `<label class="s-chip"><input type="radio" name="day" value="${i}" data-full="${full}"${i === 0 ? " checked" : ""}><span>${label}</span></label>`);
    }
    const drawTimes = () => {
      const keep = timesBox.querySelector("input:checked")?.value;
      const first = daysBox.querySelector("input:checked")?.value === "0";
      const nowH = today.getHours() + today.getMinutes() / 60;
      timesBox.innerHTML = "";
      slots.forEach((t) => {
        const [h, m] = t.split(":").map(Number); const past = first && h + m / 60 <= nowH + 1;
        timesBox.insertAdjacentHTML("beforeend", `<label class="s-chip"${past ? ' aria-disabled="true"' : ""}><input type="radio" name="time" value="${t}"${past ? " disabled" : ""}><span>${t}</span></label>`);
      });
      // при смене дня выбранное время сохраняем, если в этот день оно не прошло
      const pick = (keep && timesBox.querySelector(`input[value="${keep}"]:not([disabled])`)) || timesBox.querySelector("input:not([disabled])");
      if (pick) pick.checked = true;
      else timesBox.insertAdjacentHTML("beforeend", `<p class="g-none">На сегодня окна закончились – выберите другой день.</p>`);
    };
    const plural = (n) => n % 10 === 1 && n % 100 !== 11 ? "услуга" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "услуги" : "услуг";
    const cards = document.querySelectorAll("[data-g-add]");
    const update = () => {
      const picked = [...booking.querySelectorAll("input[name=svc]:checked")];
      const d = daysBox.querySelector("input:checked"), t = timesBox.querySelector("input:checked");
      const priced = picked.filter((s) => s.dataset.price);
      const total = priced.reduce((a, s) => a + +s.dataset.price, 0);
      ready = picked.length > 0;
      countEl.textContent = ready ? "Выбрано: " + picked.length + " " + plural(picked.length) : "Можно выбрать несколько";
      sumEl.innerHTML = priced.length ? "Ориентир по ценам «от»: <b>от " + rub(total) + "</b>" + (priced.length < picked.length ? " + услуги с ценой «уточнить»" : "") + ". Итог – после осмотра." : "";
      booking.classList.toggle("is-empty", !ready);
      sendBtns.forEach((b) => b.setAttribute("aria-disabled", String(!ready)));
      if (ready && warn) warn.hidden = true;
      // карточки услуг ниже по странице показывают, что уже в заявке
      cards.forEach((c) => { const on = booking.querySelector(`input[name=svc][value="${c.dataset.gAdd}"]`)?.checked; c.classList.toggle("is-on", !!on); c.textContent = on ? "В заявке ✓" : "Добавить в заявку"; c.setAttribute("aria-pressed", String(!!on)); });
      if (!ready) { message = GENERIC; if (bubble) bubble.textContent = "Отметьте хотя бы одну услугу – и здесь появится готовая заявка."; return; }
      const line = (s) => "— " + s.dataset.name + (s.dataset.price ? " (от " + rub(+s.dataset.price) + ")" : " (цену уточнить)");
      message = [
        "Здравствуйте! Хочу обратиться в Gamma Detailing.",
        "Интересуют услуги:",
        ...picked.map(line),
        "Желаемая дата: " + (d ? d.dataset.full : "уточню"),
        "Удобное время: " + (t ? t.value : "уточню"),
        "Автомобиль и пожелания: " + ((car && car.value.trim()) || "напишу в ответ"),
        "Подскажите, пожалуйста, стоимость и возможность записи."
      ].join("\n");
      if (bubble) bubble.textContent = message;
    };
    daysBox.addEventListener("change", () => { drawTimes(); update(); });
    booking.addEventListener("change", update);
    if (car) car.addEventListener("input", update);
    drawTimes();
    // на сегодня окна закончились – сразу выбираем завтра
    if (!timesBox.querySelector("input:not([disabled])")) { const next = daysBox.querySelectorAll("input")[1]; if (next) { next.checked = true; drawTimes(); } }
    update();

    // «Добавить в заявку» из карточек услуг
    cards.forEach((c) => c.addEventListener("click", () => {
      const inp = booking.querySelector(`input[name=svc][value="${c.dataset.gAdd}"]`); if (!inp) return;
      inp.checked = !inp.checked; update();
      const note = document.querySelector("[data-g-added]");
      if (note) { note.hidden = false; clearTimeout(note._t); note._t = setTimeout(() => (note.hidden = true), 3500); }
    }));

    const nudge = () => {
      const svc = booking.querySelector("[data-d-svc]");
      if (warn) warn.hidden = false;
      if (svc) { svc.classList.remove("is-alert"); void svc.offsetWidth; svc.classList.add("is-alert"); svc.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); }
    };
    // копировать заявку
    const copyBtn = booking.querySelector("[data-g-copy]"), copied = booking.querySelector("[data-s-copied]");
    if (copyBtn) copyBtn.addEventListener("click", async () => {
      if (!ready) return nudge();
      let ok = false;
      try { await navigator.clipboard.writeText(message); ok = true; } catch (_) {
        const ta = document.createElement("textarea"); ta.value = message; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); try { ok = document.execCommand("copy"); } catch (_) {} ta.remove();
      }
      if (copied) { copied.textContent = ok ? "Заявка скопирована – вставьте её в любой мессенджер." : "Не получилось скопировать – выделите текст заявки вручную."; copied.hidden = false; setTimeout(() => (copied.hidden = true), 4000); }
    });

    // WhatsApp: кнопка формы без выбранных услуг не отправляет, а подсказывает
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-s-msg]"); if (!a) return;
      e.preventDefault();
      const inForm = !!a.closest("[data-s-booking]");
      if (inForm && !ready) return nudge();
      const text = ready ? message : GENERIC;
      window.open("https://wa.me/" + digits(body.dataset.wa) + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    });
  }
})();
