# 🚀 Guide d'Utilisation Rapide - Nouvelles Fonctionnalités

Ce guide vous aidera à utiliser rapidement les nouvelles fonctionnalités ajoutées au système.

---

## 📖 Table des Matières

1. [Réorganisation des UEs](#1-réorganisation-des-ues)
2. [Export/Import de Thèmes](#2-exportimport-de-thèmes)
3. [Mémorisation Automatique du Fichier Excel](#3-mémorisation-automatique-du-fichier-excel)
4. [Génération Multi-Semestres](#4-génération-multi-semestres)

---

## 1. ⬆️⬇️ Réorganisation des UEs

### Comment réorganiser l'ordre des UEs ?

1. **Accéder à la configuration**
   - Allez dans `Configuration Académique`
   - Sélectionnez une configuration de classe
   - Cliquez sur le bouton `Modifier`

2. **Réorganiser les UEs**
   - Dans l'onglet `Semestres & Structure`
   - Vous verrez **4 boutons** à côté de chaque UE :
     - `⏫` : Déplacer en **première** position
     - `⬆️` : Déplacer **vers le haut**
     - `⬇️` : Déplacer **vers le bas**
     - `⏬` : Déplacer en **dernière** position

3. **Sauvegarder**
   - Cliquez sur `Enregistrer` en haut
   - L'ordre est maintenant sauvegardé !

### 💡 Astuces
- Les boutons sont désactivés quand l'action n'est pas possible (ex: déjà en première position)
- L'ordre défini sera utilisé dans tous les relevés générés
- Testez avec une prévisualisation avant génération massive

---

## 2. 🎨 Export/Import de Thèmes

### Comment exporter un thème ?

1. **Accéder à la configuration**
   - `Configuration Académique` → Sélectionnez une classe → `Configuration Avancée`

2. **Exporter le thème**
   - Dans la section `Thème personnalisé`
   - Cliquez sur le bouton `Exporter` (📥)
   - Un fichier JSON sera téléchargé : `theme_NomClasse_DATE.json`

### Comment importer un thème ?

1. **Accéder à la configuration**
   - `Configuration Académique` → Sélectionnez une classe → `Configuration Avancée`

2. **Importer le thème**
   - Dans la section `Thème personnalisé`
   - Cliquez sur le bouton `Importer` (📤)
   - Sélectionnez votre fichier JSON de thème
   - Le thème est appliqué instantanément !

### 💡 Astuces
- Créez une bibliothèque de thèmes pour votre institution
- Les thèmes sont compatibles entre configurations
- Nommez vos fichiers de manière explicite : `theme_licence_info.json`

---

## 3. 💾 Mémorisation Automatique du Fichier Excel

### Comment ça marche ?

**C'est automatique !** 🎉

1. **Première utilisation**
   - Importez votre fichier Excel
   - Faites la correspondance des colonnes
   - Générez vos relevés

2. **Le système sauvegarde automatiquement :**
   - Le nom du fichier Excel
   - Toutes les correspondances (EC ↔ Colonnes)
   - Les mappings de sessions

3. **Prochaine utilisation**
   - Importez le **même fichier Excel**
   - Le système détecte le fichier et **restaure automatiquement** toutes les correspondances !
   - Vous voyez un **badge bleu** "Fichier mémorisé" avec les détails

### Où voir les informations mémorisées ?

Dans l'onglet `Configuration` de la génération de relevés, vous verrez :

```
📄 Fichier mémorisé : notes_L1_S1.xlsx
Dernière utilisation : 13/01/2025 à 14:30
• Mapping sauvegardé : 12 EC(s)
[Auto-mapping activé]
```

### 💡 Astuces
- Plus besoin de refaire les correspondances à chaque fois !
- Le système vérifie le **nom du fichier** pour restaurer le mapping
- Si vous renommez le fichier, les correspondances ne seront pas restaurées

---

## 4. 📚 Génération Multi-Semestres

### Comment générer les relevés de plusieurs semestres ?

1. **Préparer les données**
   - Importez un fichier Excel contenant les notes de **tous les semestres**
   - Sélectionnez votre configuration de classe
   - Complétez la correspondance des colonnes

2. **Accéder à la génération multi-semestres**
   - Allez dans l'onglet `Multi-semestres` (icône 📚)
   - Vous verrez la liste de tous les semestres disponibles

3. **Sélectionner les semestres**
   - Cochez les semestres dont vous voulez générer les relevés
   - Ou cliquez sur `Tout sélectionner` pour tous les prendre
   - Le compteur affiche : `X / Y sélectionné(s)`

4. **Générer**
   - Cliquez sur `Générer les relevés (X semestres)`
   - Le système génère tous les relevés et les organise automatiquement

### Structure du ZIP généré

```
releves_multi_semestres_2025-01-13.zip
├── Semestre 1/
│   ├── DUPONT_Jean_MAT001_L1_S1_Informatique_releve.pdf
│   ├── MARTIN_Marie_MAT002_L1_S1_Informatique_releve.pdf
│   └── ...
├── Semestre 2/
│   ├── DUPONT_Jean_MAT001_L1_S2_Informatique_releve.pdf
│   └── ...
└── Semestre 3/
    └── ...
```

### 💡 Astuces
- Vérifiez que votre fichier Excel contient **toutes les colonnes** pour tous les semestres
- Commencez par tester avec 1-2 semestres
- La génération peut prendre du temps selon le nombre d'étudiants et de semestres

---

## 🎯 Scénarios d'Utilisation Courants

### Scénario 1 : Configuration initiale d'une nouvelle filière

1. Créez la configuration de classe
2. Ajoutez les semestres, UEs et ECs
3. Réorganisez l'ordre des UEs selon vos besoins
4. Créez un thème personnalisé
5. **Exportez le thème** pour le réutiliser

### Scénario 2 : Génération régulière de relevés

1. Importez votre fichier Excel habituel
2. Le système **restaure automatiquement** le mapping
3. Sélectionnez les étudiants (ou tous)
4. Générez les relevés
5. C'est tout ! ✅

### Scénario 3 : Génération de fin d'année

1. Importez le fichier Excel avec tous les semestres
2. Allez dans l'onglet **Multi-semestres**
3. Sélectionnez tous les semestres
4. Générez une archive complète
5. Téléchargez le ZIP organisé par semestres

### Scénario 4 : Partage de configuration entre années

1. Exportez le thème de l'année N
2. Créez la configuration pour l'année N+1
3. **Importez le thème** exporté
4. Ajustez si nécessaire
5. Gagnez du temps ! ⚡

---

## 🔍 Vérification Rapide

### Checklist avant génération

- [ ] Configuration de classe créée et sauvegardée
- [ ] Semestres, UEs et ECs configurés
- [ ] Ordre des UEs défini (si nécessaire)
- [ ] Thème personnalisé appliqué (optionnel)
- [ ] Fichier Excel importé
- [ ] Correspondances des colonnes complétées ou restaurées
- [ ] Aperçu vérifié (au moins 1 relevé)

### En cas de problème

**Le mapping n'est pas restauré automatiquement ?**
- Vérifiez que le nom du fichier Excel est identique
- Regardez si le badge "Fichier mémorisé" s'affiche
- Refaites le mapping manuellement si nécessaire

**Les UEs ne s'affichent pas dans le bon ordre ?**
- Vérifiez que vous avez sauvegardé après réorganisation
- Prévisualisez un relevé pour confirmer

**L'import de thème échoue ?**
- Vérifiez que c'est bien un fichier JSON valide
- Assurez-vous qu'il a été exporté depuis le système

**La génération multi-semestres ne fonctionne pas ?**
- Vérifiez que tous les semestres ont des UEs et ECs
- Assurez-vous que le fichier Excel contient toutes les colonnes nécessaires
- Testez d'abord avec un seul semestre

---

## ⌨️ Raccourcis Clavier

- `Ctrl+P` : Prévisualiser un relevé
- `Ctrl+G` : Générer les relevés
- `Esc` : Retour à l'onglet Configuration

---

## 📞 Support

Pour toute question ou problème :

1. Consultez la **documentation complète** : `NOUVELLES_FONCTIONNALITES.md`
2. Vérifiez les **logs de la console** en mode développement
3. Contactez le support technique

---

## 🎓 Ressources Complémentaires

- **Documentation complète** : `NOUVELLES_FONCTIONNALITES.md`
- **Types TypeScript** : `src/components/organisms/configs/types.ts`
- **Composant Multi-Semestres** : `src/components/organisms/receipts/MultiSemesterGenerator.tsx`

---

*Guide créé le 13/01/2025*
*Version du système : 2.0*

---

## 🌟 Points Clés à Retenir

1. ⬆️⬇️ **Réorganisez facilement** les UEs avec les boutons de déplacement
2. 🎨 **Exportez/Importez** vos thèmes pour les réutiliser
3. 💾 **Le mapping est automatique** quand vous réimportez le même fichier
4. 📚 **Générez massivement** les relevés de plusieurs semestres en un clic

**Bonne utilisation !** 🚀
