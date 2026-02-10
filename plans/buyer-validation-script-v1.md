# Buyer Validation Script V1 (5 Sessions)

## Goal
Validate whether the landing page communicates value in 2-3 seconds and drives the right CTA choice for HVAC&R buyers.

## Participant Mix
- 2 Owner/Manager
- 2 Technician/Lead Tech
- 1 Entrepreneur/New shop

## Session Setup
- Duration: 12-15 minutes each
- Device:
  - 3 desktop
  - 2 mobile
- Use current landing build at `/`

## Test Script

### Step 1: First-3-second read
- Prompt: “Look at this page for 3 seconds. Then tell me what this product is.”
- Capture:
  - Their exact sentence
  - If they mention dispatch/compliance/engineering

### Step 2: Buyer fit
- Prompt: “Who is this built for?”
- Capture:
  - Whether they self-identify in one of:
    - Owner/Manager
    - Technician
    - Entrepreneur

### Step 3: Next action
- Prompt: “What would you click next and why?”
- Capture:
  - CTA chosen:
    - `Start Engineering Free`
    - `Book an Ops Demo`
  - Reason for click

### Step 4: Tool trust check
- Prompt: “Do you trust this has the tools you need? What feels missing or unclear?”
- Capture:
  - Any tool/category confusion
  - Any skepticism or objection language

### Step 5: Pricing fit
- Prompt: “Looking at pricing, which plan seems right for your stage?”
- Capture:
  - Track selected
  - Whether pricing logic felt clear

## Data Capture Template

For each participant, record:
- Persona
- Device
- Step 1 answer (verbatim)
- Step 2 answer (verbatim)
- CTA selected
- Top 2 objections
- Tool clarity score (1-5)
- Overall confidence to try/book (1-5)

## Scoring Criteria
- Clarity pass:
  - At least 4/5 can state “ops + engineering HVAC&R system” in <= 3 seconds
- Audience fit pass:
  - At least 4/5 identify their role on page
- CTA fit pass:
  - At least 4/5 can explain why they chose one CTA
- Tool trust pass:
  - Average tool clarity >= 4.0/5

## V5 Prioritization Rule
- Rank objections by:
  - Frequency (how many sessions)
  - Severity (blocks click/intent)
- Implement top 3 only in V5.

