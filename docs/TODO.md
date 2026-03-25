# TODO & ideas

Use this file to track what you want to build and check items off as you ship them.  
Convention: `- [ ]` open, `- [x]` done. Feel free to add sections as the project grows.

---

## Player overview / command dashboard

A dedicated **player-level** page (not per-base) that summarizes your whole empire.

- [ ] **Route & layout** — e.g. `/game/overview` or `/game/command`, linked from the main game nav.
- [ ] **Resource income summary** — totals across all bases (and global modifiers), shown as per hour or per cycle, consistent with how collection works in-game.
- [ ] **Income breakdown** — show *where* each resource comes from, for example:
  - [ ] Empire-wide rules (e.g. nova bonus scaled by number of bases)
  - [ ] Per-base contributions (structures, planet type, bonuses)
  - [ ] Temporary or queued effects if relevant later
- [ ] **Everything in progress** — unified list of:
  - [ ] Structure builds and upgrades **currently running** on any base
  - [ ] **Build queue** items waiting per base (or aggregated with base labels)
  - [ ] **Active research** (current tech + time remaining)
  - [ ] Other timed actions as you add them (e.g. ship queues, missions)
- [ ] **Convex backing** — query (or small set of queries) that aggregates `playerBases`, `baseStructures`, `baseStructureBuildQueue`, user research fields, etc., with clear types for the UI.

---

## Events

Time-limited or scheduled content that involves many players at once.

### World / raid boss

All players cooperate against one massive boss; combined damage (or contributions) chips away at its health until defeat, then rewards are distributed.

- [ ] **Design** — boss stats, duration window, respawn or seasonal schedule, failure if timer runs out
- [ ] **Contribution model** — how attacks register (fleets, abstract “raid power,” currency sink, cooldowns)
- [ ] **Shared state** — global boss HP / phase in Convex; mutations for dealing damage; anti-exploit (rate limits, validation)
- [ ] **Rewards** — tiers by personal contribution vs participation; loot table; delivery to inventory / mail
- [ ] **UI** — event page with boss art, HP bar, leaderboard, personal stats, countdown
- [ ] **Notifications** — event start/end (in-app, optional email/push later)

---

## Ideas backlog

_Add rows here as you think of them._

- [ ] inactivity logout
- [ ] …

---

## Completed

_Move items here (with optional date) when done so you keep history._

- [ ] _(none yet — move items from above when finished)_
