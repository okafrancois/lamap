# LaMap241 - Règles du Jeu (Guide Agent IA)

## Vue d'ensemble

LaMap241 est un jeu de cartes compétitif à 2 joueurs avec mise d'argent. L'objectif est de **remporter le 5ème et dernier tour** pour gagner la partie.

---

## Composition du jeu

### Cartes utilisées (20 cartes au total)

- **Valeurs en jeu** : 3, 4, 5, 6, 7, 8, 9, 10
- **Couleurs** : ♠️ Pique, ♣️ Trèfle, ♦️ Carreau, ♥️ Cœur
- **Exclusions** : As, 2, Valet, Dame, Roi de toutes couleurs + le 10♠️

### Distribution

Chaque joueur reçoit **5 cartes** au début.

---

## Mécanique de jeu

### Principe fondamental

Le jeu est une **bataille pour la main**. Celui qui a la main dicte la couleur à jouer.

### Déroulement d'un tour

1. Le joueur ayant la **main** joue une carte (choisit la couleur)
2. L'adversaire **doit répondre** avec une carte de la **même couleur** s'il en possède une
3. La carte la plus haute remporte la main pour le tour suivant
4. Si l'adversaire n'a pas la couleur demandée, il **défausse** une carte de son choix (il perd automatiquement la main)

### Règle obligatoire

**Obligation de suivre** : Un joueur ne peut PAS jouer une autre couleur s'il possède une carte de la couleur demandée.

---

## Condition de victoire

**Seul le 5ème tour compte** : Le gagnant est celui qui remporte la main au tour final (tour 5).

---

## Victoires automatiques (avant de jouer)

| Condition | Description | Gain |
|-----------|-------------|------|
| **Main faible** | Somme des cartes < 21 | Mise normale |
| **Triple 7** | 3 cartes de valeur 7 | Mise normale |

---

## Victoires spéciales (Kora)

| Type | Condition | Multiplicateur |
|------|-----------|----------------|
| **Kora simple** | Gagner le tour 5 avec un 3 | x2 |
| **Double Kora** | Gagner tours 4 ET 5 avec des 3 | x4 |
| **Triple Kora** | Gagner tours 3, 4 ET 5 avec des 3 | x8 |

---

## Système économique

### Mise et gains

- Les joueurs définissent une mise en **Kora** (jetons)
- Le gagnant reçoit **90%** de la mise totale
- La plateforme prélève **10%** de commission

### Exemple

- Mise par joueur : 100 Kora
- Mise totale : 200 Kora
- Gain vainqueur : 180 Kora
- Commission : 20 Kora

---

## Règle de priorité

Le **gagnant du match précédent** cède la main au match suivant (il joue en second).

---

## Stratégies clés

1. **Conserver les cartes hautes** pour les tours décisifs (4 et 5)
2. **Les 3 sont des atouts majeurs** en fin de partie (potentiel Kora)
3. **Défausser intelligemment** les cartes inutiles quand on n'a pas la couleur
4. **Mémoriser les cartes jouées** pour anticiper les possibilités adverses

---

## Hiérarchie des cartes (par valeur)

`10 > 9 > 8 > 7 > 6 > 5 > 4 > 3`

Note : Le 3 est la carte la plus faible mais devient stratégique pour les victoires Kora.

---

## Résumé pour l'agent

- **5 tours**, seul le dernier compte
- **Suivre la couleur** est obligatoire si possible
- **Carte haute = main** pour le tour suivant
- **Pas de couleur = défausse** (perte de main automatique)
- **3 au tour 5 = bonus Kora**
