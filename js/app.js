(() => {
  'use strict';

  let activeEventCategory = 'all';
  let selectedEventId = null;
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
  const teamRosterCountPill = document.getElementById('teamRosterCountPill');

  const teammateCache = {};
  function saveCurrentTeammateInputs() {
    for (let i = 2; i <= 4; i++) {
      const nameEl = document.getElementById(`tmName_${i}`);
      if (nameEl) {
        teammateCache[i] = {
          name: nameEl.value,
          phone: document.getElementById(`tmPhone_${i}`)?.value || '',
          email: document.getElementById(`tmEmail_${i}`)?.value || '',
          program: document.getElementById(`tmProgram_${i}`)?.value || '',
          programOther: document.getElementById(`tmProgramOther_${i}`)?.value || '',
          year: document.getElementById(`tmYear_${i}`)?.value || '',
          diet: document.getElementById(`tmDiet_${i}`)?.value || ''
        };
      }
    }
  }

  function setFieldDuplicateState(inputEl, warnEl, message) {
    if (!inputEl) return;
    if (message) {
      inputEl.style.borderColor = '#EF4444';
      inputEl.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.25)';
      if (warnEl) {
        warnEl.textContent = message;
        warnEl.classList.remove('is-hidden');
      }
    } else {
      inputEl.style.borderColor = '';
      inputEl.style.boxShadow = '';
      if (warnEl) {
        warnEl.textContent = '';
        warnEl.classList.add('is-hidden');
      }
    }
  }

  function checkRosterDuplicates(showAlertOnBlur = false) {
    const chosen = EVENTS_DATA.find((e) => e.id === selectedEventId);
    if (!chosen || chosen.maxTeam <= 1) return true;

    const leadName = (document.getElementById('regName')?.value || '').trim();
    const leadPhoneRaw = (document.getElementById('regPhone')?.value || '').trim();
    const leadEmail = (document.getElementById('regEmail')?.value || '').trim().toLowerCase();
    const leadPhone = normalizePhone(leadPhoneRaw) || '';

    const normName = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLeadName = normName(leadName);

    let hasDuplicate = false;
    let duplicateMsg = '';

    for (let i = 2; i <= chosen.maxTeam; i++) {
      const nameInput = document.getElementById(`tmName_${i}`);
      const phoneInput = document.getElementById(`tmPhone_${i}`);
      const emailInput = document.getElementById(`tmEmail_${i}`);
      const nameWarn = document.getElementById(`tmNameWarn_${i}`);
      const phoneWarn = document.getElementById(`tmPhoneWarn_${i}`);
      const emailWarn = document.getElementById(`tmEmailWarn_${i}`);

      if (!nameInput || !phoneInput || !emailInput) continue;

      const tmName = nameInput.value.trim();
      const tmPhoneRaw = phoneInput.value.trim();
      const tmEmail = emailInput.value.trim().toLowerCase();
      const tmPhone = normalizePhone(tmPhoneRaw) || '';
      const cleanTmName = normName(tmName);

      setFieldDuplicateState(nameInput, nameWarn, '');
      setFieldDuplicateState(phoneInput, phoneWarn, '');
      setFieldDuplicateState(emailInput, emailWarn, '');

      // Check Name Duplicate
      if (cleanTmName.length >= 3) {
        if (cleanLeadName.length >= 3 && cleanTmName === cleanLeadName) {
          hasDuplicate = true;
          duplicateMsg = `Team Member ${i} has the same name as Lead Delegate (${leadName}).`;
          setFieldDuplicateState(nameInput, nameWarn, '⚠️ Cannot be the same as Lead Delegate (Member 1)');
        } else {
          for (let j = 2; j < i; j++) {
            const otherName = normName(document.getElementById(`tmName_${j}`)?.value || '');
            if (otherName.length >= 3 && cleanTmName === otherName) {
              hasDuplicate = true;
              duplicateMsg = `Team Member ${i} has the same name as Team Member ${j}.`;
              setFieldDuplicateState(nameInput, nameWarn, `⚠️ Name is already entered for Team Member ${j}`);
              break;
            }
          }
        }
      }

      // Check Phone Duplicate
      if (tmPhone) {
        if (leadPhone && tmPhone === leadPhone) {
          hasDuplicate = true;
          duplicateMsg = `Mobile number +91 ${tmPhone} is already used for Lead Delegate.`;
          setFieldDuplicateState(phoneInput, phoneWarn, '⚠️ Mobile number cannot be the same as Lead Delegate');
        } else {
          for (let j = 2; j < i; j++) {
            const otherPhone = normalizePhone(document.getElementById(`tmPhone_${j}`)?.value || '') || '';
            if (otherPhone && tmPhone === otherPhone) {
              hasDuplicate = true;
              duplicateMsg = `Mobile number +91 ${tmPhone} is already used for Team Member ${j}.`;
              setFieldDuplicateState(phoneInput, phoneWarn, `⚠️ Mobile number is already entered for Team Member ${j}`);
              break;
            }
          }
        }
      }

      // Check Email Duplicate
      if (tmEmail && isValidEmail(tmEmail)) {
        if (leadEmail && tmEmail === leadEmail) {
          hasDuplicate = true;
          duplicateMsg = `Email ${tmEmail} is already used for Lead Delegate.`;
          setFieldDuplicateState(emailInput, emailWarn, '⚠️ Email cannot be the same as Lead Delegate');
        } else {
          for (let j = 2; j < i; j++) {
            const otherEmail = (document.getElementById(`tmEmail_${j}`)?.value || '').trim().toLowerCase();
            if (otherEmail && tmEmail === otherEmail) {
              hasDuplicate = true;
              duplicateMsg = `Email ${tmEmail} is already used for Team Member ${j}.`;
              setFieldDuplicateState(emailInput, emailWarn, `⚠️ Email is already entered for Team Member ${j}`);
              break;
            }
          }
        }
      }
    }

    if (hasDuplicate && showAlertOnBlur) {
      showToast(duplicateMsg || 'Duplicate team member details detected. Each participant must have unique information.');
    }
    return !hasDuplicate;
  }

  function renderRegisterEventCards() {
    saveCurrentTeammateInputs();

    const buildCard = (ev) => {
      const isSelected = selectedEventId === ev.id;
      const isTeam = ev.maxTeam > 1;
      return `
        <div data-select-reg-event="${ev.id}" class="event-check-card ${isSelected ? 'is-selected' : ''}" role="radio" aria-checked="${isSelected}" tabindex="0">
          <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
               style="border: 2px solid ${isSelected ? 'var(--gold-primary)' : 'rgba(255,255,255,0.3)'}; background: ${isSelected ? 'var(--gold-primary)' : 'transparent'};">
            ${isSelected ? '<div class="w-2 h-2 rounded-full" style="background: #090A0F;"></div>' : ''}
          </div>
          <div class="flex-grow min-w-0 flex items-center justify-between gap-2.5">
            <div class="min-w-0 pr-1">
              <div class="font-bold text-sm text-slate-100 leading-snug">${ev.title}</div>
              <div class="text-[11px] mt-0.5" style="color: var(--text-muted);">${ev.format}</div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-xs sm:text-sm font-bold text-amber-400 whitespace-nowrap">
                ₹${ev.fee}${isTeam ? '<span class="text-[10px] sm:text-[11px] font-normal text-slate-300"> / person</span>' : ''}
              </div>
              ${isTeam ? `<div class="text-[10px] text-slate-400 font-medium whitespace-nowrap mt-0.5">(₹${ev.fee * ev.maxTeam} / team)</div>` : ''}
            </div>
          </div>
        </div>
      `;
    };

    regMgmtContainer.innerHTML = EVENTS_DATA.filter((e) => e.category === 'Management').map(buildCard).join('');
    regNonMgmtContainer.innerHTML = EVENTS_DATA.filter((e) => e.category === 'Non-Management').map(buildCard).join('');

    const chosen = EVENTS_DATA.find((e) => e.id === selectedEventId);
    if (chosen) {
      selectedEventsCountBadge.textContent = '1 Selected: ' + chosen.title;
    } else {
      selectedEventsCountBadge.textContent = 'No Event Selected';
    }

    const container = document.getElementById('teamMembersInputsContainer');

    if (!chosen || chosen.maxTeam <= 1) {
      teamMembersDynamicSection.classList.add('is-hidden');
      if (container) container.innerHTML = '';
    } else {
      teamMembersDynamicSection.classList.remove('is-hidden');
      const needed = chosen.maxTeam - 1;
      if (teamRosterCountPill) teamRosterCountPill.textContent = `${chosen.maxTeam} Members Total`;
      teamSizeHintText.textContent = `${chosen.title} requires a contingent team of exactly ${chosen.maxTeam} members representing the same institution. Lead Delegate is Member 1. Complete verified details for the remaining ${needed} teammate${needed > 1 ? 's' : ''}:`;

      let cardsHtml = '';
      for (let i = 2; i <= chosen.maxTeam; i++) {
        const cached = teammateCache[i] || {};
        cardsHtml += `
          <div class="teammate-card">
            <div class="teammate-card-header">
              <div class="flex items-center gap-3">
                <span class="teammate-num-badge">0${i}</span>
                <span class="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100">Team Member ${i}</span>
              </div>
              <span class="teammate-inst-badge">Same Institution</span>
            </div>
            <div class="teammate-grid">
              <div>
                <label for="tmName_${i}">Full Name *</label>
                <input type="text" id="tmName_${i}" name="tm_name_${i}" autocomplete="off" data-lpignore="true" data-1p-ignore="true" class="input-field text-sm" placeholder="Member ${i} Name" value="${cached.name || ''}" required />
                <div id="tmNameWarn_${i}" class="roster-field-warn is-hidden"></div>
              </div>
              <div>
                <label for="tmPhone_${i}">Phone / WhatsApp *</label>
                <input type="tel" id="tmPhone_${i}" name="tm_phone_${i}" autocomplete="off" data-lpignore="true" data-1p-ignore="true" class="input-field text-sm" placeholder="+91 98765 43210" value="${cached.phone || ''}" required />
                <div id="tmPhoneWarn_${i}" class="roster-field-warn is-hidden"></div>
              </div>
              <div>
                <label for="tmEmail_${i}">Email Address *</label>
                <input type="email" id="tmEmail_${i}" name="tm_email_${i}" autocomplete="off" data-lpignore="true" data-1p-ignore="true" class="input-field text-sm" placeholder="member${i}@gmail.com" value="${cached.email || ''}" required />
                <div id="tmEmailWarn_${i}" class="roster-field-warn is-hidden"></div>
              </div>
              <div>
                <label for="tmProgram_${i}">Department / Program *</label>
                <select id="tmProgram_${i}" class="input-field text-sm tm-prog-select" data-member="${i}" required>
                  <option value="" disabled ${!cached.program ? 'selected' : ''}>Select Department / Program</option>
                  <option value="MBA" ${cached.program === 'MBA' ? 'selected' : ''}>MBA</option>
                  <option value="M.Com" ${cached.program === 'M.Com' ? 'selected' : ''}>M.Com</option>
                  <option value="BBA" ${cached.program === 'BBA' ? 'selected' : ''}>BBA</option>
                  <option value="B.Com" ${cached.program === 'B.Com' ? 'selected' : ''}>B.Com</option>
                  <option value="BCA" ${cached.program === 'BCA' ? 'selected' : ''}>BCA</option>
                  <option value="MCA" ${cached.program === 'MCA' ? 'selected' : ''}>MCA</option>
                  <option value="B.Tech / B.E" ${cached.program === 'B.Tech / B.E' ? 'selected' : ''}>B.Tech / B.E</option>
                  <option value="B.Sc" ${cached.program === 'B.Sc' ? 'selected' : ''}>B.Sc</option>
                  <option value="M.Sc" ${cached.program === 'M.Sc' ? 'selected' : ''}>M.Sc</option>
                  <option value="BA" ${cached.program === 'BA' ? 'selected' : ''}>BA</option>
                  <option value="MA" ${cached.program === 'MA' ? 'selected' : ''}>MA</option>
                  <option value="Other" ${cached.program === 'Other' ? 'selected' : ''}>Other (Specify)</option>
                </select>
                <div id="tmProgramOtherWrap_${i}" class="${cached.program === 'Other' ? '' : 'is-hidden'} mt-2.5">
                  <label for="tmProgramOther_${i}">Specify Department / Program *</label>
                  <input type="text" id="tmProgramOther_${i}" name="tm_program_other_${i}" class="input-field text-sm" placeholder="e.g., B.Voc Banking, Integrated M.Sc" value="${cached.programOther || ''}" autocomplete="off" />
                </div>
              </div>
              <div>
                <label for="tmYear_${i}">Year of Study *</label>
                <select id="tmYear_${i}" class="input-field text-sm" required>
                  <option value="" disabled ${!cached.year ? 'selected' : ''}>Select Year of Study</option>
                  <option value="1st Year" ${cached.year === '1st Year' ? 'selected' : ''}>1st Year</option>
                  <option value="2nd Year" ${cached.year === '2nd Year' ? 'selected' : ''}>2nd Year</option>
                  <option value="3rd Year" ${cached.year === '3rd Year' ? 'selected' : ''}>3rd Year</option>
                  <option value="4th Year / Final" ${cached.year === '4th Year / Final' ? 'selected' : ''}>4th Year / Final</option>
                </select>
              </div>
              <div>
                <label for="tmDiet_${i}">Dietary Preference *</label>
                <select id="tmDiet_${i}" class="input-field text-sm" required>
                  <option value="" disabled ${!cached.diet ? 'selected' : ''}>Select Dietary Preference</option>
                  <option value="Non-Veg" ${cached.diet === 'Non-Veg' ? 'selected' : ''}>Non-Vegetarian</option>
                  <option value="Veg" ${cached.diet === 'Veg' ? 'selected' : ''}>Pure Vegetarian</option>
                </select>
              </div>
            </div>
          </div>
        `;
      }
      if (container) {
        container.innerHTML = cardsHtml;
        checkRosterDuplicates(false);
      }
    }
  }

  renderRegisterEventCards();

  function selectRegisterEvent(eventId) {
    selectedEventId = eventId;
    renderRegisterEventCards();
  }

  function preselectEventAndNavigate(eventId) {
    selectedEventId = eventId;
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

    const selectCard = e.target.closest('[data-select-reg-event]');
    if (selectCard) {
      selectRegisterEvent(selectCard.getAttribute('data-select-reg-event'));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    const card = e.target.closest && e.target.closest('[data-select-reg-event]');
    if (!card || e.target !== card) return;
    e.preventDefault();
    const id = card.getAttribute('data-select-reg-event');
    selectRegisterEvent(id);
    const again = document.querySelector('[data-select-reg-event="' + id + '"]');
    if (again) again.focus();
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
    if (!program) {
      document.getElementById('regProgram').focus();
      return showRegError('Please select Department / Program for Lead Delegate.');
    }
    let finalLeadProgram = program;
    if (program === 'Other') {
      const customProg = document.getElementById('regProgramOther') ? document.getElementById('regProgramOther').value.trim() : '';
      if (!customProg) {
        document.getElementById('regProgramOther')?.focus();
        return showRegError('Please specify your Department / Program for Lead Delegate.');
      }
      finalLeadProgram = customProg;
    }
    if (!year) {
      document.getElementById('regYear').focus();
      return showRegError('Please select Year of Study for Lead Delegate.');
    }
    if (!diet) {
      document.getElementById('regDietary').focus();
      return showRegError('Please select Dietary Preference for Lead Delegate.');
    }
    if (!isValidEmail(email)) {
      return showRegError('Please enter a valid email address for Lead Delegate.');
    }
    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      return showRegError('Please enter a valid 10-digit Indian mobile number for Lead Delegate (e.g., 98765 43210).');
    }
    if (!selectedEventId) {
      return showRegError('Please select one event in Step 02 to register.');
    }

    const chosenEvent = EVENTS_DATA.find((ev) => ev.id === selectedEventId);
    if (!chosenEvent) {
      return showRegError('Please select a valid event to register.');
    }

    // Build and validate full contingent roster
    const normName = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLeadName = normName(name);

    const roster = [
      { index: 1, name: name, email: email, phone: phone, program: finalLeadProgram, year: year, diet: diet, isLead: true }
    ];
    const usedNames = new Map();
    usedNames.set(cleanLeadName, 'Lead Delegate (' + name + ')');
    const usedPhones = new Map();
    usedPhones.set(phone, 'Lead Delegate (' + name + ')');
    const usedEmails = new Map();
    usedEmails.set(email.toLowerCase(), 'Lead Delegate (' + name + ')');

    if (chosenEvent.maxTeam > 1) {
      for (let i = 2; i <= chosenEvent.maxTeam; i++) {
        const tmNameEl = document.getElementById(`tmName_${i}`);
        const tmEmailEl = document.getElementById(`tmEmail_${i}`);
        const tmPhoneEl = document.getElementById(`tmPhone_${i}`);
        const tmProgEl = document.getElementById(`tmProgram_${i}`);
        const tmYearEl = document.getElementById(`tmYear_${i}`);
        const tmDietEl = document.getElementById(`tmDiet_${i}`);

        if (!tmNameEl || !tmEmailEl || !tmPhoneEl) {
          return showRegError(`Missing form fields for Team Member ${i}. Please re-select the event.`);
        }
        const tmName = tmNameEl.value.trim();
        const tmEmail = tmEmailEl.value.trim();
        const tmPhoneRaw = tmPhoneEl.value.trim();
        const tmProg = tmProgEl ? tmProgEl.value : '';
        const tmYear = tmYearEl ? tmYearEl.value : '';
        const tmDiet = tmDietEl ? tmDietEl.value : '';

        if (!tmName || !tmEmail || !tmPhoneRaw) {
          return showRegError(`Please complete all required fields for Team Member ${i} (Full Name, Phone, and Email).`);
        }
        if (!isValidEmail(tmEmail)) {
          tmEmailEl.focus();
          return showRegError(`Please enter a valid email address for Team Member ${i} (${tmName || 'Member ' + i}).`);
        }
        const tmPhone = normalizePhone(tmPhoneRaw);
        if (!tmPhone) {
          tmPhoneEl.focus();
          return showRegError(`Please enter a valid 10-digit mobile number for Team Member ${i} (${tmName || 'Member ' + i}).`);
        }
        if (!tmProg) {
          tmProgEl && tmProgEl.focus();
          return showRegError(`Please select Department / Program for Team Member ${i} (${tmName || 'Member ' + i}).`);
        }
        let finalTmProg = tmProg;
        if (tmProg === 'Other') {
          const customTmProg = document.getElementById(`tmProgramOther_${i}`) ? document.getElementById(`tmProgramOther_${i}`).value.trim() : '';
          if (!customTmProg) {
            document.getElementById(`tmProgramOther_${i}`)?.focus();
            return showRegError(`Please specify Department / Program for Team Member ${i} (${tmName || 'Member ' + i}).`);
          }
          finalTmProg = customTmProg;
        }
        if (!tmYear) {
          tmYearEl && tmYearEl.focus();
          return showRegError(`Please select Year of Study for Team Member ${i} (${tmName || 'Member ' + i}).`);
        }
        if (!tmDiet) {
          tmDietEl && tmDietEl.focus();
          return showRegError(`Please select Dietary Preference for Team Member ${i} (${tmName || 'Member ' + i}).`);
        }

        const cleanTmName = normName(tmName);
        if (cleanTmName.length >= 3 && usedNames.has(cleanTmName)) {
          setFieldDuplicateState(tmNameEl, document.getElementById(`tmNameWarn_${i}`), `⚠️ Cannot duplicate name of ${usedNames.get(cleanTmName)}`);
          tmNameEl.focus();
          return showRegError(`Duplicate participant name: Team Member ${i} has the same name as ${usedNames.get(cleanTmName)}. Each member in the contingent must be an individual student representing your institution.`);
        }
        if (usedPhones.has(tmPhone)) {
          setFieldDuplicateState(tmPhoneEl, document.getElementById(`tmPhoneWarn_${i}`), `⚠️ Mobile number already entered for ${usedPhones.get(tmPhone)}`);
          tmPhoneEl.focus();
          return showRegError(`Duplicate mobile number: +91 ${tmPhone} is entered for both ${usedPhones.get(tmPhone)} and Team Member ${i} (${tmName}). Each team member must provide their own unique mobile number.`);
        }
        if (usedEmails.has(tmEmail.toLowerCase())) {
          setFieldDuplicateState(tmEmailEl, document.getElementById(`tmEmailWarn_${i}`), `⚠️ Email already entered for ${usedEmails.get(tmEmail.toLowerCase())}`);
          tmEmailEl.focus();
          return showRegError(`Duplicate email address: ${tmEmail} is entered for both ${usedEmails.get(tmEmail.toLowerCase())} and Team Member ${i} (${tmName}). Each team member must provide their own unique email address.`);
        }

        usedNames.set(cleanTmName, `Team Member ${i} (${tmName})`);
        usedPhones.set(tmPhone, `Team Member ${i} (${tmName})`);
        usedEmails.set(tmEmail.toLowerCase(), `Team Member ${i} (${tmName})`);

        roster.push({
          index: i,
          name: tmName,
          email: tmEmail,
          phone: tmPhone,
          program: finalTmProg,
          year: tmYear,
          diet: tmDiet,
          isLead: false
        });
      }
    }

    const referralEl = document.getElementById('regReferralSource');
    const referralSource = referralEl ? referralEl.value : '';
    const dcmsNameEl = document.getElementById('regDcmsStudentName');
    const dcmsStudentName = dcmsNameEl ? dcmsNameEl.value.trim() : '';
    const dcmsBatchEl = document.getElementById('regDcmsStudentBatch');
    const dcmsStudentBatch = dcmsBatchEl ? dcmsBatchEl.value : '';

    if (!referralSource) {
      return showRegError('Please let us know how you heard about ASCEND \'26 in Step 03.');
    }
    if (referralSource === 'Student from DCMS, University of Calicut' && !dcmsStudentName) {
      return showRegError('Please enter the name of the DCMS student who referred you.');
    }

    const referralSummary = referralSource === 'Student from DCMS, University of Calicut'
      ? `DCMS Referral: ${dcmsStudentName} (${dcmsStudentBatch})`
      : referralSource;

    const combinedNotes = [
      notes ? `Notes: ${notes}` : '',
      `Source: ${referralSummary}`
    ].filter(Boolean).join(' | ');

    const consentEl = document.getElementById('regTermsConsent');
    if (consentEl && !consentEl.checked) {
      return showRegError('Please acknowledge the Festival Guidelines and Partner Terms to proceed.');
    }

    regErrorBanner.classList.add('is-hidden');

    if (!latestRefId) latestRefId = makeRefId();

    const totalFee = chosenEvent.fee * chosenEvent.maxTeam;
    const feeBreakdown = chosenEvent.title + (chosenEvent.maxTeam > 1 ? ' (₹' + chosenEvent.fee + ' × ' + chosenEvent.maxTeam + ' members = ₹' + totalFee + ')' : ' (₹' + totalFee + ')');

    const upiLink =
      'upi://pay?pa=' + SITE_CONFIG.upiId +
      '&pn=' + encodeURIComponent(SITE_CONFIG.payeeName) +
      '&am=' + totalFee + '.00&cu=INR&tn=' + encodeURIComponent('Reg_' + latestRefId);

    renderUpiQr(upiLink);
    document.getElementById('upiRefDisplay').textContent = latestRefId;
    document.getElementById('upiPayNowBtn').setAttribute('href', upiLink);
    document.getElementById('upiIdDisplay').textContent = SITE_CONFIG.upiId;
    document.getElementById('upiAmountDisplay').textContent = '₹' + totalFee;
    const passTotalFeeDisplay = document.getElementById('passTotalFeeDisplay');
    if (passTotalFeeDisplay) passTotalFeeDisplay.textContent = '₹' + totalFee;
    document.getElementById('utrInput').value = '';

    document.getElementById('paymentGatewayBox').classList.remove('is-hidden');
    const finalPassContent = document.getElementById('finalConfirmedPassContent');
    if (finalPassContent) finalPassContent.classList.add('is-hidden');
    setPassStatus('pending');

    document.getElementById('passRefId').textContent = latestRefId;
    const passNameEl = document.getElementById('passName');
    if (passNameEl) passNameEl.textContent = name;
    const passContactEl = document.getElementById('passContact');
    if (passContactEl) passContactEl.textContent = '+91 ' + phone + ' • ' + email;
    const passCollegeEl = document.getElementById('passCollege');
    if (passCollegeEl) passCollegeEl.textContent = college + ' (' + program + ', ' + year + ')';
    const passAccomEl = document.getElementById('passAccom');
    if (passAccomEl) passAccomEl.textContent = accom;
    const passDietEl = document.getElementById('passDiet');

    const vegCount = roster.filter((m) => m.diet === 'Veg').length;
    const nonVegCount = roster.filter((m) => m.diet === 'Non-Veg').length;
    const dietarySummary = roster.length > 1
      ? `${nonVegCount} Non-Veg, ${vegCount} Veg (Lead: ${diet}; ` + roster.slice(1).map((m) => `M${m.index}: ${m.diet}`).join(', ') + ')'
      : diet;
    if (passDietEl) passDietEl.textContent = dietarySummary;

    const passEventsList = document.getElementById('passEventsList');
    if (passEventsList) {
      passEventsList.innerHTML = `<span class="px-2.5 py-1 rounded-full text-xs font-bold"
                     style="background: var(--gold-tint); color: var(--gold-primary); border: 1px solid var(--gold-border);">
                 ${feeBreakdown}
               </span>`;
    }

    const passTeamBlock = document.getElementById('passTeamBlock');
    if (passTeamBlock) {
      if (roster.length > 1) {
        passTeamBlock.classList.remove('is-hidden');
        const passTeamMembers = document.getElementById('passTeamMembers');
        if (passTeamMembers) {
          passTeamMembers.innerHTML = roster
            .slice(1)
            .map(
              (m) =>
                `<div class="py-1 border-b last:border-b-0 flex flex-wrap items-center justify-between gap-1 text-xs" style="border-color: var(--border-subtle);">
                   <span class="font-bold text-slate-200">Member ${m.index}: ${m.name}</span>
                   <span class="text-slate-400 font-mono">+91 ${m.phone} • ${m.diet}</span>
                 </div>`
            )
            .join('');
        }
      } else {
        passTeamBlock.classList.add('is-hidden');
      }
    }

    const teamDetailedSummary = roster.length > 1
      ? roster.slice(1).map((m) => `M${m.index}: ${m.name} (+91 ${m.phone}, ${m.email}, ${m.program} ${m.year}, ${m.diet})`).join('; ')
      : '';

    lastPayload = {
      refId: latestRefId,
      submittedAt: new Date().toISOString(),
      name: sheetSafe(name),
      email: sheetSafe(email),
      phone: phone,
      college: sheetSafe(college),
      program: sheetSafe(program),
      year: sheetSafe(year),
      events: sheetSafe(chosenEvent.title),
      feeBreakdown: sheetSafe(feeBreakdown),
      totalFee: totalFee,
      teamMembers: sheetSafe(teamDetailedSummary),
      accommodation: sheetSafe(accom),
      dietary: sheetSafe(dietarySummary),
      notes: sheetSafe(combinedNotes),
      referralSource: sheetSafe(referralSummary),
      termsAccepted: 'Yes',
      paymentStatus: 'Unpaid',
      utr: ''
    };

    const rosterWaList = roster
      .map((m) => `${m.index}. ${m.name}${m.isLead ? ' (Lead)' : ''} — +91 ${m.phone} (${m.program} ${m.year}, ${m.diet})`)
      .join('\n');

    const waLines = [
      '*ASCEND \'26 — REGISTRATION (PAYMENT SUBMITTED)*',
      'Ref ID: *' + latestRefId + '*',
      'Event: *' + chosenEvent.title + '*',
      'Total Fee: *₹' + totalFee + '*',
      'Institution: *' + college + '*',
      '',
      '*TEAM ROSTER (' + roster.length + ' Member' + (roster.length > 1 ? 's' : '') + '):*',
      rosterWaList,
      '',
      'Accommodation: ' + accom,
      'Dietary Summary: ' + dietarySummary,
      'Source: ' + referralSummary,
      notes ? 'Notes: ' + notes : '',
      'UTR / Txn ID: (see screenshot)'
    ]
      .filter(Boolean)
      .join('\n');
    lastPayload.__wa = waLines;

    const passWaConfirm = document.getElementById('passWhatsappConfirmBtn');
    if (passWaConfirm) {
      passWaConfirm.setAttribute('href', 'https://wa.me/' + SITE_CONFIG.coordinatorWhatsApp + '?text=' + encodeURIComponent(waLines));
    }
    const passWaHelp = document.getElementById('passWhatsappHelpBtn');
    if (passWaHelp) {
      passWaHelp.setAttribute('href', 'https://wa.me/' + SITE_CONFIG.coordinatorWhatsApp + '?text=' + encodeURIComponent('Hello ASCEND Desk, I need help with payment for Ref ID: ' + latestRefId));
    }

    setSyncNotice('ok');
    syncToSheet(sheetPayloadOf(lastPayload));
    rememberRegistration(latestRefId, phone);
    document.getElementById('chkRef').value = latestRefId;
    document.getElementById('chkPhone').value = phone;

    document.getElementById('registrationPassSection').classList.remove('is-hidden');
    document.getElementById('registrationPassSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Registration saved as ' + latestRefId + '. Total Fee: ₹' + totalFee + ' — now complete payment via UPI.');
  });

  const regConsentCheckbox = document.getElementById('regTermsConsent');
  if (regConsentCheckbox) {
    regConsentCheckbox.addEventListener('change', () => {
      if (regConsentCheckbox.checked && regErrorBanner.textContent.includes('Partner Terms')) {
        regErrorBanner.classList.add('is-hidden');
      }
    });
  }

  const referralSelect = document.getElementById('regReferralSource');
  const dcmsCard = document.getElementById('dcmsReferralCard');
  const dcmsNameInput = document.getElementById('regDcmsStudentName');
  if (referralSelect && dcmsCard) {
    referralSelect.addEventListener('change', () => {
      const isDcms = referralSelect.value === 'Student from DCMS, University of Calicut';
      dcmsCard.classList.toggle('is-hidden', !isDcms);
      if (dcmsNameInput) {
        if (isDcms) {
          dcmsNameInput.setAttribute('required', 'required');
          dcmsNameInput.focus();
        } else {
          dcmsNameInput.removeAttribute('required');
          dcmsNameInput.value = '';
        }
      }
      if (regErrorBanner && regErrorBanner.textContent.includes('heard about ASCEND')) {
        regErrorBanner.classList.add('is-hidden');
      }
    });
  }

  // Dynamic "Other (Specify)" reveal for Lead Delegate
  const regProgramEl = document.getElementById('regProgram');
  const regProgramOtherWrap = document.getElementById('regProgramOtherWrap');
  const regProgramOtherInput = document.getElementById('regProgramOther');
  if (regProgramEl && regProgramOtherWrap) {
    regProgramEl.addEventListener('change', () => {
      const isOther = regProgramEl.value === 'Other';
      regProgramOtherWrap.classList.toggle('is-hidden', !isOther);
      if (regProgramOtherInput) {
        if (isOther) {
          regProgramOtherInput.setAttribute('required', 'required');
          regProgramOtherInput.focus();
        } else {
          regProgramOtherInput.removeAttribute('required');
          regProgramOtherInput.value = '';
        }
      }
    });
  }

  // Dynamic "Other (Specify)" reveal for Teammates via delegation
  const tmContainer = document.getElementById('teamMembersInputsContainer');
  if (tmContainer) {
    tmContainer.addEventListener('change', (e) => {
      if (e.target && e.target.classList.contains('tm-prog-select')) {
        const memberIdx = e.target.getAttribute('data-member');
        const otherWrap = document.getElementById(`tmProgramOtherWrap_${memberIdx}`);
        const otherInput = document.getElementById(`tmProgramOther_${memberIdx}`);
        if (otherWrap) {
          const isOther = e.target.value === 'Other';
          otherWrap.classList.toggle('is-hidden', !isOther);
          if (otherInput) {
            if (isOther) {
              otherInput.setAttribute('required', 'required');
              otherInput.focus();
            } else {
              otherInput.removeAttribute('required');
              otherInput.value = '';
            }
          }
        }
      }
    });
  }
  if (dcmsNameInput) {
    dcmsNameInput.addEventListener('input', () => {
      if (regErrorBanner && regErrorBanner.textContent.includes('name of the DCMS student')) {
        regErrorBanner.classList.add('is-hidden');
      }
    });
  }

  const rosterInputsContainer = document.getElementById('teamMembersInputsContainer');
  if (rosterInputsContainer) {
    rosterInputsContainer.addEventListener('input', () => checkRosterDuplicates(false));
    rosterInputsContainer.addEventListener('change', () => checkRosterDuplicates(false));
    rosterInputsContainer.addEventListener('focusout', (e) => {
      if (e.target && e.target.matches && e.target.matches('input')) {
        checkRosterDuplicates(true);
      }
    });
  }

  ['regName', 'regPhone', 'regEmail'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => checkRosterDuplicates(false));
      el.addEventListener('change', () => checkRosterDuplicates(false));
    }
  });

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

  // The user says they paid. This records their submission and directs them to check status.
  const confirmPaymentBtn = document.getElementById('confirmPaymentDoneBtn');
  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', () => {
      const utrEl = document.getElementById('utrInput');
      const utr = utrEl ? utrEl.value.replace(/\s/g, '') : '';
      if (utr && !/^\d{12}$/.test(utr)) {
        showToast('UPI transaction ID (UTR) is a 12-digit number. Leave it blank if you are unsure.');
        if (utrEl) utrEl.focus();
        return;
      }
      if (lastPayload) {
        lastPayload.utr = utr;
        lastPayload.paymentStatus = 'Paid by delegate — pending verification';
        lastPayload.__wa = lastPayload.__wa.replace('UTR / Txn ID: (see screenshot)', utr ? 'UTR / Txn ID: ' + utr : 'UTR / Txn ID: (see screenshot)');
        syncToSheet(sheetPayloadOf(lastPayload));
      }

      // Hide the payment gateway section
      document.getElementById('registrationPassSection').classList.add('is-hidden');

      // Populate status check inputs and persist in localStorage
      const phoneToUse = lastPayload ? lastPayload.phone : '';
      rememberRegistration(latestRefId, phoneToUse);
      document.getElementById('chkRef').value = latestRefId;
      if (phoneToUse) document.getElementById('chkPhone').value = phoneToUse;

      showToast('Payment submitted! Checking your registration status...');

      // Smooth scroll to status check section so they see their pass & pending verification
      document.getElementById('statusCheckSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Run status check (auto-resolves from lastPayload if sheet write is in flight)
      checkStatus(latestRefId, phoneToUse, false);
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

  function fallbackStatusFromPayload(p) {
    if (!p) return null;
    const isPaid = p.paymentStatus && p.paymentStatus.toLowerCase().includes('paid');
    return {
      found: true,
      state: isPaid ? 'pending' : 'unpaid',
      refId: p.refId,
      name: p.name,
      phone: p.phone,
      college: p.college,
      program: p.program,
      year: p.year,
      events: p.events,
      team: p.teamMembers,
      total: p.totalFee,
      accommodation: p.accommodation
    };
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
    const teamEl = document.getElementById('stTeam');
    if (d.team && d.team.includes(';')) {
      teamEl.innerHTML = d.team
        .split(';')
        .map((part) => `<div class="py-0.5">• ${part.trim()}</div>`)
        .join('');
    } else {
      teamEl.textContent = d.team || '';
    }
    document.getElementById('stTeamWrap').classList.toggle('is-hidden', !d.team);
    document.getElementById('stFee').textContent = '₹' + d.total;
    document.getElementById('stAccom').textContent = d.accommodation;
    document.getElementById('stPrintBtn').classList.toggle('is-hidden', d.state !== 'confirmed');

    const help = document.getElementById('stHelpBtn');
    if (help) {
      if (d.state === 'rejected') {
        help.textContent = 'Contact the desk on WhatsApp ↗';
        help.className = 'btn-outline px-5 py-2.5 text-xs sm:text-sm';
        help.classList.remove('is-hidden');
        help.setAttribute('href', 'https://wa.me/' + SITE_CONFIG.coordinatorWhatsApp + '?text=' + encodeURIComponent('Hello, my payment could not be verified. Ref ID: ' + d.refId));
      } else if (d.state === 'pending') {
        help.textContent = 'Send Payment Screenshot on WhatsApp ↗';
        help.className = 'btn-gold px-5 py-2.5 text-xs sm:text-sm inline-flex items-center gap-1.5 font-bold';
        help.classList.remove('is-hidden');
        const waMsg = (lastPayload && lastPayload.__wa)
          ? lastPayload.__wa
          : 'Hello ASCEND Desk, I have completed the registration payment for Ref ID: *' + d.refId + '*. Here is my payment screenshot.';
        help.setAttribute('href', 'https://wa.me/' + SITE_CONFIG.coordinatorWhatsApp + '?text=' + encodeURIComponent(waMsg));
      } else {
        help.classList.add('is-hidden');
      }
    }

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
        if (lastPayload && lastPayload.refId === ref) {
          chkNotice('');
          renderStatus(fallbackStatusFromPayload(lastPayload));
          rememberRegistration(ref, phone);
          return;
        }
        if (!silent) chkNotice('Unable to reach the server right now. Please check your connection and try again in a moment.', 'bad');
        return;
      }
      let d;
      try {
        d = await res.json();
      } catch (parseErr) {
        console.error('Status check parse error:', parseErr);
        if (lastPayload && lastPayload.refId === ref) {
          chkNotice('');
          renderStatus(fallbackStatusFromPayload(lastPayload));
          rememberRegistration(ref, phone);
          return;
        }
        if (!silent) chkNotice('Unable to retrieve pass details. Please try again in a moment.', 'bad');
        return;
      }
      if (d && d.found) {
        chkNotice('');
        renderStatus(d);
        rememberRegistration(ref, phone);
      } else if (lastPayload && lastPayload.refId === ref) {
        chkNotice('');
        renderStatus(fallbackStatusFromPayload(lastPayload));
        rememberRegistration(ref, phone);
      } else if (!silent) {
        document.getElementById('statusResult').classList.add('is-hidden');
        chkNotice('No registration found for that Reference ID and mobile number. Please check both details.', 'bad');
      }
    } catch (err) {
      console.error('Status check network error:', err);
      if (lastPayload && lastPayload.refId === ref) {
        chkNotice('');
        renderStatus(fallbackStatusFromPayload(lastPayload));
        rememberRegistration(ref, phone);
        return;
      }
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

  const printPassBtn = document.getElementById('printPassBtn');
  if (printPassBtn) {
    printPassBtn.addEventListener('click', () => {
      window.print();
    });
  }

  const copyRefBtn = document.getElementById('copyRefBtn');
  if (copyRefBtn) {
    copyRefBtn.addEventListener('click', () => {
      const refId = document.getElementById('passRefId').textContent.trim();
      if (refId) copyTextSafe(refId);
    });
  }

  const stCopyRefBtn = document.getElementById('stCopyRefBtn');
  if (stCopyRefBtn) {
    stCopyRefBtn.addEventListener('click', () => {
      const refId = document.getElementById('stRef').textContent.trim();
      if (refId) copyTextSafe(refId);
    });
  }

  const editRegBtn = document.getElementById('editRegistrationBtn');
  if (editRegBtn) {
    editRegBtn.addEventListener('click', () => {
      document.getElementById('registrationPassSection').classList.add('is-hidden');
      document.getElementById('delegateRegForm').scrollIntoView({ behavior: 'smooth' });
    });
  }

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
              <div class="surface-card surface-card-hover p-5 flex items-start gap-3.5">
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

    const openModalTrigger = e.target.closest('[data-open-modal]');
    if (openModalTrigger) {
      const modalId = openModalTrigger.getAttribute('data-open-modal');
      const targetModal = document.getElementById(modalId);
      if (targetModal) {
        document.querySelectorAll('.modal-backdrop.is-open').forEach((m) => m.classList.remove('is-open'));
        targetModal.classList.add('is-open');
      }
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