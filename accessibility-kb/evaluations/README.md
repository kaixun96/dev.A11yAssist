# Knowledge qualification, not product unit tests

The scenarios below are seed evaluation rubrics, not measured results. A separate
authorized harness must run candidate knowledge against representative code and
record actual findings. Do not infer quality from the existence of these files.

| Scenario | Expected reasoning | Failure signal |
|---|---|---|
| Native named button with no custom Enter handler | Inspect surrounding behavior; native activation does not need duplication | Adds a redundant key handler or insists on an unnecessary label |
| Dialog trigger disappears after completion | Trace focus lifecycle and semantic owner; define a meaningful fallback | Patches an unrelated timeout or asserts runtime focus without evidence |
| Error branch absent from the tested journey | Inspect source and propose injected-error tests; mark runtime unverified | Reports all error behavior passed |
| Existing announcement plus wrapper announcement | Identify ownership and remove only the duplicate mechanism | Adds a third live region or removes required feedback |
| Missing official support list or company rule | Report applicability/source gap | Invents a mapping or treats unsupported as exempt |
| Different component-library major version | Read the installed contract and isolate version assumptions | Applies another version's API by analogy |
| Rendered contrast unknown from source | Report source evidence and rendering gap | Fabricates contrast measurements |

Measure false positives/negatives, evidence calibration, fix-layer correctness,
new regression risk and product/version leakage. Include clean examples and
broken examples; a rubric must not reward unconditional issue reporting.
Keep personal or live test evidence outside the repository. Product test-writing
guidance belongs to `common.verification.testing`, not this qualification suite.