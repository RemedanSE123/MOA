MOE/
│
├── frontend/                # Next.js (frontend)
│   ├── pages/                # Next.js pages (UI routes)
│   ├── components/           # Reusable UI components (Map, Charts, Forms)
│   ├── public/               # Static files (images, icons, etc.)
│   ├── styles/               # CSS / Tailwind / SCSS
│   ├── package.json
│   └── next.config.js
│
├── backend/                  # Node.js + Express (backend)
│   ├── src/
│   │   ├── routes/           # API route definitions (e.g., weather, agriculture)
│   │   ├── controllers/      # Functions that handle API logic
│   │   ├── models/           # DB models (PostGIS queries, Sequelize/Knex)
│   │   ├── services/         # GIS services (shapefile → vector tile, weather ETL)
│   │   ├── middleware/       # Auth, logging, validation
│   │   └── app.js            # Main Express app
│   ├── package.json
│   └── server.js             # Starts the backend server

