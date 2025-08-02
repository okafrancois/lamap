# 🃏 Règles du Jeu - Kora Battle

## 📖 Principe Général

**Kora Battle** est un jeu de cartes stratégique où deux joueurs s'affrontent pour conserver la main à travers 5 tours de jeu. Le gagnant est celui qui remporte la main au tour final (tour 5).

## 🎯 Objectif

Gagner la main au **tour 5** pour remporter la partie et les **koras** (points) misés.

## 🎴 Composition du Jeu

- **Deck complet** : 52 cartes standard (4 familles × 13 valeurs)
- **Familles** : Pique (♠), Cœur (♥), Carreau (♦), Trèfle (♣)
- **Valeurs** : As (1), 2, 3, 4, 5, 6, 7, 8, 9, 10, Valet (11), Dame (12), Roi (13)
- **Mise initiale** : Chaque joueur commence avec 100 koras

## 🚀 Séquence de Jeu

### Phase 1 : Initialisation

1. **Distribution** : Chaque joueur reçoit 5 cartes aléatoires
2. **Vérifications automatiques** :
   - Si un joueur a **au moins 3 cartes de 7** → **Victoire automatique**
   - Si la somme des cartes d'un joueur < 21 → **Victoire automatique**
3. **Premier joueur** : Déterminé aléatoirement
4. **Mise** : Les joueurs misent leurs koras (optionnel pour cette version)

### Phase 2 : Tours de Jeu (5 tours maximum)

#### Tour de Jeu Standard

1. **Joueur avec la main** joue une carte de n'importe quelle famille
2. **Joueur adverse** doit répondre selon les règles :
   - **A une carte de la même famille** → OBLIGÉ de jouer cette famille
   - **N'a pas cette famille** → Peut jouer n'importe quelle carte
3. **Résolution** :
   - Si carte adverse > carte du joueur avec la main → **Adversaire prend la main**
   - Sinon → **Joueur garde la main**
4. **Passage au tour suivant**

#### Exemple de Tour

```
Tour 1: Joueur A a la main
- Joueur A joue : 7♠ (7 de Pique)
- Joueur B a des piques → DOIT jouer un pique
- Joueur B joue : 10♠ (10 de Pique)
- 10 > 7 → Joueur B prend la main

Tour 2: Joueur B a la main
- Joueur B joue : 5♥ (5 de Cœur)
- Joueur A n'a pas de cœur → Peut jouer n'importe quoi
- Joueur A joue : K♣ (Roi de Trèfle)
- Familles différentes → Joueur B garde la main
```

### Phase 3 : Fin de Partie

La partie se termine quand :

- **5 tours** sont joués → Gagnant = celui qui a la main
- **Victoire automatique** → Au moins 3 cartes de 7 ou somme < 21
- **Cartes épuisées** → Gagnant = celui qui a la main

## 🏆 Cas Spéciaux - Kora et Exploits

### Kora Simple

Gagner le **tour 5** avec un **3** (peu importe la famille) = **Double la mise**

### Double Kora (33 Export)

Gagner avec **deux 3 consécutifs** = **Triple la mise**

### Triple Kora (333)

Gagner avec **trois 3 consécutifs** = **Quadruple la mise**

## ⚖️ Règles Importantes

### Contraintes de Jeu

1. **Famille obligatoire** : Si tu as la famille demandée, tu DOIS la jouer
2. **Liberté de choix** : Si tu n'as pas la famille, joue ce que tu veux
3. **Comparaison** : Seules les cartes de même famille se comparent
4. **Main** : Le joueur avec la main décide de la famille à jouer

### Cartes Jouables

- **Avec la main** : Toutes tes cartes sont jouables
- **Sans la main** :
  - Si tu as la famille demandée → Seules ces cartes sont jouables
  - Si tu n'as pas la famille → Toutes tes cartes sont jouables

## 🎮 Séquence Complète d'une Partie

```
1. DISTRIBUTION
   Joueur A: [3♠, 7♥, J♣, 2♦, 9♠] (Somme: 32)
   Joueur B: [K♠, 5♥, 8♣, Q♦, 4♠] (Somme: 42)

2. PREMIER JOUEUR (aléatoire)
   → Joueur A commence (a la main)

3. TOUR 1
   Joueur A (main): Joue 7♥
   Joueur B: A des cœurs ? Non → Peut jouer tout
   Joueur B: Joue K♠
   Résultat: Familles différentes → Joueur A garde la main

4. TOUR 2
   Joueur A (main): Joue J♣
   Joueur B: A des trèfles ? Oui (8♣) → DOIT jouer trèfle
   Joueur B: Joue 8♣
   Résultat: 11 > 8 → Joueur A garde la main

5. TOUR 3
   Joueur A (main): Joue 2♦
   Joueur B: A des carreaux ? Oui (Q♦) → DOIT jouer carreau
   Joueur B: Joue Q♦
   Résultat: 12 > 2 → Joueur B prend la main

6. TOUR 4
   Joueur B (main): Joue 5♥
   Joueur A: A des cœurs ? Non → Peut jouer tout
   Joueur A: Joue 9♠
   Résultat: Familles différentes → Joueur B garde la main

7. TOUR 5 (FINAL)
   Joueur B (main): Joue 4♠
   Joueur A: A des piques ? Oui (3♠) → DOIT jouer pique
   Joueur A: Joue 3♠
   Résultat: 4 > 3 → Joueur B garde la main

   🏆 JOUEUR B GAGNE LA PARTIE !
```

## 🎯 Points Clés pour l'Engine

1. **Distribution intelligente** : Vérifier les sommes < 21
2. **Gestion des contraintes** : Famille obligatoire vs liberté
3. **Suivi de la main** : Qui décide, qui subit
4. **Comptage des tours** : Maximum 5 tours
5. **Détection des exploits** : Kora, 33, 333
6. **État des cartes** : Propriété `jouable` dynamique

---

_Version 1.0 - Game Engine Kora Battle_
