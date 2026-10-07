# Website versioning

package.json is the canonical website version. package-lock.json mirrors it for dependency installation; it is not a separate application constant. Vite injects the package version into the public footer. Build metadata and the static 404 footer read that same value. The production guard verifies every generated HTML identity uses it.

Use numeric MAJOR.MINOR.PATCH: PATCH for fixes, MINOR for substantial capabilities or hosting/provider/legal changes, MAJOR for a major stable product milestone. Gate 2 changes 0.1.0 to 0.2.0. Game identity/build ID and SHA remain metadata for QA, not ordinary footer text.

Before release: change package version and lockfile root together, run check, test:monetization, build, verify:ads-production and verify:static-release; inspect the footer in the actual deployment. No duplicated manual website version constants. Games retain their own internal development version labels where applicable.
