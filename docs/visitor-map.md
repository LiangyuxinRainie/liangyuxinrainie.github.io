# Visitor counter

The sidebar uses the FlagCounter widget in
`src/components/home/VisitorMap.tsx`. It loads live visitor totals and country
flags from FlagCounter, so the repository does not need generated map JSON,
country-flag assets, Google Analytics credentials, or a scheduled update
workflow.

The current FlagCounter account ID is `YXPZ`. Keep this ID unchanged to retain
the existing visitor history.
