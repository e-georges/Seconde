// Générateur local d'automatismes (Maths DNB 2026) — 100% Gratuit & Infini
function genererQuestionAutomatisme() {
  const categories = ['pourcentage', 'fraction', 'conversion', 'calcul_mental', 'double_moitie'];
  const choixCategorie = categories[Math.floor(Math.random() * categories.length)];
  
  let enonce = "";
  let bonneReponse = 0;
  let unite = "";
  let explication = "";

  switch (choixCategorie) {
    case 'pourcentage':
      const p = [10, 15, 20, 25, 50, 75][Math.floor(Math.random() * 6)];
      const v = [40, 60, 80, 120, 160, 200][Math.floor(Math.random() * 6)];
      bonneReponse = (p * v) / 100;
      enonce = `Calculer ${p}% de ${v} €.`;
      unite = " €";
      explication = `Prendre ${p}%, c'est faire (${p} × ${v}) / 100 = ${bonneReponse}.`;
      break;

    case 'fraction':
      const num = [1, 3, 5, 7][Math.floor(Math.random() * 4)];
      enonce = `Donner l'écriture décimale de la fraction ${num}/4.`;
      bonneReponse = num * 0.25;
      explication = `1/4 = 0,25. Donc ${num}/4 vaut ${num} × 0,25 = ${bonneReponse}.`;
      break;

    case 'conversion':
      const h = [1.5, 2.5, 0.5, 1.25, 1.75][Math.floor(Math.random() * 5)];
      bonneReponse = h * 60;
      enonce = `Convertir ${h} heure(s) en minutes.`;
      unite = " minutes";
      explication = `1 heure = 60 minutes. ${h} × 60 = ${bonneReponse} minutes.`;
      break;

    case 'calcul_mental':
      const a = Math.floor(Math.random() * 12) + 4;
      const b = [9, 11, 19, 21][Math.floor(Math.random() * 4)];
      bonneReponse = a * b;
      enonce = `Calculer mentalement : ${a} × ${b}`;
      explication = `Astuce : si on multiplie par ${b}, on peut distribuer. Exemple : ${a} × (${b === 9 || b === 19 ? b + 1 : b - 1}) ... Résultat = ${bonneReponse}.`;
      break;
      
    case 'double_moitie':
      const n = [12, 24, 36, 48, 50, 64, 84, 100][Math.floor(Math.random() * 8)];
      const mode = Math.random() > 0.5 ? 'le double' : 'la moitié';
      bonneReponse = mode === 'le double' ? n * 2 : n / 2;
      enonce = `Quelle est ${mode} de ${n} ?`;
      explication = mode === 'le double' ? `${n} × 2 = ${bonneReponse}` : `${n} / 2 = ${bonneReponse}`;
      break;
  }

  // Génération de 3 fausses réponses cohérentes proches de la bonne réponse
  const delta = choixCategorie === 'fraction' ? 0.25 : (bonneReponse > 10 ? 5 : 2);
  const options = [
    `${bonneReponse}${unite}`,
    `${bonneReponse + delta}${unite}`,
    `${bonneReponse - delta > 0 ? bonneReponse - delta : bonneReponse + (delta * 2)}${unite}`,
    `${bonneReponse * 2}${unite}`
  ];

  // Mélanger les propositions
  const optionsMelangees = shuffleArr([...new Set(options)]); 
  // Trouver l'index de la bonne réponse après mélange
  const idxBonne = optionsMelangees.indexOf(`${bonneReponse}${unite}`);

  return {
    enonce,
    options: optionsMelangees,
    bonne_reponse: idxBonne === -1 ? 0 : idxBonne,
    explication
  };
}
