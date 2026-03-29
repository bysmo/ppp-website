/* =========================================================
   PROJET P3V – Galerie dynamique
   ========================================================= */

(function() {
  'use strict';

  // Données de démonstration (seront remplacées par les données DB)
  const DEMO_MEDIA = [
    { id:'1', titre:'Vaccination bovins – Région de Thiès', categorie:'terrain', type:'photo', pays:'Sénégal', date:'Mars 2024', img:'images/hero-ppv-vaccination.jpg', desc:'Séance de vaccination contre la péripneumonie contagieuse bovine dans la région de Thiès, conduite par une PPV certifiée.' },
    { id:'2', titre:'Session de formation – EISMV Dakar', categorie:'formation', type:'photo', pays:'Sénégal', date:'Février 2024', img:'images/hero-formation-ppv.jpg', desc:'Formation pratique des para-professionnels vétérinaires au sein de l\'EISMV de Dakar, axée sur les techniques de diagnostic clinique.' },
    { id:'3', titre:'Transhumance – Borgou, Bénin', categorie:'terrain', type:'photo', pays:'Bénin', date:'Janvier 2024', img:'images/hero-eleveurs-sahel.jpg', desc:'Troupeau de zébus traversant le couloir de transhumance du Borgou, accompagnés d\'éleveurs Peuls et d\'un PPV en mission de suivi.' },
    { id:'4', titre:'Examen clinique caprin – Kara, Togo', categorie:'terrain', type:'photo', pays:'Togo', date:'Décembre 2023', img:'images/ppv-examen-animal.jpg', desc:'Une PPV togolaise effectue un examen clinique d\'un caprin dans le cadre de sa mission de suivi des troupeaux de la région de Kara.' },
    { id:'5', titre:'Formation pratique terrain – EISMV', categorie:'formation', type:'photo', pays:'Sénégal', date:'Novembre 2023', img:'images/formation-terrain-eismv.jpg', desc:'Session de formation pratique sur le terrain organisée par l\'EISMV pour les promotions de PPV, exercices de diagnostic en conditions réelles.' },
    { id:'6', titre:'Atelier plaidoyer – Lomé', categorie:'evenement', type:'photo', pays:'Togo', date:'Octobre 2023', img:'images/reunion-communautaire.jpg', desc:'Atelier de plaidoyer pour la reconnaissance légale des PPV, réunissant élus, ministères et acteurs de la société civile à Lomé.' },
  ];

  let allMedia = [...DEMO_MEDIA];
  let filteredMedia = [...allMedia];
  let currentFilter = 'all';
  let currentPage = 1;
  const PAGE_SIZE = 9;
  let lightboxIndex = 0;

  const grid = document.getElementById('galerieGridFull');
  const emptyState = document.getElementById('emptyState');
  const countEl = document.getElementById('galerieCount');
  const searchInput = document.getElementById('searchInput');
  const paginationEl = document.getElementById('pagination');

  // Charger depuis DB
  async function loadFromDB() {
    try {
      const res = await fetch('tables/galerie_media?limit=100');
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        allMedia = data.data.map(d => ({
          id: d.id,
          titre: d.titre || 'Sans titre',
          categorie: d.categorie || 'autre',
          type: d.type_media || 'photo',
          pays: d.pays || '',
          date: d.date_prise || (d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : ''),
          img: d.url_media || d.url_miniature || 'images/hero-ppv-vaccination.jpg',
          desc: d.description || '',
        }));
      }
    } catch(e) {
      // Utilise données démo
    }
    filteredMedia = [...allMedia];
    render();
  }

  // Filtres
  document.querySelectorAll('.gf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      applyFilters();
    });
  });

  // Recherche
  searchInput?.addEventListener('input', () => {
    currentPage = 1;
    applyFilters();
  });

  function applyFilters() {
    const q = (searchInput?.value || '').toLowerCase();
    filteredMedia = allMedia.filter(m => {
      const matchFilter = currentFilter === 'all' || m.categorie === currentFilter || m.type === currentFilter;
      const matchSearch = !q || m.titre.toLowerCase().includes(q) || m.pays.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
    render();
  }

  function render() {
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredMedia.slice(start, start + PAGE_SIZE);

    if (countEl) countEl.innerHTML = `Affichage de <strong>${filteredMedia.length}</strong> média${filteredMedia.length > 1 ? 's' : ''}`;

    if (filteredMedia.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      paginationEl.innerHTML = '';
      return;
    }
    emptyState.style.display = 'none';

    grid.innerHTML = pageItems.map((m, i) => buildCard(m, i)).join('');

    // Events cartes
    grid.querySelectorAll('.gi-card').forEach((card, i) => {
      card.addEventListener('click', () => {
        lightboxIndex = start + i;
        openLightbox(filteredMedia[lightboxIndex]);
      });
    });

    renderPagination();
  }

  function buildCard(m, i) {
    const catColors = {
      formation: '#003F87', terrain: '#00879E', evenement: '#E8760A',
      video: '#C0392B', autre: '#64748b'
    };
    const color = catColors[m.categorie] || '#003F87';
    return `
      <div class="gi-card" data-reveal="up" style="transition-delay:${i*50}ms">
        <div class="gi-card-img">
          <img src="${m.img}" alt="${m.titre}" loading="lazy" onerror="this.src='images/hero-ppv-vaccination.jpg'"/>
          <div class="gi-card-img-overlay">
            <div class="gi-expand-btn"><i class="fas fa-expand"></i></div>
          </div>
          <div class="gi-card-badges">
            <span class="gi-card-cat" style="background:${color}">${m.categorie}</span>
            <span class="gi-card-type-badge">
              <i class="fas fa-${m.type === 'video' ? 'play' : 'camera'}"></i>${m.type}
            </span>
          </div>
        </div>
        <div class="gi-card-body">
          <div class="gi-card-title">${m.titre}</div>
          <div class="gi-card-meta">
            ${m.pays ? `<span><i class="fas fa-map-marker-alt"></i>${m.pays}</span>` : ''}
            ${m.date ? `<span><i class="fas fa-calendar-alt"></i>${m.date}</span>` : ''}
          </div>
        </div>
      </div>`;
  }

  function renderPagination() {
    const totalPages = Math.ceil(filteredMedia.length / PAGE_SIZE);
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }
    let html = '';
    if (currentPage > 1) html += `<button class="page-btn" data-page="${currentPage-1}"><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i===currentPage?'active':''}" data-page="${i}">${i}</button>`;
    }
    if (currentPage < totalPages) html += `<button class="page-btn" data-page="${currentPage+1}"><i class="fas fa-chevron-right"></i></button>`;
    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        render();
        window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' });
      });
    });
  }

  // LIGHTBOX
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbTitle = document.getElementById('lightboxTitle');
  const lbDesc = document.getElementById('lightboxDesc');

  function openLightbox(m) {
    if (!m) return;
    lbImg.src = m.img;
    lbTitle.textContent = m.titre;
    lbDesc.textContent = m.pays + (m.date ? ' · ' + m.date : '');
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', e => { if(e.target === lightbox) closeLightbox(); });

  document.getElementById('lightboxPrev')?.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + filteredMedia.length) % filteredMedia.length;
    openLightbox(filteredMedia[lightboxIndex]);
  });

  document.getElementById('lightboxNext')?.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % filteredMedia.length;
    openLightbox(filteredMedia[lightboxIndex]);
  });

  document.addEventListener('keydown', e => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev')?.click();
    if (e.key === 'ArrowRight') document.getElementById('lightboxNext')?.click();
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  // INIT
  loadFromDB();
})();
