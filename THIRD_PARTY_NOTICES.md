# Third-party components

Original project material is reserved to Παναγιώτα Μπρούσαλη (Pundora); see LICENSE and docs/RIGHTS_SCOPE.md. This is not an
OSI-licensed open-source release.

- Browser MP3 encoder: lamejs 1.2.1, LGPL-3.0. The original package, including its
  Java/JavaScript source, is included in third_party/lamejs-1.2.1. Corresponding
  unchanged asset: web/dist/vendor/lame.min.js. License texts are in
  web/dist/vendor/LAMEJS-LICENSE.txt and licenses/ (LGPL/GPL).
- UnifrakturCook font: SIL Open Font License 1.1, text in licenses/ and
  web/dist/vendor/UNIFRAKTUR-LICENSE.txt. The font asset is unchanged.
- Python dependencies are installed separately, not bundled as binaries:
  Qiskit, NumPy, SciPy, Matplotlib, lameenc and pytest. Consult the licenses
  distributed with the pinned packages for full terms, including linked LAME.
- Browser development dependencies: esbuild, jsdom and their transitives.
  Versions are in web/package-lock.json; installed package license files apply.

No copyrighted textbooks, credentials or private hosting configuration are
included. Bibliography links identify research sources.

Space Grotesk SemiBold is bundled locally from @fontsource/space-grotesk
5.2.10. Copyright 2020 The Space Grotesk Project Authors (see the included license).
SIL Open Font License 1.1: web/dist/vendor/SPACE-GROTESK-LICENSE.txt.
No external font service is contacted at runtime. The previous font assets
remain included with their original license.
