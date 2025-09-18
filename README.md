# Analyse de l’entropie et de la redondance des mots de passe

Ce document explique le fonctionnement du composant Vue fourni, qui évalue la **force** et la **redondance** d’un mot de passe.

---

## 1. Entropie globale

### Définition
L’entropie d’un mot de passe mesure sa quantité d’information, en bits.

- On estime d’abord la taille de l’alphabet possible (`N`).
- Chaque caractère apporte alors `log2(N)` bits.
- L’entropie totale ≈ `longueur × log2(N)`.

### Exemple
- Mot de passe `apd45!D`
- Alphabet détecté : minuscules (26) + majuscules (26) + chiffres (10) + symboles (33) = 95
- `log2(95) ≈ 6,57 bits`
- Longueur = 7
- Entropie ≈ 46 bits

Un seuil de 60 bits est souvent choisi comme minimum.

---

## 2. Redondance

### Idée
La redondance reflète **les répétitions et régularités** dans un mot de passe.  
Formule de base (Shannon) :

```
R = 1 - (H_eff / log2(k))
```

- `k` = nombre de symboles distincts
- `H_eff` = entropie effective par caractère
- `R` = 0 % (aucune redondance) → 100 % (très redondant)

---

## 3. Trois composantes

Pour obtenir une redondance logique, on combine trois indicateurs :

### R1 – Manque de diversité
- Calcule l’entropie empirique `H_emp` à partir des fréquences des caractères.
- Si un caractère est surreprésenté (`aaaaaaaa`), `H_emp` chute.
- `R1 = 1 - H_emp/log2(k)`

### R2 – Dépendances séquentielles
- Analyse les transitions entre caractères (Markov ordre 1).
- Si chaque caractère annonce presque toujours le suivant (ex: `abababab`), l’entropie conditionnelle baisse.
- `R2 = 1 - H_rate/log2(k)`

### R3 – Répétition de blocs
- Détecte explicitement les sous-chaînes répétées contiguës.
- Exemple `bonbon` = `bon`×2 → couverture = 100 %.
- Exemple `aaaaaaaa7!` → 6 `a` sur 8 caractères = 75 %.
- `R3 = taille_bloc_repeté / longueur`

---

## 4. Score final

Le score de redondance est calculé comme suit :

```
Redondance = max(R3, 0.3·R1, 0.2·R2)
```


- R3 est prioritaire (répétitions franches).
- R1 et R2 sont pondérés pour rester en appoint.

---

## 5. Exemples

| Mot de passe     | Résultat attendu  |
|------------------|-------------------|
| `aaaaaaaaaa`     | 100 % redondance  |
| `bonbon`         | 100 % redondance  |
| `aaaaaaaa7!`     | ≈ 75 %            |
| `kZfvns72fj!`    | ≈ 0 %             |
| `kylianlebg`     | Faible redondance |

---

## 6. Utilisation pratique

Dans l’UI :
- La **ProgressBar** montre la redondance en %.
- Vert = acceptable (≤ 20 %).
- Rouge = trop de redondance.

---

## 7. Compte administrateur par défaut

Un compte **admin** est disponible par défaut pour accéder au tableau de bord :

- **Nom d’utilisateur** : `admin`  
- **Mot de passe** : `Admin#123456`  

⚠️ Pensez à modifier ce mot de passe dans un environnement réel pour des raisons de sécurité.

---

## 8. Expiration de la base de données

La base de données utilisée dans ce projet est temporaire.  
Elle **expire automatiquement le 17 octobre**.  

---

## 9. Conclusion

Ce système combine :
- Entropie globale pour la **force brute**.
- Redondance pour la **variété réelle**.

Un bon mot de passe doit avoir :
- Entropie ≥ 60 bits
- Redondance ≤ 20 %
