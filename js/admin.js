/* =====================================================
   PROJET P3V – admin.js
   Gestion complète : Galerie & Actualités
   ===================================================== */

'use strict';

/* ===== TOAST ===== */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
  t.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${msg}`;
  t.className = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.classList.remove('show'); }, 3500);
}

/* ===== TABS ===== */
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`)?.classList.add('active');
  });
});

/* ===== API HELPERS ===== */
async function apiGet(table, params = '') {
  const res = await fetch(`tables/${table}?${params}`);
  if (!res.ok) throw new Error(`GET ${table} failed`);
  return res.json();
}
async function apiPost(table, data) {
  const res = await fetch(`tables/${table}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST ${table} failed`);
  return res.json();
}
async function apiPut(table, id, data) {
  const res = await fetch(`tables/${table}/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PUT ${table}/${id} failed`);
  return res.json();
}
async function apiDelete(table, id) {
  const res = await fetch(`tables/${table}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${table}/${id} failed`);
}

/* ============================================================
   GALERIE MÉDIA
   ============================================================ */

let mediaItems = [];
let editingMediaId = null;

const mediaModal   = document.getElementById('mediaModal');
const mediaForm    = document.getElementById('mediaForm');
const mediaGrid    = document.getElementById('adminMediaGrid');
const mediaUrlInput = document.getElementById('mediaUrl');
const mediaPreview  = document.getElementById('mediaPreview');

/* -- Ouvrir/Fermer modal -- */
function openMediaModal(item = null) {
  editingMediaId = item ? item.id : null;
  document.getElementById('mediaModalTitle').innerHTML = item
    ? '<i class="fas fa-edit"></i> Modifier le média'
    : '<i class="fas fa-plus-circle"></i> Ajouter un média';

  mediaForm.reset();
  mediaPreview.innerHTML = '';

  if (item) {
    document.getElementById('mediaId').value = item.id;
    document.getElementById('mediaTitre').value = item.titre || '';
    document.getElementById('mediaUrl').value = item.url || '';
    document.getElementById('mediaVignette').value = item.vignette || '';
    document.getElementById('mediaCat').value = item.categorie || '';
    document.getElementById('mediaPays').value = item.pays || '';
    document.getElementById('mediaDesc').value = item.description || '';
    const radio = mediaForm.querySelector(`input[value="${item.type_media}"]`);
    if (radio) radio.checked = true;
    updatePreview(item.url, item.type_media);
  }

  mediaModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMediaModal() {
  mediaModal.classList.remove('active');
  document.body.style.overflow = '';
  editingMediaId = null;
}

document.getElementById('openMediaModal')?.addEventListener('click', () => openMediaModal());
document.getElementById('closeMediaModal')?.addEventListener('click', closeMediaModal);
document.getElementById('cancelMediaBtn')?.addEventListener('click', closeMediaModal);
mediaModal?.querySelector('.modal-overlay')?.addEventListener('click', closeMediaModal);

/* -- Prévisualisation URL -- */
function updatePreview(url, type) {
  if (!url || !mediaPreview) return;
  mediaPreview.innerHTML = '';
  if (type === 'video') {
    mediaPreview.innerHTML = `<video src="${url}" controls muted style="max-height:180px;max-width:100%;"></video>`;
  } else {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Aperçu';
    img.onerror = () => { mediaPreview.innerHTML = '<p style="color:#e07b23;padding:12px;font-size:13px;"><i class="fas fa-exclamation-triangle"></i> URL invalide ou inaccessible</p>'; };
    mediaPreview.appendChild(img);
  }
}

mediaUrlInput?.addEventListener('blur', () => {
  const type = mediaForm.querySelector('input[name="type_media"]:checked')?.value || 'image';
  updatePreview(mediaUrlInput.value, type);
});
mediaForm?.querySelectorAll('input[name="type_media"]').forEach(r => {
  r.addEventListener('change', () => updatePreview(mediaUrlInput?.value, r.value));
});

/* -- Sauvegarde média -- */
mediaForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('saveMediaBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Enregistrement...</span>';
  btn.disabled = true;

  const payload = {
    titre:       document.getElementById('mediaTitre').value.trim(),
    url:         document.getElementById('mediaUrl').value.trim(),
    vignette:    document.getElementById('mediaVignette').value.trim(),
    categorie:   document.getElementById('mediaCat').value,
    pays:        document.getElementById('mediaPays').value,
    description: document.getElementById('mediaDesc').value.trim(),
    type_media:  mediaForm.querySelector('input[name="type_media"]:checked')?.value || 'image',
    date_ajout:  new Date().toISOString()
  };

  try {
    if (editingMediaId) {
      await apiPut('galerie_media', editingMediaId, payload);
      showToast('Média mis à jour avec succès !', 'success');
    } else {
      await apiPost('galerie_media', payload);
      showToast('Média ajouté avec succès !', 'success');
    }
    closeMediaModal();
    await loadMedia();
  } catch (err) {
    showToast('Erreur lors de l\'enregistrement.', 'error');
    console.error(err);
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> <span>Enregistrer</span>';
    btn.disabled = false;
  }
});

/* -- Supprimer un média -- */
async function deleteMedia(id) {
  if (!confirm('Supprimer ce média définitivement ?')) return;
  try {
    await apiDelete('galerie_media', id);
    showToast('Média supprimé.', 'info');
    await loadMedia();
  } catch {
    showToast('Erreur lors de la suppression.', 'error');
  }
}

/* -- Rendu carte média admin -- */
function renderMediaCard(item) {
  const isVideo = item.type_media === 'video';
  const thumb = item.vignette || item.url || '';
  return `
    <div class="admin-media-card">
      <div class="admin-media-thumb">
        ${isVideo
          ? `<video src="${item.url}" muted preload="metadata" poster="${thumb}" style="width:100%;height:100%;object-fit:cover;"></video>`
          : `<img src="${thumb}" alt="${item.titre}" loading="lazy" onerror="this.style.opacity='.3';this.src='https://via.placeholder.com/220x160?text=Image'" />`
        }
        <div class="admin-media-type-badge">
          <i class="fas fa-${isVideo ? 'video' : 'image'}"></i>
          ${isVideo ? 'Vidéo' : 'Image'}
        </div>
      </div>
      <div class="admin-media-info">
        <h4 title="${item.titre || ''}">${item.titre || 'Sans titre'}</h4>
        <div class="admin-media-meta">
          ${item.categorie ? `<span class="badge badge-blue">${item.categorie}</span>` : ''}
          ${item.pays ? `<span class="badge badge-green">${item.pays}</span>` : ''}
        </div>
        <div class="admin-media-actions">
          <button class="btn-edit" onclick="openMediaModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
            <i class="fas fa-pen"></i> Modifier
          </button>
          <button class="btn-danger" onclick="deleteMedia('${item.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>`;
}

/* -- Charger médias -- */
async function loadMedia() {
  if (!mediaGrid) return;
  mediaGrid.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
  try {
    const res = await apiGet('galerie_media', 'limit=100&sort=created_at');
    mediaItems = res.data || [];

    // Stats
    document.getElementById('totalMedias').textContent = mediaItems.length;
    document.getElementById('totalImages').textContent = mediaItems.filter(m => m.type_media !== 'video').length;
    document.getElementById('totalVideos').textContent = mediaItems.filter(m => m.type_media === 'video').length;

    renderFilteredMedia();
  } catch {
    mediaGrid.innerHTML = '<div class="admin-loading" style="color:#dc3545;"><i class="fas fa-exclamation-circle"></i> Erreur de chargement</div>';
  }
}

function renderFilteredMedia() {
  const cat = document.getElementById('filterCat')?.value || '';
  const pays = document.getElementById('filterPays')?.value || '';
  const search = document.getElementById('searchMedia')?.value.toLowerCase() || '';

  const filtered = mediaItems.filter(item => {
    const matchCat = !cat || item.categorie === cat;
    const matchPays = !pays || item.pays === pays;
    const matchSearch = !search || (item.titre || '').toLowerCase().includes(search);
    return matchCat && matchPays && matchSearch;
  });

  if (filtered.length === 0) {
    mediaGrid.innerHTML = `
      <div class="admin-empty" style="grid-column:1/-1;">
        <i class="fas fa-images"></i>
        <h3>Aucun média trouvé</h3>
        <p>Ajoutez votre premier média en cliquant sur "Ajouter un média".</p>
      </div>`;
    return;
  }
  mediaGrid.innerHTML = filtered.map(item => renderMediaCard(item)).join('');
}

/* Filtres */
['filterCat', 'filterPays', 'searchMedia'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', renderFilteredMedia);
  document.getElementById(id)?.addEventListener('change', renderFilteredMedia);
});

/* ============================================================
   ACTUALITÉS
   ============================================================ */

let actuItems = [];
let editingActuId = null;

const actuModal = document.getElementById('actuModal');
const actuForm  = document.getElementById('actuForm');
const actuList  = document.getElementById('adminActuList');

/* -- Ouvrir/Fermer modal -- */
function openActuModal(item = null) {
  editingActuId = item ? item.id : null;
  document.getElementById('actuModalTitle').innerHTML = item
    ? '<i class="fas fa-pen"></i> Modifier l\'actualité'
    : '<i class="fas fa-pen"></i> Nouvelle actualité';

  actuForm.reset();

  if (item) {
    document.getElementById('actuId').value = item.id;
    document.getElementById('actuTitre').value = item.titre || '';
    document.getElementById('actuCat').value = item.categorie || '';
    document.getElementById('actuPays').value = item.pays || '';
    document.getElementById('actuDate').value = item.date_publication ? item.date_publication.split('T')[0] : '';
    document.getElementById('actuAuteur').value = item.auteur || '';
    document.getElementById('actuImage').value = item.image_url || '';
    document.getElementById('actuResume').value = item.resume || '';
    document.getElementById('actuContenu').value = item.contenu || '';
  }

  actuModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeActuModal() {
  actuModal.classList.remove('active');
  document.body.style.overflow = '';
  editingActuId = null;
}

document.getElementById('openActuModal')?.addEventListener('click', () => openActuModal());
document.getElementById('closeActuModal')?.addEventListener('click', closeActuModal);
document.getElementById('cancelActuBtn')?.addEventListener('click', closeActuModal);

/* -- Sauvegarde actualité -- */
actuForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('saveActuBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Publication...</span>';
  btn.disabled = true;

  const payload = {
    titre:            document.getElementById('actuTitre').value.trim(),
    categorie:        document.getElementById('actuCat').value,
    pays:             document.getElementById('actuPays').value,
    date_publication: document.getElementById('actuDate').value || new Date().toISOString().split('T')[0],
    auteur:           document.getElementById('actuAuteur').value.trim() || 'Équipe P3V',
    image_url:        document.getElementById('actuImage').value.trim(),
    resume:           document.getElementById('actuResume').value.trim(),
    contenu:          document.getElementById('actuContenu').value.trim()
  };

  try {
    if (editingActuId) {
      await apiPut('actualites', editingActuId, payload);
      showToast('Actualité mise à jour !', 'success');
    } else {
      await apiPost('actualites', payload);
      showToast('Actualité publiée avec succès !', 'success');
    }
    closeActuModal();
    await loadActualites();
  } catch (err) {
    showToast('Erreur lors de la publication.', 'error');
    console.error(err);
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> <span>Publier</span>';
    btn.disabled = false;
  }
});

/* -- Supprimer actualité -- */
async function deleteActu(id) {
  if (!confirm('Supprimer cette actualité ?')) return;
  try {
    await apiDelete('actualites', id);
    showToast('Actualité supprimée.', 'info');
    await loadActualites();
  } catch {
    showToast('Erreur lors de la suppression.', 'error');
  }
}

/* -- Rendu carte actualité admin -- */
const catColors = { 'Actualité': '#00529b', 'Événement': '#e07b23', 'Publication': '#2d9b4e', 'Rapport': '#1a8a7a' };

function renderActuCard(item) {
  const color = catColors[item.categorie] || '#00529b';
  const dateStr = item.date_publication ? new Date(item.date_publication).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const safeItem = JSON.stringify(item).replace(/"/g, '&quot;');

  return `
    <div class="admin-actu-card">
      ${item.image_url
        ? `<div class="admin-actu-img"><img src="${item.image_url}" alt="${item.titre}" loading="lazy" /></div>`
        : `<div class="admin-actu-img-placeholder"><i class="fas fa-newspaper"></i></div>`
      }
      <div class="admin-actu-body">
        <div class="admin-actu-meta">
          <span class="badge" style="background:${color}15;color:${color};">${item.categorie || 'Actualité'}</span>
          ${item.pays ? `<span class="badge badge-green">${item.pays}</span>` : ''}
          ${dateStr ? `<span style="font-size:12px;color:var(--muted);"><i class="fas fa-calendar" style="margin-right:4px;"></i>${dateStr}</span>` : ''}
        </div>
        <h3>${item.titre}</h3>
        <p>${item.resume || ''}</p>
      </div>
      <div class="admin-actu-actions">
        <button class="btn-edit" onclick="openActuModal(JSON.parse(document.querySelector('[data-id=\\'${item.id}\\']').dataset.raw))">
          <i class="fas fa-pen"></i>
        </button>
        <button class="btn-danger" onclick="deleteActu('${item.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <span data-id="${item.id}" data-raw="${safeItem}" style="display:none;"></span>
    </div>`;
}

/* -- Charger actualités -- */
async function loadActualites() {
  if (!actuList) return;
  actuList.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
  try {
    const res = await apiGet('actualites', 'limit=100&sort=created_at');
    actuItems = res.data || [];
    if (actuItems.length === 0) {
      actuList.innerHTML = `
        <div class="admin-empty">
          <i class="fas fa-newspaper"></i>
          <h3>Aucune actualité</h3>
          <p>Publiez votre première actualité du projet P3V.</p>
        </div>`;
      return;
    }
    actuList.innerHTML = actuItems.map(a => renderActuCard(a)).join('');
  } catch {
    actuList.innerHTML = '<div class="admin-loading" style="color:#dc3545;"><i class="fas fa-exclamation-circle"></i> Erreur de chargement</div>';
  }
}

/* ===== INIT ===== */
(async () => {
  await Promise.all([loadMedia(), loadActualites()]);
})();

/* Expose pour les boutons inline */
window.openMediaModal = openMediaModal;
window.deleteMedia    = deleteMedia;
window.openActuModal  = openActuModal;
window.deleteActu     = deleteActu;
