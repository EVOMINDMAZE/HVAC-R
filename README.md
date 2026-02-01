# ThermoNeural (HVAC-R)

**ThermoNeural** is a state-of-the-art Progressive Web Application (PWA) designed for HVAC&R professionals, engineers, and students. It provides advanced tools for cycle analysis, refrigerant comparison, system troubleshooting, and professional estimation.

## 🚀 Quick Start

For detailed setup instructions, please refer to the [Developer Guide](./DEVELOPER_GUIDE.md).

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment:**
    Copy `.env.example` to `.env` and fill in your Supabase and Stripe keys.
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## ✨ Features

- **Advanced Cycle Analysis:**
  - Standard Vapor Compression Cycle
  - Cascade Cycle Analysis
  - Real-time Property Calculations (Enthalpy, Entropy, etc.)
- **Refrigerant Intelligence:**
  - Compare multiple refrigerants side-by-side
  - A2L/A3 Safety Standard Calculators
  - Interactive P-h and T-s Diagrams
- **Professional Tools:**
  - AI-Powered Troubleshooting Assistant
  - Estimate Builder for Contractors
  - Project Management & Reporting
- **Modern Tech Stack:**
  - React 18, Vite, TypeScript, Tailwind CSS
  - Supabase Auth & Database
  - Stripe Subscription Integration

## 📚 Documentation

- [**Developer Guide**](./DEVELOPER_GUIDE.md): Architecture, Tech Stack, and detailed setup.
- [**Deployment**](./DEVELOPER_GUIDE.md#5-deployment): How to build and deploy.
- [**AI Context**](./AI_ONBOARDING.md): **Start Here** for AI Agents and New Contributors.

## 🤝 Contributing

Please ensure you run `npm run format.fix` before committing changes to maintain code style consistency.

## 📄 License

Proprietary software. All rights reserved.
