# WanoKuni SRS - Application React

Application de révision espacée (SRS) fidèle à WanoKuni pour l'apprentissage des kanji japonais.

## 🚀 Installation locale

```bash
npm install
npm start
```

## 📱 Déploiement sur Vercel

### Méthode 1: Via GitHub (Recommandée)

1. **Push le code sur GitHub :**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/wanokuni-srs.git
git push -u origin main
```

2. **Connecter à Vercel :**
- Va sur [vercel.com](https://vercel.com)
- "New Project" → Importe depuis GitHub
- Sélectionne ton repo `wanokuni-srs`
- Deploy automatique !

### Méthode 2: Upload direct

1. **Build le projet :**
```bash
npm run build
```

2. **Upload sur Vercel :**
- Va sur [vercel.com](https://vercel.com)
- Drag & drop le dossier `build/`

## 📱 Fonctionnalités

- ✅ **SRS authentique** (8 stages, timings exacts WanoKuni)
- ✅ **Responsive design** (mobile + desktop)
- ✅ **PWA ready** (installable sur mobile)
- ✅ **Offline storage** (localStorage)
- ✅ **Audio support** (URLs WanoKuni)
- ✅ **Déblocage automatique** (radical → kanji → vocabulaire)

## 📊 Structure des données

Upload du fichier JSON généré par le parser WanoKuni avec la structure :
```json
{
  "radicals": [...],
  "kanji": [...], 
  "vocabulary": [...],
  "relationships": {...}
}
```

## 🎯 Utilisation

1. **Charger les données** (JSON structuré)
2. **Dashboard** → voir les stats SRS
3. **Révisions** → sessions d'apprentissage
4. **Progression automatique** par niveaux
