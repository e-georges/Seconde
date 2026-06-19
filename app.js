// ============================================================
// RévisBrevet 2026 — app.js (Version Autonome Purifiée)
// ============================================================

const S = AppState = {
  data: null,
  progress: {},
  quiz: { chapitreId: null, qs: [], idx: 0, score: 0, matLabel: '' },
  currentScreen: 'home-screen'
};

const $ = id => document.getElementById(id);

// ── UTILS ─────────────────────────────────────────────────────
function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showToast(msg) {
  const ext = document.querySelector('.toast');
  if (ext) ext.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ── LOCAL STORAGE ────────────────────────────────────────────
function loadLS() {
  try {
    const p = localStorage.getItem('rb_progress_2026');
    if (p) S.progress = JSON.parse(p);
    
    const u = localStorage.getItem('rb_username') || "Élève de 3e";
    const av = localStorage.getItem('rb_avatar') || "🦊";
    const st = localStorage.getItem('rb_streak') || "0";
    
    $('display-username').textContent = u;
    $('display-avatar').textContent = av;
    $('display-streak').textContent = st;
    $('input-username').value = u;
    $('select-avatar').value = av;
  } catch(e) { console.error(e); }
}

function saveProgress() {
  localStorage.setItem('rb_progress_2026', JSON.stringify(S.progress));
  refreshBadge();
  refreshRing();
}

// ── RENDU & GRAPHISMES ───────────────────────────────────────
function refreshBadge() {
  let done = 0;
  Object.values(S.progress).forEach(v => { if (v && v.termine) done++; });
  $('display-streak').textContent = done;
}

function refreshRing() {
  if (!S.data || !S.data.matieres) return;
  let totalChaps = 0;
  S.data.matieres.forEach(m => {
    if (m.chapitres) totalChaps += m.chapitres.length;
  });
  
  let done = 0;
  Object.values(S.progress).forEach(v => { if (v && v.termine) done++; });
  
  const pct = totalChaps > 0 ? Math.min(100, Math.round((done / totalChaps) * 100)) : 0;
  $('global-progress-text').textContent = `${pct}%`;
  
  const circle = $('global-progress-circle');
  if (circle) {
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (pct / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }
}

// ── NAVIGATION DES ÉCRANS ────────────────────────────────────
function changeScreen(screenId) {
  const screens = ['home-screen', 'chapitres-screen', 'quiz-screen', 'score-screen', 'settings-screen'];
  screens.forEach(s => {
    const el = $(s);
    if (el) {
      if (s === screenId) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  });
  S.currentScreen = screenId;
  window.scrollTo(0,0);
}

function goHome() { changeScreen('home-screen'); }

function buildNav() {
  const menu = $('sidebar-menu');
  menu.innerHTML = `
    <li onclick="changeScreen('home-screen')">🏠 Tableau de bord</li>
    <li id="nav-btn-culture">🌍 Culture Générale</li>
    <li onclick="changeScreen('settings-screen')">⚙️ Réglages & Profil</li>
  `;
  
  // Correction du bouton Culture Générale (Attachement effectif de l'event listener)
  $('nav-btn-culture').addEventListener('click', () => {
    lancerQuizInifiniCulture();
  });
}

// ── CORRECTION DU COMPTE À REBOURS (DNB 2026 AUTOMATIQUE) ──
function updateCountdown() {
  const dateExam = new Date('2026-06-26T09:00:00');
  const maintenant = new Date();
  const diff = dateExam - maintenant;
  const jours = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  const display = $('countdown-display');
  if (display) {
    if (jours > 0) {
      display.textContent = `⏳ J-${jours} avant le début du Brevet 2026`;
    } else if (jours === 0) {
      display.textContent = `🎓 Jour J ! Début des épreuves ce matin !`;
    } else {
      display.textContent = `🎓 Session 2026 clôturée !`;
    }
  }
}

// ── GESTIONNAIRE DE LA BOTTOM-SHEET INTERACTIVE ─────────────
let sheetStartY = 0;
let sheetCurrentY = 0;

function openCourseSheet(chapitreId) {
  if (!S.data || !S.data.matieres) return;
  
  let targetChap = null;
  S.data.matieres.forEach(m => {
    if (m.chapitres) {
      const c = m.chapitres.find(ch => ch.id === chapitreId);
      if (c) targetChap = c;
    }
  });

  if (!targetChap || !targetChap.fiche) {
    showToast("⚠️ Fiche de cours indisponible pour ce chapitre.");
    return;
  }

  const f = targetChap.fiche;
  const body = $('sheet-course-body');
  
  body.innerHTML = `
    <div class="fiche-container">
      <div class="fiche-header">
        <span class="fiche-icon">${f.icone || '📖'}</span>
        <h2>${f.titre || targetChap.titre}</h2>
      </div>
      <hr class="fiche-divider">
      <div class="fiche-section notion">
        <h3>💡 Notion Fondamentale</h3>
        <p>${f.notion || "Contenu de cours en révision."}</p>
      </div>
      <div class="fiche-section exemple">
        <h3>📝 Exemple & Méthode</h3>
        <div class="fiche-block-code">${f.exemple || "Exemple d'application type Brevet."}</div>
      </div>
      <div class="fiche-section piege">
        <h3>⚠️ Piège à éviter absolument</h3>
        <p>${f.piege || "Attention aux erreurs fréquentes sur ce point !"}</p>
      </div>
    </div>
  `;

  $('course-sheet').classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Bloquer le scroll de fond
}

function closeCourseSheet() {
  $('course-sheet').classList.add('hidden');
  document.body.style.overflow = '';
}

function initSheetEvents() {
  $('sheet-backdrop').addEventListener('click', closeCourseSheet);
  $('sheet-close').addEventListener('click', closeCourseSheet);

  const content = document.querySelector('.sheet-content');

  // Gestes tactiles mobiles : Drag down to close
  content.addEventListener('touchstart', (e) => {
    sheetStartY = e.touches[0].clientY;
  }, { passive: true });

  content.addEventListener('touchmove', (e) => {
    sheetCurrentY = e.touches[0].clientY;
    const deltaY = sheetCurrentY - sheetStartY;
    if (deltaY > 0) {
      content.style.transform = `translateY(${deltaY}px)`;
    }
  }, { passive: true });

  content.addEventListener('touchend', () => {
    const deltaY = sheetCurrentY - sheetStartY;
    if (deltaY > 140) {
      closeCourseSheet();
    }
    content.style.transform = '';
  });

  // Raccourci Fiche depuis le Quiz en cours
  $('quiz-view-sheet').addEventListener('click', () => {
    if (S.quiz.chapitreId) {
      openCourseSheet(S.quiz.chapitreId);
    } else {
      showToast("🌍 Pas de fiche disponible pour le mode Culture Générale.");
    }
  });
}

// ── CHARGEMENT DE L'APPLICATION ACCUEIL ──────────────────────
function renderMatieres() {
  const grid = $('matieres-grid');
  grid.innerHTML = '';
  if (!S.data || !S.data.matieres) return;

  S.data.matieres.forEach(m => {
    const card = document.createElement('div');
    card.className = 'matiere-card';
    card.style.borderLeft = `6px solid ${m.couleur || '#7C3AED'}`;
    
    let total = m.chapitres ? m.chapitres.length : 0;
    let done = 0;
    if (m.chapitres) {
      m.chapitres.forEach(c => {
        if (S.progress[c.id] && S.progress[c.id].termine) done++;
      });
    }

    card.innerHTML = `
      <div class="matiere-header">
        <span class="matiere-emoji">${m.emoji || '📚'}</span>
        <h3>${m.label}</h3>
      </div>
      <p class="matiere-meta">${m.nouveaute_2026 || m.duree_epreuve}</p>
      <div class="matiere-progress-text">${done} / ${total} chapitres révisés</div>
    `;
    card.addEventListener('click', () => openMatiere(m));
    grid.appendChild(card);
  });
}

function openMatiere(m) {
  $('matiere-title').textContent = m.label;
  const list = $('chapitres-list');
  list.innerHTML = '';

  if (m.chapitres) {
    m.chapitres.forEach(c => {
      const row = document.createElement('div');
      row.className = 'chapitre-row';
      const isDone = S.progress[c.id] && S.progress[c.id].termine;
      
      row.innerHTML = `
        <div class="chapitre-info">
          <h4>${c.titre}</h4>
          <span class="chapitre-tag">${c.theme || 'Général'}</span>
          ${isDone ? '<span class="badge-done">✅ Acquis</span>' : ''}
        </div>
        <div class="chapitre-actions">
          <button class="btn-action-quiz" data-id="${c.id}">🎯 Quiz Adaptatif</button>
          <button class="btn-action-fiche" data-id="${c.id}">📖 Fiche de cours</button>
        </div>
      `;

      row.querySelector('.btn-action-quiz').addEventListener('click', (e) => {
        e.stopPropagation();
        lancerQuizChapitre(c.id, c.titre, m.label, c.quiz || []);
      });

      row.querySelector('.btn-action-fiche').addEventListener('click', (e) => {
        e.stopPropagation();
        openCourseSheet(c.id);
      });

      list.appendChild(row);
    });
  }
  changeScreen('chapitres-screen');
}

// ── MOTEUR DE QUIZ COMPLET ───────────────────────────────────
function lancerQuizChapitre(chapitreId, titreChap, matLabel, poolQuestions) {
  S.quiz.chapitreId = chapitreId;
  S.quiz.matLabel = matLabel;
  S.quiz.idx = 0;
  S.quiz.score = 0;

  if (!poolQuestions || poolQuestions.length === 0) {
    showToast("⚠️ Aucun quiz disponible pour ce chapitre.");
    return;
  }

  // Sélection de 5 questions max du pool pour la session
  S.quiz.qs = shuffleArr(poolQuestions).slice(0, 5);
  changeScreen('quiz-screen');
  afficherQuestion();
}

function lancerQuizInifiniCulture() {
  S.quiz.chapitreId = null;
  S.quiz.matLabel = "Culture Générale";
  S.quiz.idx = 0;
  S.quiz.score = 0;

  // Extraction d'une banque globale issue de secours
  S.quiz.qs = shuffleArr(SECOURS);
  changeScreen('quiz-screen');
  afficherQuestion();
}

function lancerExamen() {
  if (!S.data || !S.data.matieres) return;
  let allQ = [];
  S.data.matieres.forEach(m => {
    if (m.chapitres) {
      m.chapitres.forEach(c => {
        if (c.quiz) allQ = allQ.concat(c.quiz);
      });
    }
  });

  if (allQ.length === 0) allQ = SECOURS;
  
  S.quiz.chapitreId = "examen_blanc";
  S.quiz.matLabel = "Examen National Blanc";
  S.quiz.idx = 0;
  S.quiz.score = 0;
  S.quiz.qs = shuffleArr(allQ).slice(0, 10); // 10 questions pour l'examen blanc
  
  changeScreen('quiz-screen');
  afficherQuestion();
}

function afficherQuestion() {
  $('quiz-next').classList.add('hidden');
  $('quiz-feedback-box').classList.add('hidden');

  const q = S.quiz.qs[S.quiz.idx];
  $('quiz-q-index').textContent = `Question ${S.quiz.idx + 1}/${S.quiz.qs.length}`;
  $('quiz-q-type').textContent = q.type_brevet ? q.type_brevet.toUpperCase() : 'BREVET';
  $('quiz-question-text').textContent = q.enonce;

  const box = $('quiz-options-box');
  box.innerHTML = '';

  q.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => validerReponse(index, btn));
    box.appendChild(btn);
  });

  // Calcul barre de progression
  const pct = (S.quiz.idx / S.quiz.qs.length) * 100;
  $('quiz-progress-fill').style.width = `${pct}%`;
}

function validerReponse(idxChoisi, btnClique) {
  const q = S.quiz.qs[S.quiz.idx];
  const btns = document.querySelectorAll('.option-btn');
  
  // Bloquer les clics supplémentaires
  btns.forEach(b => b.disabled = true);

  if (idxChoisi === q.bonne_reponse) {
    btnClique.classList.add('correct');
    S.quiz.score++;
    $('quiz-feedback-text').innerHTML = `🟢 <strong>Excellent !</strong><br>${q.explication || ''}`;
  } else {
    btnClique.classList.add('wrong');
    if (btns[q.bonne_reponse]) btns[q.bonne_reponse].classList.add('correct');
    $('quiz-feedback-text').innerHTML = `🔴 <strong>Mauvaise réponse.</strong><br>${q.explication || ''}`;
  }

  $('quiz-feedback-box').classList.remove('hidden');
  $('quiz-next').classList.remove('hidden');
}

function finSession() {
  $('score-obtained').textContent = S.quiz.score;
  $('score-total').textContent = S.quiz.qs.length;

  const ratio = S.quiz.score / S.quiz.qs.length;
  if (ratio === 1) $('score-comment').textContent = "👑 Parfait ! Tu maîtrises le sujet sur le bout des doigts.";
  else if (ratio >= 0.7) $('score-comment').textContent = "🚀 Très bon score ! Tu es sur la bonne voie pour décrocher une mention.";
  else $('score-comment').textContent = "📚 Encore un peu de révision. Relis bien la fiche de cours associée !";

  // Enregistrer le succès dans la progression
  if (S.quiz.chapitreId && S.quiz.chapitreId !== "examen_blanc" && S.quiz.score >= S.quiz.qs.length * 0.6) {
    S.progress[S.quiz.chapitreId] = { termine: true, date: new Date().toISOString() };
    saveProgress();
  }

  changeScreen('score-screen');
}

function fermerQuiz() {
  if (confirm("Quitter la session en cours ? Ta progression sur cette série sera perdue.")) {
    goHome();
  }
}

// ── INITIALISATION & CHARGEMENT DES DONNÉES ──────────────────
async function loadData() {
  try {
    const res = await fetch('troisieme.json');
    if (res.ok) {
      S.data = await res.json();
    } else {
      throw new Error("Erreur de chargement du JSON principal");
    }
  } catch(e) {
    console.error(e);
    showToast("⚠️ Échec du réseau. Utilisation de la banque locale.");
    // Auto-génération minimale de secours
    S.data = { matieres: [{ id: "maths", label: "Mathématiques", emoji: "📐", chapitres: [] }] };
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  buildNav();
  loadLS();
  await loadData();
  renderMatieres();
  refreshRing();
  updateCountdown();
  initSheetEvents();

  // Événements d'en-tête et actions
  $('quiz-close').addEventListener('click', fermerQuiz);
  
  $('quiz-next').addEventListener('click', () => {
    S.quiz.idx++;
    if (S.quiz.idx < S.quiz.qs.length) afficherQuestion();
    else finSession();
  });

  $('fab-examen').addEventListener('click', lancerExamen);

  $('btn-theme').addEventListener('click', () => {
    document.body.classList.toggle('dark-bg');
    $('btn-theme').textContent = document.body.classList.contains('dark-bg') ? '☀️' : '🌙';
  });

  // Profil Paramètres
  $('btn-save-profile').addEventListener('click', () => {
    const name = $('input-username').value.trim() || "Élève de 3e";
    const av = $('select-avatar').value;
    localStorage.setItem('rb_username', name);
    localStorage.setItem('rb_avatar', av);
    $('display-username').textContent = name;
    $('display-avatar').textContent = av;
    showToast("✅ Profil mis à jour !");
  });

  $('btn-reset-data').addEventListener('click', () => {
    if (confirm("Es-tu sûr de vouloir effacer tout ton historique de révision ? Cette action est irréversible.")) {
      S.progress = {};
      localStorage.removeItem('rb_progress_2026');
      renderMatieres();
      refreshRing();
      refreshBadge();
      goHome();
      showToast("🗑️ Progression réinitialisée.");
    }
  });

  setInterval(updateCountdown, 60000); // Rafraîchir le calcul chaque minute
});