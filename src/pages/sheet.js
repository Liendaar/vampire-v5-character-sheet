import { currentUser } from '../auth.js';
import { getCharacter, saveCharacter, cleanForExport, importToExistingCharacter } from '../db.js';
import { exportAllNotes, importAllNotes } from '../db-notes.js';
import { logout } from '../auth.js';

// ─── Field Definitions ──────────────────────────────────

const ATTRIBUTS = {
  physique: [
    { key: 'force', label: 'Force' },
    { key: 'dexterite', label: 'Dextérité' },
    { key: 'vigueur', label: 'Vigueur' },
  ],
  social: [
    { key: 'charisme', label: 'Charisme' },
    { key: 'manipulation', label: 'Manipulation' },
    { key: 'sangFroid', label: 'Sang-froid' },
  ],
  mental: [
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'astuce', label: 'Astuce' },
    { key: 'resolution', label: 'Résolution' },
  ],
};

const COMPETENCES = {
  physique: [
    { key: 'armesAfeu', label: 'Armes à feu' },
    { key: 'artisanat', label: 'Artisanat' },
    { key: 'athletisme', label: 'Athlétisme' },
    { key: 'bagarre', label: 'Bagarre' },
    { key: 'conduite', label: 'Conduite' },
    { key: 'furtivite', label: 'Furtivité' },
    { key: 'larcin', label: 'Larcin' },
    { key: 'melee', label: 'Mêlée' },
    { key: 'survie', label: 'Survie' },
  ],
  social: [
    { key: 'animaux', label: 'Animaux' },
    { key: 'commandement', label: 'Commandement' },
    { key: 'empathie', label: 'Empathie' },
    { key: 'etiquette', label: 'Étiquette' },
    { key: 'experienceRue', label: 'Expérience de la rue' },
    { key: 'intimidation', label: 'Intimidation' },
    { key: 'persuasion', label: 'Persuasion' },
    { key: 'representation', label: 'Représentation' },
    { key: 'subterfuge', label: 'Subterfuge' },
  ],
  mental: [
    { key: 'erudition', label: 'Érudition' },
    { key: 'finances', label: 'Finances' },
    { key: 'investigation', label: 'Investigation' },
    { key: 'medecine', label: 'Médecine' },
    { key: 'occultisme', label: 'Occultisme' },
    { key: 'politique', label: 'Politique' },
    { key: 'sciences', label: 'Sciences' },
    { key: 'technologie', label: 'Technologie' },
    { key: 'vigilance', label: 'Vigilance' },
  ],
};

const CATEGORY_LABELS = { physique: 'Physique', social: 'Social', mental: 'Mental' };

// ─── Helpers ──────────────────────────────────

function dots(field, value, max = 5) {
  let html = `<div class="dots" data-field="${field}">`;
  for (let i = 1; i <= max; i++) {
    html += `<span class="dot${i <= value ? ' filled' : ''}" data-value="${i}"></span>`;
  }
  html += '</div>';
  return html;
}

function trackerBoxes(field, values) {
  let html = `<div class="tracker" data-tracker="${field}">`;
  for (let i = 0; i < values.length; i++) {
    const s = values[i];
    const cls = s === 1 ? ' superficial' : s === 2 ? ' aggravated' : '';
    html += `<span class="tracker-box${cls}" data-index="${i}"></span>`;
    if (i === 4) html += '<span class="tracker-spacer"></span>';
  }
  html += '</div>';
  return html;
}

function textField(field, value, placeholder = '') {
  const escaped = (value || '').replace(/"/g, '&quot;');
  return `<input type="text" class="field-input" data-field="${field}" value="${escaped}" placeholder="${placeholder}">`;
}

function textArea(field, value, placeholder = '', extraClass = '') {
  const escaped = (value || '').replace(/</g, '&lt;');
  return `<textarea class="field-input ${extraClass}" data-field="${field}" placeholder="${placeholder}">${escaped}</textarea>`;
}

function numberField(field, value, extraClass = '') {
  return `<input type="number" class="${extraClass || 'xp-value'}" data-field="${field}" value="${value || 0}" min="0">`;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ─── Section Renderers ──────────────────────────────────

function renderPortrait(c) {
  const src = c.portrait || '';
  return `
    <div class="sheet-section portrait-section">
      <div class="portrait-wrapper">
        <div class="portrait" id="portrait-container">
          ${src
            ? `<img src="${src}" alt="Portrait" class="portrait-img">`
            : `<div class="portrait-placeholder">Cliquez pour ajouter<br>un portrait</div>`}
        </div>
        <input type="file" id="portrait-input" accept="image/*" class="hidden">
        <div class="portrait-actions">
          <button class="btn btn-small btn-gold" id="btn-upload-portrait">Changer</button>
          ${src ? '<button class="btn btn-small btn-danger" id="btn-remove-portrait">Retirer</button>' : ''}
        </div>
      </div>
    </div>
  `;
}

function renderInfo(c) {
  return `
    <div class="sheet-section">
      <div class="info-grid">
        <div class="field-group">
          <label class="field-label">Nom</label>
          ${textField('nom', c.nom, 'Nom du personnage')}
        </div>
        <div class="field-group">
          <label class="field-label">Concept</label>
          ${textField('concept', c.concept, 'Concept')}
        </div>
        <div class="field-group">
          <label class="field-label">Prédateur</label>
          ${textField('predateur', c.predateur, 'Type de prédateur')}
        </div>
        <div class="field-group">
          <label class="field-label">Chronique</label>
          ${textField('chronique', c.chronique, 'Chronique')}
        </div>
        <div class="field-group">
          <label class="field-label">Ambition</label>
          ${textField('ambition', c.ambition, 'Ambition')}
        </div>
        <div class="field-group">
          <label class="field-label">Clan</label>
          ${textField('clan', c.clan, 'Clan')}
        </div>
        <div class="field-group">
          <label class="field-label">Sire</label>
          ${textField('sire', c.sire, 'Sire')}
        </div>
        <div class="field-group">
          <label class="field-label">Désir</label>
          ${textField('desir', c.desir, 'Désir')}
        </div>
        <div class="field-group">
          <label class="field-label">Génération</label>
          ${textField('generation', c.generation, 'Génération')}
        </div>
      </div>
    </div>
  `;
}

function renderAttributs(c) {
  let html = '<div class="sheet-section"><div class="section-title">Attributs</div><div class="attributes-grid">';
  for (const [cat, attrs] of Object.entries(ATTRIBUTS)) {
    html += `<div class="attr-category"><div class="attr-category-title">${CATEGORY_LABELS[cat]}</div>`;
    for (const a of attrs) {
      html += `<div class="attr-row"><span class="attr-name">${a.label}</span>${dots('attributs.' + a.key, c.attributs[a.key])}</div>`;
    }
    html += '</div>';
  }
  html += '</div></div>';
  return html;
}

function renderTrackers(c) {
  return `
    <div class="sheet-section">
      <div class="trackers-row">
        <div class="tracker-group">
          <div class="tracker-label">Santé</div>
          ${trackerBoxes('sante', c.sante)}
        </div>
        <div class="tracker-group">
          <div class="tracker-label">Volonté</div>
          ${trackerBoxes('volonte', c.volonte)}
        </div>
      </div>
    </div>
  `;
}

function renderCompetences(c) {
  let html = '<div class="sheet-section"><div class="section-title">Compétences</div><div class="competences-grid">';
  for (const [cat, comps] of Object.entries(COMPETENCES)) {
    html += `<div><div class="attr-category-title">${CATEGORY_LABELS[cat]}</div>`;
    for (const s of comps) {
      html += `<div class="comp-row"><span class="comp-name">${s.label}</span>${dots('competences.' + s.key, c.competences[s.key])}</div>`;
    }
    html += '</div>';
  }
  html += '</div></div>';
  return html;
}

function renderDisciplines(c) {
  let html = '<div class="sheet-section"><div class="section-title">Disciplines</div><div class="disciplines-grid">';
  for (let i = 0; i < 6; i++) {
    const d = c.disciplines[i] || { nom: '', niveau: 0, pouvoirs: ['', '', '', ''] };
    const nameEsc = (d.nom || '').replace(/"/g, '&quot;');
    html += `
      <div class="discipline-block">
        <div class="discipline-header">
          <input type="text" class="discipline-name" data-field="disciplines" data-index="${i}" data-subfield="nom" value="${nameEsc}" placeholder="Discipline">
          ${dots(`disciplines.${i}.niveau`, d.niveau)}
        </div>
        <div class="discipline-powers">
    `;
    const pouvoirs = d.pouvoirs || ['', '', '', ''];
    for (let j = 0; j < 4; j++) {
      const pEsc = (pouvoirs[j] || '').replace(/"/g, '&quot;');
      html += `<input type="text" class="discipline-power-input" data-field="disciplines" data-index="${i}" data-subfield="pouvoirs" data-pindex="${j}" value="${pEsc}" placeholder="Pouvoir ${j + 1}">`;
    }
    html += '</div></div>';
  }
  html += '</div></div>';
  return html;
}

function renderResonanceSoifHumanite(c) {
  return `
    <div class="sheet-section">
      <div class="rsh-row">
        <div class="rsh-item">
          <span class="rsh-label">Résonance</span>
          ${textField('resonance', c.resonance, 'Résonance')}
        </div>
        <div class="rsh-item">
          <span class="rsh-label">Soif</span>
          ${dots('soif', c.soif)}
        </div>
        <div class="rsh-item">
          <span class="rsh-label">Humanité</span>
          ${dots('humanite', c.humanite, 10)}
        </div>
      </div>
    </div>
  `;
}

function renderPrincipesAttachesFLeau(c) {
  return `
    <div class="sheet-section">
      <div class="section-title section-title-gold">Chronique & Convictions</div>
      <div class="three-col-text">
        <div class="text-block">
          <div class="text-block-label">Principes de la chronique</div>
          ${textArea('principesChronique', c.principesChronique, 'Principes...')}
        </div>
        <div class="text-block">
          <div class="text-block-label">Attaches & Convictions</div>
          ${textArea('attachesConvictions', c.attachesConvictions, 'Attaches et convictions...')}
        </div>
        <div class="text-block">
          <div class="text-block-label">Fléau de clan</div>
          ${textArea('fleauClan', c.fleauClan, 'Fléau de clan...')}
        </div>
      </div>
    </div>
  `;
}

function renderAvantagesHandicaps(c) {
  const items = c.avantagesHandicaps || [];
  let html = '<div class="sheet-section"><div class="section-title">Avantages & Handicaps</div><div class="adv-list">';
  for (let i = 0; i < 11; i++) {
    const item = items[i] || { nom: '', niveau: 0 };
    const nameEsc = (item.nom || '').replace(/"/g, '&quot;');
    html += `
      <div class="adv-row">
        <input type="text" class="adv-input" data-field="avantagesHandicaps" data-index="${i}" data-subfield="nom" value="${nameEsc}" placeholder="Avantage ou handicap">
        ${dots(`avantagesHandicaps.${i}.niveau`, item.niveau)}
      </div>
    `;
  }
  html += '</div></div>';
  return html;
}

function renderPuissanceSang(c) {
  return `
    <div class="sheet-section">
      <div class="section-title section-title-gold">Puissance du sang</div>
      <div class="blood-potency-section">
        <div class="bp-header">
          <span class="rsh-label">Niveau</span>
          ${dots('puissanceSang', c.puissanceSang, 10)}
        </div>
        <div class="bp-grid">
          <div class="bp-item">
            <span class="bp-label">Coup de sang</span>
            <input type="text" class="bp-value" data-field="coupDeSang" value="${escapeHtml(c.coupDeSang || '')}">
          </div>
          <div class="bp-item">
            <span class="bp-label">Dégâts régénérés</span>
            <input type="text" class="bp-value" data-field="degatsRegeneres" value="${escapeHtml(c.degatsRegeneres || '')}">
          </div>
          <div class="bp-item">
            <span class="bp-label">Bonus aux pouvoirs</span>
            <input type="text" class="bp-value" data-field="bonusPouvoirs" value="${escapeHtml(c.bonusPouvoirs || '')}">
          </div>
          <div class="bp-item">
            <span class="bp-label">Relance du test d'Exaltation</span>
            <input type="text" class="bp-value" data-field="relanceExaltation" value="${escapeHtml(c.relanceExaltation || '')}">
          </div>
          <div class="bp-item">
            <span class="bp-label">Pénalité pour se nourrir</span>
            <input type="text" class="bp-value" data-field="penaliteNourrir" value="${escapeHtml(c.penaliteNourrir || '')}">
          </div>
          <div class="bp-item">
            <span class="bp-label">Score de Fléau</span>
            <input type="text" class="bp-value" data-field="scoreFLeau" value="${escapeHtml(c.scoreFLeau || '')}">
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderExperience(c) {
  return `
    <div class="sheet-section">
      <div class="section-title">Expérience</div>
      <div class="xp-row">
        <div class="xp-item">
          <span class="xp-label">Expérience totale</span>
          ${numberField('experienceTotale', c.experienceTotale)}
        </div>
        <div class="xp-item">
          <span class="xp-label">Expérience dépensée</span>
          ${numberField('experienceDepensee', c.experienceDepensee)}
        </div>
      </div>
    </div>
  `;
}

function renderBiographie(c) {
  return `
    <div class="sheet-section">
      <div class="section-title section-title-gold">Biographie</div>
      <div class="bio-grid">
        <div class="field-group">
          <label class="field-label">Âge véritable</label>
          ${textField('ageVeritable', c.ageVeritable, 'Âge véritable')}
        </div>
        <div class="field-group">
          <label class="field-label">Âge apparent</label>
          ${textField('ageApparent', c.ageApparent, 'Âge apparent')}
        </div>
        <div class="field-group">
          <label class="field-label">Date de naissance</label>
          ${textField('dateNaissance', c.dateNaissance, 'Date de naissance')}
        </div>
        <div class="field-group">
          <label class="field-label">Date de décès</label>
          ${textField('dateDeces', c.dateDeces, 'Date de décès')}
        </div>
        <div class="field-group bio-full">
          <label class="field-label">Apparence</label>
          ${textArea('apparence', c.apparence, 'Description physique...')}
        </div>
        <div class="field-group bio-full">
          <label class="field-label">Signes distinctifs</label>
          ${textArea('signesDistinctifs', c.signesDistinctifs, 'Signes distinctifs...')}
        </div>
        <div class="field-group bio-full">
          <label class="field-label">Historique</label>
          ${textArea('historique', c.historique, 'Historique du personnage...', 'notes-textarea')}
        </div>
      </div>
    </div>
  `;
}

function renderNotes(c) {
  return `
    <div class="sheet-section">
      <div class="section-title">Notes</div>
      ${textArea('notes', c.notes, 'Notes libres...', 'notes-textarea')}
    </div>
  `;
}

// ─── Main Render ──────────────────────────────────

export async function renderSheet(container, router, charId) {
  const user = currentUser();
  if (!user) { router.navigate('/login'); return; }

  container.innerHTML = `
    <nav class="navbar">
      <a class="navbar-brand" href="#/">Vampire V5</a>
      <div class="navbar-right">
        <span class="save-status" id="save-status"></span>
        <button class="btn btn-small btn-gold" id="btn-export">Exporter</button>
        <button class="btn btn-small" id="btn-import-update">Importer</button>
        <input type="file" id="import-update-input" accept=".json" class="hidden">
        <button class="btn btn-small" id="btn-back">Mes personnages</button>
        <button class="btn btn-small" id="btn-logout">Quitter</button>
      </div>
    </nav>
    <div class="sheet-page">
      <div class="char-tabs">
        <a href="#/sheet/${charId}" class="char-tab active">Fiche</a>
        <a href="#/notes/${charId}" class="char-tab">Notes</a>
      </div>
      <div id="sheet-content"><div class="loading">Chargement</div></div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => router.navigate('/'));
  document.getElementById('btn-logout').addEventListener('click', () => logout());
  document.getElementById('btn-export').addEventListener('click', async () => {
    if (!char) return;
    const statusEl = document.getElementById('save-status');
    statusEl.textContent = 'Export en cours...';
    statusEl.className = 'save-status saving';
    try {
      const data = cleanForExport(char);
      data._notes = await exportAllNotes(user.uid, charId);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(char.nom || 'personnage').replace(/[^a-zA-Z0-9À-ÿ _-]/g, '')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      statusEl.textContent = 'Exporté';
      statusEl.className = 'save-status saved';
    } catch (err) {
      statusEl.textContent = 'Erreur export';
      statusEl.className = 'save-status error';
    }
  });

  const importUpdateInput = document.getElementById('import-update-input');
  document.getElementById('btn-import-update').addEventListener('click', () => importUpdateInput.click());
  importUpdateInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('Remplacer les données de ce personnage avec le fichier importé ?')) {
      importUpdateInput.value = '';
      return;
    }
    const statusEl = document.getElementById('save-status');
    statusEl.textContent = 'Import en cours...';
    statusEl.className = 'save-status saving';
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { notesData } = await importToExistingCharacter(user.uid, charId, data);
      if (notesData && notesData.length > 0) {
        await importAllNotes(user.uid, charId, notesData);
      }
      // Reload the page to reflect changes
      renderSheet(container, router, charId);
    } catch (err) {
      statusEl.textContent = 'Erreur import : ' + err.message;
      statusEl.className = 'save-status error';
    }
    importUpdateInput.value = '';
  });

  const contentEl = document.getElementById('sheet-content');
  let char;

  try {
    char = await getCharacter(user.uid, charId);
  } catch (err) {
    contentEl.innerHTML = `<div class="empty-state"><p>Erreur : ${err.message}</p><button class="btn" id="btn-retry">Retour</button></div>`;
    contentEl.querySelector('#btn-retry')?.addEventListener('click', () => router.navigate('/'));
    return;
  }

  if (!char) {
    contentEl.innerHTML = `<div class="empty-state"><p>Personnage introuvable.</p><button class="btn" id="btn-retry">Retour</button></div>`;
    contentEl.querySelector('#btn-retry')?.addEventListener('click', () => router.navigate('/'));
    return;
  }

  // Ensure all expected fields exist (migration safety)
  ensureDefaults(char);

  contentEl.innerHTML = `
    <div class="sheet">
      <div class="sheet-header">
        <h1>Vampire</h1>
        <div class="sheet-header-sub">La Mascarade</div>
      </div>
      ${renderPortrait(char)}
      ${renderInfo(char)}
      ${renderAttributs(char)}
      ${renderTrackers(char)}
      ${renderCompetences(char)}
      ${renderDisciplines(char)}
      ${renderResonanceSoifHumanite(char)}
      ${renderPrincipesAttachesFLeau(char)}
      ${renderAvantagesHandicaps(char)}
      ${renderPuissanceSang(char)}
      ${renderExperience(char)}
      ${renderBiographie(char)}
      ${renderNotes(char)}
    </div>
  `;

  // ─── Event Handling ──────────────────────────────────
  const statusEl = document.getElementById('save-status');
  let saveTimeout = null;

  function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    statusEl.textContent = 'Modifications non sauvegardées';
    statusEl.className = 'save-status';
    saveTimeout = setTimeout(async () => {
      statusEl.textContent = 'Sauvegarde...';
      statusEl.className = 'save-status saving';
      try {
        await saveCharacter(user.uid, charId, char);
        statusEl.textContent = 'Sauvegardé';
        statusEl.className = 'save-status saved';
      } catch (err) {
        statusEl.textContent = 'Erreur de sauvegarde';
        statusEl.className = 'save-status error';
      }
    }, 1500);
  }

  // ─── Portrait Upload ──────────────────────────────────
  const portraitInput = document.getElementById('portrait-input');
  const portraitContainer = document.getElementById('portrait-container');

  portraitContainer.addEventListener('click', () => portraitInput.click());
  document.getElementById('btn-upload-portrait')?.addEventListener('click', () => portraitInput.click());

  document.getElementById('btn-remove-portrait')?.addEventListener('click', async () => {
    char.portrait = '';
    portraitContainer.innerHTML = '<div class="portrait-placeholder">Cliquez pour ajouter<br>un portrait</div>';
    const removeBtn = document.getElementById('btn-remove-portrait');
    if (removeBtn) removeBtn.remove();
    scheduleSave();
  });

  portraitInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    statusEl.textContent = 'Traitement de l\'image...';
    statusEl.className = 'save-status saving';
    try {
      const base64 = await resizeImage(file, 400, 0.8);
      char.portrait = base64;
      portraitContainer.innerHTML = `<img src="${base64}" alt="Portrait" class="portrait-img">`;
      // Ensure remove button exists
      const actions = portraitContainer.closest('.portrait-wrapper').querySelector('.portrait-actions');
      if (!actions.querySelector('#btn-remove-portrait')) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-small btn-danger';
        btn.id = 'btn-remove-portrait';
        btn.textContent = 'Retirer';
        btn.addEventListener('click', async () => {
          char.portrait = '';
          portraitContainer.innerHTML = '<div class="portrait-placeholder">Cliquez pour ajouter<br>un portrait</div>';
          btn.remove();
          scheduleSave();
        });
        actions.appendChild(btn);
      }
      scheduleSave();
    } catch (err) {
      statusEl.textContent = 'Erreur image';
      statusEl.className = 'save-status error';
    }
    portraitInput.value = '';
  });

  // Dot clicks
  contentEl.addEventListener('click', (e) => {
    const dot = e.target.closest('.dot');
    if (!dot) return;

    const dotsContainer = dot.parentElement;
    const field = dotsContainer.dataset.field;
    let newValue = parseInt(dot.dataset.value);

    // Get current value
    const currentValue = getNestedValue(char, field);
    // If clicking the same dot, decrease (toggle off)
    if (newValue === currentValue) {
      // For attributes, minimum is 0 for soif, 1 for attributes
      const isAttribute = field.startsWith('attributs.');
      newValue = isAttribute ? Math.max(newValue - 1, 1) : newValue - 1;
    }

    setNestedValue(char, field, newValue);
    // Re-render dots
    const allDots = dotsContainer.querySelectorAll('.dot');
    allDots.forEach((d) => {
      const v = parseInt(d.dataset.value);
      d.classList.toggle('filled', v <= newValue);
    });
    scheduleSave();
  });

  // Tracker clicks (cycle: empty → superficial → aggravated → empty)
  contentEl.addEventListener('click', (e) => {
    const box = e.target.closest('.tracker-box');
    if (!box) return;

    const tracker = box.parentElement;
    const field = tracker.dataset.tracker;
    const idx = parseInt(box.dataset.index);
    const arr = char[field];
    const current = arr[idx] || 0;
    const next = (current + 1) % 3;
    arr[idx] = next;

    box.className = 'tracker-box' + (next === 1 ? ' superficial' : next === 2 ? ' aggravated' : '');
    scheduleSave();
  });

  // Text/number inputs
  contentEl.addEventListener('input', (e) => {
    const el = e.target;
    const field = el.dataset.field;
    if (!field) return;

    // Special handling for array fields
    if (el.dataset.index !== undefined && el.dataset.subfield) {
      const idx = parseInt(el.dataset.index);
      if (field === 'disciplines') {
        if (el.dataset.subfield === 'nom') {
          char.disciplines[idx].nom = el.value;
        } else if (el.dataset.subfield === 'pouvoirs') {
          const pIdx = parseInt(el.dataset.pindex);
          char.disciplines[idx].pouvoirs[pIdx] = el.value;
        }
      } else if (field === 'avantagesHandicaps') {
        char.avantagesHandicaps[idx].nom = el.value;
      }
    } else if (el.type === 'number') {
      setNestedValue(char, field, parseInt(el.value) || 0);
    } else {
      setNestedValue(char, field, el.value);
    }

    scheduleSave();
  });
}

// ─── Utilities ──────────────────────────────────

function getNestedValue(obj, path) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (const key of keys) {
    const k = /^\d+$/.test(key) ? parseInt(key) : key;
    if (current == null) return undefined;
    current = current[k];
  }
  return current;
}

function setNestedValue(obj, path, value) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = /^\d+$/.test(keys[i]) ? parseInt(keys[i]) : keys[i];
    current = current[k];
  }
  const lastKey = /^\d+$/.test(keys[keys.length - 1]) ? parseInt(keys[keys.length - 1]) : keys[keys.length - 1];
  current[lastKey] = value;
}

function ensureDefaults(char) {
  char.attributs = char.attributs || { force: 1, dexterite: 1, vigueur: 1, charisme: 1, manipulation: 1, sangFroid: 1, intelligence: 1, astuce: 1, resolution: 1 };
  char.competences = char.competences || {};
  const defaultComps = ['armesAfeu', 'artisanat', 'athletisme', 'bagarre', 'conduite', 'furtivite', 'larcin', 'melee', 'survie', 'animaux', 'commandement', 'empathie', 'etiquette', 'experienceRue', 'intimidation', 'persuasion', 'representation', 'subterfuge', 'erudition', 'finances', 'investigation', 'medecine', 'occultisme', 'politique', 'sciences', 'technologie', 'vigilance'];
  for (const k of defaultComps) char.competences[k] = char.competences[k] || 0;

  char.sante = char.sante || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  char.volonte = char.volonte || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  if (char.sante.length < 10) char.sante = [...char.sante, ...Array(10 - char.sante.length).fill(0)];
  if (char.volonte.length < 10) char.volonte = [...char.volonte, ...Array(10 - char.volonte.length).fill(0)];

  if (!char.disciplines || char.disciplines.length < 6) {
    char.disciplines = char.disciplines || [];
    while (char.disciplines.length < 6) char.disciplines.push({ nom: '', niveau: 0, pouvoirs: ['', '', '', ''] });
  }
  for (const d of char.disciplines) {
    d.pouvoirs = d.pouvoirs || ['', '', '', ''];
    while (d.pouvoirs.length < 4) d.pouvoirs.push('');
  }

  if (!char.avantagesHandicaps || char.avantagesHandicaps.length < 11) {
    char.avantagesHandicaps = char.avantagesHandicaps || [];
    while (char.avantagesHandicaps.length < 11) char.avantagesHandicaps.push({ nom: '', niveau: 0 });
  }

  char.soif = char.soif ?? 0;
  char.humanite = char.humanite ?? 7;
  char.puissanceSang = char.puissanceSang ?? 1;
  char.experienceTotale = char.experienceTotale ?? 0;
  char.experienceDepensee = char.experienceDepensee ?? 0;

  const textFields = ['nom', 'concept', 'predateur', 'chronique', 'ambition', 'clan', 'sire', 'desir', 'generation', 'resonance', 'principesChronique', 'attachesConvictions', 'fleauClan', 'coupDeSang', 'degatsRegeneres', 'bonusPouvoirs', 'relanceExaltation', 'penaliteNourrir', 'scoreFLeau', 'ageVeritable', 'ageApparent', 'dateNaissance', 'dateDeces', 'apparence', 'signesDistinctifs', 'historique', 'notes'];
  for (const f of textFields) char[f] = char[f] || '';
  char.portrait = char.portrait || '';
}

function resizeImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        } else {
          if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
