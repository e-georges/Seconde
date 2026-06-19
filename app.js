// ==========================================================================
// RévisBrevet & Seconde 2026 — app.js (Moteur de Démarrage Sécurisé)
// ==========================================================================

const AppState = {
  data: null,
  historiqueQuestions: [],
  targetMatiereIdForAdd: null,
  extractedOcrText: "",
  quiz: { chapitreId: null, questions: [], idx: 0, score: 0, isCustomIA: false }
};

const $ = id => document.getElementById(id);

const DATA_INITIALE = {
  matieres: [
    {
      id: "maths_2de",
      label: "Mathématiques",
      categorie: "🚀 PROGRAMME LYCÉE (2DE)",
      chapitres: [
        {
          id: "intervalles",
          titre: "Ensembles de nombres & Intervalles",
          theme: "Algèbre",
          cours: "En Seconde, on étudie les ensembles de nombres : ℕ, ℤ, 𝔻, ℚ et ℝ.\nUn intervalle [a ; b] rassemble tous les réels x tels que a ≤ x ≤ b.",
          piege: "Attention au sens des crochets : ouvert = exclu, fermé = inclus !"
        }
      ]
    },
    {
      id: "francais_2de",
      label: "Français",
      categorie: "🚀 PROGRAMME LYCÉE (2DE)",
      chapitres: [
        {
          id: "commentaire",
          titre: "Le Commentaire de Texte",
          theme: "Méthodologie",
          cours: "Le commentaire repose sur l'analyse littéraire d'un texte. Il faut lier le fond (le sens) et la forme (les figures de style, la syntaxe).",
          piege: "Le piège absolu est de faire de la paraphrase sans analyser."
        }
      ]
    },
    {
      id: "physique_2de",
      label: "Physique-Chimie",
      categorie: "🚀 PROGRAMME LYCÉE (2DE)",
      chapitres: [
        {
          id: "mole",
          titre: "La quantité de matière (La Mole)",
          theme: "Chimie",
          cours: "La mole est l'unité de quantité de matière (mol). Un paquet contient un nombre d'Avogadro d'entités : NA = 6,02 x 10^23.",
          piege: "Ne pas confondre la masse m (en g) et la quantité de matière n (en mol)."
        }
      ]
    }
  ]
};

const SVGMappings = {
  "maths_2de": `<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  "francais_2de": `<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  "physique_2de": `<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/></svg>`
};

function initialiserApp() {
  // Purge de sécurité si d'anciennes structures invalides bloquent l'affichage
  try {
    const local = localStorage.getItem('dnb_custom_curriculum');
    if (local && local.trim() !== "" && local.includes("matieres")) {
      AppState.data = JSON.parse(local);
    } else {
      AppState.data = DATA_INITIALE;
      localStorage.setItem('dnb_custom_curriculum', JSON.stringify(DATA_INITIALE));
    }
  } catch(e) {
    AppState.data = DATA_INITIALE;
  }

  construireMenuMatieres();
  configurerOcrEvents();
  
  // Navigation
  $('nav-home').onclick = () => goHome();
}

function construireMenuMatieres() {
  const container = $('matieres-container');
  if (!container) return;
  container.innerHTML = "";
  
  AppState.data.matieres.forEach(m => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const header = document.createElement('div');
    header.className = 'matiere-trigger-header';
    
    const icon = SVGMappings[m.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`;
    
    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <div class="header-icon-box">${icon}</div>
        <h3 style="margin:0; font-size:1rem; font-weight:700; color:var(--text-primary);">${m.label}</h3>
      </div>
      <svg class="arrow-indicator" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
    `;
    
    const bodyContent = document.createElement('div');
    bodyContent.className = 'matiere-chapters-body';
    
    if (m.chapitres) {
      m.chapitres.forEach(c => {
        const row = document.createElement('div');
        row.style.cssText = "padding:12px; margin-top:8px; background:#F8FAFC; border-radius:8px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;";
        row.onclick = (e) => ouvrirPreQuiz(m.id, c.id, e);
        row.innerHTML = `
          <span style="font-weight:600; font-size:0.85rem;">${c.titre}</span>
          <span style="font-size:0.65rem; font-weight:700; color:var(--color-primary); background:#EEF2FF; padding:2px 6px; border-radius:4px;">${c.theme || 'Perso'}</span>
        `;
        bodyContent.appendChild(row);
      });
    }

    const btnAdd = document.createElement('button');
    btnAdd.className = "btn-secondary";
    btnAdd.style.cssText = "margin-top:12px; min-height:36px; font-size:0.8rem; width:100%; font-weight:700;";
    btnAdd.textContent = "＋ Ajouter un chapitre (Texte / Photo / HTTP)";
    btnAdd.onclick = (e) => {
      e.stopPropagation();
      openAddChapterModal(m.id);
    };
    bodyContent.appendChild(btnAdd);

    header.onclick = () => {
      const isOpen = bodyContent.classList.contains('is-open');
      document.querySelectorAll('.matiere-chapters-body').forEach(b => b.classList.remove('is-open'));
      document.querySelectorAll('.arrow-indicator').forEach(a => a.classList.remove('rotated'));
      if (!isOpen) {
        bodyContent.classList.add('is-open');
        header.querySelector('.arrow-indicator').classList.add('rotated');
      }
    };

    card.appendChild(header);
    card.appendChild(bodyContent);
    container.appendChild(card);
  });
}

function openAddChapterModal(matiereId) {
  AppState.targetMatiereIdForAdd = matiereId;
  $('modal-add-chapter').classList.remove('hidden');
  switchIngestTab('tab-text');
}

function closeAddChapterModal() {
  $('modal-add-chapter').classList.add('hidden');
}

function switchIngestTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  $(tabId).classList.add('active');
  
  const btns = document.querySelectorAll('.tab-btn');
  if(tabId === 'tab-text') btns[0].classList.add('active');
  if(tabId === 'tab-photo') btns[1].classList.add('active');
  if(tabId === 'tab-link') btns[2].classList.add('active');
}

function configurerOcrEvents() {
  $('file-camera-input').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    $('ocr-status-container').classList.remove('hidden');
    
    try {
      const worker = await Tesseract.createWorker('fra');
      const ret = await worker.recognize(file);
      AppState.extractedOcrText = ret.data.text;
      await worker.terminate();
      $('ocr-status-container').classList.add('hidden');
      alert("✅ Document numérisé ! L'IA locale est prête.");
    } catch (err) {
      $('ocr-status-container').classList.add('hidden');
      alert("Erreur OCR. Utilise la saisie manuelle.");
    }
  };

  $('btn-submit-new-chap').onclick = () => {
    const titre = $('input-new-chap-title').value.trim();
    if (!titre) return alert("Indique un titre de chapitre.");

    let source = "";
    const activeTab = document.querySelector('.tab-content.active').id;
    if (activeTab === 'tab-text') source = $('area-ingest-text').value.trim();
    else if (activeTab === 'tab-photo') source = AppState.extractedOcrText;
    else source = $('input-ingest-url').value.trim();

    const mat = AppState.data.matieres.find(m => m.id === AppState.targetMatiereIdForAdd);
    if(mat) {
      mat.chapitres.push({
        id: "custom_" + Date.now(),
        titre: titre,
        theme: "Perso",
        isCustomIA: true,
        rawSource: source || "Généré par IA"
      });
      localStorage.setItem('dnb_custom_curriculum', JSON.stringify(AppState.data));
      construireMenuMatieres();
      closeAddChapterModal();
    }
  };
}

function ouvrirPreQuiz(matiereId, chapitreId, event) {
  if (event) event.stopPropagation();
  const mat = AppState.data.matieres.find(m => m.id === matiereId);
  const chap = mat.chapitres.find(c => c.id === chapitreId);
  
  $('home-screen').classList.add('hidden');
  $('pre-quiz-screen').classList.remove('hidden');
  $('pre-quiz-title').textContent = chap.titre;
  $('pre-quiz-theme').textContent = chap.theme || "Perso";
  
  if (chap.isCustomIA) {
    $('wrapper-cours-standard').classList.add('hidden');
    $('wrapper-cours-ia').classList.remove('hidden');
  } else {
    $('wrapper-cours-ia').classList.add('hidden');
    $('wrapper-cours-standard').classList.remove('hidden');
    $('pre-quiz-cours-text').textContent = chap.cours;
    $('pre-quiz-piege-text').textContent = chap.piege;
  }
}

function goHome() {
  $('pre-quiz-screen').classList.add('hidden');
  $('modal-add-chapter').classList.add('hidden');
  $('home-screen').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', initialiserApp);
