---
name: sih-vigil-ai-master-plan
description: The master architecture, current progress, and 36-hour execution strategy for the Smart India Hackathon (SIH) VIGIL-AI project.
---

# VIGIL-AI: Smart India Hackathon Master Plan

## 1. Project Context
*   **Goal:** Catch MPLADS corruption (fake photos, GPS spoofing, shell company syndicates).
*   **Actors:** MP (Recommends), DA (Sanctions/Locks Baseline), Contractor (Uploads Evidence), Auditor (Blocks/Approves), Sarpanch (Receives Alerts).

## 2. Currently Built (The Core MVP)
*   **Frontend (React/Tailwind):** High-Risk Auditor Dashboard, Project Detail Modal with Fraud Chain mapping, Contractor portal with file upload UI.
*   **Backend (FastAPI/SQLite):** Bootable REST API, Blockchain verification logging.
*   **Image Processing (Python/PIL):** Live extraction of hidden EXIF GPS coordinates from uploaded JPEG files.
*   **Mock Data:** "Golden JSON" containing the perfect story for project `P00059973` to guarantee a flawless live demo.

## 3. The 36-Hour Hackathon Roadmap ("The Flex Features")
When the hackathon begins, the agent must guide the user to implement the following technologies defined in the Architecture PPT:
1.  **Neo4j Graph DB:** Spin up a local Neo4j instance. Write Cypher queries to map Contractor syndicates (shared IPs, Bank Accounts) instead of hardcoding the network graph.
2.  **Machine Learning (Pandas/Scikit-Learn):** Train a real XGBoost or Random Forest model to generate the Vulnerability Priority Index (VPI).
3.  **Explainability (SHAP):** Integrate the SHAP library to visually explain to the Auditor *why* the AI flagged the project.
4.  **Computer Vision (OpenCV/GenAI):** Verify the actual *contents* of the photo (e.g., "Is this a road?") to prevent contractors from taking pictures of empty dirt patches at the correct GPS location.
5.  **Real-world Integration (Twilio):** Write a Python script to send a real SMS/WhatsApp alert to a phone when fraud is detected.

## 4. Pitch Talking Points (To Remember)
*   **The Feedback Loop (Human-in-the-Loop):** The AI flags a project -> Human Auditor verifies it (True/False Positive) -> The decision is saved -> The ML model automatically retrains at the end of the month based on human corrections to improve accuracy over time.

