# MARSWALK — Interplanetary Survival Guide: Martian Map
**NASA Space Apps Challenge 2026** • **Team_Cyborgs** (Dhaka, Bangladesh)

MARSWALK is an interactive Martian surface mapping and interplanetary survival platform that unifies NASA orbital datasets, MOLA topographic cross-sections, and real-time mission telemetry into a unified mission-control interface.

---

## Live Architecture
- **Frontend:** React + TypeScript + Vite (hosted on Netlify)
- **Backend & Database:** FastAPI + Supabase PostgreSQL (pre-connected to our live cloud API—no local database or Python setup required)

---

## Local Hosting Instructions

Because the frontend connects directly to our hosted backend and Supabase database, you only need **Node.js** to run the application locally.

### Prerequisites
- **Node.js (v18 or higher)** and **npm** installed on your system.

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd nasa-spaceapp-hackathon
```

### Step 2: Install Dependencies
Install all required React and Vite packages:
```bash
npm install
```

### Step 3: Start the Local Development Server
Run the Vite development server:
```bash
npm run dev
```

Once started, open the local URL shown in your terminal (typically **`http://localhost:5173`**) in your browser to explore MARSWALK with full live database and telemetry support.

---

## License & Submission
Developed by **Team_Cyborgs** for the NASA Space Apps Challenge 2026. All rights reserved.