# .eslintrc.json

```json
{
  "extends": "next/core-web-vitals"
}

```

# .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts


.env.local
.env
.env
.env

```
EADME.md

```md
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

```

# scripts\init-db.ts

```ts

import prisma from '../app/lib/db-utils';

async function main() {
  try {
    // Test connection first
    await prisma.$connect();
    console.log('Connected to database');

    // Create initial admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        id: 'auth0|admin',
        email: 'admin@example.com',
        name: 'Admin User',
        roleType: 'ADMIN'
      }
    });
    console.log('Created admin user:', adminUser);

    // Create sample crops
    const wheat = await prisma.crop.create({
      data: {
        userId: adminUser.id,
        cropName: 'Wheat',
        cropType: 'Cereal',
        cropVariety: 'Winter Wheat',
        nitrogenDemand: 180,
        nitrogenSupply: 40,
        ItShouldNotBeRepeatedForXYears: 2,
        details: {
          create: [
            { value: 'aphids', detailType: 'PEST' },
            { value: 'rust', detailType: 'DISEASE' },
            { value: 'nitrogen', detailType: 'FERTILIZER' }
          ]
        }
      }
    });
    console.log('Created sample crop:', wheat);

  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
```

# styles\globalsBot.css

```css


.nav-list {
    list-style: none;
  }
  
  .nav-link-login {
    color: inherit !important;
  }
```

# styles\header-plain-green.jpg

This is a binary file of the type: Image

# styles\Header.module.css

```css
/* .container {
  max-width: 100%;
}


.header {
  width: 100%;
 padding: 10px ; 
  top: 0;
  left: 0;
  z-index: 10;
  background: #FCCB8C;
  box-shadow: 0 0.3rem 2rem 0px rgba(1, 2, 1, 0.10) !important ;
  
}

.link {
  color: #ffffff;
  text-decoration: none;
}
.logo {
  margin-left: 15%!important;
}

.navbar {
  margin-left: 20px;
}

.navLink {
  color: #fff;
  margin-left: 20px;
  margin-right: 30px;
  text-decoration: none;
  padding: 5px;
  white-space: nowrap;
}

.navLink:hover {
  color: #ddd;
}

.signInBtn {
  color: #fff;
  background-color: rgba(108, 117, 125, 0.5); 
}

  
    
    .footer {
      box-shadow: -1px 1rem 2rem 4px rgba(1, 2, 1, 0.25) !important ;
  
      background: #FCCB8C;
      background-size: cover;
      border-radius: 0.25rem;
      width: 100%;
      color: white;
      position: relative;
      bottom: 0;
      display: flex;
     max-height: 25px;

    }
    
    .container {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    
    .nav-list {
      list-style: none;
    }
    
    .navLink {
      color: white;
      text-decoration: none;
    }
    
    .navLink:hover {
      color: #ddd;
      transition: color 0.3s ease-in-out;
    }
    
    @media (max-width: 768px) {
      .container {
        flex-direction: column;
      }
    } */
```

# styles\Home.module.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

.main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 6rem;
  min-height: 100vh;
}

.description {
  display: inherit;
  justify-content: inherit;
  align-items: inherit;
  font-size: 0.85rem;
  max-width: var(--max-width);
  width: 100%;
  z-index: 2;
  font-family: var(--font-mono);
}

.description a {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.description p {
  position: relative;
  margin: 0;
  padding: 1rem;
  background-color: rgba(var(--callout-rgb), 0.5);
  border: 1px solid rgba(var(--callout-border-rgb), 0.3);
  border-radius: var(--border-radius);
}

.code {
  font-weight: 700;
  font-family: var(--font-mono);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(25%, auto));
  width: var(--max-width);
  max-width: 100%;
}

.card {
  padding: 1rem 1.2rem;
  /* border-radius: var(--border-radius); */
  /* background: rgba(var(--card-rgb), 0); */
  border: 0;
  transition: background 200ms, border 200ms;
}

.card span {
  display: inline-block;
  transition: transform 200ms;
}

.card h2 {
  font-weight: 600;
  margin-bottom: 0.7rem;
}

.card p {
  margin: 0;
  opacity: 0.6;
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 30ch;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 4rem 0;
}

.center::before {
  background: var(--secondary-glow);
  border-radius: 50%;
  width: 480px;
  height: 360px;
  margin-left: -400px;
}

.center::after {
  background: var(--primary-glow);
  width: 240px;
  height: 180px;
  z-index: -1;
}

.center::before,
.center::after {
  content: '';
  left: 50%;
  position: absolute;
  filter: blur(45px);
  transform: translateZ(0);
}

.logo,
.thirteen {
  position: relative;
}

.thirteen {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 75px;
  height: 75px;
  padding: 25px 10px;
  margin-left: 16px;
  transform: translateZ(0);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0px 2px 8px -1px #0000001a;
}

.thirteen::before,
.thirteen::after {
  content: '';
  position: absolute;
  z-index: -1;
}

/* Conic Gradient Animation */
.thirteen::before {
  animation: 6s rotate linear infinite;
  width: 200%;
  height: 200%;
  background: var(--tile-border);
}

/* Inner Square */
.thirteen::after {
  inset: 0;
  padding: 1px;
  border-radius: var(--border-radius);
  background: linear-gradient(
    to bottom right,
    rgba(var(--tile-start-rgb), 1),
    rgba(var(--tile-end-rgb), 1)
  );
  background-clip: content-box;
}

/* Enable hover only on non-touch devices */
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    background: rgba(var(--card-rgb), 0.1);
    border: 1px solid rgba(var(--card-border-rgb), 0.15);
  }

  .card:hover span {
    transform: translateX(4px);
  }
}

@media (prefers-reduced-motion) {
  .thirteen::before {
    animation: none;
  }

  .card:hover span {
    transform: none;
  }
}

/* Mobile */
@media (max-width: 700px) {
  .content {
    padding: 4rem;
  }

  .grid {
    grid-template-columns: 1fr;
    margin-bottom: 120px;
    max-width: 320px;
    text-align: center;
  }

  .card {
    padding: 1rem 2.5rem;
  }

  .card h2 {
    margin-bottom: 0.5rem;
  }

  .center {
    padding: 8rem 0 6rem;
  }

  .center::before {
    transform: none;
    height: 300px;
  }

  .description {
    font-size: 0.8rem;
  }

  .description a {
    padding: 1rem;
  }

  .description p,
  .description div {
    display: flex;
    justify-content: center;
    position: fixed;
    width: 100%;
  }

  .description p {
    align-items: center;
    inset: 0 0 auto;
    padding: 2rem 1rem 1.4rem;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid rgba(var(--callout-border-rgb), 0.25);
    background: linear-gradient(
      to bottom,
      rgba(var(--background-start-rgb), 1),
      rgba(var(--callout-rgb), 0.5)
    );
    background-clip: padding-box;
    backdrop-filter: blur(24px);
  }

  .description div {
    align-items: flex-end;
    pointer-events: none;
    inset: auto 0 0;
    padding: 2rem;
    height: 200px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgb(var(--background-end-rgb)) 40%
    );
    z-index: 1;
  }
}

/* Tablet and Smaller Desktop */
@media (min-width: 701px) and (max-width: 1120px) {
  .grid {
    grid-template-columns: repeat(2, 50%);
  }
}

@media (prefers-color-scheme: dark) {
  .vercelLogo {
    filter: invert(1);
  }

  .logo,
  .thirteen img {
    filter: invert(1) drop-shadow(0 0 0.3rem #ffffff70);
  }
}

@keyframes rotate {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

```

# tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{css,scss,sass,less,styl}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Enable CSS Modules compatibility
  important: true,
}

```

# tailwind.config.ts

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
    },
    fontFamily: {
      sans: ['Inter var', 'sans-serif'],
    },
    
  },
  plugins: [],
};
export default config;



```

# tsconfig.json

```json
{
  "compilerOptions": {
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "target": "ES2017"
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "next-i18next.config.js"
, "app/lib/prisma.js"  ],
  "exclude": [
    "node_modules"
  ]
}

```

# types\index.ts

```ts
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface PaginationParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
  }
```

