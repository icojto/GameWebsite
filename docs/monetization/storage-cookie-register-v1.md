# Storage and cookie register v1

Scope: current main ef6694e and isolated pre-provider candidate. Source audit is comprehensive for literal keys and wrappers. Browser evaluation exposes a read-only DOM scope without localStorage access; one attempt established that limitation and was not repeated. Browser runtime storage enumeration is therefore BLOCKED, not falsely passed. Existing browser-local saves were visible in the live game UI; their private values were not extracted.

| Key/pattern | Data and purpose | Trigger / retention | Recipient / control | Assessment |
|---|---|---|---|---|
| odesos.theme | Light/dark preference | Explicit theme choice; no TTL | Browser origin; change choice or clear site data | Explicitly requested preference; exemption requires purpose/duration assessment |
| studioArcade.theme | Legacy theme | Read/migrate to odesos.theme; legacy value retained | Browser origin; clear site data | Migration not a new analytics purpose |
| odesos.player.reaction.<slug> | Local like/dislike choice | User reaction; no TTL | Browser only, no public vote upload; toggle or clear | Persistent convenience; exemption not established |
| orbitBreak.profile.v2 | XP, stars, quests, unlocks, equipment, score history | Profile bootstrap loads/ensures quests/saves before PLAY; updated during progress; no TTL | Browser only; clear site data removes progress | Initial automatic persistent write needs explicit-request/necessity review |
| orbitBreak.bestScore | Legacy compatible best-score mirror | Profile save; no TTL | Browser only; clear site data | Duplicate persistence is disclosed, not silently erased |
| orbitBreak.audio.v1 | Versioned mute preference | User mute change; no TTL | Browser only; mute toggle/clear site data | Explicit preference; duration assessment pending |
| reactor-stack-scores | Local scores, moves, result and timestamp | Completed run, top-10 score history; no TTL | Browser only; clear site data | Requested save-function necessity and retention review pending |
| reactor-stack-best | Legacy best-score compatibility | Migration / score persistence; no TTL | Browser only; clear site data | Same review as local score history |
| last-relay-v1 | Hidden direct-embed game progression | Local save actions; no TTL | Browser only; clear site data | Built direct embed is accessible, despite unlisted portal route |
| hs.game004.scenario | Hidden Station Quartermaster scenario save | SaveCoordinator local save; no TTL | Browser only; clear site data | Built direct embed; necessity review pending |
| hristo.signal-below.checkpoint | Hidden Signal Below checkpoint | CheckpointStore save; no TTL | Browser only; clear site data | Built direct embed; necessity review pending |
| odesos.dev.ads.v1.1 / legacy v1 | Mock configuration | DEV settings only; no TTL | Development origin only | Not production collection |
| odesos.qa.<session>.<key> | Isolated QA equivalents | Exact authorised DEV session; no TTL | QA development origin; browser site-data controls | Not production collection |

Source pointers: shared/storage.mjs and storage-scope.mjs; src/site/storage.mjs; src/main.ts; games/orbit-break/src/game/profile.ts and mute.ts; Reactor storage module; hidden-game save/checkpoint modules. No production sessionStorage writer or direct document.cookie writer was found. Reactor mute/volume and ad request/event counters are memory-only.

No direct cookie setter was identified in OdesosGames source. That is not proof of no edge/provider cookies. Cloudflare cookies depend on dashboard security products and challenges; no cookie-header runtime trace was available. Future CMP/ad storage is NOT ACTIVE and is not listed as current collection.

ePrivacy Article 5(3) applies to information storage/access even without personal data. [BG Act Article 4a](https://www.mi.government.bg/file/2026/05/zet_03_02_26.pdf), [WP194](https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf), and [EDPB final guidance](https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en) do not justify a blanket essential-storage label. Determine each requested function, necessity and proportionate duration before deciding consent/exemption. Do not erase existing saves or add a competing custom advertising cookie banner as an unreviewed workaround.
