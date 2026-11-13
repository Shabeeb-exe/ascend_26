(() => {
  'use strict';

  let activeEventCategory = 'all';
  let selectedEventIds = new Set();
  let currentModalEventId = null;
  let toastTimer = null;

  function getInitials(name) {
    const cleaned = name.replace(/\(.*?\)/g, '').trim();
    const parts = cleaned.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function showToast(message) {
    const toast = document.getElementById('appToast');
    const msgEl = document.getElementById('appToastMessage');
    msgEl.textContent = message;
    toast.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3600);
  }

  function copyTextSafe(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.className = 'sr-only';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Copied to clipboard: ' + text);
    } catch (err) {
      showToast('Reference: ' + text);
    }
    document.body.removeChild(textarea);
  }

  const htmlRoot = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  themeToggleBtn.addEventListener('click', () => {
    const current = htmlRoot.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    htmlRoot.setAttribute('data-theme', next);
    showToast(next === 'dark' ? 'Obsidian & Gold Dark Theme enabled' : 'Alabaster & Gunmetal Light Theme enabled');
  });

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const menuIconBars = document.getElementById('menuIconBars');
  const menuIconClose = document.getElementById('menuIconClose');

  function closeMobileDrawer() {
    mobileDrawer.classList.remove('is-open');
    menuIconBars.classList.remove('is-hidden');
    menuIconClose.classList.add('is-hidden');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }

  mobileMenuBtn.addEventListener('click', () => {
    const isOpen = mobileDrawer.classList.toggle('is-open');
    menuIconBars.classList.toggle('is-hidden', isOpen);
    menuIconClose.classList.toggle('is-hidden', !isOpen);
    mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
  });

  const VIEW_KEYS = ['home', 'events', 'register', 'sponsorship', 'team', 'dcms', 'contact'];

  function viewFromHash() {
    const raw = window.location.hash.replace('#', '');
    const key = raw.split('?')[0].split('&')[0];
    return VIEW_KEYS.includes(key) ? key : 'home';
  }

  // Navigate by changing the URL hash so the browser Back button and deep links work.
  function goTo(viewKey) {
    if (window.location.hash === '#' + viewKey) {
      switchView(viewKey);
    } else {
      window.location.hash = viewKey;
    }
  }

  function switchView(viewKey) {
    document.querySelectorAll('.spa-view').forEach((sec) => {
      sec.classList.toggle('is-active', sec.id === 'view-' + viewKey);
    });
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      if (btn.classList.contains('nav-link')) {
        btn.classList.toggle('is-active', btn.getAttribute('data-nav') === viewKey);
      }
    });
    closeMobileDrawer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', (e) => {
    const navTrigger = e.target.closest('[data-nav]');
    if (navTrigger) {
      goTo(navTrigger.getAttribute('data-nav'));
    }
  });

  window.addEventListener('hashchange', () => switchView(viewFromHash()));
  if (window.location.hash && viewFromHash() !== 'home') {
    switchView(viewFromHash());
  }

  const targetTimestamp = new Date(SITE_CONFIG.eventStartsAt).getTime();
  if (SITE_CONFIG.datesTentative) document.getElementById('countdownNote').classList.remove('is-hidden');
  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMinutes = document.getElementById('cdMinutes');
  const cdSeconds = document.getElementById('cdSeconds');
  const countdownGrid = document.getElementById('countdownGrid');
  const countdownStatusBanner = document.getElementById('countdownStatusBanner');

  function updateCountdown() {
    const now = Date.now();
    const diff = targetTimestamp - now;

    if (diff <= 0) {
      countdownGrid.classList.add('is-hidden');
      countdownStatusBanner.classList.remove('is-hidden');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    cdDays.textContent = String(days).padStart(2, '0');
    cdHours.textContent = String(hours).padStart(2, '0');
    cdMinutes.textContent = String(minutes).padStart(2, '0');
    cdSeconds.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  function renderSponsorsMarquee() {
    const track1 = document.getElementById('sponsorsMarqueeTrack1');
    const track2 = document.getElementById('sponsorsMarqueeTrack2');
    const track3 = document.getElementById('sponsorsMarqueeTrack3');
    const singleTrack = document.getElementById('sponsorsMarqueeTrack');

    const renderTrack = (trackEl, items) => {
      if (!trackEl) return;
      const doubled = items.concat(items);
      trackEl.innerHTML = doubled
        .map(
          (brand) => `
          <div class="sponsor-logo-card" title="${brand.name}">
            <img src="${brand.logo}" alt="${brand.name}" class="sponsor-logo-img" loading="lazy" />
          </div>
        `
        )
        .join('');
    };

    if (track1 && track2 && track3) {
      renderTrack(track1, PAST_SPONSORS.slice(0, 10));
      renderTrack(track2, PAST_SPONSORS.slice(10, 20));
      renderTrack(track3, PAST_SPONSORS.slice(20, 30));
    } else if (singleTrack) {
      renderTrack(singleTrack, PAST_SPONSORS);
    }
  }
  renderSponsorsMarquee();

  const eventsGridContainer = document.getElementById('eventsGridContainer');
  const eventsEmptyState = document.getElementById('eventsEmptyState');
  const eventSearchInput = document.getElementById('eventSearchInput');

  function renderEventsGrid() {
    const query = eventSearchInput.value.trim().toLowerCase();
    const filtered = EVENTS_DATA.filter((ev) => {
      const matchesCat = activeEventCategory === 'all' || ev.category === activeEventCategory;
      const matchesSearch =
        !query ||
        ev.title.toLowerCase().includes(query) ||
        ev.skills.toLowerCase().includes(query) ||
        ev.desc.toLowerCase().includes(query);
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      eventsGridContainer.innerHTML = '';
      eventsEmptyState.classList.remove('is-hidden');
      return;
    }

    eventsEmptyState.classList.add('is-hidden');
    eventsGridContainer.innerHTML = filtered
      .map(
        (ev) => `
        <article class="surface-card surface-card-hover p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <span class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                    style="background: var(--gold-tint); color: var(--gold-primary); border: 1px solid var(--gold-border);">
                ${ev.category}
              </span>
              <span class="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                    style="background: var(--bg-elevated); color: var(--gold-primary); border: 1px solid var(--border-subtle);">
                ${ev.icon}
              </span>
            </div>

            <h2 class="font-display text-xl font-bold">${ev.title}</h2>
            <div class="flex items-center justify-between mt-1">
              <span class="text-xs font-semibold" style="color: var(--gold-primary);">${ev.format}</span>
              <span class="text-xs font-bold text-amber-400">Fee: ₹${ev.fee}${SITE_CONFIG.feePerPerson ? ' / person' : ''}</span>
            </div>

            <p class="text-xs sm:text-sm leading-relaxed mt-3" style="color: var(--text-secondary);">
              ${ev.desc}
            </p>

            <div class="mt-4 px-3 py-2 rounded-lg text-[11px] font-medium"
                 style="background: var(--bg-elevated); color: var(--text-secondary);">
              ${ev.skills}
            </div>

          </div>

          <div class="mt-5 pt-4 border-t grid grid-cols-2 gap-2.5" style="border-color: var(--border-subtle);">
            <button type="button" data-open-guidelines="${ev.id}" class="btn-outline py-2.5 text-xs">
              View Guidelines
            </button>
            <button type="button" data-register-event="${ev.id}" class="btn-gold py-2.5 text-xs">
              Register →
            </button>
          </div>
        </article>
      `
      )
      .join('');
  }

  renderEventsGrid();

  document.getElementById('eventFilterTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-event-cat]');
    if (!tab) return;
    activeEventCategory = tab.getAttribute('data-event-cat');
    document.querySelectorAll('[data-event-cat]').forEach((b) => {
      b.classList.toggle('is-active', b === tab);
    });
    renderEventsGrid();
  });

  eventSearchInput.addEventListener('input', renderEventsGrid);

  document.getElementById('resetEventFilterBtn').addEventListener('click', () => {
    activeEventCategory = 'all';
    eventSearchInput.value = '';
    document.querySelectorAll('[data-event-cat]').forEach((b) => {
      b.classList.toggle('is-active', b.getAttribute('data-event-cat') === 'all');
    });
    renderEventsGrid();
  });

  document.addEventListener('click', (e) => {
    const filterJump = e.target.closest('[data-filter-jump]');
    if (filterJump) {
      const cat = filterJump.getAttribute('data-filter-jump');
      activeEventCategory = cat;
      document.querySelectorAll('[data-event-cat]').forEach((b) => {
        b.classList.toggle('is-active', b.getAttribute('data-event-cat') === cat);
      });
      renderEventsGrid();
      goTo('events');
    }

    const jumpEvent = e.target.closest('[data-jump-event]');
    if (jumpEvent) {
      const evId = jumpEvent.getAttribute('data-jump-event');
      openGuidelinesModal(evId);
    }
  });

  function openGuidelinesModal(eventId) {
    const ev = EVENTS_DATA.find((item) => item.id === eventId);
    if (!ev) return;
    currentModalEventId = ev.id;
    document.getElementById('modalEventBadge').textContent = ev.category + ' Event';
    document.getElementById('modalEventTitle').textContent = ev.title;
    document.getElementById('modalEventDesc').textContent = ev.desc;
    document.getElementById('modalEventFormat').textContent = ev.format;
    document.getElementById('modalEventRules').innerHTML = ev.rules.map((r) => `<li>${r}</li>`).join('');
    document.getElementById('eventGuidelinesModal').classList.add('is-open');
  }

  document.getElementById('modalRegisterTriggerBtn').addEventListener('click', () => {
    document.getElementById('eventGuidelinesModal').classList.remove('is-open');
    if (currentModalEventId) {
      preselectEventAndNavigate(currentModalEventId);
    }
  });

  const regMgmtContainer = document.getElementById('regManagementCheckboxes');
  const regNonMgmtContainer = document.getElementById('regNonManagementCheckboxes');
  const selectedEventsCountBadge = document.getElementById('selectedEventsCountBadge');
  const teamMembersDynamicSection = document.getElementById('teamMembersDynamicSection');
  const teamSizeHintText = document.getElementById('teamSizeHintText');

  function renderRegisterEventCards() {
    const buildCard = (ev) => {
      const isChecked = selectedEventIds.has(ev.id);
      return `
        <div data-toggle-reg-event="${ev.id}" class="event-check-card ${isChecked ? 'is-selected' : ''}" role="checkbox" aria-checked="${isChecked}" tabindex="0">
          <div class="w-5 h-5 rounded flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0"
               style="border: 1.5px solid var(--gold-primary); background: ${isChecked ? 'var(--gold-primary)' : 'transparent'}; color: #090A0F;">
            ${isChecked ? '✓' : ''}
          </div>
          <div class="flex-grow flex items-center justify-between">
            <div>
              <div class="font-bold text-sm">${ev.title}</div>
              <div class="text-[11px]" style="color: var(--text-muted);">${ev.format}</div>
            </div>
            <div class="text-xs font-bold text-amber-400 whitespace-nowrap">₹${ev.fee}${SITE_CONFIG.feePerPerson ? ' / person' : ''}</div>
          </div>
        </div>
      `;
    };

    regMgmtContainer.innerHTML = EVENTS_DATA.filter((e) => e.category === 'Management').map(buildCard).join('');
    regNonMgmtContainer.innerHTML = EVENTS_DATA.filter((e) => e.category === 'Non-Management').map(buildCard).join('');

    selectedEventsCountBadge.textContent = selectedEventIds.size + ' Selected';

    const selectedObjs = EVENTS_DATA.filter((e) => selectedEventIds.has(e.id));
    const teamEvents = selectedObjs.filter((e) => e.maxTeam > 1);
    if (teamEvents.length > 0) {
      teamMembersDynamicSection.classList.remove('is-hidden');
      teamSizeHintText.textContent =
        'Add your teammates below (you are member 1). Needed: ' +
        teamEvents.map((t) => t.title + ' (' + t.format + ')').join(' | ');
    } else {
      teamMembersDynamicSection.classList.add('is-hidden');
    }
  }

  renderRegisterEventCards();

  function toggleRegisterEvent(eventId) {
    if (selectedEventIds.has(eventId)) {
      selectedEventIds.delete(eventId);
    } else {
      selectedEventIds.add(eventId);
    }
    renderRegisterEventCards();
  }

  function preselectEventAndNavigate(eventId) {
    selectedEventIds.add(eventId);
    renderRegisterEventCards();
    document.getElementById('registrationPassSection').classList.add('is-hidden');
    goTo('register');
    const ev = EVENTS_DATA.find((e) => e.id === eventId);
    if (ev) showToast(ev.title + ' selected in your registration form!');
  }

  document.addEventListener('click', (e) => {
    const openGuide = e.target.closest('[data-open-guidelines]');
    if (openGuide) {
      openGuidelinesModal(openGuide.getAttribute('data-open-guidelines'));
    }

    const regEvBtn = e.target.closest('[data-register-event]');
    if (regEvBtn) {
      preselectEventAndNavigate(regEvBtn.getAttribute('data-register-event'));
    }

    const toggleCard = e.target.closest('[data-toggle-reg-event]');
    if (toggleCard) {
      toggleRegisterEvent(toggleCard.getAttribute('data-toggle-reg-event'));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    const card = e.target.closest && e.target.closest('[data-toggle-reg-event]');
    if (!card || e.target !== card) return;
    e.preventDefault();
    const id = card.getAttribute('data-toggle-reg-event');
    toggleRegisterEvent(id);
    const again = document.querySelector('[data-toggle-reg-event="' + id + '"]');
    if (again) again.focus();
  });

  document.getElementById('addTeamMemberBtn').addEventListener('click', () => {
    const list = document.getElementById('teamMembersInputsList');
    const count = list.querySelectorAll('.team-member-input').length + 2;
    if (count > SITE_CONFIG.maxRoster) {
      showToast('Maximum team roster slots added.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-field team-member-input';
    input.placeholder = 'Team Member ' + count + ' Full Name';
    list.appendChild(input);
  });

  const delegateRegForm = document.getElementById('delegateRegForm');
  const regErrorBanner = document.getElementById('regErrorBanner');
  let latestRefId = '';
  let lastPayload = null;

  // Unique-enough reference ID (time-based + random), kept stable if the user edits & resubmits.
  function makeRefId() {
    const t = Date.now().toString(36).slice(-5).toUpperCase();
    const r = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0');
    return 'ASC26-' + t + r;
  }

  function normalizePhone(raw) {
    let d = String(raw).replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
    if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : null;
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  // Stops spreadsheet formula injection (=, +, -, @ at the start of a cell).
  function sheetSafe(v) {
    const str = String(v == null ? '' : v).slice(0, 500);
    return /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
  }

  function showRegError(msg) {
    regErrorBanner.textContent = msg;
    regErrorBanner.classList.remove('is-hidden');
    regErrorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Fee for one event: per participant (fee x people, clamped to the event's team size) or flat.
  function feeLine(ev, rosterSize) {
    const people = SITE_CONFIG.feePerPerson ? Math.min(Math.max(rosterSize, ev.minTeam), ev.maxTeam) : 1;
    return { ev: ev, people: people, amount: ev.fee * people };
  }

  function setSyncNotice(state) {
    const el = document.getElementById('syncNotice');
    if (!el) return;
    if (state === 'failed') {
      el.textContent =
        'We could not reach the registration server (check your internet). Your details are still on this page — please also send them to the desk on WhatsApp so your registration is not lost.';
      el.classList.remove('is-hidden');
    } else {
      el.classList.add('is-hidden');
    }
  }

  function syncToSheet(payload) {
    fetch(SITE_CONFIG.sheetEndpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(() => setSyncNotice('ok'))
      .catch((err) => {
        console.error('Sheet sync error:', err);
        setSyncNotice('failed');
      });
  }

  function renderUpiQr(text) {
    const box = document.getElementById('upiQrContainer');
    if (!box) return;
    try {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch (err) {
      box.textContent = 'QR unavailable — use the Pay button or UPI ID below.';
    }
  }

  function registrationIsOpen() {
    if (!SITE_CONFIG.registrationOpen) return false;
    if (SITE_CONFIG.registrationClosesAt && Date.now() > new Date(SITE_CONFIG.registrationClosesAt).getTime()) return false;
    return true;
  }

  function applyRegistrationState() {
    const open = registrationIsOpen();
    document.getElementById('regFormGrid').classList.toggle('is-hidden', !open);
    document.getElementById('regClosedNotice').classList.toggle('is-hidden', open);
    document
      .getElementById('regClosedWa')
      .setAttribute('href', 'https://wa.me/' + SITE_CONFIG.coordinatorWhatsApp + '?text=' + encodeURIComponent("Hello, I have a query about ASCEND '26 registration."));
    const note = document.getElementById('regDeadlineNote');
    if (open && SITE_CONFIG.registrationClosesAt) {
      note.textContent =
        'Registrations close on ' +
        new Date(SITE_CONFIG.registrationClosesAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) +
        ' IST';
      note.classList.remove('is-hidden');
    } else {
      note.classList.add('is-hidden');
    }
  }
  applyRegistrationState();

  delegateRegForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!registrationIsOpen()) {
      applyRegistrationState();
      return;
    }
    if (document.getElementById('regWebsite').value) return; // honeypot: bots only

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phoneRaw = document.getElementById('regPhone').value.trim();
    const college = document.getElementById('regCollege').value.trim();
    const program = document.getElementById('regProgram').value;
    const year = document.getElementById('regYear').value;
    const accom = document.getElementById('regAccommodation').value;
    const diet = document.getElementById('regDietary').value;
    const notes = document.getElementById('regNotes').value.trim();

    if (!name || !email || !phoneRaw || !college) {
      return showRegError('Please complete all required Lead Delegate & Institution fields (*).');
    }
    if (!isValidEmail(email)) {
      return showRegError('Please enter a valid email address.');
    }
    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      return showRegError('Please enter a valid 10-digit Indian mobile number (e.g., 98765 43210).');
    }
    if (selectedEventIds.size === 0) {
      return showRegError('Please select at least one event in Step 02 to register.');
    }

    const chosenEvents = EVENTS_DATA.filter((ev) => selectedEventIds.has(ev.id));
    const rosterVisible = chosenEvents.some((ev) => ev.maxTeam > 1);
    const teamNames = rosterVisible
      ? Array.from(document.querySelectorAll('.team-member-input')).map((inp) => inp.value.trim()).filter(Boolean)
      : [];
    const rosterSize = 1 + teamNames.length;

    for (const ev of chosenEvents) {
      if (rosterSize < ev.minTeam) {
        return showRegError(
          ev.title + ' needs ' + (ev.minTeam === ev.maxTeam ? 'exactly ' : 'at least ') + ev.minTeam +
            ' members (you have ' + rosterSize + '). Add the remaining teammate names in Step 02.'
        );
      }
    }
    const largestAllowed = Math.max.apply(null, chosenEvents.map((ev) => ev.maxTeam));
    if (rosterSize > largestAllowed) {
      return showRegError(
        'Your roster has ' + rosterSize + ' members but the selected event(s) allow at most ' + largestAllowed +
          '. Remove extra names or select a larger team event.'
      );
    }

    const consentEl = document.getElementById('regTermsConsent');
    if (consentEl && !consentEl.checked) {
      return showRegError('Please acknowledge the Festival Guidelines and Partner Terms to proceed.');
    }

    regErrorBanner.classList.add('is-hidden');

    if (!latestRefId) latestRefId = makeRefId();

    const lines = chosenEvents.map((ev) => feeLine(ev, rosterSize));
    const totalFee = lines.reduce((sum, l) => sum + l.amount, 0);
    const lineText = (l) =>
      l.ev.title + ' (' + (SITE_CONFIG.feePerPerson && l.people > 1 ? '₹' + l.ev.fee + ' × ' + l.people + ' = ' : '') + '₹' + l.amount + ')';

    const upiLink =
      'upi://pay?pa=' + SITE_CONFIG.upiId +
      '&pn=' + encodeURIComponent(SITE_CONFIG.payeeName) +
      '&am=' + totalFee + '.00&cu=INR&tn=' + encodeURIComponent('Reg_' + latestRefId);

    renderUpiQr(upiLink);
    document.getElementById('upiRefDisplay').textContent = latestRefId;
    document.getElementById('upiPayNowBtn').setAttribute('href', upiLink);
    document.getElementById('upiIdDisplay').textContent = SITE_CONFIG.upiId;
    document.getElementById('upiAmountDisplay').textContent = '₹' + totalFee;
    document.getElementById('passTotalFeeDisplay').textContent = '₹' + totalFee;
    document.getElementById('utrInput').value = '';

    document.getElementById('paymentGatewayBox').classList.remove('is-hidden');
    document.getElementById('finalConfirmedPassContent').classList.add('is-hidden');
    setPassStatus('pending');

    document.getElementById('passRefId').textContent = latestRefId;
    document.getElementById('passName').textContent = name;
    document.getElementById('passContact').textContent = '+91 ' + phone + ' • ' + email;
    document.getElementById('passCollege').textContent = college + ' (' + program + ', ' + year + ')';
    document.getElementById('passAccom').textContent = accom;
    document.getElementById('passDiet').textContent = diet;

    document.getElementById('passEventsList').innerHTML = lines
      .map(
        (l) => `<span class="px-2.5 py-1 rounded-full text-xs font-bold"
                       style="background: var(--gold-tint); color: var(--gold-primary); border: 1px solid var(--gold-border);">
                   ${lineText(l)}
                 </span>`
      )
      .join('');

    const passTeamBlock = document.getElementById('passTeamBlock');
    if (teamNames.length > 0) {
      passTeamBlock.classList.remove('is-hidden');
      document.getElementById('passTeamMembers').textContent = teamNames.join(', ');
    } else {
      passTeamBlock.classList.add('is-hidden');
    }

    lastPayload = {
      refId: latestRefId,
      submittedAt: new Date().toISOString(),
      name: sheetSafe(name),
      email: sheetSafe(email),
      phone: phone,
      college: sheetSafe(college),
      program: sheetSafe(program),
      year: sheetSafe(year),
      events: sheetSafe(chosenEvents.map((c) => c.title).join(', ')),
      feeBreakdown: sheetSafe(lines.map(lineText).join('; ')),
      totalFee: totalFee,
      teamMembers: sheetSafe(teamNames.join(', ')),
      accommodation: sheetSafe(accom),
      dietary: sheetSafe(diet),
      notes: sheetSafe(notes),
      termsAccepted: 'Yes',
      paymentStatus: 'Unpaid',
      utr: ''
    };

    const waLines = [
      '*ASCEND \'26 — REGISTRATION (PAYMENT SUBMITTED)*',
      'Ref ID: *' + latestRefId + '*',
      'Lead Delegate: ' + name,
      'Phone: +91 ' + phone,
      'Email: ' + email,
      'Institution: ' + college + ' (' + program + ' - ' + year + ')',
      'Events: ' + lines.map(lineText).join(', '),
      'Total Fee: *₹' + totalFee + '*',
      teamNames.length ? 'Team Members: ' + teamNames.join(', ') : '',
      'Accommodation: ' + accom,
      'Dietary: ' + diet,
      notes ? 'Notes: ' + notes : '',
      'UTR / Txn ID: (see screenshot)'
    ]
      .filter(Boolean)
      .join('\n');
    lastPayload.__wa = waLines;

    document
      .getElementById('passWhatsappConfirmBtn')
      .setAttribute('href', 'https://wa.me/' + SITE_CONFIG.coordinatorWhatsApp + '?text=' + encodeURIComponent(waLines));

    setSyncNotice('ok');
    syncToSheet(sheetPayloadOf(lastPayload));
    rememberRegistration(latestRefId, phone);
    document.getElementById('chkRef').value = latestRefId;
    document.getElementById('chkPhone').value = phone;

    document.getElementById('registrationPassSection').classList.remove('is-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Registration saved as ' + latestRefId + '. Total Fee: ₹' + totalFee + ' — now complete payment.');
  });

  const regConsentCheckbox = document.getElementById('regTermsConsent');
  if (regConsentCheckbox) {
    regConsentCheckbox.addEventListener('change', () => {
      if (regConsentCheckbox.checked && regErrorBanner.textContent.includes('Partner Terms')) {
        regErrorBanner.classList.add('is-hidden');
      }
    });
  }

  function sheetPayloadOf(p) {
    const copy = Object.assign({}, p);
    delete copy.__wa;
    return copy;
  }

  function setPassStatus(state) {
    const badge = document.getElementById('passStatusBadge');
    if (!badge) return;
    if (state === 'submitted') {
      badge.textContent = 'Payment submitted — pending verification';
      badge.style.color = '#34D399';
    } else {
      badge.textContent = 'Awaiting payment';
      badge.style.color = '#FBBF24';
    }
  }

  // The user says they paid. This does NOT confirm anything — the desk verifies the payment manually.
  const confirmPaymentBtn = document.getElementById('confirmPaymentDoneBtn');
  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', () => {
      const utrEl = document.getElementById('utrInput');
      const utr = utrEl.value.replace(/\s/g, '');
      if (utr && !/^\d{12}$/.test(utr)) {
        showToast('UPI transaction ID (UTR) is a 12-digit number. Leave it blank if you are unsure.');
        utrEl.focus();
        return;
      }
      if (lastPayload) {
        lastPayload.utr = utr;
        lastPayload.paymentStatus = 'Paid by delegate — pending verification';
        lastPayload.__wa = lastPayload.__wa.replace('UTR / Txn ID: (see screenshot)', utr ? 'UTR / Txn ID: ' + utr : 'UTR / Txn ID: (see screenshot)');
        document
          .getElementById('passWhatsappConfirmBtn')
          .setAttribute('href', 'https://wa.me/' + SITE_CONFIG.coordinatorWhatsApp + '?text=' + encodeURIComponent(lastPayload.__wa));
        syncToSheet(sheetPayloadOf(lastPayload));
      }
      document.getElementById('paymentGatewayBox').classList.add('is-hidden');
      document.getElementById('finalConfirmedPassContent').classList.remove('is-hidden');
      setPassStatus('submitted');
      showToast('Payment submitted — your registration is pending verification by the ASCEND desk.');
    });
  }

  // ---- Status check: delegate sees confirmed pass after the desk marks YES in the sheet
  const STORE_KEY = 'ascend26.registration';
  function rememberRegistration(ref, phone) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ ref: ref, phone: phone })); } catch (err) { /* private mode */ }
  }
  function recallRegistration() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (err) { return null; }
  }

  const chkMsg = document.getElementById('statusCheckMsg');
  function chkNotice(text, tone) {
    chkMsg.textContent = text;
    chkMsg.style.color = tone === 'bad' ? '#FCA5A5' : '#FBBF24';
    chkMsg.classList.toggle('is-hidden', !text);
  }

  function renderStatus(d) {
    const banner = document.getElementById('stBanner');
    const tones = {
      confirmed: ['✅ REGISTRATION CONFIRMED — your payment is verified. Show this pass (with your college ID) at the ASCEND registration desk.', 'rgba(16,185,129,.12)', '#6EE7B7'],
      pending: ['⏳ Payment received from you — pending verification by the ASCEND desk. Check again later; this page updates automatically once verified.', 'rgba(245,158,11,.12)', '#FCD34D'],
      unpaid: ['💳 Registration saved, but no payment has been reported yet. Complete the UPI payment to continue.', 'rgba(245,158,11,.12)', '#FCD34D'],
      rejected: ['⚠️ We could not verify your payment. Please contact the ASCEND desk on WhatsApp with your payment screenshot.', 'rgba(239,68,68,.12)', '#FCA5A5']
    };
    const t = tones[d.state] || tones.pending;
    banner.textContent = t[0];
    banner.style.background = t[1];
    banner.style.color = t[2];
    document.getElementById('stName').textContent = d.name;
    document.getElementById('stRef').textContent = d.refId;
    document.getElementById('stCollege').textContent = d.college + ' (' + d.program + ', ' + d.year + ')';
    document.getElementById('stEvents').textContent = d.events;
    document.getElementById('stTeam').textContent = d.team || '';
    document.getElementById('stTeamWrap').classList.toggle('is-hidden', !d.team);
    document.getElementById('stFee').textContent = '₹' + d.total;
    document.getElementById('stAccom').textContent = d.accommodation;
    document.getElementById('stPrintBtn').classList.toggle('is-hidden', d.state !== 'confirmed');
    const help = document.getElementById('stHelpBtn');
    help.classList.toggle('is-hidden', d.state !== 'rejected');
    help.setAttribute('href', 'https://wa.me/' + SITE_CONFIG.coordinatorWhatsApp + '?text=' + encodeURIComponent('Hello, my payment could not be verified. Ref ID: ' + d.refId));

    // Render live scannable verification QR Code on confirmed pass
    const qrWrap = document.getElementById('stQrWrap');
    const qrContainer = document.getElementById('stQrContainer');
    if (qrWrap && qrContainer) {
      if (d.state === 'confirmed' && typeof qrcode !== 'undefined') {
        try {
          const passLiveUrl = 'https://ascend26.vercel.app/?pass=' + encodeURIComponent(d.refId) + (d.phone ? '&phone=' + encodeURIComponent(d.phone) : '') + '#register';
          const qr = qrcode(0, 'M');
          qr.addData(passLiveUrl);
          qr.make();
          qrContainer.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
          qrWrap.classList.remove('is-hidden');
        } catch (qrErr) {
          qrWrap.classList.add('is-hidden');
        }
      } else {
        qrWrap.classList.add('is-hidden');
      }
    }

    document.getElementById('statusResult').classList.remove('is-hidden');
    setTimeout(() => {
      document.getElementById('statusResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  async function checkStatus(ref, phoneRaw, silent) {
    const phone = normalizePhone(phoneRaw);
    ref = String(ref).trim().toUpperCase().replace(/[\u2010-\u2015\u2212]/g, '-');
    document.getElementById('statusResult').classList.add('is-hidden');
    if (!/^ASC26-[0-9A-Z]{7}$/.test(ref) || !phone) {
      if (!silent) chkNotice('Enter your Reference ID (ASC26-XXXXXXX) and the 10-digit mobile number you registered with.', 'bad');
      return;
    }
    const btn = document.getElementById('chkBtn');
    if (btn) btn.disabled = true;
    if (!silent) chkNotice('Checking…');
    try {
      let q = '?action=status&ref=' + encodeURIComponent(ref);
      if (phone) q += '&phone=' + encodeURIComponent(phone);
      const res = await fetch(SITE_CONFIG.sheetEndpoint + q);
      if (!res.ok) {
        console.error('Status check HTTP error:', res.status, res.statusText);
        if (!silent) chkNotice('Unable to reach the server right now. Please check your connection and try again in a moment.', 'bad');
        return;
      }
      let d;
      try {
        d = await res.json();
      } catch (parseErr) {
        console.error('Status check parse error:', parseErr);
        if (!silent) chkNotice('Unable to retrieve pass details. Please try again in a moment.', 'bad');
        return;
      }
      if (d && d.found) {
        chkNotice('');
        renderStatus(d);
        rememberRegistration(ref, phone);
      } else if (!silent) {
        document.getElementById('statusResult').classList.add('is-hidden');
        chkNotice('No registration found for that Reference ID and mobile number. Please check both details.', 'bad');
      }
    } catch (err) {
      console.error('Status check network error:', err);
      if (!silent) chkNotice('Unable to connect to the server right now. Please check your internet connection and try again.', 'bad');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  document.getElementById('statusCheckForm').addEventListener('submit', (e) => {
    e.preventDefault();
    checkStatus(document.getElementById('chkRef').value, document.getElementById('chkPhone').value, false);
  });
  ['chkRef', 'chkPhone'].forEach((id) => {
    document.getElementById(id).addEventListener('input', () => {
      document.getElementById('statusResult').classList.add('is-hidden');
      chkNotice('');
    });
  });
  document.getElementById('stRefreshBtn').addEventListener('click', () => {
    checkStatus(document.getElementById('chkRef').value, document.getElementById('chkPhone').value, false);
  });
  document.getElementById('stPrintBtn').addEventListener('click', () => {
    document.body.classList.add('print-status');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-status'), { once: true });
    window.print();
  });

  // Helper to extract pass parameters from query string or hash
  function getUrlPassParams() {
    const params = new URLSearchParams(window.location.search);
    if (window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?') + 1);
      const hp = new URLSearchParams(hashQuery);
      hp.forEach((val, key) => {
        if (!params.has(key)) params.set(key, val);
      });
    }
    const ref = (params.get('pass') || params.get('ref') || '').trim().toUpperCase();
    const phone = (params.get('phone') || params.get('p') || '').trim();
    return { ref, phone };
  }

  // Auto-detect pass in URL (e.g. from scanned QR code or email link)
  const urlPass = getUrlPassParams();
  if (urlPass.ref && /^ASC26-[0-9A-Z]{7}$/.test(urlPass.ref)) {
    switchView('register');
    document.getElementById('chkRef').value = urlPass.ref;
    if (urlPass.phone) document.getElementById('chkPhone').value = urlPass.phone;
    checkStatus(urlPass.ref, urlPass.phone, false);
  } else {
    // After a page refresh, restore this delegate's status automatically from localStorage
    const saved = recallRegistration();
    if (saved && saved.ref) {
      document.getElementById('chkRef').value = saved.ref;
      document.getElementById('chkPhone').value = saved.phone || '';
      checkStatus(saved.ref, saved.phone || '', true);
    }
  }

  document.getElementById('printPassBtn').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('copyRefBtn').addEventListener('click', () => {
    const refId = document.getElementById('passRefId').textContent.trim();
    if (refId) copyTextSafe(refId);
  });

  document.getElementById('stCopyRefBtn').addEventListener('click', () => {
    const refId = document.getElementById('stRef').textContent.trim();
    if (refId) copyTextSafe(refId);
  });

  document.getElementById('editRegistrationBtn').addEventListener('click', () => {
    document.getElementById('delegateRegForm').scrollIntoView({ behavior: 'smooth' });
  });

  const teamSearchInput = document.getElementById('teamSearchInput');
  const teamSections = {
    'Core Committee': document.getElementById('coreCommitteeGrid'),
    'Event Heads': document.getElementById('eventHeadsGrid'),
    'Committee Heads': document.getElementById('committeeHeadsGrid')
  };

  function renderTeamGrid() {
    const query = teamSearchInput.value.trim().toLowerCase();
    Object.entries(teamSections).forEach(([category, grid]) => {
      const section = grid.closest('[data-team-section]');
      const filtered = TEAM_DATA.filter((member) => {
        if (member.category !== category) return false;
        return (
          !query ||
          (member.name && member.name.toLowerCase().includes(query)) ||
          member.role.toLowerCase().includes(query)
        );
      });

      section.classList.toggle('is-hidden', filtered.length === 0);
      grid.innerHTML = filtered
        .map((member) => {
          const avatarHtml = member.photo
            ? `<div class="avatar-photo">
                 <img src="${member.photo}" alt="${member.name}" class="avatar-img" loading="lazy" />
               </div>`
            : `<div class="avatar-monogram">${getInitials(member.name)}</div>`;

          if (category === 'Event Heads') {
            return `
              <div class="surface-card p-5 flex items-start gap-3.5">
                ${avatarHtml}
                <div class="min-w-0">
                  <h3 class="font-bold text-base leading-snug">${member.name}</h3>
                  <div class="text-xs font-semibold mt-0.5" style="color: var(--gold-primary);">${member.role}</div>
                </div>
              </div>
            `;
          }

          return `
            <div class="surface-card surface-card-hover p-5 flex flex-col justify-between">
              <div class="flex items-start gap-3.5">
                ${avatarHtml}
                <div class="min-w-0">
                  <h3 class="font-bold text-base leading-snug">${member.name}</h3>
                  <div class="text-xs font-semibold mt-0.5" style="color: var(--gold-primary);">${member.role}</div>
                  ${member.phoneDisplay ? `<div class="text-xs mt-1" style="color: var(--text-muted);">${member.phoneDisplay}</div>` : ''}
                </div>
              </div>

              ${member.phoneRaw ? `
                <div class="mt-4 pt-3 border-t grid grid-cols-2 gap-2" style="border-color: var(--border-subtle);">
                  <a href="tel:+${member.phoneRaw}" class="btn-action-chip py-2 text-center">Call</a>
                  <a href="https://wa.me/${member.phoneRaw}?text=${encodeURIComponent("Hello " + member.name + ", reaching out regarding ASCEND '26.")}"
                     target="_blank" rel="noopener noreferrer" class="btn-action-chip py-2 text-center" style="color: var(--gold-primary);">
                    WhatsApp ↗
                  </a>
                </div>
              ` : ''}
            </div>
          `;
        })
        .join('');
    });
  }

  renderTeamGrid();

  teamSearchInput.addEventListener('input', renderTeamGrid);

  document.addEventListener('click', (e) => {
    const spTrigger = e.target.closest('.open-sponsor-modal');
    if (spTrigger) {
      const tier = spTrigger.getAttribute('data-sponsor-tier') || 'Corporate Partnership';
      document.getElementById('spTierInput').value = tier;
      document.getElementById('sponsorInquiryModal').classList.add('is-open');
    }

    const closeTrigger = e.target.closest('[data-close-modal]');
    if (closeTrigger) {
      const modalId = closeTrigger.getAttribute('data-close-modal');
      document.getElementById(modalId).classList.remove('is-open');
    }

    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('is-open');
    }

    const copyBtn = e.target.closest('.copy-trigger');
    if (copyBtn) {
      copyTextSafe(copyBtn.getAttribute('data-copy'));
    }
  });

  function getSponsorPayload() {
    const tier = document.getElementById('spTierInput').value;
    const brand = document.getElementById('spBrand').value.trim();
    const person = document.getElementById('spContactPerson').value.trim();
    const phone = document.getElementById('spPhone').value.trim();
    const email = document.getElementById('spEmail').value.trim();
    const notes = document.getElementById('spNotes').value.trim();
    if (!brand || !person || !phone || !email) {
      showToast('Please fill in company name, contact person, phone, and email.');
      return null;
    }
    return { tier, brand, person, phone, email, notes };
  }

  document.getElementById('spSendWhatsappBtn').addEventListener('click', () => {
    const data = getSponsorPayload();
    if (!data) return;
    const text = [
      '*ASCEND \'26 — SPONSORSHIP PROPOSAL INQUIRY*',
      'Package: *' + data.tier + '*',
      'Company/Brand: ' + data.brand,
      'Contact Person: ' + data.person,
      'Phone: ' + data.phone,
      'Email: ' + data.email,
      data.notes ? 'Notes: ' + data.notes : ''
    ]
      .filter(Boolean)
      .join('\n');
    window.open('https://wa.me/919744011164?text=' + encodeURIComponent(text), '_blank', 'noopener');
    document.getElementById('sponsorInquiryModal').classList.remove('is-open');
    showToast('Connecting with Sponsorship Lead Muhammed Shabeeb K T!');
  });

  document.getElementById('sponsorExpressForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = getSponsorPayload();
    if (!data) return;
    const subject = 'ASCEND 26 Sponsorship Inquiry — ' + data.brand + ' (' + data.tier + ')';
    const body = [
      'Dear ASCEND 26 Sponsorship Team,',
      '',
      'We are interested in partnering with ASCEND 26 (' + SITE_CONFIG.eventDatesLabel + (SITE_CONFIG.datesTentative ? ', tentative' : '') + ') at DCMS, University of Calicut.',
      '',
      'Selected Tier: ' + data.tier,
      'Brand / Organization: ' + data.brand,
      'Contact Person: ' + data.person,
      'Phone / WhatsApp: ' + data.phone,
      'Email: ' + data.email,
      data.notes ? 'Additional Notes: ' + data.notes : '',
      '',
      'Please share the next steps and MoU details.'
    ]
      .filter((v) => v !== undefined)
      .join('\n');

    window.location.href =
      'mailto:dcms.ascend26@gmail.com,muhammedshabeebkt2016@gmail.com?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body);
    document.getElementById('sponsorInquiryModal').classList.remove('is-open');
    showToast('Opening email client addressed to ASCEND Sponsorship Desk!');
  });

  document.getElementById('contactDirectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('msgName').value.trim();
    const contact = document.getElementById('msgEmail').value.trim();
    const topic = document.getElementById('msgTopic').value;
    const body = document.getElementById('msgBody').value.trim();

    if (!name || !contact || !body) {
      showToast('Please fill in all required fields before sending.');
      return;
    }

    const mailSubject = 'ASCEND 26 Inquiry [' + topic + '] — ' + name;
    const mailBody = 'From: ' + name + '\nContact: ' + contact + '\nTopic: ' + topic + '\n\nMessage:\n' + body;

    showToast('Opening your email app — press Send there to deliver your message.');
    setTimeout(() => {
      window.location.href =
        'mailto:dcms.ascend26@gmail.com?subject=' +
        encodeURIComponent(mailSubject) +
        '&body=' +
        encodeURIComponent(mailBody);
    }, 500);
  });

  // ---- Modal accessibility: Escape to close, focus moves in, focus returns, Tab stays inside
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const modalReturnFocus = new WeakMap();

  document.querySelectorAll('.modal-backdrop').forEach((modal) => {
    new MutationObserver(() => {
      if (modal.classList.contains('is-open')) {
        modalReturnFocus.set(modal, document.activeElement);
        const first = modal.querySelector(FOCUSABLE);
        if (first) setTimeout(() => first.focus(), 30);
      } else {
        const back = modalReturnFocus.get(modal);
        if (back && document.contains(back)) back.focus();
        modalReturnFocus.delete(modal);
      }
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  });

  document.addEventListener('keydown', (e) => {
    const open = document.querySelector('.modal-backdrop.is-open');
    if (!open) return;
    if (e.key === 'Escape') {
      open.classList.remove('is-open');
      return;
    }
    if (e.key === 'Tab') {
      const items = Array.from(open.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
})();