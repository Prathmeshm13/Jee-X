# JEE Main + Advanced predictor data pack
Collected 19 September 2026. JSON data for importing into MongoDB, SQL, or a backend service. This pack collects data and supplies integration guidance; it does not modify or deploy your application.

## What is included

| File | Rows | Coverage | Evidence |
|---|---:|---|---|
| `data/josaa_2025_round_6.json` | 11,945 | All returned institutes, programs, categories, quotas and gender pools, Round 6 | Official JoSAA |
| `data/josaa_2026_round_5.json` | 12,936 | All returned institutes, programs, categories, quotas and gender pools, Round 5 | Official JoSAA |
| `data/advanced_2024_marks_rank.json` | 491 | CRL, GEN-EWS, OBC-NCL, SC, ST, CRL-PwD anchors | Official Advanced report |
| `data/advanced_2025_marks_rank.json` | 613 | Same six rank lists | Official Advanced report |
| `data/main_2025_percentile_rank_sample.json` | 31 | Selected Paper 1 CRL observations | Secondary published data |
| `data/main_2026_percentile_rank_sample.json` | 32 | Selected Paper 1 CRL observations | Secondary published data |
| `data/main_2026_april_shift_estimates.json` | 36 | Nine shifts, four target percentiles | Unvalidated publisher estimates |
| `data/main_2024_2026_generic_marks_estimates.json` | 21 | Seven target percentiles per year | Unvalidated publisher estimates |
| `data/main_2026_cohort_and_qualifying_cutoffs.json` | 8 | Annual cohort totals and Advanced eligibility cutoffs | Official NTA |
| `data/advanced_2025_qualifying_cutoffs.json` | 11 | Aggregate and per-subject qualifying thresholds | Official Advanced report |
| `data/nirf_2025_engineering_top10.json` | 10 | Optional institute-level ranking reference | Official NIRF |

Every dataset has a source URL, evidence type, retrieval date, and record count. Advanced anchors have PDF page and section locators. JoSAA files include the SHA-256 of their downloaded source response. `manifest.json` checksums the deliverables. No student names, roll numbers, or scorecards are included.

## Start with a rank-based college explorer

1. Ask for examination and counselling year, official CRL/category/PwD ranks, category, gender-seat eligibility, state of eligibility, and preferred branches/locations.
2. Resolve institute-specific quota eligibility from that year's official business rules. State of eligibility is not automatically the student's residence or domicile. Do not assume that every institute offers both HS and OS; special quotas also exist.
3. Select the matching exam route and cutoff dataset. Match OPEN seats using CRL; reserved seats using the corresponding category rank; PwD seats using the appropriate PwD rank. GEN-EWS in Advanced reports maps to EWS in JoSAA. These are naming aliases, not conversions between ranks.
4. Compare with closing rank only. A rank better than opening rank must remain eligible for consideration. A historical closing-rank match is not an admission promise.
5. Rank the resulting college-and-program options by the student's branch preference, then location/budget preferences and optional institutional rankings. NIRF is institutional, not a measure of individual branch fit. The top-10 reference is intentionally incomplete; missing ranking data means unknown, not bad.
6. Display source year, round, quota, seat category, gender pool, rank list used, and cutoff beside each match.

`match_colleges.py` implements step 4 after the caller supplies verified quota eligibility. It skips preparatory/mixed-rank rows and missing closing ranks. It does not evaluate board marks, subject prerequisites, age/attempt limits, or program restrictions; those need an independent year-specific eligibility layer.

Do not call the options "safe" or assign percentage chances without backtesting. Prefer "within the 2025 historical cutoff", "within both reference-year cutoffs", and "outside the reference cutoff". When comparing years, retain each year's round and exact program/seat identity; Round 6 in 2025 and Round 5 in 2026 are not identically numbered rounds. This pack does not contain all rounds, CSAB special rounds, JAC Delhi, state counselling, or independent institute admission channels.

## Marks and percentile feature

### JEE Main Paper 1

Use this flow: raw marks + exam year + session + shift -> estimated percentile interval -> estimated CRL interval -> historical college matches.

Main is normalized by shift. The secondary score tables here are reference inputs, not official NTA marks-to-percentile conversion tables. Keep the two marks-estimate datasets disabled for production until independently validated against permitted, consented score observations or a validated provider. Their ranges are not statistical confidence intervals. Generic yearly targets cannot substitute for shift-specific data. Preserve `+` thresholds without inventing upper endpoints.

The sampled percentile/rank files are secondary observations with truncated percentile values. They do not give exact ranks for every percentile, and no Main category-rank conversion is supplied. Interpolation is an estimate; at repeated percentiles, retain all observed ranks and account for truncation/ties rather than returning one exact rank. Outside the observed range, return "insufficient data".

The familiar approximation `N * (100 - percentile) / 100 + 1` is a rough check only. The annual unique cohort is not the same as one shift's cohort; best-of-session scores and ties make this unsuitable as the definitive conversion. Do not derive reserved-category ranks by scaling CRL.

### JEE Advanced

Use this flow: both-paper aggregate marks + year + rank list + subject marks -> historical rank interval -> IIT/program cutoff matches. Do not manufacture an NTA-style Advanced percentile.

Official reports publish discrete rank/score anchors. Between anchors, use a conservatively bracketed range labelled historical. Multiple anchors can have the same score; do not treat one as the unique rank. Qualifying requires both aggregate and individual-subject thresholds. Total marks are 360 for the 2024 and 2025 files; do not hard-code that for every year.

The current official reports index offered reports through 2025 when checked. No 2026 Advanced marks/rank table is asserted here. Current-year JoSAA cutoffs and historical marks/rank data must retain their separate reference years.

### Mock tests

Do not map a 10-question quiz, chapter test, or uncalibrated platform mock directly to national percentiles. Use comparable full-length tests, disclose the reference exam, and calibrate mock difficulty first. Otherwise show topic performance and a broad preparation benchmark instead of a national rank.

## Database fields and indexes

For import, flatten each file's `metadata.year`, `round`, `counselling`, `source_url`, and `source_type` into each cutoff record. Keep raw rank strings as well as parsed numbers and preparatory flags. Preserve nulls as null, not zero.

Suggested unique cutoff key:

`(year, counselling, round, institute_id, program_id, quota, seat_type, gender_pool)`

Keep exact source names; resolve stable institute/program IDs through a reviewed alias table. Do not fuzzy-merge program names or campuses automatically. Route inference in this export uses institute/program names and is marked derived. Architecture and Planning rows are retained separately as Main Paper 2A/2B; they must never be matched with Paper 1 CRL. IIT architecture also requires the relevant AAT eligibility checks.

Marks/rank anchor key: `(exam, year, rank_list, rank)`.
Percentile observations should allow repeated percentile values with different ranks.
Marks-estimate key: `(exam, year, session, shift, percentile_target, source)`.

## Validation and known limitations

- Extracted all rows returned by the selected JoSAA form filters; this is not a guarantee of seat-matrix completeness.
- Validated unique cutoff composite keys, numeric/preparatory rank parsing, and opening <= closing for comparable rank lists.
- Source ranks formatted as `1002085.0` become integers while raw strings are retained.
- Blank source ranks remain null. Preparatory suffixes remain explicit; mixed ordinary/preparatory endpoints are not compared numerically.
- Advanced score anchors are monotonic within each rank list. Identical repeated source anchors were deduplicated; irregular rank numbers and gaps were preserved. See `data_quality_notes.json`.
- Main percentile samples are hand-selected and transcribed from cited tables; not exhaustive or independently verified against scorecards.
- Main marks estimates require further independent validation and should not drive production recommendations yet.
- Advanced 2024 subject qualifying thresholds, exhaustive institute/state mappings, fees, placements, and program restrictions are not included.
- Existing official business rules and cutoffs must be refreshed before each counselling season.

## Sources

- JoSAA cutoff landing page: https://josaa.nic.in/or-cr/
- JoSAA current results: https://josaa.admissions.nic.in/Applicant/SeatAllotmentResult/currentorcr.aspx
- JoSAA historical results: https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx
- JoSAA rules: https://josaa.nic.in/business-rules/
- Advanced report index: https://jeeadv.ac.in/reports.html
- Advanced 2024 report: https://jeeadv.ac.in/reports/2024.pdf
- Advanced 2025 report: https://jeeadv.ac.in/reports/2025.pdf
- NTA 2026 final Paper 1 result release: source URL in the cohort JSON, PDF page 3.
- Secondary percentile/rank: https://www.collegepravesh.com/insights/jee-main-2025-rank-vs-percentile/ and https://www.collegepravesh.com/insights/jee-main-2026-rank-vs-percentile/
- Secondary marks estimates: https://engineering.careers360.com/articles/jee-main-marks-vs-percentile
- NIRF reference: https://www.nirfindia.org/Rankings/2025/EngineeringRanking.html

Official sources and secondary observations are deliberately distinguishable in the data. Verify each provider's reuse terms before incorporating its dataset into a public commercial service.
