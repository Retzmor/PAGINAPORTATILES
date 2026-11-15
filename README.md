# 💻 TuPortátil.co — Comparador Inteligente de Portátiles (Colombia)

Un comparador y recomendador de portátiles para el mercado colombiano pensado especialmente para **usuarios no técnicos** (como madres, padres, estudiantes o emprendedores) que desean comprar un equipo en **Mercado Libre Colombia** sin enredarse entre especificaciones confusas.

---

## 🎯 Filosofía de Producto (Diseño Centrado en Humanos)
En lugar de forzar al usuario a descifrar códigos como `i5-1235U`, `DDR4` o `NVMe M.2`:
1. **Perfiles de uso reales:**
   - 📚 *Estudio y Oficina Básica:* Clases virtuales, Word, Excel, Zoom, YouTube y Netflix.
   - 💼 *Multitarea y Trabajo Fluido:* Teletrabajo, decenas de pestañas abiertas, videollamadas fluidas y software contable/administrativo.
   - 🎮 *Alto Rendimiento / Gaming / Diseño:* Edición de video 4K, Photoshop, arquitectura, render 3D y videojuegos.
2. **Explicaciones en lenguaje cotidiano:**
   - **Memoria RAM:** "El tamaño del escritorio" (más cosas abiertas al tiempo sin ralentizarse).
   - **Disco SSD:** "Adiós al relojito de espera" (el portátil enciende en 10 segundos).
   - **Procesador:** "El motor del automóvil" (ciudad vs. carretera vs. carreras).
3. **Comparador Lado a Lado (Side-by-Side):** Permite elegir hasta 3 equipos y destaca visualmente cuál tiene el mejor precio, más memoria y procesador más rápido.
4. **Moneda local (COP) y enlaces de afiliados:** Precios en Pesos Colombianos con tags listos para monetización mediante afiliados de Mercado Libre (`matt_tool`).

---

## 🏗️ Arquitectura y Estructura del Proyecto

```
PaginaPortatiles/
├── backend/
│   └── scraper.js          # Scraper en Node.js (ESM) + analizador semántico regex + dataset resiliente
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Barra superior con logo, acceso a guía y botón comparador
│   │   ├── Hero.tsx             # Portada empática, buscador y botones rápidos de perfiles
│   │   ├── FilterBar.tsx        # Filtros por perfil, rangos COP, marcas y ordenamiento
│   │   ├── ProductCard.tsx      # Tarjeta de producto con chips amigables y enlace afiliado
│   │   ├── ComparisonModal.tsx  # Modal comparativo lado a lado (hasta 3 equipos)
│   │   ├── GuideModal.tsx       # Diccionario explicativo para no técnicos
│   │   └── Footer.tsx           # Aviso de afiliados, garantía de Mercado Libre y créditos
│   ├── data/
│   │   └── portatiles.json      # Base de datos local generada por el scraper
│   ├── types/
│   │   └── laptop.ts            # Interfaces TypeScript
│   ├── utils/
│   │   └── formatters.ts        # Formateadores de moneda COP y temas visuales
│   ├── App.tsx                  # Componente principal interactivo
│   ├── index.css                # Estilos base con Tailwind CSS
│   └── main.tsx                 # Entrada React 18
├── index.html                   # HTML base optimizado para SEO
├── package.json                 # Scripts y dependencias
├── tailwind.config.js           # Configuración de colores y tipografía
├── tsconfig.json                # Configuración TypeScript
└── vite.config.ts               # Bundler Vite
```

---

## ⚙️ Requisitos Previos
- **Node.js**: v18 o superior (probado en Node v24).
- **npm** o **pnpm**.

---

## 🚀 Puesta en Marcha (Paso a Paso)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar el Scraper y Analizador Semántico
Este comando conecta con Mercado Libre Colombia, extrae productos, procesa marcas, procesadores, memorias y almacena los resultados clasificados en `src/data/portatiles.json`:
```bash
npm run scrape
```

> **Nota de Resiliencia:** Mercado Libre cuenta con sistemas anti-bot que en ocasiones solicitan verificación de tráfico. El scraper implementa un motor de respaldo con un catálogo certificado de portátiles colombianos reales para asegurar que tu aplicación **siempre** cuente con datos actualizados y funcionales.

### 3. Levantar el entorno de desarrollo
Inicia el servidor local de desarrollo con recarga rápida (HMR):
```bash
npm run dev
```

Abre en tu navegador la URL que indique la consola:
👉 `http://localhost:5173`

---

## 🛠️ Tecnologías Utilizadas
- **Frontend:** React 18, Vite, TypeScript.
- **Estilos:** Tailwind CSS, Lucide React (iconografía moderna).
- **Backend / Scraping:** Node.js (ES Modules), Axios, Cheerio.
- **Procesamiento Semántico:** Expresiones regulares adaptativas para categorización por hardware y perfiles de uso.

