# Projet P3V – Site Web Officiel
## Professionnalisation des Para-Professionnels Vétérinaires

---

## 🎯 Présentation du projet

Le **Projet P3V** est une initiative régionale visant à professionnaliser les para-professionnels vétérinaires (PPV) au **Sénégal**, au **Bénin** et au **Togo**. Financé par l'**AFD** (Agence Française de Développement) et mis en œuvre par l'**OMSA/WOAH**, en partenariat avec l'**EISMV de Dakar** et le **Réseau FAR**.

---

## ✅ Pages disponibles

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `index.html` | Page principale avec slider, stats, composantes, pays, galerie, actualités, partenaires |
| Le Projet | `projet.html` | Présentation détaillée : contexte, objectifs, composantes, méthodologie, budget |
| Pays | `pays.html` | Fiches détaillées Sénégal, Bénin, Togo avec avancement et partenaires |
| Galerie | `galerie.html` | Médiathèque photos/vidéos avec filtres, recherche, lightbox et pagination |
| Actualités | `actualites.html` | Fil d'actualités avec filtres par catégorie, articles à la une, newsletter |
| Contact | `contact.html` | Formulaire de contact, bureaux nationaux, FAQ accordion |
| Administration | `admin.html` | Interface d'administration pour médias et actualités |

---

## 🎨 Design & Couleurs

### Palette OMSA/WOAH
- **Bleu institutionnel** : `#003F87`
- **Bleu sombre** : `#002560`
- **Teal OMSA** : `#00879E`
- **Teal foncé** : `#006478`
- **Orange** : `#E8760A`
- **Vert** : `#2E7D32`

---

## ✨ Fonctionnalités implémentées

### index.html
- ✅ **Hero slider** 3 slides avec images Sahel/PPV (photos générées IA)
- ✅ **Bandeau logos partenaires défilants** (OMSA/WOAH, AFD, EISMV, Réseau FAR, CILSS, DSV, MAEP, MAEH, DGSV, UA-BIRA)
- ✅ **Barre de statistiques** animée (PPV formés, éleveurs, pays, centres, durée)
- ✅ **Section projet** avec image contextualisée
- ✅ **4 composantes** en cartes animées
- ✅ **Chiffres clés** sur fond dégradé OMSA avec images de terrain
- ✅ **Onglets pays** (Sénégal, Bénin, Togo) avec barres de progression
- ✅ **Timeline méthodologie** (5 étapes)
- ✅ **Galerie aperçu** avec filtres et lightbox
- ✅ **Actualités** chargées depuis la base de données
- ✅ **Section partenaires** organisée par catégorie (financiers, mise en œuvre, nationaux)
- ✅ **Formulaire de contact**
- ✅ **Page loader** animé
- ✅ **Curseur custom** avec follower
- ✅ **Particules héro** flottantes
- ✅ **Scroll reveal** sur tous les éléments
- ✅ **Compteurs animés**
- ✅ **Back to top** button
- ✅ **Burger menu** responsive

### Animations
- Loader cinématique avec compteur de progression
- Hero slider avec zoom effect (6s par slide)
- Particules flottantes dans le hero
- Scroll reveal (droite/gauche/bas/scale)
- Compteurs animés (chiffres clés)
- Barres de progression animées (sections pays)
- Hover 3D sur les cartes
- Logo défilement infini (bande partenaires)
- Curseur custom avec lag effect

---

## 📁 Structure des fichiers

```
index.html          → Page d'accueil
projet.html         → Présentation du projet
pays.html           → Pays d'intervention
galerie.html        → Galerie médias
actualites.html     → Actualités
contact.html        → Contact
admin.html          → Administration

css/
  style.css         → Feuille de style principale (couleurs OMSA)

js/
  main.js           → Script principal (index.html)
  pages.js          → Script commun (pages secondaires)
  galerie.js        → Galerie dynamique avec DB
  actualites.js     → Actualités dynamiques avec DB
  admin.js          → Interface administration

images/
  logo-woah.png     → Logo OMSA/WOAH
  logo-afd.png      → Logo AFD
  logo-eismv.png    → Logo EISMV
  logo-far.png      → Logo Réseau FAR
  logo-cilss.png    → Logo CILSS
  hero-ppv-vaccination.jpg  → PPV vaccination (IA)
  hero-formation-ppv.jpg    → Formation PPV (IA)
  hero-eleveurs-sahel.jpg   → Éleveurs Sahel (IA)
  ppv-examen-animal.jpg     → Examen animal (IA)
  formation-terrain-eismv.jpg → Formation terrain (IA)
  reunion-communautaire.jpg → Réunion communautaire (IA)
```

---

## 🗄️ Base de données

### Table `galerie_media`
Stocke les médias uploadés via l'interface admin.

### Table `actualites`
Stocke les articles et actualités du projet.

### API RESTful utilisée
```javascript
GET  tables/actualites?limit=3      // Dernières actualités
GET  tables/galerie_media?limit=100 // Tous les médias
POST tables/galerie_media           // Ajouter un média
PUT  tables/actualites/{id}         // Modifier un article
DEL  tables/galerie_media/{id}      // Supprimer un média
```

---

## 🔗 Navigation

| Section | index.html | Page dédiée |
|---------|-----------|-------------|
| Accueil | `#hero` | — |
| Le Projet | `#projet` | `projet.html` |
| Composantes | `#composantes` | `projet.html#composantes` |
| Pays | `#pays` | `pays.html#senegal/benin/togo` |
| Réalisations | `#realisations` | — |
| Galerie | `#galerie` | `galerie.html` |
| Actualités | `#actualites` | `actualites.html` |
| Partenaires | `#partenaires` | — |
| Contact | `#contact` | `contact.html` |

---

## 🚀 Déploiement

Pour mettre le site en ligne, utiliser l'onglet **Publish** de la plateforme.

---

## 📋 Prochaines étapes suggérées

1. **Ajouter des images réelles** via `admin.html` (photos de terrain, événements)
2. **Renseigner les actualités** via l'interface d'administration
3. **Compléter les logos** partenaires manquants (UA-BIRA, DSV, MAEP, DGSV)
4. **Intégrer une vraie carte** des zones d'intervention (Leaflet.js)
5. **Ajouter un module vidéo** dans la galerie
6. **SEO** : Ajouter des balises Open Graph pour partage réseaux sociaux
7. **Accessibilité** : Vérifier contraste des couleurs WCAG AA

---

*Site développé pour le Projet P3V – OMSA/WOAH × AFD × EISMV × Réseau FAR × CILSS*  
*Mise à jour : Mars 2026*
# ppp-website
