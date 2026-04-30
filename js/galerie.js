/* =========================================================
   PROJET P3V – Galerie dynamique
   Lit depuis localStorage (Netlify/local) ou API (Genspark)
   ========================================================= */

(function() {
  'use strict';

  /* ── Détection environnement (identique à admin.js) ── */
  const IS_GENSPARK = (
    window.location.hostname.endsWith('genspark.ai') ||
    window.location.hostname.endsWith('genspark.site') ||
    window.location.hostname.includes('.genspark.')
  );
  const USE_API = IS_GENSPARK;
  const LS_KEY  = 'p3v_galerie_media'; // même clé qu'admin.js

  /* ── Données de démonstration ── */
  /* ── Données réelles du projet P3V ── */
  const DEMO_MEDIA = [
    { id:'1', titre:'Comité de Pilotage (COPIL) – Session 2024', categorie:'evenement', type:'photo', pays:'Sénégal', date:'Avril 2024', img:'images/p3v/COPIL 1.JPG', desc:'Réunion du Comité de Pilotage réunissant les partenaires institutionnels et techniques à Dakar.' },
    { id:'2', titre:'Atelier de validation des référentiels', categorie:'formation', type:'photo', pays:'Bénin', date:'Mars 2024', img:'images/p3v/DSC_3051.jpg', desc:'Travaux de groupe lors de l\'atelier national de validation des curricula de formation pour les PPV.' },
    { id:'3', titre:'Mission de suivi terrain – Zone Est', categorie:'terrain', type:'photo', pays:'Togo', date:'Février 2024', img:'images/p3v/DSC_1686.JPG', desc:'Équipe de coordination en mission de suivi des centres de formation partenaires.' },
    { id:'4', titre:'Réunion institutionnelle OMSA-AFD', categorie:'evenement', type:'photo', pays:'Sénégal', date:'Janvier 2024', img:'images/p3v/CCS_8189.jpg', desc:'Échanges entre les représentants de l\'OMSA et de l\'AFD sur l\'avancement du projet.' },
    { id:'5', titre:'Formation pratique des formateurs', categorie:'formation', type:'photo', pays:'Bénin', date:'Novembre 2023', img:'images/p3v/DSC_0468.JPG', desc:'Session de renforcement des capacités pédagogiques pour les enseignants des écoles vétérinaires.' },
    { id:'6', titre:'Déploiement des équipements pédagogiques', categorie:'terrain', type:'photo', pays:'Togo', date:'Octobre 2023', img:'images/p3v/DSC_3177.JPG', desc:'Réception et installation du matériel technique dans un centre de formation professionnel.' },
    { id:'7', titre:'Atelier technique régional', categorie:'evenement', type:'photo', pays:'Sénégal', date:'Septembre 2023', img:'images/p3v/IMG Atelier (15).JPG', desc:'Rencontre technique régionale pour l\'harmonisation des outils de formation.' },
    { id:'8', titre:'Visite de terrain – Élevage communautaire', categorie:'terrain', type:'photo', pays:'Bénin', date:'Août 2023', img:'images/p3v/CCS_8305.jpg', desc:'Sensibilisation des éleveurs locaux au rôle des para-professionnels vétérinaires.' },
    { id:'9', titre:'Examen clinique bovin', categorie:'terrain', type:'photo', pays:'Sénégal', date:'Juillet 2023', img:'images/p3v/BB4A7812.jpg', desc:'Pratique clinique sur le terrain avec les étudiants para-vétérinaires.' },
    { id:'10', titre:'Session de travail en laboratoire', categorie:'formation', type:'photo', pays:'Togo', date:'Juin 2023', img:'images/p3v/DSC_1693.JPG', desc:'Utilisation des outils pédagogiques (lames et microscopes) fournis par le projet.' },
    { id:'11', titre:'Atelier de capitalisation', categorie:'evenement', type:'photo', pays:'Bénin', date:'Mai 2023', img:'images/p3v/IMG Atelier (173).JPG', desc:'Partage d\'expériences et documentation des leçons apprises du projet.' },
    { id:'12', titre:'Suivi des éleveurs nomades', categorie:'terrain', type:'photo', pays:'Sénégal', date:'Avril 2023', img:'images/p3v/BB4A8069.jpg', desc:'Échanges avec les communautés d\'éleveurs sur l\'accès aux soins de santé animale.' }
  ];

  /* ── Normalise un enregistrement (API ou LS) vers format interne ── */
  function normalize(d) {
    return {
      id:        d.id,
      titre:     d.titre       || 'Sans titre',
      categorie: (d.categorie  || 'autre').toLowerCase(),
      type:      d.type_media  || d.type || 'photo',
      pays:      d.pays        || '',
      date:      d.date_prise  || d.date_ajout ||
                 (d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR',{month:'long',year:'numeric'}) : ''),
      img:       d.url_media   || d.url || d.url_miniature || d.vignette || 'images/hero-ppv-vaccination.jpg',
      desc:      d.description || '',
    };
  }

  let allMedia = [...DEMO_MEDIA];
  let filteredMedia = [...allMedia];
  let currentFilter = 'all';
  let currentPage = 1;
  const PAGE_SIZE = 9;
  let lightboxIndex = 0;

  const grid       = document.getElementById('galerieGridFull');
  const emptyState = document.getElementById('emptyState');
  const countEl    = document.getElementById('galerieCount');
  const searchInput = document.getElementById('searchInput');
  const paginationEl = document.getElementById('pagination');

  /* ── Chargement des données ── */
  async function loadFromDB() {
    let loaded = [];

    if (USE_API) {
      /* ── Genspark : API REST ── */
      try {
        const res  = await fetch('tables/galerie_media?limit=200');
        const data = await res.json();
        if (data.data && data.data.length > 0) loaded = data.data.map(normalize);
      } catch(e) {
        console.warn('[P3V Galerie] API indisponible, fallback démo', e);
      }
    } else {
      /* ── Netlify / local : localStorage ── */
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const items = JSON.parse(raw);
          if (Array.isArray(items) && items.length > 0) loaded = items.map(normalize);
        }
      } catch(e) {
        console.warn('[P3V Galerie] Erreur lecture localStorage', e);
      }
    }

    if (loaded.length > 0) allMedia = loaded;
    filteredMedia = [...allMedia];
    render();
  }

  /* ── Écoute les changements localStorage depuis l'admin ── */
  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY) loadFromDB();
  });

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
