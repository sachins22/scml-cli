# 🚀 SCML Framework (Secure Custom Markup Language)

SCML ek modern, lightweight aur strict markup language framework hai jo **Node.js** par built hai. Iska vision web development ko mobile-app development (React Native style) jitna fast, clean aur secure banana hai.

---

## ✨ Key Features

- **🚫 Strict Security:** Ye compiler kisi bhi standard HTML tag (`div`, `h1`, `p`, etc.) ko block karta hai. Sirf authorize kiye gaye SCML tags hi run honge.
- **📱 Mobile-App Syntax:** Web layout banane ke liye React Native jaisa logic (e.g., `<Row>`, `<Colume>`, `<TextButton>`).
- **📦 Zero-Junk Build:** `scml build` command seedha live deploy karti hai (Surge/Web), bina local storage mein `.html` files ka kachra jama kiye.
- **⚡ Hot Reload:** Development mode mein code change karte hi browser apne aap refresh ho jata hai.
- **🎨 JS-in-SCML Styling:** Styles ko JavaScript objects ki tarah likhein (camelCase support).

---

## 🛠️ System Architecture

1. **Parser:** Aapke `.scml` file se custom tags ko scan karta hai.
2. **Security Shield:** Unauthorized HTML tags ko remove karta hai.
3. **Style Engine:** CamelCase styles ko Standard Kebab-case CSS mein convert karke inject karta hai.
4. **Compiler:** Sab kuch merge karke ek final optimized HTML5 document generate karta hai.

---

## Installation
Install the SCML CLI globally via npm:
```bash
npm install -g @scml-org/cli

## Usage
1. Create a project: `npx @scml-org/cli create my-app`
2. Run dev server: `scml run`
3. Build & Deploy: `scml build`
