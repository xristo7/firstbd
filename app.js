/**
 * Nuahn's 1st Birthday Ecard - Interactive Script
 * Features: Background sparkles, confetti particles, Web Audio API sound generator,
 * guestbook form validation, and localStorage persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let isMuted = true;
  let audioCtx = null;
  let wishes = [];
  let guestName = '';
  let guestRelationship = '';
  let pendingWishText = '';

  // --- DOM ELEMENTS ---
  const introScreen = document.getElementById('introScreen');
  const mainContent = document.getElementById('mainContent');
  const introForm = document.getElementById('introForm');
  const introNameInput = document.getElementById('introName');
  const introTitleSelect = document.getElementById('introTitle');
  const introCustomTitleInput = document.getElementById('introCustomTitle');
  const openBtn = document.getElementById('openBtn');
  const skipIntroBtn = document.getElementById('skipIntroBtn');
  const mobileWishesCountBadge = document.getElementById('mobileWishesCountBadge');
  const splitLayout = document.querySelector('.split-layout');
  const muteBtn = document.getElementById('muteBtn');
  
  const canvasBg = document.getElementById('canvasBg');
  const confettiCanvas = document.getElementById('confettiCanvas');

  const wishForm = document.getElementById('wishForm');
  const guestWishTextarea = document.getElementById('guestWish');
  
  const emailPromptModal = document.getElementById('emailPromptModal');
  const emailModalOverlay = document.getElementById('emailModalOverlay');
  const emailModalCloseBtn = document.getElementById('emailModalCloseBtn');
  const emailSubmitForm = document.getElementById('emailSubmitForm');
  const promptNameGroup = document.getElementById('promptNameGroup');
  const promptNameInput = document.getElementById('promptName');
  const promptEmailInput = document.getElementById('promptEmail');
  const rsvpNameInput = document.getElementById('rsvpName');
  
  const wishesList = document.getElementById('wishesList');
  const noWishesMessage = document.getElementById('noWishesMessage');
  const wishCountSpan = document.getElementById('wishCount');

  // --- CANVAS SETUP ---
  const ctxBg = canvasBg.getContext('2d');
  const ctxConfetti = confettiCanvas.getContext('2d');

  const graphicWrapper = document.querySelector('.graphic-wrapper');

  function resizeCanvases() {
    canvasBg.width = window.innerWidth;
    canvasBg.height = window.innerHeight;
    
    if (graphicWrapper && graphicWrapper.clientWidth > 0) {
      confettiCanvas.width = graphicWrapper.clientWidth;
      confettiCanvas.height = graphicWrapper.clientHeight;
    } else {
      confettiCanvas.width = 400;
      confettiCanvas.height = 533;
    }
  }
  resizeCanvases();
  window.addEventListener('resize', resizeCanvases);

  // --- BACKGROUND SPARKLES (Magical Twinkling Stars) ---
  const stars = [];
  const maxStars = 45;

  class Star {
    constructor() {
      this.x = Math.random() * canvasBg.width;
      this.y = Math.random() * canvasBg.height;
      this.size = Math.random() * 2 + 1;
      this.alpha = Math.random();
      this.speed = Math.random() * 0.02 + 0.005;
      this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
      // Crimson theme hues: White, Lime Green, Orange, Yellow
      const hues = ['255, 255, 255', '107, 200, 32', '255, 154, 0', '255, 217, 61'];
      this.color = hues[Math.floor(Math.random() * hues.length)];
    }

    draw() {
      ctxBg.save();
      ctxBg.globalAlpha = this.alpha;
      ctxBg.fillStyle = `rgb(${this.color})`;
      
      // Draw a simple star shape
      ctxBg.beginPath();
      ctxBg.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctxBg.fill();
      ctxBg.restore();
    }

    update() {
      this.alpha += this.speed * this.twinkleDir;
      if (this.alpha >= 1) {
        this.alpha = 1;
        this.twinkleDir = -1;
      } else if (this.alpha <= 0.1) {
        this.alpha = 0.1;
        this.twinkleDir = 1;
        // Reposition slightly to keep background dynamic
        this.x = Math.random() * canvasBg.width;
        this.y = Math.random() * canvasBg.height;
      }
      
      // Soft drift upwards
      this.y -= 0.05;
      if (this.y < 0) {
        this.y = canvasBg.height;
        this.x = Math.random() * canvasBg.width;
      }
    }
  }

  // Initialize Stars
  for (let i = 0; i < maxStars; i++) {
    stars.push(new Star());
  }

  // Animation Loop for Stars Background
  function animateBackground() {
    // Clear canvas so the CSS background-image overlay shows through
    ctxBg.clearRect(0, 0, canvasBg.width, canvasBg.height);

    // Update and draw stars
    stars.forEach(star => {
      star.update();
      star.draw();
    });

    requestAnimationFrame(animateBackground);
  }
  animateBackground();

  // --- CONFETTI PARTICLE SYSTEM ---
  const confettiParticles = [];
  let confettiActive = false;

  class Confetti {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 8 + 4;
      this.color = getRandomConfettiColor();
      this.vx = Math.random() * 10 - 5;
      this.vy = Math.random() * -12 - 5; // Launch upwards
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 10 - 5;
      this.gravity = 0.35;
      this.friction = 0.98;
      this.alpha = 1.0;
    }

    draw() {
      ctxConfetti.save();
      ctxConfetti.globalAlpha = this.alpha;
      ctxConfetti.translate(this.x, this.y);
      ctxConfetti.rotate((this.rotation * Math.PI) / 180);
      ctxConfetti.fillStyle = this.color;
      ctxConfetti.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctxConfetti.restore();
    }

    update() {
      this.vy += this.gravity;
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;
      
      // Start fading when falling down
      if (this.vy > 0) {
        this.alpha -= 0.015;
      }
    }
  }

  function getRandomConfettiColor() {
    const colors = [
      '#B51B42', // Cherry Crimson
      '#6BC820', // Lime Green
      '#FF9A00', // Juicy Orange
      '#FFFFFF', // White
      '#FFD9C0'  // Soft Yellow/Peach
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function triggerConfettiBurst(x, y, count = 80) {
    for (let i = 0; i < count; i++) {
      confettiParticles.push(new Confetti(x, y));
    }
    
    if (!confettiActive) {
      confettiActive = true;
      animateConfetti();
    }
  }

  function animateConfetti() {
    ctxConfetti.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.update();
      p.draw();
      
      // Remove dead particles
      if (p.alpha <= 0 || p.y > confettiCanvas.height) {
        confettiParticles.splice(i, 1);
      }
    }

    if (confettiParticles.length > 0) {
      requestAnimationFrame(animateConfetti);
    } else {
      confettiActive = false;
      ctxConfetti.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // --- WEB AUDIO API SOUND ENGINE (Self-Contained Chimes & Music) ---
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playRoyalChime() {
    if (isMuted || !audioCtx) return;

    // Harmonious melody representing royal celebrations: C5, E5, G5, C6 (major arpeggio)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = audioCtx.currentTime;

    notes.forEach((freq, index) => {
      const startTime = now + index * 0.15;
      const duration = 1.2;

      // Oscillator
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      // Soft music box feel: combine sine and triangle wave
      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      // Volume envelope (fast attack, long decay)
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  function playOpenFanfare() {
    if (isMuted || !audioCtx) return;

    const now = audioCtx.currentTime;
    // Elegant arpeggio sequence for opening
    const fanfareNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5

    fanfareNotes.forEach((freq, index) => {
      const startTime = now + index * 0.12;
      const duration = 1.5;

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      // Soft royal brass/harp sound
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  function playEnteringChime() {
    if (isMuted || !audioCtx) return;

    const now = audioCtx.currentTime;
    // Ascending sparkle sound effect for entering
    const notes = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // E4, G4, C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const startTime = now + index * 0.07;
      const duration = 0.9;

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  function playClickSound() {
    if (isMuted || !audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    // Fast pitch decay for crisp select/deselect click sound
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- AUDIO INTERACTION CONTROLS ---
  const volumeXSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-x"><path d="M11 4.702a.702.702 0 0 0-1.203-.496L5.5 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.5l4.297 3.794a.702.702 0 0 0 1.203-.496z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>`;
  const volume2Svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2"><path d="M11 4.702a.702.702 0 0 0-1.203-.496L5.5 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.5l4.297 3.794a.702.702 0 0 0 1.203-.496z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;

  function updateMuteButtonVisual() {
    if (muteBtn) {
      muteBtn.innerHTML = isMuted ? volumeXSvg : volume2Svg;
    }
  }

  muteBtn.addEventListener('click', () => {
    initAudio();
    isMuted = !isMuted;
    updateMuteButtonVisual();
    if (!isMuted) {
      playRoyalChime(); // Play test chime
    }
  });

  // --- INTRO FORM TITLE LOGIC (Other/Custom Title) ---
  if (introTitleSelect) {
    introTitleSelect.addEventListener('change', (e) => {
      const customGroup = document.getElementById('introCustomTitleGroup');
      if (e.target.value === 'custom') {
        if (customGroup) customGroup.classList.remove('hidden');
        introCustomTitleInput.setAttribute('required', 'true');
      } else {
        if (customGroup) customGroup.classList.add('hidden');
        introCustomTitleInput.removeAttribute('required');
        introCustomTitleInput.value = '';
      }
      clearError(introTitleSelect);
    });
  }

  // --- ENVELOPE OPEN FORM SUBMIT LOGIC ---
  if (introForm) {
    introForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isFormValid = true;

      // Validate Name (Required)
      if (!introNameInput.value.trim()) {
        setError(introNameInput);
        isFormValid = false;
      } else {
        clearError(introNameInput);
      }

      // Validate Custom Title if custom selected (Required only if custom chosen)
      if (introTitleSelect.value === 'custom' && !introCustomTitleInput.value.trim()) {
        setError(introCustomTitleInput);
        isFormValid = false;
      } else if (introTitleSelect.value === 'custom') {
        clearError(introCustomTitleInput);
      }

      if (isFormValid) {
        // Capture Guest state values (First name only)
        guestName = introNameInput.value.trim().split(' ')[0];
        if (introTitleSelect.value === 'custom') {
          guestRelationship = introCustomTitleInput.value.trim();
        } else if (introTitleSelect.value) {
          guestRelationship = introTitleSelect.value;
        } else {
          guestRelationship = 'Guest';
        }

        // Enable audio context on interaction
        isMuted = false;
        updateMuteButtonVisual();
        initAudio();

        // Entering chime sequence
        setTimeout(() => {
          playEnteringChime();
        }, 200);

        // Fade out cover, reveal invitation
        introScreen.classList.add('fade-out');
        mainContent.classList.remove('hidden');

        // Resize canvas to ecard dimensions before starting confetti
        resizeCanvases();
        // Trigger confetti celebration on ecard image
        setTimeout(() => {
          triggerConfettiBurst(confettiCanvas.width / 2, confettiCanvas.height * 0.6, 120);
        }, 800);
      }
    });
  }

  // --- SKIP INTRO COVER PAGE PROCESS LOGIC ---
  if (skipIntroBtn) {
    skipIntroBtn.addEventListener('click', () => {
      // Set default guest values
      guestName = 'Royal Guest';
      guestRelationship = 'Guest';

      // Enable audio context on interaction
      isMuted = false;
      updateMuteButtonVisual();
      initAudio();

      // Entering chime sequence
      setTimeout(() => {
        playEnteringChime();
      }, 200);

      // Fade out cover, reveal invitation
      introScreen.classList.add('fade-out');
      mainContent.classList.remove('hidden');

      // Resize canvas to ecard dimensions before starting confetti
      resizeCanvases();
      // Trigger confetti celebration on ecard image
      setTimeout(() => {
        triggerConfettiBurst(confettiCanvas.width / 2, confettiCanvas.height * 0.6, 120);
      }, 800);
    });
  }

  // Clear error styling on input
  [introNameInput, introTitleSelect, introCustomTitleInput, promptNameInput, promptEmailInput, guestWishTextarea, rsvpNameInput].forEach(input => {
    if (input) {
      input.addEventListener('input', () => clearError(input));
      if (input.tagName === 'SELECT') {
        input.addEventListener('change', () => clearError(input));
      }
    }
  });

  // Dynamic reveal of relationship field and "Tap the Royal Seal to open" subprompt
  const relationshipSelectContainer = document.getElementById('relationshipSelectContainer');
  const envelopeSubprompt = document.getElementById('envelopeSubprompt');

  if (introNameInput) {
    const checkIntroNameField = () => {
      const hasValue = introNameInput.value.trim().length >= 2;
      if (hasValue) {
        if (relationshipSelectContainer) relationshipSelectContainer.classList.remove('hidden');
        if (envelopeSubprompt) envelopeSubprompt.classList.remove('hidden');
      } else {
        if (relationshipSelectContainer) relationshipSelectContainer.classList.add('hidden');
        if (envelopeSubprompt) envelopeSubprompt.classList.add('hidden');
      }
    };

    introNameInput.addEventListener('input', checkIntroNameField);
    // Periodically run check to handle browser autocomplete/pre-fills
    setTimeout(checkIntroNameField, 100);
    setTimeout(checkIntroNameField, 500);
    setTimeout(checkIntroNameField, 1000);
  }

  // Auto-expand textarea guestWishTextarea as the user types (hiding scrollbars unless text exceeds limit)
  if (guestWishTextarea) {
    guestWishTextarea.addEventListener('input', function() {
      this.style.height = '40px'; // Reset to base height
      const newHeight = this.scrollHeight;
      this.style.height = Math.min(newHeight, 150) + 'px'; // Grow up to 150px
      if (newHeight > 150) {
        this.style.overflowY = 'auto'; // Show scrollbar if text exceeds max expanded height
      } else {
        this.style.overflowY = 'hidden';
      }
    });
  }

  function clearError(input) {
    const group = input.closest('.form-group, .form-group-compact');
    if (group) {
      group.classList.remove('invalid');
    }
  }

  function setError(input) {
    const group = input.closest('.form-group, .form-group-compact');
    if (group) {
      group.classList.add('invalid');
    }
  }

  // Email format validation helper
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // --- WISHES LIST RENDER & STORAGE (Firebase) ---
  function saveWishToFirebase(wishObj) {
    if (window.db) {
      window.db.ref('wishes').push(wishObj);
    }
  }

  // Real-time listener — keeps wishes array synced from Firebase
  if (window.db) {
    window.db.ref('wishes').on('value', (snapshot) => {
      wishes = [];
      const data = snapshot.val();
      if (data) {
        Object.values(data).forEach(w => wishes.push(w));
      }
      updateWishesDisplay();
    });

    // Real-time RSVP count listener
    window.db.ref('rsvps').on('value', (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.keys(data).length : 0;
      if (rsvpCountBadge) rsvpCountBadge.textContent = count;
    });
  }

  function getTitleString(wishObj) {
    return wishObj.title === 'Normal' ? 'Guest' : wishObj.title;
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  }

  function updateWishesDisplay() {
    if (wishCountSpan) wishCountSpan.textContent = wishes.length;
    if (mobileWishesCountBadge) mobileWishesCountBadge.textContent = wishes.length;
    
    // Clear list
    wishesList.innerHTML = '';
    
    if (wishes.length === 0) {
      wishesList.appendChild(noWishesMessage);
      noWishesMessage.style.display = 'flex';
      return;
    }

    noWishesMessage.style.display = 'none';

    // Render wishes sorted by timestamp descending (newest first)
    const sortedWishes = [...wishes].sort((a, b) => b.timestamp - a.timestamp);

    sortedWishes.forEach(wish => {
      const wishCard = document.createElement('div');
      wishCard.className = 'chat-bubble';
      
      const titleDisplay = getTitleString(wish);

      wishCard.innerHTML = `
        <div class="chat-bubble-header">
          <span class="chat-author">${escapeHTML(wish.name)}</span>
          <span class="chat-relationship">${escapeHTML(titleDisplay)}</span>
        </div>
        <p class="chat-text">${escapeHTML(wish.wish)}</p>
        <span class="chat-time">${formatTime(wish.timestamp)}</span>
      `;
      
      wishesList.appendChild(wishCard);
    });
  }

  // Basic HTML Escaper to prevent XSS
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // --- WISH FORM SUBMIT HANDLER ---
  wishForm.addEventListener('submit', (e) => {
    e.preventDefault();
    initAudio();

    let isFormValid = true;

    // Validate Wish text only
    if (!guestWishTextarea.value.trim()) {
      setError(guestWishTextarea);
      isFormValid = false;
    } else {
      clearError(guestWishTextarea);
    }

    if (isFormValid) {
      // Store pending wish text
      pendingWishText = guestWishTextarea.value.trim();

      // Open Email/Name Verification Modal
      emailPromptModal.classList.add('active');
      emailPromptModal.setAttribute('aria-hidden', 'false');
      
      // Reset form state
      emailSubmitForm.reset();
      clearError(promptEmailInput);
      clearError(promptNameInput);

      // If they skipped intro (name is Royal Guest), show Name field in verification modal
      if (guestName === 'Royal Guest' || !guestName) {
        promptNameGroup.classList.remove('hidden');
        promptNameInput.setAttribute('required', 'true');
      } else {
        promptNameGroup.classList.add('hidden');
        promptNameInput.removeAttribute('required');
      }
    }
  });

  // --- EMAIL PROMPT MODAL CLOSE HANDLERS ---
  function closeEmailModal() {
    emailPromptModal.classList.remove('active');
    emailPromptModal.setAttribute('aria-hidden', 'true');
    pendingWishText = '';
  }

  if (emailModalCloseBtn) emailModalCloseBtn.addEventListener('click', closeEmailModal);
  if (emailModalOverlay) emailModalOverlay.addEventListener('click', closeEmailModal);

  // --- EMAIL SUBMIT HANDLER ---
  if (emailSubmitForm) {
    emailSubmitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      initAudio();

      let isEmailValid = true;

      // Validate prompt name if visible (required only when skipped intro)
      const nameIsRequired = !promptNameGroup.classList.contains('hidden');
      if (nameIsRequired && !promptNameInput.value.trim()) {
        setError(promptNameInput);
        isEmailValid = false;
      } else if (nameIsRequired) {
        clearError(promptNameInput);
        // Save the updated name globally
        guestName = promptNameInput.value.trim().split(' ')[0];
      }

      // Validate prompt email input
      if (!promptEmailInput.value.trim() || !isValidEmail(promptEmailInput.value)) {
        setError(promptEmailInput);
        isEmailValid = false;
      } else {
        clearError(promptEmailInput);
      }

      if (isEmailValid) {
        const newWish = {
          id: Date.now(),
          name: guestName,
          email: promptEmailInput.value.trim(),
          title: guestRelationship,
          wish: pendingWishText,
          timestamp: Date.now()
        };

        // Push to Firebase (real-time listener will update display)
        saveWishToFirebase(newWish);

        // Close verification modal
        closeEmailModal();

        // Confetti burst on the ecard image
        triggerConfettiBurst(confettiCanvas.width / 2, confettiCanvas.height * 0.6, 75);
        const commentsFeed = document.querySelector('.comments-feed');
        if (commentsFeed) {
          commentsFeed.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Play audio chime
        playRoyalChime();

        // Reset text fields
        wishForm.reset();
        if (guestWishTextarea) {
          guestWishTextarea.style.height = '40px';
          guestWishTextarea.style.overflowY = 'hidden';
        }
      }
    });
  }

  // --- RSVP MODAL LOGIC ---
  const rsvpBtn = document.getElementById('rsvpBtn');
  const rsvpModal = document.getElementById('rsvpModal');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const rsvpSubmitForm = document.getElementById('rsvpSubmitForm');
  const rsvpSuccessMsg = document.getElementById('rsvpSuccessMsg');
  const rsvpCardsContainer = document.querySelector('.rsvp-cards-container');
  const rsvpEventCards = document.querySelectorAll('.rsvp-event-card');
  const rsvpCountBadge = document.getElementById('rsvpCountBadge');

  function updateRsvpBadge() {
    // Badge is now updated by Firebase real-time listener
  }

  // Open modal
  if (rsvpBtn) {
    rsvpBtn.addEventListener('click', () => {
      initAudio();
      rsvpModal.classList.add('active');
      rsvpModal.setAttribute('aria-hidden', 'false');
      
      // Reset modal state
      rsvpSubmitForm.classList.remove('hidden');
      rsvpCardsContainer.classList.remove('hidden');
      rsvpSuccessMsg.classList.add('hidden');
      rsvpSubmitForm.reset();

      if (rsvpNameInput) {
        rsvpNameInput.value = guestName && guestName !== 'Royal Guest' ? guestName : '';
      }
      
      // Start with no events selected — guest must choose
      rsvpEventCards.forEach(card => card.classList.remove('selected'));
    });
  }

  // Close modal functions
  function closeModal() {
    rsvpModal.classList.remove('active');
    rsvpModal.setAttribute('aria-hidden', 'true');
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

  // Toggle selection on event card
  rsvpEventCards.forEach(card => {
    // Click selection
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const selectionError = document.getElementById('rsvpSelectionError');
      if (selectionError && document.querySelectorAll('.rsvp-event-card.selected').length > 0) {
        selectionError.classList.add('hidden');
      }
      initAudio();
      playClickSound(); // Play crisp click sound when toggled
    });

    // Keyboard selection (Enter/Space)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // Handle RSVP Submit
  if (rsvpSubmitForm) {
    const confirmRsvpBtn = document.getElementById('confirmRsvpBtn');
    const maybeRsvpBtn = document.getElementById('maybeRsvpBtn');

    function submitRsvp(status) {
      initAudio();

      let isFormValid = true;

      // Validate RSVP Name
      if (rsvpNameInput) {
        if (!rsvpNameInput.value.trim()) {
          setError(rsvpNameInput);
          isFormValid = false;
        } else {
          clearError(rsvpNameInput);
          guestName = rsvpNameInput.value.trim().split(' ')[0]; // Update global state
        }
      }

      // Check if at least one event is selected
      const selectedCards = document.querySelectorAll('.rsvp-event-card.selected');
      const selectionError = document.getElementById('rsvpSelectionError');
      if (selectedCards.length === 0) {
        if (selectionError) selectionError.classList.remove('hidden');
        isFormValid = false;
      } else {
        if (selectionError) selectionError.classList.add('hidden');
      }

      if (isFormValid) {
        const selectedEvents = Array.from(selectedCards).map(card => card.getAttribute('data-event'));
        
        const rsvpData = {
          id: Date.now(),
          name: guestName,
          events: selectedEvents,
          status: status, // "Confirm" or "Most likely"
          timestamp: Date.now()
        };

        // Save RSVP to Firebase
        if (window.db) {
          window.db.ref('rsvps').push(rsvpData);
        }

        // Hide form & list, show success msg
        rsvpSubmitForm.classList.add('hidden');
        rsvpCardsContainer.classList.add('hidden');
        
        // Custom message inside success text
        const successMsgH3 = rsvpSuccessMsg.querySelector('h3');
        if (successMsgH3) {
          successMsgH3.textContent = status === 'Confirm' 
            ? 'RSVP Successfully Confirmed!' 
            : 'RSVP Registered as Most Likely!';
        }
        rsvpSuccessMsg.classList.remove('hidden');

        // Confetti burst on the ecard image
        triggerConfettiBurst(confettiCanvas.width / 2, confettiCanvas.height * 0.6, 80);

        // Sound effect
        playOpenFanfare();

        // Construct WhatsApp Share Text
        const eventNamesStr = selectedEvents.map(ev => ev === 'party' ? 'First Birthday Party 🎈' : 'Celebration BBQ 🍖').join(' and ');
        const statusStr = status === 'Confirm' ? 'Confirming I will be there! ✨' : 'Most likely attending! 🤞';
        const whatsappMsg = `Hi! I'd like to RSVP for Nuahn's 1st Birthday celebrations:
👤 Name: ${guestName}
🎉 Attending: ${eventNamesStr}
📊 Status: ${statusStr}

Looking forward to celebrating! ✨`;
        
        const whatsappUrl = `https://api.whatsapp.com/send?phone=17808609869&text=${encodeURIComponent(whatsappMsg)}`;
        
        // Open WhatsApp redirect in new window with a short delay
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);
      }
    }

    if (confirmRsvpBtn) {
      confirmRsvpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        submitRsvp('Confirm');
      });
    }

    if (maybeRsvpBtn) {
      maybeRsvpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        submitRsvp('Most likely');
      });
    }

    // Default form enter-key fallback
    rsvpSubmitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitRsvp('Confirm');
    });
  }

  // --- MOBILE WISHES DRAWER LOGIC ---
  const mobileWishesBtn = document.getElementById('mobileWishesBtn');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const leftColumn = document.querySelector('.left-column');

  if (mobileWishesBtn && splitLayout) {
    mobileWishesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      splitLayout.classList.toggle('comments-open');
    });
  }

  if (drawerCloseBtn && splitLayout) {
    drawerCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      splitLayout.classList.remove('comments-open');
    });
  }

  // Click outside to close drawer (clicking on left column when drawer is open)
  if (leftColumn && splitLayout) {
    leftColumn.addEventListener('click', (e) => {
      if (splitLayout.classList.contains('comments-open')) {
        // Only close if we didn't click inside the actions row or audio controls
        if (!e.target.closest('.left-actions-row') && !e.target.closest('#muteBtn')) {
          splitLayout.classList.remove('comments-open');
        }
      }
    });
  }

  // --- CUSTOM DROPDOWN SELECT LOGIC ---
  const container = document.getElementById('relationshipSelectContainer');
  const trigger = document.getElementById('relationshipTrigger');
  const hiddenInput = document.getElementById('introTitle');
  const optionsList = document.getElementById('relationshipOptions');
  const triggerText = trigger ? trigger.querySelector('.trigger-text') : null;

  if (container && trigger && hiddenInput && optionsList) {
    // Toggle dropdown open state
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.toggle('open');
    });

    // Handle trigger keydown (Enter / Space for accessibility)
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        container.classList.toggle('open');
      }
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        container.classList.remove('open');
      }
    });

    // Click on option
    const options = optionsList.querySelectorAll('.custom-select-option');
    options.forEach(option => {
      option.addEventListener('click', () => {
        const val = option.getAttribute('data-value');
        const text = option.textContent.replace('✓', '').trim();

        // Update selected option styling
        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // Update hidden input value
        hiddenInput.value = val;
        
        // Update trigger text and placeholder class
        if (val) {
          triggerText.textContent = text;
          trigger.classList.remove('placeholder-active');
        } else {
          triggerText.textContent = 'Select Relationship (Optional)';
          trigger.classList.add('placeholder-active');
        }

        // Trigger change event on hidden input so listener shows custom custom fields
        hiddenInput.dispatchEvent(new Event('change'));

        // Close dropdown
        container.classList.remove('open');
      });
    });
  }

  // --- INITIAL LOAD ---
  updateWishesDisplay();
  updateRsvpBadge();
});
