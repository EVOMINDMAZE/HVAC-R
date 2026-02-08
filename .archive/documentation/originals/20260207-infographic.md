# HVAC-R Project Infographic Schematic

Since the visual generation service is currently at capacity, here is a structural schematic of the project's architecture and feature set, designed to be visualized as a system map.

```mermaid
graph TD
    User((Technician/User))
    
    subgraph "Core Pillars"
        Calc[Technical Calculators]
        JobM[Job Management]
        Risk[Risk Shield]
        Career[Career Growth]
    end

    User --> Auth{Supabase Auth}
    Auth --> Dashboard[Mission Control Dashboard]
    
    Dashboard --> Calc
    Dashboard --> JobM
    Dashboard --> Risk
    Dashboard --> Career

    subgraph "Calculators (Intelligence)"
        Calc --> TargetSH[Target Superheat]
        Calc --> Subcool[Subcooling]
        Calc --> AirDen[Air Density]
        Calc --> Psych[Psychrometric]
        
        Weather(Weather API) -.->|Auto-fill Temp/Humidity| TargetSH
        Weather -.->|Auto-fill Data| AirDen
    end

    subgraph "Job Management (Workflow)"
        JobM --> JobContext{Active Context}
        JobContext -->|Link| CalcData[Save Calculations]
        JobContext -->|Link| CertData[Generate Certs]
    end

    subgraph "Risk Shield (Compliance)"
        Risk --> Winter[Winterization Audit]
        Risk --> Comm[System Commissioning]
        Risk --> Maint[Preventative Maintenance]
        
        Winter --> PDF(PDF Generation)
        Comm --> PDF
        Maint --> PDF
        
        PDF --> Download[Download Certificate]
    end

    subgraph "Data Layer"
        CalcData --> SupabaseDB[(Supabase DB)]
        JobM --> SupabaseDB
        User -->|Profile Data| SupabaseDB
    end

    classDef primary fill:#0f172a,stroke:#3b82f6,color:#fff;
    classDef secondary fill:#1e293b,stroke:#22c55e,color:#fff;
    classDef accent fill:#3b82f6,stroke:#fff,color:#fff;
    
    class Dashboard,Calc,JobM,Risk,Career primary;
    class TargetSH,Subcool,AirDen,Psych,Winter,Comm,Maint secondary;
    class User,PDF,Weather accent;
```

## Key Features
- **Smart Integration**: Weather data automatically feeds into complex calculations.
- **Context Awareness**: "Active Job" state allows seamless hopping between tools while keeping data tied to the specific client/project.
- **Instant Compliance**: One-click generation of professional PDF certificates for various service scenarios.
