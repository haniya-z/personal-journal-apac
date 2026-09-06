# Google Cloud Secret Manager & Production Configuration

This document outlines the production configuration for deploying the Astral Sanctuary application to Cloud Run with secure access to the Gemini API key via Google Cloud Secret Manager.

---

## 1. Secret Configuration

- **Secret Name:** `GEMINI_API_KEY`
- **GCP Service:** Google Cloud Secret Manager
- **Storage:** Stored as an encrypted secret payload (no hardcoded keys in code or repo).

---

## 2. Cloud Run Service Identity

Cloud Run services run under a designated service identity.
- **Default Compute Service Account:**  
  `${PROJECT_NUMBER}-compute@developer.gserviceaccount.com`
- **Dedicated Custom Service Account (Recommended for Production):**  
  `astral-sanctuary-runner@${PROJECT_ID}.iam.gserviceaccount.com`

---

## 3. Required Secret Manager Permissions

Grant the Cloud Run service identity the **Secret Manager Secret Accessor** role:

```bash
# Grant access to the service account
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

---

## 4. Where the Server Accesses the Secret

In Cloud Run, the secret is mapped directly to the container's environment variable `GEMINI_API_KEY` at runtime via the `--set-secrets` flag:

```bash
gcloud run deploy astral-sanctuary \
    --image=gcr.io/${PROJECT_ID}/astral-sanctuary:latest \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=3000 \
    --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

Within the server-side code:
- **Access Location:** `process.env.GEMINI_API_KEY` in `server/geminiService.ts` and `server.ts`.
- The secret is **never** bundled into the client build or exposed via `VITE_` prefixes.
- In local development, the secret is loaded securely from the local `.env` file via `dotenv`.

---

## 5. Security & Isolation Matrix

| Capability | Policy & Enforcement |
| :--- | :--- |
| **Authentication** | Firebase Authentication Bearer token verified in `authenticateFirebaseUser` middleware. |
| **Identity Authority** | `req.user.uid` derived exclusively from decoded token. Client-supplied UIDs are rejected/ignored. |
| **Firestore Database** | User-scoped path: `users/{uid}/**` strictly protected by `firestore.rules`. |
| **XP & Progression** | Server-authoritative engine (`server/progression.ts`). Completing tasks is idempotent. |
| **Pet Milestone** | `500+ XP` milestone locks automatic evolution and requires explicit choice among `SCHOLAR`, `ADVENTURER`, `CREATOR`. |
| **AI Isolation** | Gemini chats fetch only the isolated user's minimal context (`users/{uid}/conversations/...`). |
