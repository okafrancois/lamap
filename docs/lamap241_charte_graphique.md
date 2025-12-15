# LaMap241 - Charte Graphique

## Application mobile de jeu de cartes

---

## Palette de couleurs

### Couleurs principales

| Couleur | Hex | RGB | Utilisation |
|---------|-----|-----|-------------|
| **Rouge Terre** | `#B4443E` | rgb(180, 68, 62) | Accents, alertes, actions importantes, boutons CTA |
| **Or Sable** | `#A68258` | rgb(166, 130, 88) | Éléments premium, gains, jetons Kora, highlights |
| **Bleu Nuit** | `#465D74` | rgb(70, 93, 116) | Fond principal, cartes, éléments UI secondaires |

### Couleurs dérivées (suggestions)

| Couleur | Hex | Utilisation |
|---------|-----|-------------|
| **Bleu Nuit Foncé** | `#2E3D4D` | Fond sombre, headers |
| **Bleu Nuit Clair** | `#5A7A96` | États hover, éléments désactivés |
| **Rouge Terre Clair** | `#D4635D` | Notifications, badges |
| **Or Sable Clair** | `#C9A876` | Texte doré, bordures premium |
| **Blanc Cassé** | `#F5F2ED` | Texte principal, fond cartes |
| **Noir Profond** | `#1A1A1A` | Texte sur fond clair |

---

## Signification des couleurs

| Couleur | Émotion | Contexte jeu |
|---------|---------|--------------|
| **Rouge Terre** | Passion, compétition, urgence | Actions de jeu, mises, défis |
| **Or Sable** | Richesse, récompense, prestige | Gains, Kora, victoires spéciales |
| **Bleu Nuit** | Confiance, profondeur, stratégie | Interface, tapis de jeu, stabilité |

---

## Application UI

### Écrans principaux

```
┌─────────────────────────────┐
│  Header         #2E3D4D    │
├─────────────────────────────┤
│                             │
│  Fond principal  #465D74   │
│                             │
│  ┌─────────────────────┐   │
│  │ Carte    #F5F2ED    │   │
│  │ Bordure  #A68258    │   │
│  └─────────────────────────┘   │
│                             │
│  [Bouton CTA]  #B4443E     │
│                             │
└─────────────────────────────┘
```

### Composants

| Élément | Fond | Texte | Bordure |
|---------|------|-------|---------|
| **Bouton principal** | `#B4443E` | `#F5F2ED` | - |
| **Bouton secondaire** | transparent | `#A68258` | `#A68258` |
| **Carte jouable** | `#F5F2ED` | `#1A1A1A` | `#A68258` |
| **Carte grisée** | `#465D74` 50% | `#5A7A96` | - |
| **Badge Kora** | `#A68258` | `#1A1A1A` | - |
| **Alerte/Notification** | `#B4443E` | `#F5F2ED` | - |
| **Zone de jeu** | `#465D74` | - | - |
| **Modal** | `#2E3D4D` | `#F5F2ED` | `#A68258` |

### États interactifs

| État | Modification |
|------|--------------|
| **Hover/Press** | Luminosité +10% |
| **Désactivé** | Opacité 50% |
| **Sélectionné** | Bordure `#A68258` 2px |
| **Victoire** | Glow `#A68258` |
| **Défaite** | Teinte `#B4443E` |

---

## Typographie (suggestions)

| Usage | Police | Poids | Taille |
|-------|--------|-------|--------|
| **Titres** | Montserrat / Poppins | Bold (700) | 24-32px |
| **Sous-titres** | Montserrat / Poppins | SemiBold (600) | 18-20px |
| **Corps** | Inter / Roboto | Regular (400) | 14-16px |
| **Chiffres (mises)** | Montserrat | Bold (700) | Variable |
| **Valeur cartes** | Serif (Playfair) | Bold | 28-36px |

---

## Iconographie

### Style

- **Type** : Outline / Ligne fine
- **Épaisseur** : 1.5-2px
- **Coins** : Arrondis (border-radius: 4px)
- **Taille standard** : 24x24px

### Couleurs icônes

| Contexte | Couleur |
|----------|---------|
| Navigation | `#F5F2ED` |
| Actions | `#B4443E` |
| Monétaire | `#A68258` |
| Informations | `#5A7A96` |

---

## Cartes à jouer

### Design

```
┌───────────────┐
│ 7         ♠️  │  ← Valeur + Symbole (coins)
│               │
│               │
│      ♠️       │  ← Symbole central grand
│               │
│               │
│ ♠️         7  │  ← Inversé (coins)
└───────────────┘
```

### Couleurs des familles

| Famille | Couleur symbole |
|---------|-----------------|
| ♠️ Pique | `#1A1A1A` (noir) |
| ♣️ Trèfle | `#1A1A1A` (noir) |
| ♦️ Carreau | `#B4443E` (rouge) |
| ♥️ Cœur | `#B4443E` (rouge) |

### États cartes

| État | Style |
|------|-------|
| **Jouable** | Fond `#F5F2ED`, bordure `#A68258`, légère ombre |
| **Non jouable** | Fond `#465D74` 60%, désaturée |
| **Sélectionnée** | Scale 1.05, glow `#A68258` |
| **Jouée** | Animation flip vers table |

---

## Animations (suggestions)

| Action | Animation | Durée |
|--------|-----------|-------|
| Distribution cartes | Slide + fade in | 300ms |
| Jouer carte | Flip + translate | 400ms |
| Victoire | Pulse + particles dorées | 1000ms |
| Kora | Explosion + shake | 1500ms |
| Gain Kora | Count up + glow | 800ms |

---

## Espacements

| Taille | Valeur | Usage |
|--------|--------|-------|
| `xs` | 4px | Entre éléments liés |
| `sm` | 8px | Padding interne |
| `md` | 16px | Marges composants |
| `lg` | 24px | Sections |
| `xl` | 32px | Marges écran |

---

## Coins arrondis

| Élément | Radius |
|---------|--------|
| Boutons | 8px |
| Cartes | 12px |
| Modals | 16px |
| Avatars | 50% (cercle) |
| Chips/Badges | 20px |

---

## Ombres

```css
/* Carte au repos */
box-shadow: 0 2px 8px rgba(26, 26, 26, 0.15);

/* Carte hover/sélectionnée */
box-shadow: 0 4px 16px rgba(166, 130, 88, 0.3);

/* Modal */
box-shadow: 0 8px 32px rgba(26, 26, 26, 0.4);
```

---

## Résumé rapide

| Élément | Couleur |
|---------|---------|
| **Action/CTA** | `#B4443E` |
| **Argent/Premium** | `#A68258` |
| **Fond/UI** | `#465D74` |
| **Texte clair** | `#F5F2ED` |
| **Texte sombre** | `#1A1A1A` |
