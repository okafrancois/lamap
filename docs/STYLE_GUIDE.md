# Guide de Style - Application Kora

Ce document décrit le système de design complet de l'application Kora, incluant toutes les couleurs, styles de composants, décorations et animations utilisées dans l'interface.

## 🎨 Palette de Couleurs

### Mode Clair (Light Mode)

#### Couleurs Principales
- **Background (Fond principal)** : `oklch(0.98 0.01 70)` - Fond crème inspiré des cartes de jeu traditionnelles
- **Foreground (Texte principal)** : `oklch(0.15 0.02 40)` - Texte sombre pour contraste
- **Card (Cartes/Conteneurs)** : `oklch(0.99 0.005 60)` - Cartes avec texture papier
- **Card Foreground** : `oklch(0.2 0.02 40)` - Texte sur les cartes

#### Couleurs d'Accent
- **Primary (Rouge des cartes)** : `oklch(0.52 0.18 25)` - Rouge #B4443E
  - Utilisé pour : boutons principaux, éléments d'action, focus
- **Primary Foreground** : `oklch(0.99 0 0)` - Blanc pour contraste sur primary
- **Secondary (Marron)** : `oklch(0.62 0.08 65)` - Marron #A68258
  - Utilisé pour : boutons secondaires, éléments décoratifs
- **Secondary Foreground** : `oklch(0.99 0 0)` - Blanc pour contraste sur secondary

#### Couleurs Neutres
- **Muted** : `oklch(0.92 0.02 70)` - Fond subtil pour zones secondaires
- **Muted Foreground** : `oklch(0.45 0.02 40)` - Texte sur fond muted
- **Accent** : `oklch(0.88 0.04 65)` - Marron clair pour hovers et sélections
- **Accent Foreground** : `oklch(0.15 0.02 40)` - Texte sur accent

#### Couleurs d'État
- **Destructive (Rouge alerte)** : `oklch(0.5 0.3 25)` - Rouge vif pour alertes et erreurs
- **Destructive Foreground** : `oklch(0.99 0 0)` - Blanc pour contraste

#### Bordures et Inputs
- **Border** : `oklch(0.85 0.03 65)` - Bordures marron clair
- **Input** : `oklch(0.94 0.01 70)` - Fond des champs de saisie
- **Ring (Focus)** : `oklch(0.52 0.18 25)` - Couleur du focus (rouge primary)

#### Couleurs pour Graphiques
- **Chart 1** : `oklch(0.52 0.18 25)` - Rouge #B4443E
- **Chart 2** : `oklch(0.62 0.08 65)` - Marron #A68258
- **Chart 3** : `oklch(0.45 0.05 230)` - Bleu #465D74
- **Chart 4** : `oklch(0.65 0.18 160)` - Vert émeraude
- **Chart 5** : `oklch(0.6 0.15 45)` - Orange terre

### Mode Sombre (Dark Mode)

#### Couleurs Principales
- **Background** : `oklch(0.12 0.02 230)` - Fond sombre bleu nuit avec texture
- **Foreground** : `oklch(0.95 0.01 70)` - Texte clair
- **Card** : `oklch(0.16 0.03 230)` - Cartes avec effet velours sombre
- **Card Foreground** : `oklch(0.95 0.01 70)` - Texte clair sur cartes

#### Couleurs d'Accent
- **Primary** : `oklch(0.58 0.22 25)` - Rouge des cartes lumineux #B4443E
- **Primary Foreground** : `oklch(0.98 0.01 70)` - Texte clair
- **Secondary** : `oklch(0.68 0.1 65)` - Marron doré #A68258
- **Secondary Foreground** : `oklch(0.98 0.01 70)` - Texte clair

#### Couleurs Neutres
- **Muted** : `oklch(0.25 0.02 230)` - Tons neutres sombres
- **Muted Foreground** : `oklch(0.65 0.02 70)` - Texte sur fond muted
- **Accent** : `oklch(0.35 0.05 65)` - Marron sombre pour les hovers
- **Accent Foreground** : `oklch(0.95 0.01 70)` - Texte clair

#### Couleurs d'État
- **Destructive** : `oklch(0.6 0.35 20)` - Rouge alerte lumineux
- **Destructive Foreground** : `oklch(0.98 0.01 70)` - Texte clair

#### Bordures et Inputs
- **Border** : `oklch(0.3 0.03 230)` - Bordures bleu profond
- **Input** : `oklch(0.2 0.02 230)` - Fond des champs de saisie sombre
- **Ring** : `oklch(0.58 0.22 25)` - Couleur du focus (rouge primary)

## 🎯 Texture de Fond

### Mode Clair
Le fond utilise une texture subtile inspirée des cartes avec deux dégradés radiaux :
- Dégradé 1 : `radial-gradient(circle at 25% 25%, oklch(0.52 0.18 25 / 0.03) 0%, transparent 50%)`
- Dégradé 2 : `radial-gradient(circle at 75% 75%, oklch(0.62 0.08 65 / 0.02) 0%, transparent 50%)`

### Mode Sombre
- Dégradé 1 : `radial-gradient(circle at 25% 25%, oklch(0.58 0.22 25 / 0.05) 0%, transparent 50%)`
- Dégradé 2 : `radial-gradient(circle at 75% 75%, oklch(0.68 0.1 65 / 0.03) 0%, transparent 50%)`

## 🔘 Boutons

### Variantes de Boutons

#### Default (Principal)
- **Couleur de fond** : `bg-primary` (Rouge #B4443E)
- **Couleur de texte** : `text-primary-foreground` (Blanc)
- **Hover** : `hover:bg-primary/90` (Rouge légèrement assombri)
- **Style** : Bouton principal avec effet de brillance radial

#### Secondary
- **Couleur de fond** : `bg-secondary` (Marron #A68258)
- **Couleur de texte** : `text-secondary-foreground` (Blanc)
- **Hover** : `hover:bg-secondary/80` (Marron légèrement assombri)

#### Outline
- **Bordure** : `border` (Marron clair)
- **Fond** : `bg-background` (Transparent)
- **Hover** : `hover:bg-accent hover:text-accent-foreground`
- **Mode sombre** : `dark:bg-input/30 dark:border-input dark:hover:bg-input/50`

#### Destructive
- **Couleur de fond** : `bg-destructive` (Rouge alerte)
- **Couleur de texte** : `text-white`
- **Hover** : `hover:bg-destructive/90`
- **Focus** : `focus-visible:ring-destructive/20`

#### Ghost
- **Fond** : Transparent
- **Hover** : `hover:bg-accent hover:text-accent-foreground`
- **Mode sombre** : `dark:hover:bg-accent/50`

#### Link
- **Couleur** : `text-primary` (Rouge)
- **Hover** : `hover:underline`
- **Offset** : `underline-offset-4`

### Tailles de Boutons

- **default** : `h-9 px-4 py-2` (36px de hauteur)
- **sm** : `h-8 px-3` (32px de hauteur)
- **lg** : `h-10 px-6` (40px de hauteur)
- **icon** : `size-9` (36x36px)

### Effets Interactifs

- **Active** : `scale-[0.98]` avec transition de 100ms
- **Touch** : `touch-action: manipulation` pour éviter le double-tap zoom
- **Transition** : `transition-all duration-[var(--animation-fast)]` (150ms)

### Boutons Spéciaux

#### Bouton Style Jetons (btn-chip)
- **Fond** : Dégradé radial avec primary
- **Ombre** : 
  - Inset : `inset 0 2px 4px 0 oklch(1 0 0 / 0.2)`
  - Externe : `0 2px 4px 0 oklch(0 0 0 / 0.2)`
- **Hauteur minimale** : `min-h-[48px]`

#### Bouton Jeu Principal (btn-game-primary)
- **Fond** : `bg-primary text-primary-foreground`
- **Ombre** : `shadow-lg hover:shadow-xl`
- **Effet brillance** : Overlay blanc avec animation de translation
- **Active** : `active:scale-[0.98]`

## 📦 Cartes (Cards)

### Style de Base
- **Fond** : `bg-card` (Couleur de carte)
- **Texte** : `text-card-foreground`
- **Bordure** : `border` (Marron clair)
- **Ombre** : `shadow-sm`
- **Rayon** : `rounded-xl` (12px)
- **Padding** : `py-6` avec `px-6` pour le contenu

### Effet Carte de Jeu (card-game-effect)
- **Fond** : Dégradé linéaire 135deg avec variation de luminosité
- **Ombres multiples** :
  - `0 1px 3px 0 oklch(0 0 0 / 0.1)`
  - `0 1px 2px -1px oklch(0 0 0 / 0.1)`
  - `inset 0 1px 1px 0 oklch(1 0 0 / 0.1)` (Mode clair)
- **Mode sombre** : Ombres plus prononcées avec opacité augmentée

### Structure
- **CardHeader** : `px-6` avec gap de 1.5
- **CardContent** : `px-6`
- **CardFooter** : `px-6` avec bordure supérieure optionnelle

## 🎭 Modals / Sheets

### Overlay
- **Fond** : `bg-black/50` (Noir à 50% d'opacité)
- **Animation** : Fade in/out avec `animate-in` et `animate-out`
- **Z-index** : `z-50`

### Sheet Content (Modal Mobile)
- **Fond** : `bg-background`
- **Ombre** : `shadow-lg`
- **Animation** : Slide depuis le bas avec `slide-in-from-bottom`
- **Rayon** : `rounded-t-2xl` (16px en haut)
- **Bordure** : `border-t` (Bordure supérieure)

### Sheet Header
- **Fond** : `bg-background/95` avec `backdrop-blur`
- **Support backdrop-filter** : `supports-[backdrop-filter]:bg-background/80`
- **Bordure** : `border-b`
- **Padding** : `p-4`
- **Position** : `sticky top-0 z-10`

### Bouton de Fermeture
- **Fond** : `bg-background/80` avec `backdrop-blur-sm`
- **Hover** : `hover:bg-secondary`
- **Active** : `active:scale-95`
- **Taille** : `h-10 w-10`
- **Position** : `absolute top-3 right-3`
- **Rayon** : `rounded-full`

## 🎨 Décorations

### Décorations de Coin (DecorativeCornerIcon)
- **Taille** : `h-32 w-32` (128x128px)
- **Couleur** : `rgba(251, 191, 36, 0.6)` (Ambre)
- **Opacité** : 0.2 par défaut
- **Forme** : Motif courbe avec cercle central

### Particules Flottantes (FloatingParticle)
- **Taille** : `h-2 w-2` par défaut (8x8px)
- **Couleur** : `bg-amber-400/40` (Ambre à 40%)
- **Animation** : `animate-pulse`
- **Rayon** : `rounded-full`
- **Délai** : Configurable (0s, 0.5s, 1s, 2s)

### Bordures Décoratives (DecorativeBorder)
- **Orientation verticale** : `h-24 w-1` (96x4px)
- **Orientation horizontale** : `h-1 w-24` (4x96px)
- **Dégradé** : `from-transparent via-amber-400/30 to-transparent`

### Décoration Circulaire (CircularDecoration)
- **Taille externe** : `h-8 w-8` (32x32px)
- **Taille interne** : `h-6 w-6` (24x24px)
- **Bordure** : `border-2 border-amber-400/40`
- **Fond externe** : `bg-amber-200/10`
- **Fond interne** : `bg-amber-300/30`

### Motif de Table de Jeu (GameTablePattern)
- **Lignes** : `rgba(251, 191, 36, 0.2)` avec `stroke-dasharray="5,5"`
- **Cercle central** : `rgba(251, 191, 36, 0.3)` avec `stroke-dasharray="3,3"`
- **Formes** : Losanges aux coins avec `rgba(251, 191, 36, 0.15)`

### Anneaux Animés (AnimatedRing)
- **Animation** : `animate-pulse`
- **Bordure** : `border-amber-400/20`
- **Durée** : Configurable (4s, 6s, 8s)
- **Délai** : Configurable (0s, 1s, 2s)

### Zone de Mise (betting-zone)
- **Fond** : `bg-card/80` avec `backdrop-blur-sm`
- **Bordure** : `border-2 border-dashed border-secondary/50`
- **Rayon** : `rounded-xl`
- **Padding** : `p-4`

## 🎮 Zone de Jeu (Game Area)

### Fond de Table
- **Dégradé** : `bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900`
- **Effet de profondeur** : Bordure interne `border-2 border-amber-300/30`
- **Texture** : Dégradé avec `from-emerald-600/20 to-emerald-900/40`
- **Brillance** : `bg-gradient-to-tr from-transparent via-amber-200/10 to-transparent`
- **Texture de feutre** : Opacité 30% avec dégradé émeraude

## 🃏 Cartes de Jeu (Playing Cards)

### Dimensions
- **Petit** : `32px × 45px` (ratio 2:3)
- **Moyen** : `40px × 56px`
- **Grand** : `60px × 84px`

### Styles
- **Rayon** : `rounded-lg` (8px)
- **Ombre** : `shadow-lg`
- **Transition** : `transform 150ms var(--ease-out-expo)`
- **Optimisations GPU** : `transform: translateZ(0)`, `backface-visibility: hidden`

### États Interactifs
- **Hover** : `scale(1.05) translateY(-4px)`
- **Active** : `scale(0.95)` avec transition de 50ms
- **Playable** : Animation `card-pulse` (2s infinite)

### Ombres de Carte
- **Ombre standard** : `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
- **Ombre grande** : `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- **Ombre premium** : Double `feDropShadow` avec opacités différentes

### Effets Visuels
- **Brillance** : Dégradé linéaire blanc avec opacités variables
- **Bordure dorée** : Pour les figures (J, Q, K)
- **Pattern décoratif** : Motif de bordure subtil

## ✨ Animations

### Durées
- **Fast** : `150ms` (`--animation-fast`)
- **Normal** : `300ms` (`--animation-normal`)
- **Slow** : `500ms` (`--animation-slow`)

### Courbes d'Animation
- **Ease Out Expo** : `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-out-expo`)
- **Ease In Out Smooth** : `cubic-bezier(0.4, 0, 0.2, 1)` (`--ease-in-out-smooth`)
- **Ease Spring** : `cubic-bezier(0.34, 1.56, 0.64, 1)` (`--ease-spring`)

### Animations Personnalisées

#### Card Pulse
- **Durée** : 2s
- **Type** : `ease-in-out infinite`
- **Effet** : Variation d'ombre pour les cartes jouables

#### Coin Flip
- **Durée** : 0.6s
- **Type** : `ease-in-out`
- **Effet** : Rotation 180deg sur l'axe Y

#### Float Animations
- **Float Slow** : 6-8s, mouvement subtil
- **Float Medium** : 4-6s, mouvement modéré
- **Float Fast** : 3-4s, mouvement rapide

#### Slide Up
- **Durée** : 0.3s
- **Type** : `ease-out`
- **Effet** : Translation depuis le bas avec fade

#### Fade In
- **Durée** : 0.2s
- **Type** : `ease-out`
- **Effet** : Apparition progressive

#### Shake
- **Durée** : 0.5s
- **Type** : `ease-in-out`
- **Effet** : Tremblement horizontal

#### Pulse Soft
- **Durée** : 3s
- **Type** : `ease-in-out infinite`
- **Effet** : Variation d'opacité douce

#### Shine (Brillance)
- **Durée** : 3s
- **Type** : `infinite`
- **Effet** : Dégradé qui traverse l'élément

## 📐 Espacements et Dimensions

### Rayons de Bordure (Border Radius)
- **Radius de base** : `0.75rem` (12px)
- **Radius SM** : `calc(var(--radius) - 4px)` (8px)
- **Radius MD** : `calc(var(--radius) - 2px)` (10px)
- **Radius LG** : `var(--radius)` (12px)
- **Radius XL** : `calc(var(--radius) + 4px)` (16px)

### Espacements Responsives
- **Mobile** : `px-3`, `py-2`, `gap-3`
- **Tablette** : `sm:px-4`, `sm:py-3`, `sm:gap-4`
- **Desktop** : `lg:px-6`, `lg:py-4`, `lg:gap-6`

### Padding de Conteneurs
- **Container** : `px-4 sm:px-6`
- **Card Header/Content/Footer** : `px-4 sm:px-6`
- **Game Padding** : `px-3 sm:px-4 lg:px-6`
- **Game Padding Vertical** : `py-2 sm:py-3 lg:py-4`

## 📝 Typographie

### Tailles de Titres
- **H1** : `text-2xl sm:text-3xl lg:text-4xl` (24px → 30px → 36px)
- **H2** : `text-xl sm:text-2xl lg:text-3xl` (20px → 24px → 30px)
- **H3** : `text-lg sm:text-xl lg:text-2xl` (18px → 20px → 24px)
- **H4** : `text-base sm:text-lg` (16px → 18px)

### Corps de Texte
- **Paragraphe** : `text-sm sm:text-base` (14px → 16px)
- **Leading** : `leading-relaxed`

### Tailles de Texte Spéciales
- **Game XS** : `text-[10px] leading-3`
- **Game SM** : `text-xs leading-4`
- **Game Base** : `text-sm leading-5`
- **Game LG** : `text-base leading-6`

### Fonts
- **Sans** : `var(--font-geist-sans)`
- **Mono** : `var(--font-geist-mono)`

## 🎯 Z-Index Layers

- **Base** : `0`
- **Dropdown** : `50`
- **Sticky** : `100`
- **Fixed** : `200`
- **Modal Backdrop** : `300`
- **Modal** : `400`
- **Notification** : `500`

## 📱 Safe Area Insets (PWA)

- **Top** : `env(safe-area-inset-top)`
- **Right** : `env(safe-area-inset-right)`
- **Bottom** : `env(safe-area-inset-bottom)`
- **Left** : `env(safe-area-inset-left)`

## 🎨 Scrollbar Personnalisée

### Webkit (Chrome, Safari, Edge)
- **Largeur** : `8px`
- **Track** : Fond avec `var(--background)`, rayon `4px`
- **Thumb** : `var(--primary)` (Rouge), rayon `4px`
- **Hover** : Luminosité augmentée de 5%
- **Active** : Luminosité réduite de 5%

### Firefox
- **Scrollbar-width** : `thin`
- **Scrollbar-color** : `var(--primary) var(--background)`

## 🔍 Focus Styles

- **Outline** : `outline-ring` (Rouge primary)
- **Width** : `outline-2` (2px)
- **Offset** : `outline-offset-2` (2px)
- **Ring** : `ring-ring/50` avec `ring-[3px]`

## 💎 Effets Spéciaux

### Gold Shine (Brillance Dorée)
- **Dégradé** : `linear-gradient(90deg, transparent, oklch(0.62 0.08 65 / 0.3), transparent)`
- **Animation** : Translation de -100% à 200% en 3s

### Skeleton Pulse (Chargement)
- **Fond** : `bg-muted`
- **Animation** : `animate-pulse`

### Disabled State
- **Opacité** : `opacity-50`
- **Pointer Events** : `pointer-events-none`

## 🎪 Badges

- **Padding** : `px-2 py-0.5 text-xs sm:px-2.5 sm:py-1`
- **Fond** : Utilise les couleurs du thème selon le contexte

## 🎯 Classes Utilitaires

### GPU Acceleration
- `gpu-accelerated` : `transform: translateZ(0)`, `will-change: transform`, `backface-visibility: hidden`

### Touch Manipulation
- `touch-manipulation` : `touch-action: manipulation` (évite le double-tap zoom)

### No Select
- `no-select` : Désactive la sélection de texte

### Smooth Scroll
- `smooth-scroll` : `scroll-behavior: smooth`

### Active Scale
- `active-scale` : `scale(0.98)` au clic avec transition 100ms

### Truncate
- `truncate-2` : Limite à 2 lignes avec ellipsis

## 🌈 Conversion des Couleurs OKLCH vers Hex/RGB

Pour référence, voici les conversions approximatives :

### Mode Clair
- **Primary (#B4443E)** : `oklch(0.52 0.18 25)` → RGB(180, 68, 62)
- **Secondary (#A68258)** : `oklch(0.62 0.08 65)` → RGB(166, 130, 88)
- **Background** : `oklch(0.98 0.01 70)` → RGB(250, 250, 249)

### Mode Sombre
- **Primary** : `oklch(0.58 0.22 25)` → RGB(195, 75, 68)
- **Secondary** : `oklch(0.68 0.1 65)` → RGB(185, 150, 110)
- **Background** : `oklch(0.12 0.02 230)` → RGB(20, 25, 35)

## 📋 Résumé des Couleurs Principales

### Mode Clair
| Élément | Couleur | Code |
|---------|---------|------|
| Fond | Crème | `oklch(0.98 0.01 70)` |
| Primary | Rouge #B4443E | `oklch(0.52 0.18 25)` |
| Secondary | Marron #A68258 | `oklch(0.62 0.08 65)` |
| Carte | Blanc cassé | `oklch(0.99 0.005 60)` |
| Bordure | Marron clair | `oklch(0.85 0.03 65)` |

### Mode Sombre
| Élément | Couleur | Code |
|---------|---------|------|
| Fond | Bleu nuit | `oklch(0.12 0.02 230)` |
| Primary | Rouge lumineux | `oklch(0.58 0.22 25)` |
| Secondary | Marron doré | `oklch(0.68 0.1 65)` |
| Carte | Velours sombre | `oklch(0.16 0.03 230)` |
| Bordure | Bleu profond | `oklch(0.3 0.03 230)` |

---

*Ce guide de style est basé sur l'analyse du code source de l'application Kora. Toutes les valeurs sont extraites du fichier `src/index.css` et des composants UI.*

