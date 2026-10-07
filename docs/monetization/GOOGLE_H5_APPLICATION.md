# Google H5 application and disabled integration plan

Current status: NOT SUBMITTED. No AdSense account or H5 access exists in the approved baseline. No SDK is loaded by this candidate.

Human: after creating AdSense account, use the [official application](https://adsense.google.com/start/h5-game-ads-apply/). Supply accurate public information directly. The form asks a company field; do not fabricate a registered company. Ask Google for the appropriate individual-publisher submission if necessary. Record status NOT SUBMITTED/PENDING/APPROVED/REJECTED and non-secret feedback. Approved AdSense is required to show H5 ads, and H5 remains a separate by-application product.

Approved factual description for human adaptation: OdesosGames is an independent Bulgarian individual's general-audience browser-game project at https://odesosgames.com, with Orbit Break and Reactor Stack, no accounts/purchases/analytics, optional non-cash in-game rewards and natural-transition opportunities. Do not describe legal/technical readiness as complete while listed gates remain open.

Architecture: the disabled GoogleH5Adapter scaffold is unregistered. Runtime remains Null; Mock stays DEV. The current host bridge coordinates games but Google H5 SDK/calls must later run in the document containing the canvas. Google CMP belongs in the top-level document. Actual publisher configuration, signal propagation and script origin/CSP validation require approved account/provider documentation and separate reviewed integration.

Mapping at the later gate: qualified adViewed → completed/reward-qualified exactly once; adDismissed/failed/no-fill/timeout → no reward; adBreakDone → settlement/cleanup, not unconditional reward. Maintain request/run/game ownership, reject stale/duplicate callbacks, restore input/audio. Reactor adds +1 Cool/+1 Upgrade without automatically using it; Orbit revive limits remain game-owned.

Placement decisions before activation: startup fullscreen OFF; Orbit PLAY/RESTART and Reactor start/restart only when actual natural transitions and conservative pacing are verified; Reactor deliberate Pause is CONDITIONAL until current guidance and behavior defend it. API pause type alone is insufficient. No continuous-play interruption, per-interaction ad, navigation interference or chaining. Courtesy is DEV-only. No banner placement is approved merely by this document.

Later tests use [Google-supported test mode](https://developers.google.com/ad-placement/docs/test), data-adbreak-test="on", without clicking revenue ads. These tests have not run because SDK/access is absent. No-fill, blocking, consent change and physical mobile flows remain exact queued cases.

Sources: [H5 application policy](https://support.google.com/adsense/answer/1705831?hl=en-GB), [game structure](https://developers.google.com/ad-placement/docs/html5-game-structure), [adBreak](https://developers.google.com/ad-placement/apis/adbreak), [reward policy](https://support.google.com/adsense/answer/9121589?hl=en).
