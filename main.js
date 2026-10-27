/**
 * Unicorn's Coworking Space — unicornscoworking.in
 * main.js — All interactive UI controllers
 *
 * Sections:
 *   1. Initialisation (date constraints)
 *   2. Security helpers
 *   3. Navigation (mobile menu)
 *   4. Hero photo switcher
 *   5. Workspace card filter
 *   6. Floor-plan zone selector
 *   7. Pass / savings calculator
 *   8. Booking modal (open / close / tabs)
 *   9. Form validation
 *  10. Secure WhatsApp booking submission
 */

(function () {
  'use strict';

  /* ── 1. Initialisation ────────────────────────────────────────────────────── */
  var todayIso = new Date().toISOString().split('T')[0];
  var dateInput = document.getElementById('modal-user-date');
  if (dateInput) {
    dateInput.min   = todayIso;
    dateInput.value = todayIso;
  }

  /* ── 2. Security Helpers ──────────────────────────────────────────────────── */
  /**
   * Strips dangerous HTML characters to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function sanitizeString(str) {
    if (!str) return '';
    return String(str).replace(/[\r\n<>"'`]/g, '').trim();
  }

  /* ── 3. Mobile Navigation ─────────────────────────────────────────────────── */
  window.toggleMobileMenu = function () {
    var menu      = document.getElementById('mobile-menu');
    var iconOpen  = document.getElementById('menu-icon-open');
    var iconClose = document.getElementById('menu-icon-close');
    if (!menu) return;

    var isHidden = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !isHidden);
    if (iconOpen)  iconOpen.classList.toggle('hidden',  isHidden);
    if (iconClose) iconClose.classList.toggle('hidden', !isHidden);
  };

  /* ── 4. Hero Photo Switcher ───────────────────────────────────────────────── */
  var HERO_PHOTOS = ['13.jpeg', '4.jpeg', '12.jpeg'];

  window.swapHeroPhoto = function (index) {
    var img = document.getElementById('hero-showcase-img');
    if (img && HERO_PHOTOS[index]) img.src = HERO_PHOTOS[index];

    document.querySelectorAll('.hero-thumb-btn').forEach(function (btn, idx) {
      btn.className = (idx === index)
        ? 'hero-thumb-btn px-2.5 py-1 rounded text-[10px] font-semibold bg-brand-royal text-white'
        : 'hero-thumb-btn px-2.5 py-1 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-brand-ice';
    });
  };

  /* ── 5. Workspace Card Filter ─────────────────────────────────────────────── */
  window.filterWorkspaceCards = function (cat) {
    ['all', 'solo', 'team'].forEach(function (t) {
      var tab = document.getElementById('ws-tab-' + t);
      if (!tab) return;
      tab.className = (t === cat)
        ? 'px-4 py-2 rounded-lg text-xs font-bold bg-brand-royal text-white transition'
        : 'px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-brand-navy transition';
    });

    document.querySelectorAll('.ws-card').forEach(function (card) {
      var show = cat === 'all' || card.getAttribute('data-category') === cat;
      card.classList.toggle('hidden', !show);
    });
  };

  /* ── 6. Interactive Floor-Plan Zone Selector ──────────────────────────────── */
  var FLOOR_ZONES = {
    quiet: {
      tag:       'ZONE A // QUIET DEEP-WORK BAY',
      title:     'Quiet Deep-Work Bay (North Wing)',
      desc:      'Engineered specifically for software developers, writers, and remote executives who require library-grade peace and quiet. Every workstation includes universal power sockets, ergonomic lumbar support, and high-speed dual-band fiber.',
      acoustics: 'Low-Noise / Deep Focus',
      bestfor:   'Day Passes & Solo Coders',
      img:       '20.jpeg'
    },
    dedicated: {
      tag:       'ZONE B // DEDICATED MEMBER DESKS',
      title:     'Dedicated Monthly Workstations',
      desc:      'Your own fixed desk accessible 7 days a week (Mon–Sun, 8 AM – 6 PM). Set up your dual monitors and store your hardware safely in personal lockable pedestals.',
      acoustics: 'Balanced Professional Focus',
      bestfor:   'Full-Time Remote Pros & Founders',
      img:       '7.jpeg'
    },
    team: {
      tag:       'ZONE C // STARTUP & TEAM SUITE',
      title:     'Collaborative Startup & Team Bay',
      desc:      'Clustered multi-desk bays designed for 3 to 12 person tech squads, satellite corporate offices, and project teams needing proximity to Technopark and NH66.',
      acoustics: 'Team Sync & Agile Workflow',
      bestfor:   'Startups & 3–12 Member Teams',
      img:       '4.jpeg'
    },
    lounge: {
      tag:       'ZONE D // MEETING & PANTRY HUB',
      title:     'Meeting Room (₹500/hr) & Refreshment Suite',
      desc:      'Host presentations on our high-res screen, conduct client interviews, or hold strategy sessions. High-speed Wi-Fi, air conditioning, and tea/coffee access.',
      acoustics: 'Private / Presentation Ready',
      bestfor:   'Client Meetings & Interviews',
      img:       '25.jpeg'
    }
  };
  var activeFloorZone = 'quiet';

  window.selectFloorZone = function (zoneKey) {
    activeFloorZone = zoneKey;
    var z = FLOOR_ZONES[zoneKey];
    if (!z) return;

    Object.keys(FLOOR_ZONES).forEach(function (k) {
      var btn = document.getElementById('map-zone-' + k);
      if (!btn) return;
      btn.className = (k === zoneKey)
        ? 'text-left p-5 rounded-2xl border-2 border-brand-royal bg-brand-royal text-white transition shadow-lg group'
        : 'text-left p-5 rounded-2xl border-2 border-blue-200 bg-brand-ice/70 text-brand-navy hover:border-brand-royal transition';
    });

    document.getElementById('zone-preview-tag').textContent      = z.tag;
    document.getElementById('zone-preview-title').textContent    = z.title;
    document.getElementById('zone-preview-desc').textContent     = z.desc;
    document.getElementById('zone-preview-acoustics').textContent = z.acoustics;
    document.getElementById('zone-preview-bestfor').textContent  = z.bestfor;
    document.getElementById('zone-preview-img').src              = z.img;
  };

  window.reserveSelectedZone = function () {
    if (activeFloorZone === 'lounge') {
      window.openMeetingRoomModal();
    } else {
      var z = FLOOR_ZONES[activeFloorZone];
      window.openBookingModal(z ? z.title : 'CPS Plaza Workstation');
    }
  };

  /* ── 7. Pass / Savings Calculator ────────────────────────────────────────── */
  var calcMode = 'day';

  window.setCalcPlan = function (mode) {
    calcMode = mode;
    ['day', 'flexi', 'monthly'].forEach(function (m) {
      var btn = document.getElementById('calc-btn-' + m);
      if (!btn) return;
      btn.className = (m === mode)
        ? 'py-3 px-3 rounded-xl text-xs font-bold bg-brand-royal text-white shadow transition'
        : 'py-3 px-3 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:border-brand-royal transition';
    });
    window.updateCalculator();
  };

  window.updateCalculator = function () {
    var slider = document.getElementById('calc-seat-slider');
    var badge  = document.getElementById('calc-seats-badge');
    var title  = document.getElementById('calc-summary-title');
    var sub    = document.getElementById('calc-summary-sub');
    if (!slider || !badge || !title || !sub) return;

    var seats = parseInt(slider.value, 10) || 1;
    var seatLabel = seats === 1 ? ' Seat' : ' Seats';
    badge.textContent = seats === 1 ? '1 Seat (Solo)' : seats + ' Seats (Team)';

    var plans = {
      day:     { label: 'Single-Day Hot Desk Pass',       sub: 'Full Access (8:00 AM – 6:00 PM) • Dual-ISP Fiber + Free CPS Plaza Parking' },
      flexi:   { label: '10-Day Flexible Pass Bundle',    sub: 'Ideal for Hybrid Technopark Engineers • Zero Deposit + Parking Included' },
      monthly: { label: 'Dedicated Monthly Workstation',  sub: 'Reserved 7-Day Access (Mon–Sun) + Lockable Storage + Team Discount' }
    };

    var p = plans[calcMode];
    title.textContent = p.label + ' × ' + seats + seatLabel;
    sub.textContent   = p.sub;
  };

  window.bookConfiguredPlan = function () {
    var title = document.getElementById('calc-summary-title');
    window.openBookingModal(title ? title.textContent : 'Custom Workspace Plan');
  };

  window.triggerHeroBooking = function () {
    var planEl = document.getElementById('hero-plan-select');
    var sizeEl = document.getElementById('hero-size-select');
    var plan = sanitizeString(planEl ? planEl.value : '');
    var size = sanitizeString(sizeEl ? sizeEl.value : '');
    if (plan.indexOf('Meeting Room') !== -1) {
      window.openMeetingRoomModal();
    } else {
      window.openBookingModal((plan || 'Hot Desk') + ' — ' + (size || '1 Seat'));
    }
  };

  /* ── 8. Booking Modal ─────────────────────────────────────────────────────── */
  var activeModalTab  = 'meeting';
  var activeModalPlan = 'Meeting Room by the Hour (₹500/hr)';
  var isSubmitting    = false;

  window.setModalTab = function (tab) {
    activeModalTab = tab;
    var isMeeting   = tab === 'meeting';
    var btnMeeting  = document.getElementById('tab-btn-meeting');
    var btnDesk     = document.getElementById('tab-btn-desk');
    var meetingFlds = document.getElementById('meeting-fields');
    var deskFlds    = document.getElementById('desk-fields');
    var labelEl     = document.getElementById('modal-plan-label');

    var activeClass  = 'py-2 px-3 rounded-lg font-bold transition shadow-sm ';
    var inactiveClass = 'py-2 px-3 rounded-lg transition font-medium text-slate-600 hover:text-slate-900';

    if (btnMeeting) btnMeeting.className = activeClass + (isMeeting  ? 'bg-red-600 text-white'      : inactiveClass);
    if (btnDesk)    btnDesk.className    = activeClass + (!isMeeting ? 'bg-brand-royal text-white'  : inactiveClass);
    if (meetingFlds) meetingFlds.classList.toggle('hidden',  !isMeeting);
    if (deskFlds)    deskFlds.classList.toggle('hidden',  isMeeting);

    if (isMeeting) {
      activeModalPlan = 'Meeting Room by the Hour (₹500/hr)';
      if (labelEl) labelEl.textContent = 'Selected: Meeting Room (₹500/hr)';
      window.updateModalMeetingCalculation();
    } else {
      var planEl = document.getElementById('modal-desk-plan');
      activeModalPlan = planEl ? planEl.value : 'Single-Day Pass';
      if (labelEl) labelEl.textContent = 'Selected: ' + activeModalPlan;
    }
  };

  window.updateModalMeetingCalculation = function () {
    var durEl = document.getElementById('modal-duration-select');
    var durVal = parseInt(durEl ? durEl.value : '1', 10);
    var dur = (isNaN(durVal) || durVal < 1 || durVal > 12) ? 1 : durVal;
    var pill = document.getElementById('modal-calc-total-pill');
    if (pill) {
      pill.textContent = 'Total: ₹' + (dur * 500).toLocaleString('en-IN') +
        ' (' + dur + (dur === 1 ? ' Hour)' : ' Hours)');
    }
  };

  window.openMeetingRoomModal = function () {
    window.openBookingModal('Meeting Room by the Hour (₹500/hr)');
    window.setModalTab('meeting');
  };

  window.openBookingModal = function (planLabel) {
    activeModalPlan = planLabel || 'Workspace Enquiry';
    var labelEl = document.getElementById('modal-plan-label');
    var modal   = document.getElementById('booking-modal');
    if (labelEl) labelEl.textContent = 'Selected: ' + activeModalPlan;
    if (modal)   modal.style.display = 'flex';

    if (activeModalPlan.indexOf('Meeting Room') !== -1) {
      window.setModalTab('meeting');
    } else {
      window.setModalTab('desk');
      var planSelect = document.getElementById('modal-desk-plan');
      if (planSelect) {
        for (var i = 0; i < planSelect.options.length; i++) {
          if (activeModalPlan.indexOf(planSelect.options[i].value) !== -1) {
            planSelect.selectedIndex = i;
            break;
          }
        }
      }
    }
  };

  window.closeBookingModal = function () {
    var modal = document.getElementById('booking-modal');
    if (modal) modal.style.display = 'none';
  };

  /* ── 9. Real-time Field Validation ───────────────────────────────────────── */
  var VALIDATORS = {
    name:  { regex: /^[A-Za-z\s.'\-]{2,50}$/, errId: 'err-name',  inputId: 'modal-user-name'  },
    phone: { regex: /^[6-9]\d{9}$/,            errId: 'err-phone', inputId: 'modal-user-phone' }
  };

  window.validateField = function (field) {
    if (field === 'date') {
      var dateVal = (document.getElementById('modal-user-date') || {}).value || '';
      var errDate = document.getElementById('err-date');
      var valid   = Boolean(dateVal && /^\d{4}-\d{2}-\d{2}$/.test(dateVal) && dateVal >= todayIso);
      if (errDate) errDate.classList.toggle('hidden', valid);
      return valid;
    }

    var v = VALIDATORS[field];
    if (!v) return true;
    var input = document.getElementById(v.inputId);
    var errEl = document.getElementById(v.errId);
    if (!input) return true;
    var val   = input.value.trim();
    var valid = v.regex.test(val);
    if (errEl) errEl.classList.toggle('hidden', valid || val.length === 0);
    return valid;
  };

  /* ── 10. Secure WhatsApp Booking Submission ───────────────────────────────── */
  window.handleSecureBookingSubmit = function (e) {
    if (e && e.preventDefault) e.preventDefault();

    // Security Check 1: Honeypot anti-bot field
    var honeypot = document.getElementById('company_trap_code');
    if (honeypot && honeypot.value.trim().length > 0) {
      console.warn('[Unicorn] Bot submission blocked via honeypot.');
      window.closeBookingModal();
      return false;
    }

    // Security Check 2: Debounce / rate-limit
    if (isSubmitting) return false;

    // Security Check 3: Validate all fields
    var nameOk  = window.validateField('name');
    var phoneOk = window.validateField('phone');
    var dateOk  = window.validateField('date');
    if (!nameOk || !phoneOk || !dateOk) return false;

    // Security Check 4: Sanitize
    var name  = sanitizeString(document.getElementById('modal-user-name').value);
    var phone = sanitizeString(document.getElementById('modal-user-phone').value);
    var date  = sanitizeString(document.getElementById('modal-user-date').value);
    var slot  = sanitizeString(document.getElementById('modal-user-slot').value);

    var message = '';
    if (activeModalTab === 'meeting') {
      var durVal  = parseInt(document.getElementById('modal-duration-select').value, 10);
      var dur     = (isNaN(durVal) || durVal < 1 || durVal > 12) ? 1 : durVal;
      var total   = dur * 500;
      var purpose = sanitizeString(document.getElementById('modal-meeting-purpose').value);
      message =
        "Hi Unicorn's Coworking Space (CPS Plaza, Venpalavattom),\n\n" +
        "I would like to book the MEETING ROOM BY THE HOUR:\n" +
        "• Purpose: "  + purpose + "\n" +
        "• Date: "     + date    + "\n" +
        "• Start Time: " + slot  + "\n" +
        "• Duration: " + dur + (dur === 1 ? " Hour" : " Hours") + "\n" +
        "• Tariff: ₹500/hr (Estimated: ₹" + total.toLocaleString('en-IN') + ")\n" +
        "• Name: "     + name  + "\n" +
        "• Mobile: +91 " + phone + "\n\n" +
        "Please confirm room availability.";
    } else {
      var deskPlan = sanitizeString(document.getElementById('modal-desk-plan').value);
      var seats    = sanitizeString(document.getElementById('modal-user-seats').value);
      message =
        "Hi Unicorn's Coworking Space (CPS Plaza, Venpalavattom),\n\n" +
        "I would like to book / enquire about Coworking Seats:\n" +
        "• Plan: "   + deskPlan + "\n" +
        "• Seats: "  + seats    + "\n" +
        "• Date: "   + date     + "\n" +
        "• Preferred Time: " + slot + "\n" +
        "• Name: "   + name   + "\n" +
        "• Mobile: +91 " + phone + "\n\n" +
        "Please share availability and tariff confirmation.";
    }

    // Lock button to prevent double-submit
    isSubmitting = true;
    var submitBtn = document.getElementById('modal-submit-btn');
    var btnText   = document.getElementById('submit-btn-text');
    if (submitBtn) submitBtn.disabled = true;
    if (btnText)   btnText.textContent = 'Connecting to Desk Manager...';

    // Open WhatsApp safely
    var waUrl = 'https://wa.me/916282057362?text=' + encodeURIComponent(message);
    setTimeout(function () {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      window.closeBookingModal();
      isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
      if (btnText)   btnText.textContent = 'Send Booking via WhatsApp →';
    }, 500);

    return false;
  };

})();
