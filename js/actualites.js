/* =========================================================
   PROJET P3V – Actualités dynamiques
   Lit depuis localStorage (Netlify/local) ou API (Genspark)
   ========================================================= */

(function () {
  'use strict';

  /* ── Détection environnement (identique à admin.js) ── */
  const IS_GENSPARK = (
    window.location.hostname.endsWith('genspark.ai') ||
    window.location.hostname.endsWith('genspark.site') ||
    window.location.hostname.includes('.genspark.')
  );
  const USE_API = IS_GENSPARK;
  const LS_KEY = 'p3v_actualites'; // même clé qu'admin.js

  /* ── Normalise un enregistrement vers format interne ── */
  function normalize(d) {
    return {
      id: d.id,
      titre: d.titre || 'Sans titre',
      contenu: d.contenu || d.resume || '',
      categorie: d.categorie || 'Actualité',
      date_publication: d.date_publication ||
        (d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''),
      pays: d.pays || '',
      image_url: d.image_url || 'images/hero-ppv-vaccination.jpg',
      auteur: d.auteur || 'Équipe P3V',
      resume: d.resume || '',
    };
  }

  const DEMO_ACTUS = [
    {
      id: 'a1', titre: 'Validation du référentiel PPV au Sénégal',
      contenu: 'Un atelier régional de validation des référentiels de compétences des para-professionnels vétérinaires s\'est tenu à Dakar. Cette étape marque une avancée majeure dans la structuration de la profession.',
      categorie: 'Formation', date_publication: 'Mars 2024', pays: 'Sénégal',
      image_url: 'images/hero-formation-ppv.jpg',
      auteur: 'Équipe P3V Sénégal'
    },
    {
      id: 'a2', titre: 'Mission de suivi terrain au Nord-Bénin',
      contenu: 'Une mission de suivi-évaluation dans les zones d\'intervention au nord du Bénin a permis de mesurer l\'impact concret des formations sur les pratiques des PPV certifiés. Plus de 850 éleveurs ont déjà bénéficié des services des PPV formés.',
      categorie: 'Terrain', date_publication: 'Février 2024', pays: 'Bénin',
      image_url: 'images/ppv-examen-animal.jpg',
      auteur: 'Mission MAEP Bénin'
    },
    {
      id: 'a3', titre: 'Atelier plaidoyer PPV à Lomé',
      contenu: 'Le projet P3V a organisé un atelier de plaidoyer réunissant élus, ministères et organisations de la société civile togolaise pour la formalisation du statut des PPV au Togo. Un projet de décret est en cours de finalisation.',
      categorie: 'Événement', date_publication: 'Janvier 2024', pays: 'Togo',
      image_url: 'images/reunion-communautaire.jpg',
      auteur: 'DGSV Togo / Équipe P3V'
    },
    {
      id: 'a4', titre: 'Formation de 18 formateurs à l\'EISMV',
      contenu: 'L\'EISMV de Dakar a accueilli une session intensive de formation des formateurs (FdF) impliquant 18 enseignants issus des 3 pays bénéficiaires. Cette formation a porté sur les méthodes pédagogiques actives adaptées à la formation professionnelle.',
      categorie: 'Formation', date_publication: 'Décembre 2023', pays: 'Sénégal',
      image_url: 'images/formation-terrain-eismv.jpg',
      auteur: 'EISMV Dakar'
    },
    {
      id: 'a5', titre: 'Publication du rapport semestriel P3V 2023',
      contenu: 'Le rapport semestriel du projet P3V pour le second semestre 2023 est disponible. Il présente les avancées réalisées dans les 3 pays, les difficultés rencontrées et les perspectives pour 2024. Ce rapport marque également la mi-parcours du projet.',
      categorie: 'Publication', date_publication: 'Décembre 2023', pays: 'Régional',
      image_url: 'images/hero-eleveurs-sahel.jpg',
      auteur: 'OMSA/WOAH – Coordination P3V'
    },
    {
      id: 'a6', titre: 'Réunion de coordination régionale OMSA/WOAH',
      contenu: 'Une réunion de coordination régionale a rassemblé les équipes nationales du projet P3V et les partenaires internationaux (OMSA, AFD, EISMV, Réseau FAR) pour faire le bilan des activités et planifier les actions du premier semestre 2024.',
      categorie: 'Partenariat', date_publication: 'Novembre 2023', pays: 'Régional',
      image_url: 'images/hero-ppv-vaccination.jpg',
      auteur: 'OMSA/WOAH'
    },
  ];

  let allActus = [...DEMO_ACTUS];
  let currentFilter = 'all';

  const grid = document.getElementById('actuListGrid');
  const loading = document.getElementById('actuLoading');

  /* ── Chargement des actualités ── */
  async function loadActus() {
    let loaded = [];

    if (USE_API) {
      /* ── Genspark : API REST ── */
      try {
        const res = await fetch('tables/actualites?limit=100');
        const data = await res.json();
        if (data.data && data.data.length > 0) loaded = data.data.map(normalize);
      } catch (e) {
        console.warn('[P3V Actus] API indisponible, fallback démo', e);
      }
    } else {
      /* ── Netlify / local : localStorage ── */
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const items = JSON.parse(raw);
          if (Array.isArray(items) && items.length > 0) loaded = items.map(normalize);
        }
      } catch (e) {
        console.warn('[P3V Actus] Erreur lecture localStorage', e);
      }
    }

    if (loaded.length > 0) allActus = loaded;
    if (loading) loading.style.display = 'none';
    renderActus();
  }

  /* ── Écoute les changements localStorage depuis l'admin ── */
  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY) loadActus();
  });

  // Filtres
  document.querySelectorAll('.af-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.af-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      renderActus();
    });
  });

  const CAT_COLORS = {
    'Formation': '#003F87',
    'Terrain': '#00879E',
    'Événement': '#E8760A',
    'Publication': '#2E7D32',
    'Partenariat': '#C0392B',
    'default': '#64748b'
  };

  function renderActus() {
    const filtered = currentFilter === 'all'
      ? allActus
      : allActus.filter(a => a.categorie === currentFilter);

    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">
          <i class="fas fa-newspaper" style="font-size:3rem;display:block;margin-bottom:16px;color:var(--border)"></i>
          <p>Aucune actualité trouvée pour cette catégorie.</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map((a, i) => {
      const color = CAT_COLORS[a.categorie] || CAT_COLORS.default;
      const text = (a.contenu || '').substring(0, 160);
      return `
        <div class="actu-card" data-reveal="up" style="transition-delay:${i * 60}ms">
          <img src="${a.image_url}" alt="${a.titre}" class="actu-img" onerror="this.src='images/hero-ppv-vaccination.jpg'"/>
          <div class="actu-body">
            <div class="actu-meta">
              <span class="actu-cat" style="background:${color}">${a.categorie}</span>
              <span class="actu-date"><i class="fas fa-calendar-alt"></i>${a.date_publication}</span>
              ${a.pays ? `<span class="actu-date"><i class="fas fa-map-marker-alt"></i>${a.pays}</span>` : ''}
            </div>
            <h3>${a.titre}</h3>
            <p>${text}${(a.contenu || '').length > 160 ? '...' : ''}</p>
            <a href="#" class="actu-link" onclick="openActuModal('${a.id}'); return false;">
              Lire la suite <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>`;
    }).join('');

    // Re-trigger reveal
    setTimeout(() => {
      if (window.P3V) window.P3V.revealOnScroll();
    }, 100);
  }

  // Modal article complet
  window.openActuModal = function (id) {
    const actu = allActus.find(a => a.id === id);
    if (!actu) return;
    // Créer modal si besoin
    let modal = document.getElementById('actuModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'actuModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box" style="max-width:700px">
          <button class="modal-close" onclick="document.getElementById('actuModal').classList.remove('open');document.body.style.overflow=''"><i class="fas fa-times"></i></button>
          <img src="" alt="" class="modal-img" id="actuModalImg"/>
          <div class="modal-body">
            <div class="modal-cat" id="actuModalCat"></div>
            <h2 id="actuModalTitle"></h2>
            <div style="display:flex;gap:12px;margin-bottom:16px;font-size:.8rem;color:var(--muted)">
              <span id="actuModalDate"></span>
              <span id="actuModalPays"></span>
              <span id="actuModalAuteur"></span>
            </div>
            <p id="actuModalContent" style="font-size:.92rem;line-height:1.85"></p>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => {
        if (e.target === modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
      });
    }
    document.getElementById('actuModalImg').src = actu.image_url;
    document.getElementById('actuModalCat').textContent = actu.categorie;
    document.getElementById('actuModalTitle').textContent = actu.titre;
    document.getElementById('actuModalDate').innerHTML = `<i class="fas fa-calendar-alt" style="color:var(--omsa-teal);margin-right:4px"></i>${actu.date_publication}`;
    document.getElementById('actuModalPays').innerHTML = actu.pays ? `<i class="fas fa-map-marker-alt" style="color:var(--omsa-teal);margin-right:4px"></i>${actu.pays}` : '';
    document.getElementById('actuModalAuteur').innerHTML = actu.auteur ? `<i class="fas fa-user" style="color:var(--omsa-teal);margin-right:4px"></i>${actu.auteur}` : '';
    document.getElementById('actuModalContent').textContent = actu.contenu;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  // Newsletter
  window.subscribeNewsletter = function () {
    const email = document.getElementById('newsletterEmail')?.value?.trim();
    const msg = document.getElementById('newsletterMsg');
    if (!email || !email.includes('@')) {
      if (msg) { msg.textContent = '⚠️ Veuillez entrer une adresse email valide.'; msg.style.display = 'block'; msg.style.color = 'rgba(255,200,100,0.9)'; }
      return;
    }
    if (msg) { msg.textContent = '✅ Merci ! Vous recevrez nos actualités par email.'; msg.style.display = 'block'; msg.style.color = 'rgba(255,255,255,0.9)'; }
    if (document.getElementById('newsletterEmail')) document.getElementById('newsletterEmail').value = '';
  };

  loadActus();
})();
