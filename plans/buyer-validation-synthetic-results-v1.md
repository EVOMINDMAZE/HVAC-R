# Buyer Validation Synthetic Results V1

## Scope
Synthetic run-throughs based on the live landing flow at `/` using owner/manager, technician, and entrepreneur lenses. These are not a replacement for real interviews; they are pre-screen signals used to shape V5.

## Session Set (5)
1. Owner/Manager (desktop)
- First-read result: understands "one system for dispatch + compliance + engineering" quickly.
- CTA behavior: prefers `Book Ops Demo`.
- Objection: right-side capability block still feels dense if every row reads as equal priority.

2. Owner/Manager (mobile)
- First-read result: hero copy clear, CTA stack readable.
- CTA behavior: chooses `Book Ops Demo`.
- Objection: wanted clearer "which button is for my stage" line.

3. Technician/Lead Tech (desktop)
- First-read result: sees diagnostics + handoff value.
- CTA behavior: chooses `Start Free`.
- Objection: category labels in capability card should be faster to scan.

4. Technician/Lead Tech (mobile)
- First-read result: value mostly clear by headline + first line.
- CTA behavior: chooses `Start Free`.
- Objection: proof bullets were slightly wordy under tight viewport height.

5. Entrepreneur/New shop (desktop)
- First-read result: free-start path is understandable.
- CTA behavior: chooses `Start Free`.
- Objection: asks whether ops is a later expansion and how to decide quickly.

## Objection Ranking
1. Hero right rail density and scan speed (frequency: 3/5, severity: high)
2. CTA decision guidance by business stage (frequency: 3/5, severity: medium-high)
3. Microcopy verbosity in first viewport (frequency: 2/5, severity: medium)

## Focused V5 Iteration Applied
- Refined hero capability snapshot to be more scannable:
  - short tab labels (`Work`, `Field`, `Engineering`, `Compliance`, `Client`)
  - explicit instruction line: "Select a pillar to preview flagship tools."
- Tightened left-rail hero copy and proof bullets for faster 2-3 second comprehension.
- Tightened CTA helper line to explicitly segment by stage:
  - "New shop or engineering-first team? Start free. Running multi-crew dispatch? Book an ops demo."

## Next Real-Interview Plan
- Run the 5 real sessions from `plans/buyer-validation-script-v1.md`.
- Keep the same scoring rubric and compare against synthetic objection ranking.
- If top objection changes, run V6 with only the top 2 conversion blockers.
