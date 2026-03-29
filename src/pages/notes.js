import { currentUser, logout } from '../auth.js';
import {
  listSections, createSection, updateSection, deleteSection, reorderSections,
  listAllNotes, createNote, updateNote, deleteNote, reorderNotes,
} from '../db-notes.js';

let uid, charId, router_;
let sections = [];
let allNotes = [];
let activeTabId = null;
let expandedNotes = new Set();
let saveTimeouts = {};
let sectionTitleTimeout = null;

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
      <div id="section-tabs-bar" class="section-tabs-bar"></div>
      <div id="section-content" class="section-content"></div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => router.navigate('/'));
  document.getElementById('btn-logout').addEventListener('click', () => logout());

  await loadData();

  // Restore active tab or pick first
  if (!activeTabId || !sections.find(s => s.id === activeTabId)) {
    activeTabId = sections.length > 0 ? sortedSections()[0].id : null;
  }

  renderTabsBar();
  renderActiveSection();
}

// ─── Data ──────────────────────────────────

async function loadData() {
  [sections, allNotes] = await Promise.all([
    listSections(uid, charId),
    listAllNotes(uid, charId),
  ]);
}

function sortedSections() {
  return [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
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

// ─── Tabs Bar ──────────────────────────────────

function renderTabsBar() {
  const bar = document.getElementById('section-tabs-bar');
  if (!bar) return;
  const sorted = sortedSections();

  let html = '<div class="section-tabs" id="section-tabs">';
  for (const s of sorted) {
    const isActive = s.id === activeTabId;
    html += `<div class="section-tab ${isActive ? 'active' : ''}" data-section-id="${s.id}" draggable="false">
      <span class="section-tab-label">${escapeHtml(s.title || 'Sans titre')}</span>
      <span class="section-tab-drag drag-handle" title="Réorganiser">⠿</span>
    </div>`;
  }
  html += `<button class="section-tab section-tab-add" id="btn-add-section" title="Nouvelle section">+</button>`;
  html += '</div>';
  bar.innerHTML = html;

  // Tab click
  bar.querySelectorAll('.section-tab[data-section-id]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      if (e.target.closest('.section-tab-drag')) return;
      activeTabId = tab.dataset.sectionId;
      renderTabsBar();
      renderActiveSection();
    });
  });

  // Add section
  document.getElementById('btn-add-section').addEventListener('click', handleAddSection);

  // Tab drag & drop
  attachTabDrag();
}

function attachTabDrag() {
  const tabsContainer = document.getElementById('section-tabs');
  if (!tabsContainer) return;
  let draggedTab = null;

  tabsContainer.querySelectorAll('.section-tab-drag').forEach(handle => {
    handle.addEventListener('mousedown', () => {
      const tab = handle.closest('.section-tab');
      if (tab && tab.dataset.sectionId) tab.setAttribute('draggable', 'true');
    });
  });

  tabsContainer.addEventListener('dragstart', (e) => {
    const tab = e.target.closest('.section-tab[draggable="true"]');
    if (!tab) return;
    draggedTab = tab;
    tab.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tab.dataset.sectionId);
  });

  tabsContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedTab) return;
    e.dataTransfer.dropEffect = 'move';
    const afterEl = getHorizontalDragAfter(tabsContainer, e.clientX);
    if (afterEl) {
      tabsContainer.insertBefore(draggedTab, afterEl);
    } else {
      // Insert before the "+" button
      const addBtn = document.getElementById('btn-add-section');
      tabsContainer.insertBefore(draggedTab, addBtn);
    }
  });

  tabsContainer.addEventListener('drop', async (e) => {
    e.preventDefault();
    if (!draggedTab) return;
    draggedTab.classList.remove('dragging');
    draggedTab.removeAttribute('draggable');

    const orderedIds = [...tabsContainer.querySelectorAll('.section-tab[data-section-id]')]
      .map(el => el.dataset.sectionId);
    await reorderSections(uid, charId, orderedIds);
    orderedIds.forEach((id, i) => {
      const s = sections.find(s => s.id === id);
      if (s) s.order = i;
    });
    draggedTab = null;
  });

  tabsContainer.addEventListener('dragend', () => {
    if (draggedTab) {
      draggedTab.classList.remove('dragging');
      draggedTab.removeAttribute('draggable');
      draggedTab = null;
    }
  });

  document.addEventListener('mouseup', () => {
    tabsContainer.querySelectorAll('.section-tab[draggable="true"]').forEach(el => {
      if (!el.classList.contains('dragging')) el.removeAttribute('draggable');
    });
  });
}

function getHorizontalDragAfter(container, x) {
  const tabs = [...container.querySelectorAll('.section-tab[data-section-id]:not(.dragging)')];
  return tabs.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ─── Active Section Content ──────────────────────────────────

function renderActiveSection() {
  const contentEl = document.getElementById('section-content');
  if (!contentEl) return;

  if (!activeTabId) {
    contentEl.innerHTML = '<div class="empty-state"><p>Aucune section.<br>Créez-en une avec le bouton + ci-dessus.</p></div>';
    return;
  }

  const section = sections.find(s => s.id === activeTabId);
  if (!section) {
    contentEl.innerHTML = '<div class="empty-state"><p>Section introuvable.</p></div>';
    return;
  }

  const notes = getNotesForSection(section.id);
  const isCustom = section.sortMode === 'custom';

  contentEl.innerHTML = `
    <div class="section-toolbar">
      <div class="section-toolbar-left">
        <input type="text" class="section-rename-input" id="section-rename"
               value="${escapeAttr(section.title || '')}" placeholder="Nom de la section">
      </div>
      <div class="section-toolbar-right">
        <select class="sort-select" id="section-sort">
          <option value="chronoDesc" ${section.sortMode === 'chronoDesc' ? 'selected' : ''}>Récentes d'abord</option>
          <option value="chronoAsc" ${section.sortMode === 'chronoAsc' ? 'selected' : ''}>Anciennes d'abord</option>
          <option value="custom" ${section.sortMode === 'custom' ? 'selected' : ''}>Ordre personnalisé</option>
        </select>
        <button class="btn btn-small btn-gold" id="btn-add-note">+ Note</button>
        <button class="btn btn-small btn-danger" id="btn-delete-section">Supprimer la section</button>
      </div>
    </div>
    <div class="notes-list" id="notes-list">
      ${notes.length === 0
        ? '<div class="notes-empty">Aucune note dans cette section.</div>'
        : notes.map(n => renderNote(n, isCustom)).join('')}
    </div>
  `;

  attachSectionContentHandlers(section);
  autoResizeAll();
  attachNoteDrag();
}

function renderNote(note, showDragHandle) {
  const isExpanded = expandedNotes.has(note.id);
  const date = formatDate(note.createdAt);
  const title = note.title || '';
  const content = note.content || '';
  const preview = content.substring(0, 120).replace(/\n/g, ' ');
  const hasMore = content.length > 120;
  const titleDisplay = title ? escapeHtml(title) : '<em>Sans titre</em>';

  return `
    <div class="note-card ${isExpanded ? 'expanded' : 'collapsed'}" data-note-id="${note.id}" data-section-id="${note.sectionId}">
      <div class="note-header">
        ${showDragHandle ? '<span class="drag-handle note-drag" title="Réorganiser la note">⠿</span>' : ''}
        ${!isExpanded ? `<span class="note-title-display">${titleDisplay}</span>` : ''}
        <span class="note-date${isExpanded ? ' note-date-expand' : ''}">${date}</span>
        <div class="note-actions">
          <button class="btn-icon btn-toggle-note" data-note-id="${note.id}" title="${isExpanded ? 'Réduire' : 'Étendre'}">
            ${isExpanded ? '▲' : '▼'}
          </button>
          <button class="btn-icon btn-delete-note" data-note-id="${note.id}" title="Supprimer">✕</button>
        </div>
      </div>
      ${isExpanded
        ? `<div class="note-content">
            <input type="text" class="note-title-input" data-note-id="${note.id}" value="${escapeAttr(title)}" placeholder="Titre de la note">
            <textarea class="note-textarea" data-note-id="${note.id}" placeholder="Écrivez votre note...">${escapeHtml(content)}</textarea>
           </div>`
        : `<div class="note-preview" data-note-id="${note.id}">
            ${preview ? escapeHtml(preview) + (hasMore ? '...' : '') : '<em>Note vide</em>'}
           </div>`}
    </div>
  `;
}

// ─── Section Content Event Handlers ──────────────────────────────────

function attachSectionContentHandlers(section) {
  // Rename section (debounced)
  const renameInput = document.getElementById('section-rename');
  renameInput.addEventListener('input', (e) => {
    const title = e.target.value;
    section.title = title;
    // Update the tab label too
    const tabLabel = document.querySelector(`.section-tab[data-section-id="${section.id}"] .section-tab-label`);
    if (tabLabel) tabLabel.textContent = title || 'Sans titre';

    if (sectionTitleTimeout) clearTimeout(sectionTitleTimeout);
    sectionTitleTimeout = setTimeout(() => {
      updateSection(uid, charId, section.id, { title });
    }, 1000);
  });

  // Sort mode
  document.getElementById('section-sort').addEventListener('change', async (e) => {
    section.sortMode = e.target.value;
    await updateSection(uid, charId, section.id, { sortMode: section.sortMode });
    renderActiveSection();
  });

  // Add note
  document.getElementById('btn-add-note').addEventListener('click', async () => {
    const btn = document.getElementById('btn-add-note');
    btn.disabled = true;
    try {
      const noteId = await createNote(uid, charId, section.id);
      expandedNotes.add(noteId);
      await loadData();
      renderActiveSection();
      const titleInput = document.querySelector(`.note-title-input[data-note-id="${noteId}"]`);
      if (titleInput) titleInput.focus();
    } catch (err) {
      showStatus('Erreur : ' + err.message, 'error');
    }
  });

  // Delete section
  document.getElementById('btn-delete-section').addEventListener('click', async () => {
    const noteCount = allNotes.filter(n => n.sectionId === section.id).length;
    const msg = noteCount > 0
      ? `Supprimer la section "${section.title || 'Sans titre'}" et ses ${noteCount} note(s) ?`
      : `Supprimer la section "${section.title || 'Sans titre'}" ?`;
    if (!confirm(msg)) return;

    try {
      await deleteSection(uid, charId, section.id);
      sections = sections.filter(s => s.id !== section.id);
      allNotes = allNotes.filter(n => n.sectionId !== section.id);
      activeTabId = sortedSections()[0]?.id || null;
      renderTabsBar();
      renderActiveSection();
    } catch (err) {
      showStatus('Erreur : ' + err.message, 'error');
    }
  });

  // Toggle note
  document.querySelectorAll('.btn-toggle-note').forEach(btn => {
    btn.addEventListener('click', (e) => {
      toggleNote(e.currentTarget.dataset.noteId);
    });
  });

  // Click preview to expand
  document.querySelectorAll('.note-preview').forEach(el => {
    el.addEventListener('click', (e) => {
      toggleNote(e.currentTarget.dataset.noteId);
    });
  });

  // Delete note
  document.querySelectorAll('.btn-delete-note').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const noteId = e.currentTarget.dataset.noteId;
      if (!confirm('Supprimer cette note ?')) return;
      try {
        await deleteNote(uid, charId, noteId);
        allNotes = allNotes.filter(n => n.id !== noteId);
        expandedNotes.delete(noteId);
        renderActiveSection();
      } catch (err) {
        showStatus('Erreur : ' + err.message, 'error');
      }
    });
  });

  // Note title editing (debounced)
  document.querySelectorAll('.note-title-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const noteId = e.target.dataset.noteId;
      const title = e.target.value;
      const note = allNotes.find(n => n.id === noteId);
      if (note) note.title = title;

      scheduleNoteSave(noteId, { title });
    });
  });

  // Note content editing (debounced)
  document.querySelectorAll('.note-textarea').forEach(textarea => {
    autoResize(textarea);
    textarea.addEventListener('input', (e) => {
      const noteId = e.target.dataset.noteId;
      const content = e.target.value;
      const note = allNotes.find(n => n.id === noteId);
      if (note) note.content = content;
      autoResize(e.target);
      scheduleNoteSave(noteId, { content });
    });
  });
}

function scheduleNoteSave(noteId, data) {
  if (saveTimeouts[noteId]) clearTimeout(saveTimeouts[noteId]);
  showStatus('Modifications non sauvegardées', '');
  saveTimeouts[noteId] = setTimeout(async () => {
    showStatus('Sauvegarde...', 'saving');
    try {
      await updateNote(uid, charId, noteId, data);
      showStatus('Sauvegardé', 'saved');
    } catch (err) {
      showStatus('Erreur de sauvegarde', 'error');
    }
  }, 1500);
}

function toggleNote(noteId) {
  if (expandedNotes.has(noteId)) {
    expandedNotes.delete(noteId);
  } else {
    expandedNotes.add(noteId);
  }
  renderActiveSection();
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
    activeTabId = id;
    renderTabsBar();
    renderActiveSection();
    document.getElementById('section-rename')?.focus();
    document.getElementById('section-rename')?.select();
  } catch (err) {
    showStatus('Erreur : ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ─── Note Drag & Drop ──────────────────────────────────

function attachNoteDrag() {
  const notesList = document.getElementById('notes-list');
  if (!notesList) return;
  let draggedNote = null;

  notesList.querySelectorAll('.note-drag').forEach(handle => {
    handle.addEventListener('mousedown', () => {
      const card = handle.closest('.note-card');
      if (card) card.setAttribute('draggable', 'true');
    });
  });

  notesList.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.note-card[draggable="true"]');
    if (!card) return;
    draggedNote = card;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.dataset.noteId);
  });

  notesList.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedNote) return;
    e.dataTransfer.dropEffect = 'move';
    const afterEl = getVerticalDragAfter(notesList, e.clientY);
    if (afterEl) {
      notesList.insertBefore(draggedNote, afterEl);
    } else {
      notesList.appendChild(draggedNote);
    }
  });

  notesList.addEventListener('drop', async (e) => {
    e.preventDefault();
    if (!draggedNote) return;
    draggedNote.classList.remove('dragging');
    draggedNote.removeAttribute('draggable');

    const orderedIds = [...notesList.querySelectorAll('.note-card')]
      .map(el => el.dataset.noteId);
    await reorderNotes(uid, charId, orderedIds);
    orderedIds.forEach((id, i) => {
      const n = allNotes.find(n => n.id === id);
      if (n) n.customOrder = i;
    });
    draggedNote = null;
  });

  notesList.addEventListener('dragend', () => {
    if (draggedNote) {
      draggedNote.classList.remove('dragging');
      draggedNote.removeAttribute('draggable');
      draggedNote = null;
    }
  });

  document.addEventListener('mouseup', () => {
    notesList.querySelectorAll('.note-card[draggable="true"]').forEach(el => {
      if (!el.classList.contains('dragging')) el.removeAttribute('draggable');
    });
  });
}

function getVerticalDragAfter(container, y) {
  const elements = [...container.querySelectorAll('.note-card:not(.dragging)')];
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
