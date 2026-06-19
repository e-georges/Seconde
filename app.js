// ============================================================
// RévisBrevet 2026 — app.js (Version Algorithmique Avancée Pro)
// ============================================================

const AppState = {
  data: null,
  progress: {},
  adaptive: {}, // Enregistrement local des erreurs/succès par thèmes
  quiz: {
    chapitreId: null,
    questions: [],
    idx: 0,
    score: 0,
    isAutomatisme: false,
    niveauFiltre: 1
  }
};

const $ = id => document.getElementById(id);

// ── CODE DE MUTATION ALGORITHMIQUE (Évite le par cœur en Maths) ──
function genererQuestionMutationMaths(type) {
  const pList = [10, 15, 20, 25, 50, 75];
  const vList = [40, 60, 80, 120, 160, 200];
  const hList = [1.5, 2.5, 0.5, 1.25, 1.75];
  
  let enonce = "", bonneReponse = "", explication = "";
  
  const randType = type || ['pourcentage', 'conversion', 'calcul_mental'][Math.floor(Math.random() * 3)];
  
  if (randType === 'pourcentage') {
    const p = pList[Math.floor(Math.random() * pList.length)];
    const v = vList[Math.floor(Math.random() * vList.length)];
    const res = (p * v) / 100;
    enonce = `Calculer ${p}% de ${v} €.`;
    bonneReponse = `${res} €`;
    explication = `Prendre ${p}%, c'est faire (${p} × ${v}) / 100 = ${res} €.`;
  } else if (randType === 'conversion') {
    const h = hList[Math.floor(Math.random() * hList.length)];
    const res = h * 60;
    enonce = `Convertir ${h} heure(s) en minutes.`;
    bonneReponse = `${res} minutes`;
    explication = `1 heure = 60 min. Donc ${h}h × 60 = ${res} minutes.`;
  } else {
    const a = Math.floor(Math.random() * 8) + 5;
    const b = [9, 11, 19][Math.floor(Math.random() * 3)];
    const res = a * b;
    enonce = `Calculer de tête de manière rapide : ${a} × ${b}`;
    bonneReponse = `${res}`;
    explication = `Calcul mental accéléré : ${a} × ${b} = ${res}.`;
  }

  // Création d'options mélangées fausses autour de la vraie valeur
  const valNum = parseFloat(bonneReponse);
  const options = [
    bonneReponse,
    isNaN(valNum) ? "Aucune" : `${valNum + 5} ${bonneReponse.includes(' ') ? bonneReponse.split(' ')[1] : ''}`.trim(),
    isNaN(valNum) ? "10" : `${valNum - 2 > 0 ? valNum - 2 : valNum + 10} ${bonneReponse.includes(' ') ? bonneReponse.split(' ')[1] : ''}`.trim(),
    isNaN(valNum) ? "42" : `${valNum * 2} ${bonneReponse.includes(' ') ? bonneReponse.split(' ')[1] : ''}`.trim()
  ];
  
  const shuffled = shuffleArr([...new Set(options)]);
  return {
    enonce,
    options: shuffled,
    bonne_reponse: shuffled.indexOf(bonneReponse),
    explication
  };
}

// ── GESTION DU CHRONOMÈTRE AUTOMATISMES ──
let timerInterval = null;
let tempsRestant = 45;

function lancerTimer() {
  clearInterval(timerInterval);
  tempsRestant = 45;
  $('quiz-timer').style.display = 'block';
  $('quiz-timer').textContent = `⏱️ ${tempsRestant}s`;
  $('quiz-timer').style.color = 'var(--text-primary)';

  timerInterval = setInterval(() => {
    tempsRestant--;
    $('quiz-timer').textContent = `⏱️ ${tempsRestant}s`;
    if (tempsRestant <= 10) $('quiz-timer').style.color = 'var(--color-danger)';
    if (tempsRestant <= 0) {
      clearInterval(timerInterval);
      forcerEchecTimeout();
    }
  }, 1000);
}

function forcerEchecTimeout() {
  const containers = document.querySelectorAll('.option-btn');
  containers.forEach(b => b.disabled = true);
  $('quiz-explanation-box').className = "explanation-box visible bad";
  $('explanation-status').textContent = "⏰ TEMPS ÉCOULÉ !";
  $('explanation-text').textContent = "Vous avez mis plus de 45 secondes pour cette question d'automatisme.";
  $('quiz-next').disabled = false;
  
  // Enregistrer la lacune
  enregistrerLacune("Mathématiques (Automatismes)");
}

// ── RELEVÉ DES LACUNES DANS LE LOCALSTORAGE ──
function enregistrerLacune(theme, estSucces = false) {
  if (!AppState.adaptive[theme]) {
    AppState.adaptive[theme] = { echecs: 0, total: 0 };
  }
  AppState.adaptive[theme].total++;
  if (!estSucces) AppState.adaptive[theme].echecs++;
  localStorage.setItem('dnb_adaptive_analytics', JSON.stringify(AppState.adaptive));
  analyserLacunes();
}

function analyserLacunes() {
  let pireTheme = null;
  let maxEchecs = 0;
  
  for (const theme in AppState.adaptive) {
    const stat = AppState.adaptive[theme];
    if (stat.echecs > maxEchecs && (stat.echecs / stat.total) >= 0.4) {
      maxEchecs = stat.echecs;
      pireTheme = theme;
    }
  }
  
  if (pireTheme) {
    $('lacunes-box').classList.remove('hidden');
    $('lacunes-text').innerHTML = `Il semblerait que tu aies des difficultés récurrentes sur le thème <strong>${pireTheme}</strong>. Nous te suggérons fortement de revoir en priorité les fiches de cours associées et de t'exercer au Niveau 1.`;
  } else {
    $('lacunes-box').classList.add('hidden');
  }
}

// ── INITIALISATION & CHARGEMENT DES DONNÉES ──
async function initialiserApp() {
  // Récupérer le localStorage adaptatif
  const savedAdaptive = localStorage.getItem('dnb_adaptive_analytics');
  if (savedAdaptive) AppState.adaptive = JSON.parse(savedAdaptive);
  
  try {
    const res = await fetch('troisieme.json');
    if (res.ok) {
      AppState.data = await res.json();
    }
  } catch (e) {
    console.error("Impossible de charger troisieme.json, vérifiez l'adresse", e);
  }
  
  construireMenuMatires();
  analyserLacunes();
}

function construireMenuMatires() {
  const container = $('matieres-container');
  container.innerHTML = "";
  if (!AppState.data || !AppState.data.matieres) return;

  AppState.data.matieres.forEach(m => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.padding = '16px';
    card.style.cursor = 'pointer';
    
    let chapitresHTML = m.chapitres.map(c => `
      <div class="chapitre-item" style="padding:10px; margin-top:8px; background:var(--bg-app); border-radius:8px; display:flex; justify-content:between; align-items:center;" onclick="ouvrirPreQuiz('${m.id}', '${c.id}', event)">
        <span style="font-weight:600; font-size:.9rem;">${c.titre}</span>
        <span style="font-size:.8rem; color:var(--text-secondary); background:white; padding:2px 8px; border-radius:10px;">${c.theme}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
        <span style="font-size:1.5rem;">${m.emoji}</span>
        <h3 style="margin:0; font-size:1.1rem;">${m.label}</h3>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">${chapitresHTML}</div>
    `;
    container.appendChild(card);
  });
}

// ── ÉCRAN DE SÉLECTION INTERMÉDIAIRE : COURS & NIVEAU ──
let currentMatiereSelected = null;
let currentChapitreSelected = null;

function ouvrirPreQuiz(matiereId, chapitreId, event) {
  if (event) event.stopPropagation();
  currentMatiereSelected = AppState.data.matieres.find(m => m.id === matiereId);
  currentChapitreSelected = currentMatiereSelected.chapitres.find(c => c.id === chapitreId);
  
  $('home-screen').classList.add('hidden');
  $('pre-quiz-screen').classList.remove('hidden');
  
  $('pre-quiz-title').textContent = currentChapitreSelected.titre;
  $('pre-quiz-theme').textContent = currentChapitreSelected.theme;
  $('pre-quiz-cours-text').textContent = currentChapitreSelected.cours;
  $('pre-quiz-piege-text').textContent = currentChapitreSelected.piege;

  // Liaison des boutons de niveaux
  $('btn-lvl-1').onclick = () => lancerQuiz(1);
  $('btn-lvl-2').onclick = () => lancerQuiz(2);
  $('btn-lvl-3').onclick = () => lancerQuiz(3);
  
  // Gestion de l'exercice ouvert
  $('btn-open-exercice').onclick = () => ouvrirExerciceOuvert();
}

function goHome() {
  $('pre-quiz-screen').classList.add('hidden');
  $('open-exercise-screen').classList.add('hidden');
  $('quiz-screen').classList.add('hidden');
  $('home-screen').classList.remove('hidden');
  clearInterval(timerInterval);
  $('quiz-timer').style.display = 'none';
}

// ── DISPOSITIF B : LES EXERCICES OUVERTS DE RÉDACTION ──
function ouvrirExerciceOuvert() {
  $('pre-quiz-screen').classList.add('hidden');
  $('open-exercise-screen').classList.remove('remove');
  $('open-exercise-screen').classList.remove('hidden');
  
  $('open-ex-title').textContent = currentChapitreSelected.titre;
  $('open-ex-enonce').textContent = currentChapitreSelected.exercice_ouvert.enonce;
  $('open-ex-textarea').value = "";
  $('open-ex-correction-box').classList.add('hidden');
  $('btn-validate-open-ex').classList.remove('hidden');

  $('btn-close-exercise').onclick = () => {
    $('open-exercise-screen').classList.add('hidden');
    $('pre-quiz-screen').classList.remove('hidden');
  };

  $('btn-validate-open-ex').onclick = () => {
    if ($('open-ex-textarea').value.trim().length < 5) {
      alert("Écris d'abord ta réponse ou ton raisonnement au brouillon dans le champ avant de corriger !");
      return;
    }
    $('btn-validate-open-ex').classList.add('hidden');
    $('open-ex-correction-box').classList.remove('hidden');
    
    // Génération de la liste des cases de notation
    const containerCriteres = $('open-ex-critere-list');
    containerCriteres.innerHTML = "";
    currentChapitreSelected.exercice_ouvert.criteres.forEach((critere, index) => {
      const label = document.createElement('label');
      label.style.cssText = "display:flex; align-items:start; gap:10px; font-size:.9rem; background:var(--bg-app); padding:8px; border-radius:6px; cursor:pointer;";
      label.innerHTML = `<input type="checkbox" class="critere-cb" value="${index}"> <span>${critere}</span>`;
      containerCriteres.appendChild(label);
    });
  };

  $('btn-finish-open-ex').onclick = () => {
    const totalCriteres = document.querySelectorAll('.critere-cb').length;
    const coches = document.querySelectorAll('.critere-cb:checked').length;
    alert(`Exercice validé ! Score d'auto-évaluation : ${coches} / ${totalCriteres} critères respectés.`);
    
    // Suivi adaptatif
    const taux = coches / totalCriteres;
    enregistrerLacune(currentChapitreSelected.theme, taux >= 0.6);
    goHome();
  };
}

// ── LANCEMENT DES SESSIONS DE QUIZ DYNAMIQUES ──
function lancerQuiz(niveau) {
  AppState.quiz.chapitreId = currentChapitreSelected.id;
  AppState.quiz.idx = 0;
  AppState.quiz.score = 0;
  AppState.quiz.isAutomatisme = false;
  AppState.quiz.niveauFiltre = niveau;
  
  // Filtrer les questions du JSON par niveau choisi
  let pool = currentChapitreSelected.questions.filter(q => q.niveau === niveau);
  
  // Si le chapitre est lié aux nombres/calculs et qu'on veut mélanger, on peut injecter des mutations
  if (currentMatiereSelected.id === 'maths') {
    pool.push(genererQuestionMutationMaths());
    pool.push(genererQuestionMutationMaths());
  }
  
  AppState.quiz.questions = shuffleArr(pool).slice(0, 5); // Conserver 5 questions max uniques
  
  $('pre-quiz-screen').classList.add('hidden');
  $('quiz-screen').classList.remove('hidden');
  afficherQuestion();
}

// ACTION DU MODE EXCLUSIF AUTOMATISMES 2026
$('btn-mode-automatismes').onclick = () => {
  AppState.quiz.chapitreId = "automatismes_global";
  AppState.quiz.idx = 0;
  AppState.quiz.score = 0;
  AppState.quiz.isAutomatisme = true;
  AppState.quiz.questions = [];
  
  // Générer 10 questions aléatoires uniques par calcul de mutation
  for (let i = 0; i < 10; i++) {
    AppState.quiz.questions.push(genererQuestionMutationMaths());
  }
  
  $('home-screen').classList.add('hidden');
  $('quiz-screen').classList.remove('hidden');
  afficherQuestion();
};

function afficherQuestion() {
  clearInterval(timerInterval);
  $('quiz-explanation-box').className = "explanation-box hidden";
  $('quiz-next').disabled = true;
  
  const totalQs = AppState.quiz.questions.length;
  const currentQ = AppState.quiz.questions[AppState.quiz.idx];
  
  $('quiz-progress-text').textContent = `Question ${AppState.quiz.idx + 1} / ${totalQs}`;
  $('quiz-progress-bar').style.width = `${((AppState.quiz.idx + 1) / totalQs) * 100}%`;
  $('quiz-question-text').textContent = currentQ.enonce;
  
  const optionsContainer = $('quiz-options-container');
  optionsContainer.innerHTML = "";
  
  currentQ.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = "option-btn";
    btn.style.cssText = "width:100%; text-align:left; padding:12px 16px; margin-bottom:8px; border:1.5px solid var(--border-color); border-radius:8px; background:white; font-size:.95rem; font-family:inherit; cursor:pointer; transition:all .2s;";
    btn.textContent = opt;
    btn.onclick = () => soumettreReponse(index, btn);
    optionsContainer.appendChild(btn);
  });

  if (AppState.quiz.isAutomatisme) {
    lancerTimer();
  } else {
    $('quiz-timer').style.display = 'none';
  }
}

function soumettreReponse(indexChoisi, boutonClique) {
  clearInterval(timerInterval);
  const currentQ = AppState.quiz.questions[AppState.quiz.idx];
  const boutons = document.querySelectorAll('.option-btn');
  boutons.forEach(b => b.disabled = true);
  
  const estCorrect = (indexChoisi === currentQ.bonne_reponse);
  
  if (estCorrect) {
    AppState.quiz.score++;
    boutonClique.style.background = "#DCFCE7";
    boutonClique.style.borderColor = "#22C55E";
    $('quiz-explanation-box').className = "explanation-box visible good";
    $('explanation-status').textContent = "✅ Excellente réponse !";
  } else {
    boutonClique.style.background = "#FEE2E2";
    boutonClique.style.borderColor = "#EF4444";
    // Mettre en valeur la bonne réponse
    boutons[currentQ.bonne_reponse].style.background = "#DCFCE7";
    boutons[currentQ.bonne_reponse].style.borderColor = "#22C55E";
    
    $('quiz-explanation-box').className = "explanation-box visible bad";
    $('explanation-status').textContent = "❌ Erreur";
  }
  
  $('explanation-text').textContent = currentQ.explication;
  $('quiz-next').disabled = false;
  
  // Enregistrement analytique
  const themeConcerne = currentChapitreSelected ? currentChapitreSelected.theme : "Automatismes";
  enregistrerLacune(themeConcerne, estCorrect);
}

$('quiz-next').onclick = () => {
  AppState.quiz.idx++;
  if (AppState.quiz.idx < AppState.quiz.questions.length) {
    afficherQuestion();
  } else {
    alert(`🏁 Entraînement terminé ! Votre score : ${AppState.quiz.score} / ${AppState.quiz.questions.length}`);
    goHome();
  }
};

$('quiz-close').onclick = () => {
  if (confirm("Quitter la session en cours ? Vos progrès sur ce questionnaire ne seront pas sauvegardés.")) {
    goHome();
  }
};

// HELPER: Mélange de tableau
function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Lancement au chargement de la page
document.addEventListener('DOMContentLoaded', initialiserApp);
