import { currentUser, logout } from '../auth.js';
import {
  listSections, createSection, updateSection, deleteSection, reorderSections,
  listAllNotes, createNote, updateNote, deleteNote, reorderNotes,
} from '../db-notes.js';

let uid, charId, router_;
let sections = [];
let allNotes = [];
let expandedNotes = new Set();
let saveTimeouts = {};
let sectionTitleTimeouts = {};

// ─── Entry Point ──────────────────────────────────

export async function renderNotesPage(container, router, id) {
  charId = id;
  router_ = router;
  const user = currentUser();
  if (!user) { router.navigate('/login'); return; }
  uid = user.uid;

  container.innerHTML = `
    <nav class="navbar">
      <a class="navbar-brand" href="#/">Vampire V5</a>
      <div class="navbar-right">
        <span class="save-status" id="save-status"></span>
        <button class="btn btn-small" id="btn-back">Mes personnages</button>
        <button class="btn btn-small" id="btn-logout">Quitter</button>
      </div>
    </nav>
    <div class="notes-page">
      <div class="char-tabs">
        <a href="#/sheet/${charId}" class="char-tab">Fiche</a>
        <a href="#/notes/${charId}" class="char-tab active">Notes</a>
      </div>
      <div class="notes-toolbar">
        <button class="btn btn-gold" id="btn-add-section">+ Nouvelle section</button>
      </div>
      <div id="sections-container" class="sections-container">
        <div class="loading">Chargement</div>
      </div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => router.navigate('/'));
  document.getElementById('btn-logout').addEventListener('click', () => logout());
  document.getElementById('btn-add-section').addEventListener('click', handleAddSection);

  await loadData();
  renderSections();
  attachDragHandlers();
}

// ─── Data Loading ──────────────────────────────────

async function loadData() {
  [sections, allNotes] = await Promise.all([
    listSections(uid, charId),
    listAllNotes(uid, charId),
  ]);
}

function getNotesForSection(sectionId) {
  const sectionNotes = allNotes.filter(n => n.sectionId === sectionId);
  const section = sections.find(s => s.id === sectionId);
  const mode = section?.sortMode || 'chronoDesc';

  return sortNotes(sectionNotes, mode);
}

function sortNotes(notes, mode) {
  const sorted = [...notes];
  switch (mode) {
    case 'chronoDesc':
      return sorted.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
    case 'chronoAsc':
      return sorted.sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt));
    case 'custom':
      return sorted.sort((a, b) => (a.customOrder || 0) - (b.customOrder || 0));
    default:
      return sorted;
  }
}

function toMs(ts) {
  if (!ts) return 0;
  if (ts.seconds) return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

// ─── Rendering ──────────────────────────────────

function renderSections() {
  const container = document.getElementById('sections-container');
  if (!container) return;

  const sorted = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));

  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Aucune section.<br>Créez-en une pour organiser vos notes.</p></div>';
    return;
  }

  container.innerHTML = sorted.map(s => renderSection(s)).join('');
  attachSectionHandlers();
  autoResizeAll();
}

function renderSection(section) {
  const notes = getNotesForSection(section.id);
  const isCustom = section.sortMode === 'custom';

  return `
    <div class="note-section" data-section-id="${section.id}">
      <div class="section-header">
        <span class="drag-handle section-drag" title="Réorganiser la section">⠿</span>
        <input type="text" class="section-title-input" data-section-id="${section.id}"
               value="${escapeAttr(section.title || '')}" placeholder="Titre de la section">
        <div class="section-controls">
          <select class="sort-select" data-section-id="${section.id}">
            <option value="chronoDesc" ${section.sortMode === 'chronoDesc' ? 'selected' : ''}>Récentes d'abord</option>
            <option value="chronoAsc" ${section.sortMode === 'chronoAsc' ? 'selected' : ''}>Anciennes d'abord</option>
            <option value="custom" ${section.sortMode === 'custom' ? 'selected' : ''}>Ordre personnalisé</option>
          </select>
          <button class="btn btn-small btn-gold btn-add-note" data-section-id="${section.id}">+ Note</button>
          <button class="btn btn-small btn-danger btn-delete-section" data-section-id="${section.id}">Supprimer</button>
        </div>
      </div>
      <div class="notes-list" data-section-id="${section.id}">
        ${notes.length === 0
          ? '<div class="notes-empty">Aucune note dans cette section.</div>'
          : notes.map(n => renderNote(n, isCustom)).join('')}
      </div>
    </div>
  `;
}

function renderNote(note, showDragHandle) {
  const isExpanded = expandedNotes.has(note.id);
  const date = formatDate(note.createdAt);
  const content = note.content || '';
  const preview = content.substring(0, 120).replace(/\n/g, ' ');
  const hasMore = content.length > 120;

  return `
    <div class="note-card ${isExpanded ? 'expanded' : 'collapsed'}" data-note-id="${note.id}" data-section-id="${note.sectionId}">
      <div class="note-header">
        ${showDragHandle ? '<span class="drag-handle note-drag" title="Réorganiser la note">⠿</span>' : ''}
        <span class="note-date">${date}</span>
        <div class="note-actions">
          <button class="btn-icon btn-toggle-note" data-note-id="${note.id}" title="${isExpanded ? 'Réduire' : 'Étendre'}">
            ${isExpanded ? '▲' : '▼'}
          </button>
          <button class="btn-icon btn-delete-note" data-note-id="${note.id}" title="Supprimer">✕</button>
        </div>
      </div>
      ${isExpanded
        ? `<div class="note-content">
            <textarea class="note-textarea" data-note-id="${note.id}" placeholder="Écrivez votre note...">${escapeHtml(content)}</textarea>
           </div>`
        : `<div class="note-preview" data-note-id="${note.id}">
            ${preview ? escapeHtml(preview) + (hasMore ? '...' : '') : '<em>Note vide</em>'}
           </div>`}
    </div>
  `;
}

// ─── Event Handlers ──────────────────────────────────

function attachSectionHandlers() {
  const container = document.getElementById('sections-container');
  if (!container) return;

  // Sort mode change
  container.querySelectorAll('.sort-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const sectionId = e.target.dataset.sectionId;
      const mode = e.target.value;
      const section = sections.find(s => s.id === sectionId);
      if (section) section.sortMode = mode;
      await updateSection(uid, charId, sectionId, { sortMode: mode });
      renderSections();
      attachDragHandlers();
    });
  });

  // Section title change (debounced)
  container.querySelectorAll('.section-title-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const sectionId = e.target.dataset.sectionId;
      const title = e.target.value;
      const section = sections.find(s => s.id === sectionId);
      if (section) section.title = title;

      if (sectionTitleTimeouts[sectionId]) clearTimeout(sectionTitleTimeouts[sectionId]);
      sectionTitleTimeouts[sectionId] = setTimeout(() => {
        updateSection(uid, charId, sectionId, { title });
      }, 1000);
    });
  });

  // Add note
  container.querySelectorAll('.btn-add-note').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const sectionId = e.target.dataset.sectionId;
      btn.disabled = true;
      try {
        const noteId = await createNote(uid, charId, sectionId);
        expandedNotes.add(noteId);
        await loadData();
        renderSections();
        attachDragHandlers();
        // Focus the new note's textarea
        const textarea = document.querySelector(`.note-textarea[data-note-id="${noteId}"]`);
        if (textarea) {
          textarea.focus();
          autoResize(textarea);
        }
      } catch (err) {
        showStatus('Erreur : ' + err.message, 'error');
      }
    });
  });

  // Delete section
  container.querySelectorAll('.btn-delete-section').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const sectionId = e.target.dataset.sectionId;
      const section = sections.find(s => s.id === sectionId);
      const noteCount = allNotes.filter(n => n.sectionId === sectionId).length;
      const msg = noteCount > 0
        ? `Supprimer la section "${section?.title || 'Sans titre'}" et ses ${noteCount} note(s) ?`
        : `Supprimer la section "${section?.title || 'Sans titre'}" ?`;
      if (!confirm(msg)) return;

      try {
        await deleteSection(uid, charId, sectionId);
        sections = sections.filter(s => s.id !== sectionId);
        allNotes = allNotes.filter(n => n.sectionId !== sectionId);
        renderSections();
        attachDragHandlers();
      } catch (err) {
        showStatus('Erreur : ' + err.message, 'error');
      }
    });
  });

  // Toggle note expand/collapse
  container.querySelectorAll('.btn-toggle-note').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const noteId = e.currentTarget.dataset.noteId;
      toggleNote(noteId);
    });
  });

  // Click on collapsed preview to expand
  container.querySelectorAll('.note-preview').forEach(el => {
    el.addEventListener('click', (e) => {
      const noteId = e.currentTarget.dataset.noteId;
      toggleNote(noteId);
    });
  });

  // Delete note
  container.querySelectorAll('.btn-delete-note').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const noteId = e.currentTarget.dataset.noteId;
      if (!confirm('Supprimer cette note ?')) return;
      try {
        await deleteNote(uid, charId, noteId);
        allNotes = allNotes.filter(n => n.id !== noteId);
        expandedNotes.delete(noteId);
        renderSections();
        attachDragHandlers();
      } catch (err) {
        showStatus('Erreur : ' + err.message, 'error');
      }
    });
  });

  // Note content editing (debounced save)
  container.querySelectorAll('.note-textarea').forEach(textarea => {
    autoResize(textarea);

    textarea.addEventListener('input', (e) => {
      const noteId = e.target.dataset.noteId;
      const content = e.target.value;
      const note = allNotes.find(n => n.id === noteId);
      if (note) note.content = content;

      autoResize(e.target);

      if (saveTimeouts[noteId]) clearTimeout(saveTimeouts[noteId]);
      showStatus('Modifications non sauvegardées', '');
      saveTimeouts[noteId] = setTimeout(async () => {
        showStatus('Sauvegarde...', 'saving');
        try {
          await updateNote(uid, charId, noteId, { content });
          showStatus('Sauvegardé', 'saved');
        } catch (err) {
          showStatus('Erreur de sauvegarde', 'error');
        }
      }, 1500);
    });
  });
}

function toggleNote(noteId) {
  if (expandedNotes.has(noteId)) {
    expandedNotes.delete(noteId);
  } else {
    expandedNotes.add(noteId);
  }
  renderSections();
  attachDragHandlers();
  // Focus textarea if expanding
  if (expandedNotes.has(noteId)) {
    const textarea = document.querySelector(`.note-textarea[data-note-id="${noteId}"]`);
    if (textarea) autoResize(textarea);
  }
}

async function handleAddSection() {
  const btn = document.getElementById('btn-add-section');
  btn.disabled = true;
  try {
    const id = await createSection(uid, charId, 'Nouvelle section');
    await loadData();
    renderSections();
    attachDragHandlers();
    // Focus the new section's title input
    const input = document.querySelector(`.section-title-input[data-section-id="${id}"]`);
    if (input) {
      input.focus();
      input.select();
    }
  } catch (err) {
    showStatus('Erreur : ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ─── Drag & Drop ──────────────────────────────────

function attachDragHandlers() {
  const container = document.getElementById('sections-container');
  if (!container) return;

  // ─ Sections drag ─
  let draggedSection = null;

  container.querySelectorAll('.section-drag').forEach(handle => {
    handle.addEventListener('mousedown', () => {
      const section = handle.closest('.note-section');
      if (section) section.setAttribute('draggable', 'true');
    });
  });

  container.addEventListener('dragstart', (e) => {
    const section = e.target.closest('.note-section[draggable="true"]');
    const noteCard = e.target.closest('.note-card[draggable="true"]');

    if (noteCard) {
      handleNoteDragStart(e, noteCard);
      return;
    }

    if (section && !noteCard) {
      draggedSection = section;
      section.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', section.dataset.sectionId);
    }
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Note drag over (within notes-list)
    if (draggedNote) {
      handleNoteDragOver(e);
      return;
    }

    // Section drag over
    if (!draggedSection) return;
    const afterEl = getDragAfterElement(container, '.note-section:not(.dragging)', e.clientY);
    if (afterEl) {
      container.insertBefore(draggedSection, afterEl);
    } else {
      container.appendChild(draggedSection);
    }
  });

  container.addEventListener('drop', async (e) => {
    e.preventDefault();

    if (draggedNote) {
      await handleNoteDrop(e);
      return;
    }

    if (!draggedSection) return;
    draggedSection.classList.remove('dragging');
    draggedSection.removeAttribute('draggable');

    // Save new order
    const orderedIds = [...container.querySelectorAll('.note-section')]
      .map(el => el.dataset.sectionId);
    await reorderSections(uid, charId, orderedIds);

    // Update local state
    orderedIds.forEach((id, i) => {
      const s = sections.find(s => s.id === id);
      if (s) s.order = i;
    });
    draggedSection = null;
  });

  container.addEventListener('dragend', () => {
    if (draggedSection) {
      draggedSection.classList.remove('dragging');
      draggedSection.removeAttribute('draggable');
      draggedSection = null;
    }
    if (draggedNote) {
      draggedNote.classList.remove('dragging');
      draggedNote.removeAttribute('draggable');
      draggedNote = null;
    }
  });

  // Remove draggable on mouseup (for handle-only drag)
  document.addEventListener('mouseup', () => {
    container.querySelectorAll('.note-section[draggable="true"]').forEach(el => {
      if (!el.classList.contains('dragging')) el.removeAttribute('draggable');
    });
    container.querySelectorAll('.note-card[draggable="true"]').forEach(el => {
      if (!el.classList.contains('dragging')) el.removeAttribute('draggable');
    });
  });

  // ─ Notes drag (custom sort only) ─
  container.querySelectorAll('.note-drag').forEach(handle => {
    handle.addEventListener('mousedown', () => {
      const card = handle.closest('.note-card');
      if (card) card.setAttribute('draggable', 'true');
    });
  });
}

let draggedNote = null;

function handleNoteDragStart(e, noteCard) {
  draggedNote = noteCard;
  noteCard.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', noteCard.dataset.noteId);
  e.stopPropagation();
}

function handleNoteDragOver(e) {
  if (!draggedNote) return;
  const notesList = draggedNote.closest('.notes-list');
  if (!notesList) return;

  const afterEl = getDragAfterElement(notesList, '.note-card:not(.dragging)', e.clientY);
  if (afterEl) {
    notesList.insertBefore(draggedNote, afterEl);
  } else {
    notesList.appendChild(draggedNote);
  }
}

async function handleNoteDrop(e) {
  if (!draggedNote) return;
  draggedNote.classList.remove('dragging');
  draggedNote.removeAttribute('draggable');

  const notesList = draggedNote.closest('.notes-list');
  if (!notesList) { draggedNote = null; return; }

  const orderedIds = [...notesList.querySelectorAll('.note-card')]
    .map(el => el.dataset.noteId);
  await reorderNotes(uid, charId, orderedIds);

  // Update local state
  orderedIds.forEach((id, i) => {
    const n = allNotes.find(n => n.id === id);
    if (n) n.customOrder = i;
  });
  draggedNote = null;
}

function getDragAfterElement(container, selector, y) {
  const elements = [...container.querySelectorAll(selector)];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ─── Utilities ──────────────────────────────────

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

function autoResizeAll() {
  document.querySelectorAll('.note-textarea').forEach(autoResize);
}

function showStatus(text, type) {
  const el = document.getElementById('save-status');
  if (!el) return;
  el.textContent = text;
  el.className = 'save-status' + (type ? ' ' + type : '');
}

function formatDate(ts) {
  if (!ts) return '';
  let d;
  if (ts.seconds) d = new Date(ts.seconds * 1000);
  else if (ts instanceof Date) d = ts;
  else return '';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
