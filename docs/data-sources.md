# Data sources

UnivIS Planner uses three separate official sources. Values are not inferred across source boundaries.

- CAU Studienverlaufsplan: recommended semester and mandatory/choice structure for the one-subject B.Sc. Informatik (FPO 2025).
- Informatik ModulDB categories `BSc-Inf-WP` and `BSc-Inf-Sem`: eligible elective/seminar module codes, official titles and ECTS.
- Public UnivIS PRG XML: courses actually offered in WS 2025/26 or SS 2026, event types, dates, recurrence/exclusions, rooms and lecturers.

An elective is shown only when its ModulDB code is eligible for the B.Sc. and the same code has published timetable data in UnivIS. Unknown UnivIS records remain unmapped and are not presented as B.Sc. electives.

Refresh all snapshots with:

```bash
npm run data:update
```
