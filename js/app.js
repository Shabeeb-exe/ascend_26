(() => {
  'use strict';

  let activeEventCategory = 'all';
  let activeTeamCategory = 'all';
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
      const targetView = navTrigger.getAttribute('data-nav');
      switchView(targetView);
    }
  });

  const targetTimestamp = new Date('2026-11-16T09:00:00+05:30').getTime();
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
    const track = document.getElementById('sponsorsMarqueeTrack');
    const doubled = PAST_SPONSORS.concat(PAST_SPONSORS);
    track.innerHTML = doubled
      .map(
        (brand) => `
        <div class="sponsor-pill">
          <span style="color: var(--gold-primary);">◆</span>
          <span>${brand}</span>
        </div>
      `
      )
      .join('');
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
        ev.head.toLowerCase().includes(query) ||
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
              <span class="text-xs font-bold text-amber-400">Fee: ₹${ev.fee}</span>
            </div>

            <p class="text-xs sm:text-sm leading-relaxed mt-3" style="color: var(--text-secondary);">
              ${ev.desc}
            </p>

            <div class="mt-4 px-3 py-2 rounded-lg text-[11px] font-medium"
                 style="background: var(--bg-elevated); color: var(--text-secondary);">
              ${ev.skills}
            </div>

            <div class="mt-4 pt-4 border-t flex items-center justify-between gap-2" style="border-color: var(--border-subtle);">
              <div>
                <div class="text-[11px] uppercase tracking-wider" style="color: var(--text-muted);">Event Head</div>
                <div class="text-xs sm:text-sm font-bold">${ev.head}</div>
                <div class="text-xs" style="color: var(--text-secondary);">${ev.phoneDisplay}</div>
              </div>
              <div class="flex items-center gap-1.5">
                <a href="tel:+${ev.phoneRaw}" class="btn-action-chip px-2.5 py-1.5" title="Call ${ev.head}">Call</a>
                <a href="https://wa.me/${ev.phoneRaw}?text=${encodeURIComponent('Hello ' + ev.head + ', I have a query regarding ' + ev.title + ' at ASCEND \'26.')}"
                   target="_blank" rel="noopener noreferrer" class="btn-action-chip px-2.5 py-1.5" title="WhatsApp ${ev.head}">
                  WhatsApp
                </a>
              </div>
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
      switchView('events');
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
    document.getElementById('modalEventHead').textContent = ev.head + ' (' + ev.phoneDisplay + ')';
    document.getElementById('modalEventCall').setAttribute('href', 'tel:+' + ev.phoneRaw);
    document.getElementById('modalEventWa').setAttribute(
      'href',
      'https://wa.me/' + ev.phoneRaw + '?text=' + encodeURIComponent('Hello ' + ev.head + ', querying about ' + ev.title + ' at ASCEND \'26.')
    );
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
              <div class="text-[11px]" style="color: var(--text-muted);">${ev.format} • Head: ${ev.head}</div>
            </div>
            <div class="text-xs font-bold text-amber-400">₹${ev.fee}</div>
          </div>
        </div>
      `;
    };

    regMgmtContainer.innerHTML = EVENTS_DATA.filter((e) => e.category === 'Management').map(buildCard).join('');
    regNonMgmtContainer.innerHTML = EVENTS_DATA.filter((e) => e.category === 'Non-Management').map(buildCard).join('');

    selectedEventsCountBadge.textContent = selectedEventIds.size + ' Selected';

    const selectedObjs = EVENTS_DATA.filter((e) => selectedEventIds.has(e.id));
    const teamEvents = selectedObjs.filter((e) => e.isTeam);
    if (teamEvents.length > 0) {
      teamMembersDynamicSection.classList.remove('is-hidden');
      teamSizeHintText.textContent =
        'Selected team format(s): ' + teamEvents.map((t) => t.title + ' (' + t.format + ')').join(' | ');
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
    switchView('register');
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

  document.getElementById('addTeamMemberBtn').addEventListener('click', () => {
    const list = document.getElementById('teamMembersInputsList');
    const count = list.querySelectorAll('.team-member-input').length + 2;
    if (count > 8) {
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

  delegateRegForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const college = document.getElementById('regCollege').value.trim();
    const program = document.getElementById('regProgram').value;
    const year = document.getElementById('regYear').value;
    const accom = document.getElementById('regAccommodation').value;
    const diet = document.getElementById('regDietary').value;
    const notes = document.getElementById('regNotes').value.trim();

    if (!name || !email || !phone || !college) {
      regErrorBanner.textContent = 'Please complete all required Lead Delegate & Institution fields (*).';
      regErrorBanner.classList.remove('is-hidden');
      return;
    }

    if (selectedEventIds.size === 0) {
      regErrorBanner.textContent = 'Please select at least one event in Step 02 to register.';
      regErrorBanner.classList.remove('is-hidden');
      return;
    }

    regErrorBanner.classList.add('is-hidden');

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    latestRefId = 'ASC26-' + randomCode;

    const chosenEvents = EVENTS_DATA.filter((ev) => selectedEventIds.has(ev.id));
    const teamNames = Array.from(document.querySelectorAll('.team-member-input'))
      .map((inp) => inp.value.trim())
      .filter(Boolean);

    // Calculate total fee dynamically
    const totalFee = chosenEvents.reduce((sum, ev) => sum + ev.fee, 0);

    const festUpiId = "muhammedshabeebkt2016@oksbi;
    const payeeName = "ASCEND 26 DCMS";
    const upiLink = `upi://pay?pa=${festUpiId}&pn=${encodeURIComponent(payeeName)}&am=${totalFee}.00&cu=INR&tn=Reg_${latestRefId}`;
    
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
    const upiQrImg = document.getElementById('dynamicUpiQrImg');
    const upiRefDisplay = document.getElementById('upiRefDisplay');
    const upiPayNowBtn = document.getElementById('upiPayNowBtn');
    const passTotalFeeDisplay = document.getElementById('passTotalFeeDisplay');

    if (upiQrImg) upiQrImg.setAttribute('src', qrApiUrl);
    if (upiRefDisplay) upiRefDisplay.textContent = latestRefId;
    if (upiPayNowBtn) upiPayNowBtn.setAttribute('href', upiLink);
    if (passTotalFeeDisplay) passTotalFeeDisplay.textContent = `₹${totalFee}`;

    // Lock behind payment gateway box initially
    const paymentGatewayBox = document.getElementById('paymentGatewayBox');
    const finalConfirmedPassContent = document.getElementById('finalConfirmedPassContent');
    if (paymentGatewayBox) paymentGatewayBox.classList.remove('is-hidden');
    if (finalConfirmedPassContent) finalConfirmedPassContent.classList.add('is-hidden');

    document.getElementById('passRefId').textContent = latestRefId;
    document.getElementById('passName').textContent = name;
    document.getElementById('passContact').textContent = phone + ' • ' + email;
    document.getElementById('passCollege').textContent = college + ' (' + program + ', ' + year + ')';
    document.getElementById('passAccom').textContent = accom;
    document.getElementById('passDiet').textContent = diet;

    document.getElementById('passEventsList').innerHTML = chosenEvents
      .map(
        (ev) => `<span class="px-2.5 py-1 rounded-full text-xs font-bold"
                       style="background: var(--gold-tint); color: var(--gold-primary); border: 1px solid var(--gold-border);">
                   ${ev.title} (₹${ev.fee})
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

    const waLines = [
      '*ASCEND \'26 — PROVISIONAL REGISTRATION*',
      'Ref ID: *' + latestRefId + '*',
      'Lead Delegate: ' + name,
      'Phone: ' + phone,
      'Email: ' + email,
      'Institution: ' + college + ' (' + program + ' - ' + year + ')',
      'Events: ' + chosenEvents.map((c) => c.title + ' (₹' + c.fee + ')').join(', '),
      'Total Fee: *₹' + totalFee + '*',
      teamNames.length ? 'Team Members: ' + teamNames.join(', ') : '',
      'Accommodation: ' + accom,
      'Dietary: ' + diet,
      notes ? 'Notes: ' + notes : ''
    ]
      .filter(Boolean)
      .join('\n');

    document
      .getElementById('passWhatsappConfirmBtn')
      .setAttribute('href', 'https://wa.me/919188007846?text=' + encodeURIComponent(waLines));

    // Send data silently to Google Sheet
    const sheetPayload = {
      refId: latestRefId,
      name: name,
      email: email,
      phone: phone,
      college: college,
      program: program,
      year: year,
      events: chosenEvents.map(c => c.title).join(', '),
      totalFee: `₹${totalFee}`,
      teamMembers: teamNames.join(', '),
      accommodation: accom,
      dietary: diet,
      notes: notes
    };

    fetch('https://script.google.com/macros/s/AKfycbxt6ZHqEyzAjgFD48EE5SUG6yqozlLcTtvZFjN3WUYarRpStvq2lO7KxddIBFWujbgL-w/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sheetPayload)
    }).catch(err => console.error('Sheet sync error:', err));

    document.getElementById('registrationPassSection').classList.remove('is-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Provisional Pass ' + latestRefId + ' generated! Total Fee: ₹' + totalFee);
  });
  // Unlock confirmed pass and WhatsApp buttons when user confirms payment
  const confirmPaymentBtn = document.getElementById('confirmPaymentDoneBtn');
  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', () => {
      document.getElementById('paymentGatewayBox').classList.add('is-hidden');
      document.getElementById('finalConfirmedPassContent').classList.remove('is-hidden');
      showToast('Payment verified & registration unlocked!');
    });
  }

  document.getElementById('printPassBtn').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('copyRefBtn').addEventListener('click', () => {
    if (latestRefId) copyTextSafe(latestRefId);
  });

  document.getElementById('editRegistrationBtn').addEventListener('click', () => {
    document.getElementById('delegateRegForm').scrollIntoView({ behavior: 'smooth' });
  });

  const teamGridContainer = document.getElementById('teamGridContainer');
  const teamSearchInput = document.getElementById('teamSearchInput');

  function renderTeamGrid() {
    const query = teamSearchInput.value.trim().toLowerCase();
    const filtered = TEAM_DATA.filter((member) => {
      const matchesCat = activeTeamCategory === 'all' || member.category === activeTeamCategory;
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.category.toLowerCase().includes(query);
      return matchesCat && matchesSearch;
    });

    teamGridContainer.innerHTML = filtered
      .map(
        (m) => `
        <div class="surface-card surface-card-hover p-5 flex flex-col justify-between">
          <div class="flex items-start gap-3.5">
            <div class="avatar-monogram">${getInitials(m.name)}</div>
            <div class="min-w-0">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style="background: var(--gold-tint); color: var(--gold-primary);">
                ${m.category}
              </span>
              <h3 class="font-bold text-base mt-1.5 leading-snug">${m.name}</h3>
              <div class="text-xs font-semibold mt-0.5" style="color: var(--gold-primary);">${m.role}</div>
              <div class="text-xs mt-1" style="color: var(--text-muted);">${m.phoneDisplay}</div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t grid grid-cols-2 gap-2" style="border-color: var(--border-subtle);">
            <a href="tel:+${m.phoneRaw}" class="btn-action-chip py-2 text-center">Call</a>
            <a href="https://wa.me/${m.phoneRaw}?text=${encodeURIComponent('Hello ' + m.name + ', reaching out regarding ASCEND \'26.')}"
               target="_blank" rel="noopener noreferrer" class="btn-action-chip py-2 text-center" style="color: var(--gold-primary);">
              WhatsApp ↗
            </a>
          </div>
        </div>
      `
      )
      .join('');
  }

  renderTeamGrid();

  document.getElementById('teamFilterTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-team-cat]');
    if (!tab) return;
    activeTeamCategory = tab.getAttribute('data-team-cat');
    document.querySelectorAll('[data-team-cat]').forEach((b) => {
      b.classList.toggle('is-active', b === tab);
    });
    renderTeamGrid();
  });

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

  document.getElementById('openVolunteerModalBtn').addEventListener('click', () => {
    document.getElementById('volunteerSignupModal').classList.add('is-open');
  });

  document.getElementById('volunteerExpressForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('volName').value.trim();
    const phone = document.getElementById('volPhone').value.trim();
    const batch = document.getElementById('volBatch').value.trim();
    const wing = document.getElementById('volWing').value;
    if (!name || !phone || !batch) {
      showToast('Please fill in your name, WhatsApp number, and batch.');
      return;
    }
    const msg = [
      '*ASCEND \'26 — CAMPUS VOLUNTEER SIGN-UP*',
      'Name: ' + name,
      'Phone: ' + phone,
      'Course & Sem: ' + batch,
      'Preferred Wing: ' + wing
    ].join('\n');
    window.open('https://wa.me/918129858290?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    document.getElementById('volunteerSignupModal').classList.remove('is-open');
    showToast('Opening WhatsApp to Volunteer Head Steljo!');
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
      'We are interested in partnering with ASCEND 26 (Nov 16 & 17, 2026) at DCMS, University of Calicut.',
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

    showToast('Message logged! Opening mail client to dcms.ascend26@gmail.com...');
    setTimeout(() => {
      window.location.href =
        'mailto:dcms.ascend26@gmail.com?subject=' +
        encodeURIComponent(mailSubject) +
        '&body=' +
        encodeURIComponent(mailBody);
    }, 500);
    e.target.reset();
  });
})();