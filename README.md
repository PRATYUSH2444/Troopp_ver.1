# Troopp 🎒

A modern trust-first social travel platform connecting verified travelers through secure activity-based communities.

---

## Features

Every feature listed here is fully implemented and operational within the codebase:

### 1. Premium Landing Page & Showcase UI
*   **DotField Interactive Canvas**: A cursor-sensitive particle canvas grid rendering behind the hero section with smooth mouse-chasing orange glow ripples.
*   **MagicBento Grid**: An interactive premium features matrix showcasing trust features (Trust Engine, Trip Rooms, Live Safety, Verified Identity, Expense Splits) with cursor spotlight beams, hover physics, and neon corner sweeps.
*   **Activity Types Carousel**: Outlined custom SVG vector icons mapping 8 adventure classes (Trekking, Road Trip, Cycling, Camping, Night Drive, Heritage Walk, Photography Walk, Day Trip) wrapped in custom `BorderGlow` proximity sweeps, custom HSL glow coordinates, and active lift card elevations.
*   **How Troopp Works Showcase**: A 50/50 split desktop layout containing:
    *   *Left*: The stable step-by-step execution timeline detailing registration, request, coordination, and reputation loop.
    *   *Right*: An iPhone-style premium smartphone mockup (thin metallic framing, bezel alignments, glass reflection overlays, and a Dynamic Island camera notch) cycling through 4 mock screen flows (KYC Scan, Activity Feed, Trip Room chat/GPS routes, Completion badges) orbiting by 3 floating glass status badges.

### 2. Identity Verification & Authentication Onboarding
*   **Premium Stepper Indicator**: Custom `SignupStepIndicator` tracking steps with active pulsating glowing states, animated Framer Motion connectors, and SVG checkmark paths.
*   **Dark Mode Onboarding Flow**: Multi-step pages fully migrated to the premium dark styling system (`#1a2129` panels, `#212b33` inputs, `#f3f1ea` headers, custom tag selections, and datepickers).
*   **Multi-Step Onboarding**: Verify Email (verification checking), Verify Phone (SMS inputs), Verify Phone Check (OTP confirmation), and Complete Profile (bio metadata, date of birth, select tags).

### 3. Backend & Core Database Systems
*   **Secure Authentication**: Dual-token (Access Token & HttpOnly HTTP Refresh Cookie) JWT authentication system, password hashing (Bcrypt), and token-gated routers.
*   **KYC Digio Integration**: API routing structures to validate government Aadhaar and PAN credentials (+30 reputation index).
*   **Biometric Face Matching**: Schema layouts and Rekognition parameters configured for image face scans to verify user profile photos.
*   **Emergency Contact System**: Model bindings and schema properties matching contact profiles for SOS notifications (+10 reputation index).
*   **Active Count Home APIs**: High-performance database aggregate routes (`GET /api/v1/public/home`) fetching total registered users, active trips, and coverages.

---

## Tech Stack

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: Vanilla CSS, Tailwind CSS (for modular classes)
*   **Animations**: Framer Motion (AnimatePresence, spring properties, layout transitions)
*   **Communications**: Axios, Socket.io-client
*   **Routing**: React Router DOM

### Backend
*   **Platform**: Node.js (Express server)
*   **ORM / Database**: Sequelize (MySQL backend mapping)
*   **Auth**: JWT (jsonwebtoken), Bcryptjs
*   **Services**: AWS SDK (SES, Rekognition), Twilio (SMS / Verify API), Cloudinary (Image upload / Storage)
*   **Safety / Logs**: Express Rate Limit, Sentry error monitoring

---

## Folder Structure

```text
Troopp_v1/
├── .github/
│   └── workflows/              # GitHub Actions workflows
├── troopp-client/              # React Frontend Application
│   ├── public/                 # Static public assets (manifest, logos)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/           # Stepper progress, verify inputs
│   │   │   ├── landing/        # DotField, BorderGlow, MagicBento, TrooppShowcase
│   │   │   └── activity/       # Dynamic Activity Card layouts
│   │   ├── pages/              # Landing, Login, Signup, Onboarding pages
│   │   ├── context/            # AuthContext, API endpoints configuration
│   │   └── utils/              # API wrapper hooks, sound players
│   ├── package.json
│   └── vite.config.js
└── troopp-server/              # Express Backend Application
    ├── src/
    │   ├── config/             # Sequelize database bindings, configurations
    │   ├── controllers/        # Auth, User profiles, Verification business logic
    │   ├── models/             # Sequelize database schema definitions (User, EmergencyContact)
    │   ├── routes/             # Authentication & verification express router gateways
    │   └── utils/              # AWS rekognition, Twilio verifying utilities
    ├── package.json
    └── app.js
```

---

## Installation & Setup

### Prerequisites
*   Node.js (v18+ recommended)
*   MySQL Server running locally

### Local Setup Instructions

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd Troopp_v1
    ```

2.  **Configure Backend env**:
    Navigate to `troopp-server`, copy the `.env.example` template, and populate it with your local environment values (do not commit this file):
    ```bash
    cd troopp-server
    cp .env.example .env
    npm install
    ```

3.  **Run Backend (Development)**:
    Ensure your local MySQL server is active, and launch the backend server:
    ```bash
    npm run dev
    ```
    *The backend server will launch on port `5000` (Socket listener ready).*

4.  **Configure Frontend env**:
    Navigate to `troopp-client`, copy `.env.example`, and populate client configuration details:
    ```bash
    cd ../troopp-client
    cp .env.example .env
    npm install
    ```

5.  **Run Frontend**:
    Launch the Vite development hot-reloading server:
    ```bash
    npm run dev
    ```
    *The client app will launch locally on `http://localhost:5173`.*

6.  **Production Compilation**:
    Test production bundling of client bundles to guarantee compilation safety:
    ```bash
    npm run build
    ```

---

## Environment Variables Configuration

Ensure the following variables are configured in your local `.env` files for execution:

### Backend (`troopp-server/.env`)
*   `PORT` (default: `5000`)
*   `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (MySQL Database parameters)
*   `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (Hex signature keys)
*   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Media storage keys)
*   `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (AWS client credentials)
*   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` (Phone validation keys)
*   `DIGIO_CLIENT_ID`, `DIGIO_CLIENT_SECRET` (Digio identity API keys)

### Frontend (`troopp-client/.env`)
*   `VITE_API_BASE_URL` (Express server base route)
*   `VITE_SOCKET_URL` (WebSockets route)
*   `VITE_GOOGLE_MAPS_API_KEY` (Google client map key)
*   `VITE_GOOGLE_CLIENT_ID` (OAuth client token ID)
*   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN` (Firebase FCM configuration parameters)

---

## Project Status

*   **Completed**:
    *   Interactive Hero page, MagicBento grid capabilities, HSL BorderGlow activity carousel.
    *   Premium 50/50 split smartphone showcase with 4 cycled mock screens.
    *   Verify Email, Verify Phone, Verify SMS, and Profile setup in Dark theme.
    *   Signup step indicator with drawing SVG paths.
    *   Dual-token JWT middleware routers and database aggregate home statistics APIs.
*   **In Progress**:
    *   Full production pipeline testing.
*   **Planned**:
    *   Host checkout reviews, custom ledger bill-splitting features.

---

## Security & Compliance
*   **Exclusion of Secrets**: All `.env` configurations are explicitly ignored via root `.gitignore` parameters.
*   **Secure Cookie Transport**: Tokens are passed via HttpOnly cookies to defend against XSS hijacks.
*   **Secure API Requests**: Route paths check JWT authenticity validation prior to controller dispatching.

---

## License
Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
