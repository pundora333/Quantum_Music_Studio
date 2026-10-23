# Research and verification files

- `reference.mjs`: JSON/stdin runner for cross-language model checks.
- `python-dom.mjs`: integration of the browser interface with the local
  Python server; invoked by the Python test suite.
- `analyse_parras.py` and `test_parras_analysis.py`: secondary NMR analysis
  and five scientific checks. Source data and outputs are in `parras_2026/`.
- `circuit_2026-10-21/`: recorded 1.7.2 verification, 94 JavaScript and
  41 Python passes, with the documented desktop Chrome scope.
- `validation_report.json`: historical 1.0.0 numerical convergence and
  example benchmarks, retaining their original version and date. Its
  historical test counts do not describe the current 1.7.2 suite.

See `docs/TEST_GUIDE_GR.md` for current commands. Regeneration may overwrite
analysis outputs; use a separate copy when comparing with archived results.
The software does not claim new physical NMR acquisition or a listener study.
