# Technical Architecture

This document outlines the technical details, architecture, and setup instructions for **Crastinat**.

## System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (Vite)"]
        UI[User Interface]
        AuthSDK[Firebase Auth SDK]
        DBSDK[Firebase Realtime DB SDK]
    end

    subgraph Server ["Backend (Node/Express)"]
        API[API Endpoint /api/chat]
        Gemini[Gemini AI Client]
        Tools[Tool Definitions]
        FBAdmin[Firebase Admin SDK]
    end

    subgraph Cloud ["Google Cloud & Firebase"]
        FirebaseAuth[Firebase Authentication]
        RTDB[(Realtime Database)]
        GeminiAPI[Gemini Pro API]
        GCalAPI[Google Calendar API]
    end

    %% User Interaction
    User((User)) -->|Interacts| UI
    UI -->|Google Sign-In| AuthSDK
    AuthSDK -->|Verify Creds| FirebaseAuth
    
    %% Realtime Data Sync
    UI -->|Listen for Changes| DBSDK
    DBSDK <-->|Sync Schedule| RTDB

    %% Chat & AI Flow
    UI -->|Send Command + Tokens| API
    API -->|Verify ID Token| FBAdmin
    FBAdmin -->|Check Token| FirebaseAuth
    
    API -->|Prompt| Gemini
    Gemini -->|Process| GeminiAPI
    GeminiAPI -->|Function Call| Tools
    
    %% Tool Execution
    Tools -->|Read/Write| RTDB
    Tools -->|Sync Events| GCalAPI
    
    %% Response
    Tools -->|Result| API
    API -->|AI Reply| UI
```

## Features

-   **Timeline Visualization**: Horizontal scrolling timeline for daily activities.
-   **AI Assistant**: Chat with Gemini to add, update, or remove events using natural language (e.g., "Schedule lunch at 12pm").
-   **Google Calendar Sync**: Events added via the app appear in your Google Calendar and vice versa.
-   **Realtime Updates**: Changes reflect instantly across devices using Firebase.
-   **Secure Authentication**: Google Sign-In via Firebase Auth.

## Setup Instructions

### Prerequisites
- Node.js installed
- Google Cloud Project with Calendar API enabled
- Firebase Project with Auth & Realtime Database enabled

### Live Deployment
The backend is deployed on Render: [https://to-do-iun8.onrender.com](https://to-do-iun8.onrender.com)
The frontend is configured to point to this URL in `frontend/src/pages/Dashboard.jsx`.

### Installation & Local Development

1.  **Clone the repository**
2.  **Using Yarn/NPM**:
    - In `backend/`: Run `npm install` and `npm start`.
    - In `frontend/`: Run `npm install` and `npm run dev`.

3.  **Environment Variables**:
    - **Backend**: Create `.env` with `GEMINI_API_KEY`. Render uses "Secret Files" for `serviceAccountKey.json`.
    - **Frontend**: Configure `firebase-config.js` in `src/`.
