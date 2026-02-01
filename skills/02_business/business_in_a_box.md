---
name: Business in a Box Model
description: Codifies the "Business in a Box" offer: Community membership includes App and n8n microserver access.
---

# Business in a Box Model

This skill defines the core product offering. The "App" is just one tool in the Member's toolbox.

> **Architecture Split**: 
> 1. **App**: Shared SaaS (Supabase Cloud + Netlify).
> 2. **Heavy Calcs**: Python/Go Engine on **Render**.
> 3. **Automation**: Private Docker Instance on **Vultr** (Member Node).


## 1. The Offer Bundle
*   **Primary Product**: Monthly Subscription to the **Community**.
*   **Price**: ~$199/month (Platform: Skool).
*   **Included Assets**:
    1.  **Community Access**: Discussion, learning, networking.
    2.  **HVAC-R Pro App**: White-labeled usage for the Member to run their business.
    3.  **Automation Server**: A personal n8n microserver ($5/m value) for custom workflows.

## 2. The Member Persona (Owner)
The user of this app is an **HVAC Business Owner** (or aspiring one).
*   **Goal**: To serve *their* residential/commercial clients efficiently.
*   **Need**: They need "Tools" (App) + "Systems" (n8n) + "Guidance" (Community).

## 3. Integration Logic
*   **Authentication**:
    *   Ideally, "Login with Skool" or an invite link sent after Skool checkout.
    *   App Role: `Owner`.
*   **n8n Provisioning**:
    *   The App should likely have a "My Automation Server" settings page.
    *   It should store the URL/API Key of the member's private n8n instance.
    *   The App sends webhooks to *that* specific n8n instance for events (e.g., "New Job Created" -> Member's n8n -> Member's SMS provider).

## 4. Development Implications
*   **No "Freemium" App**: The App is a paid benefit of the Community. Access is binary (Member vs Non-Member).
*   **White Labeling**: The App needs to look like *the Member's* business to *their* clients.
    *   *Feature*: "Upload Your Logo" (replaces App logo on Client Portal).
    *   *Feature*: "Your Company Name" on PDF reports.
