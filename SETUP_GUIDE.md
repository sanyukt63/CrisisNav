# 🚀 Full Project Setup Guide

Welcome to the **Crisis Navigation System**! 🔐 This guide will walk you through the 10-minute professional setup required to get your authentication and database fully live.

---

## 🛠️ Phase 1: Supabase Configuration

### 1. Create Your Project
- Sign up at [Supabase.com](https://supabase.com/).
- Create a new project called **"CrisisNav"**.

### 2. Set Your API Keys
Open **[`supabase.js`](file:///a:/hack%20horizon/prototype/supabase.js)** in your editor and replace the placeholders:
```javascript
const SUPABASE_URL = 'https://your-project.id.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'
```

### 3. Initialize the Database
1.  Go to the **SQL Editor** in your Supabase Dashboard.
2.  Click **"New Query"**.
3.  Copy and paste the entire content of **[`schema.sql`](file:///a:/hack%20horizon/prototype/schema.sql)**.
4.  Click **Run**.
> [!TIP]
> This creates the `profiles` table and sets up **Row Level Security (RLS)** so users can only see their own data.

---

## 🌈 Phase 2: Google OAuth Integration

### 1. Google Cloud Console
1.  Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2.  Select your project and go to **APIs & Services > Credentials**.
3.  Create an **OAuth 2.0 Client ID** (Web application).
4.  **Authorized Redirect URIs:** Add the URI from your Supabase Auth settings:
    `https://your-project-id.supabase.co/auth/v1/callback`

### 2. Supabase Provider Settings
1.  Go to **Authentication > Providers** in Supabase.
2.  Select **Google** and toggle it **ON**.
3.  Paste your **Client ID** and **Client Secret** from Google.
4.  Save changes.

---

## 🚦 Phase 3: Running Locally

### 1. Start the Server
Open your terminal in the `prototype` directory and run:
```bash
node server.js
```

### 2. Access the App
Open your browser to:
[**http://localhost:3001**](http://localhost:3001)

---

## 🧪 Verification Checklist

- [ ] **Email Sign Up:** Create an account and verify it in the **Supabase > Auth** tab.
- [ ] **Google Login:** Test the "Sign in with Google" button.
- [ ] **Profile Save:** Update your name on the **Profile** page and check the **Supabase > Table Editor > profiles** tab to see it saved!

---

**Great luck with your hackathon!** 🏆
