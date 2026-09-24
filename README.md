# MPLADS Anti-Fraud System (Smart India Hackathon MVP)

A comprehensive, AI-driven digital public infrastructure (DPI) platform designed to track, audit, and prevent fraud in the **Members of Parliament Local Area Development Scheme (MPLADS)**. 

This project was built to address the specific vulnerabilities in the MPLADS pipeline—including work splitting, vendor syndicates, and falsified photographic evidence—using a combination of **Graph Analytics, Machine Learning, AI Computer Vision, and Blockchain Ledgering**.

---

## 🛑 The Problem
Currently, the MPLADS system relies on multi-stage human approvals across MPs, District Authorities (DCs), Contractors, and Inspectors. This creates systemic vulnerabilities:
1. **Ghost Projects & Fake Evidence:** Contractors upload fake, reused, or internet-downloaded photos to claim funds for work that was never executed.
2. **Work Splitting:** Corrupt officials split large projects (e.g., ₹1 Crore) into smaller fragments (e.g., ₹20 Lakh) to evade strict public tender (GFR) guidelines.
3. **Cartelization & Favoritism:** A network of contractors (syndicate) monopolizes projects in a specific constituency by registering multiple shell companies that share the same bank accounts or directors.
4. **Lack of Immutable Audits:** Fraudulent approvals can be hidden or modified in centralized databases, making it difficult for the CVC or CAG to prosecute offenders.

---

## 🚀 Our Solution
We have built an end-to-end, multi-role dashboard system that enforces transparency at every step of the workflow.

### 1. The 4-Stage Role Pipeline
- **MP Portal:** MPs securely propose projects against their annual ₹5 Crore statutory allocation. 
- **District Authority (DC) Portal:** DC/DM receives the project, deploys an inspector to capture a baseline **Geo-Fence** (GPS lock), and sanctions funds.
- **Contractor Portal:** Contractors upload photographic evidence of completed work.
- **Fraud Auditor Portal (CVC/CAG):** The final defense layer where AI algorithms flag anomalies for human review.

### 2. Core AI & Technical Features
* **HTML5 Live Geolocation & Reverse Geocoding:** Replaces easily-spoofed EXIF data. The Field Engineer locks a physical Day-0 Geofence, and the PWA browser grabs the live coordinates of the Contractor to calculate the Haversine distance.
* **Twilio & Bhashini (Local Alerts):** Automatically generates native-language WhatsApp voice alerts (e.g., Telugu, Hindi) for village Sarpanchs when a project is flagged as high-risk.
* **Graph Intelligence (Neo4j):** Maps IP addresses, bank accounts, and contractor profiles to automatically detect **Syndicates** and **Favoritism** in real-time.
* **Machine Learning (XGBoost):** Calculates a Fraud Vulnerability Priority Index (VPI) based on timeline anomalies, budget burn rates, and historical data.
* **Immutable Blockchain Ledger:** All auditor decisions are cryptographically anchored to prevent database tampering.

---

## 🛠️ Tech Stack
* **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Leaflet (GIS Mapping)
* **Backend:** Python, FastAPI, SQLAlchemy, SQLite (for local MVP)
* **Databases:** Neo4j (Graph Database - AuraDB)
* **Data Science / AI:** Scikit-learn (XGBoost), Pandas, Geopy
* **Communications:** Twilio Voice API

---

## 🚀 How to Run Locally

### 1. Environment Variables
Create a `.env` file in the root directory and add your keys (see `.env.example`):
```env
NEO4J_URI=neo4j+ssc://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_secure_password_here
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_token_here
```

### 2. Backend Setup
```bash
# Clone the repository
# Activate your virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install python-dotenv

# Run the FastAPI server
uvicorn backend.main:app --reload --port 8000
```
*The backend will run on `http://127.0.0.1:8000`. Swagger documentation is available at `/docs`.*

### 3. Frontend Setup
```bash
# Open a new terminal
# Navigate to the frontend directory
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
*The React app will launch on `http://localhost:5173/`.*

### ⚡ One-Click Start (Windows)
If you have already installed the dependencies, you can start both servers simultaneously by double-clicking the `start_project.bat` file in the root directory.

---

## 🎯 Usage Flow for SIH Demo
1. **Login as MP:** Check balance and recommend a new project.
2. **Login as Field Engineer (JE):** Lock the physical Day-0 Geofence location on site.
3. **Login as District Authority:** Approve the project funds based on the locked geofence.
4. **Login as Contractor:** Attempt to upload photographic evidence. HTML5 Geolocation runs a Haversine distance check against the Day-0 Geofence.
5. **Login as Fraud Auditor:** 
   - View the **Neo4j Fraud Network** graph to find vendor syndicates.
   - View the **Live Geofence Map** to see the distance discrepancy.
   - Record your final decision, securing it in the **Audit Trail** blockchain ledger.

---
*Built with ❤️ for the Smart India Hackathon.*