import { logout, currentUser } from '../auth.js';
import { listCharacters, createCharacter, deleteCharacter } from '../db.js';

export async function renderDashboard(container, router) {
  const user = currentUser();
  if (!user) { router.navigate('/login'); return; }

  container.innerHTML = `
    <nav class="navbar">
      <a class="navbar-brand" href="#/">Vampire V5</a>
      <div class="navbar-right">
        <span class="navbar-user">${user.displayName || user.email}</span>
        <button class="btn btn-small" id="btn-logout">Quitter</button>
      </div>
    </nav>
    <div class="dashboard">
      <div class="dashboard-header">
        <h2 class="dashboard-title">Mes Personnages</h2>
      </div>
      <div class="characters-grid" id="chars-grid">
        <div class="loading">Chargement</div>
      </div>
    </div>
  `;

  document.getElementById('btn-logout').addEventListener('click', () => logout());

  const grid = document.getElementById('chars-grid');

  try {
    const chars = await listCharacters(user.uid);
    renderGrid(grid, chars, user.uid, router);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>Erreur : ${err.message}</p></div>`;
  }
}

function renderGrid(grid, chars, uid, router) {
  let html = '';

  // New character card
  html += `
    <div class="character-card card-new" id="card-new">
      <div class="card-new-icon">+</div>
      Nouveau personnage
    </div>
  `;

  for (const c of chars) {
    html += `
      <div class="character-card" data-id="${c.id}">
        <div class="card-name">${escapeHtml(c.nom || 'Sans nom')}</div>
        <div class="card-detail">Clan : <span>${escapeHtml(c.clan || '—')}</span></div>
        <div class="card-detail">Concept : <span>${escapeHtml(c.concept || '—')}</span></div>
        <div class="card-detail">Génération : <span>${escapeHtml(c.generation || '—')}</span></div>
        <div class="card-actions">
          <button class="btn btn-small btn-danger btn-delete" data-id="${c.id}">Supprimer</button>
        </div>
      </div>
    `;
  }

  if (chars.length === 0) {
    html += `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <p>Aucun personnage pour le moment.<br>Créez votre premier vampire.</p>
      </div>
    `;
  }

  grid.innerHTML = html;

  // Create new character
  document.getElementById('card-new').addEventListener('click', async () => {
    const btn = document.getElementById('card-new');
    btn.style.pointerEvents = 'none';
    btn.innerHTML = '<div class="card-new-icon">...</div>Création...';
    try {
      const id = await createCharacter(uid);
      router.navigate(`/sheet/${id}`);
    } catch (err) {
      alert('Erreur lors de la création : ' + err.message);
      btn.style.pointerEvents = '';
      btn.innerHTML = '<div class="card-new-icon">+</div>Nouveau personnage';
    }
  });

  // Open character
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.character-card[data-id]');
    if (card && !e.target.closest('.btn-delete')) {
      router.navigate(`/sheet/${card.dataset.id}`);
    }
  });

  // Delete character
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;
    e.stopPropagation();

    const charId = btn.dataset.id;
    if (!confirm('Supprimer ce personnage ? Cette action est irréversible.')) return;

    try {
      await deleteCharacter(uid, charId);
      const card = btn.closest('.character-card');
      card.remove();
      const remaining = grid.querySelectorAll('.character-card[data-id]');
      if (remaining.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.style.gridColumn = '1 / -1';
        empty.innerHTML = '<p>Aucun personnage pour le moment.<br>Créez votre premier vampire.</p>';
        grid.appendChild(empty);
      }
    } catch (err) {
      alert('Erreur lors de la suppression : ' + err.message);
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
