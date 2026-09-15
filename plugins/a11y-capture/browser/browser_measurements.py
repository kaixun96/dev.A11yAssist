"""Actual browser measurements and local pinned axe-core integration."""
import hashlib
import math
from pathlib import Path

TEXT_SPACING_VALUES = {
    "lineHeight": 1.5, "paragraphSpacingEm": 2, "letterSpacingEm": 0.12, "wordSpacingEm": 0.16
}
TEXT_SPACING_CSS = (
    "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; "
    "word-spacing: 0.16em !important; }\n"
    "p { margin-block-end: 2em !important; }"
)


def text_spacing_record():
    return {"preset": "wcag22-1.4.12", "scope": "main-frame-light-dom",
            "values": dict(TEXT_SPACING_VALUES),
            "stylesheetSha256": hashlib.sha256(TEXT_SPACING_CSS.encode("utf-8")).hexdigest(),
            "state": "installing", "cleanupState": "pending"}


def apply_text_spacing(page):
    if page.evaluate("document.contentType") not in {"text/html", "application/xhtml+xml"}:
        raise RuntimeError("Text-spacing preset requires an HTML document")
    # Use the normal stylesheet API; CSP rejection must propagate without a nonce or bypass.
    return page.add_style_tag(content=TEXT_SPACING_CSS)


def text_spacing_present(style):
    value = style.evaluate("""(element, css) => element.isConnected &&
      element.textContent === css && !element.media && !element.disabled &&
      !!element.sheet && !element.sheet.disabled && element.sheet.cssRules.length === 2""",
                           TEXT_SPACING_CSS)
    if type(value) is not bool:
        raise RuntimeError("Invalid owned text-spacing stylesheet observation")
    return value


def restore_text_spacing(style):
    removed = style.evaluate("element => { element.remove(); return !element.isConnected; }")
    if removed is not True:
        raise RuntimeError("Owned text-spacing stylesheet was not removed")
    style.dispose()


def load_scanner(policy):
    scanner = policy.get("scanner")
    if scanner is None:
        raise RuntimeError("This row requires an operator-installed, SHA-256-pinned axe-core script")
    path = Path(scanner["path"])
    if not path.is_file() or not 1 <= path.stat().st_size <= 8 * 1024 * 1024:
        raise ValueError("Pinned axe-core script is missing or exceeds 8 MiB")
    data = path.read_bytes()
    if len(data) > 8 * 1024 * 1024 or hashlib.sha256(data).hexdigest() != scanner["sha256"]:
        raise ValueError("Pinned axe-core script hash changed")
    return data.decode("utf-8")


def scan(page, target, policy, timeout_milliseconds=15000):
    if timeout_milliseconds <= 0:
        raise TimeoutError("Original scanner observation budget exhausted")
    page.add_script_tag(content=load_scanner(policy))
    value = target.evaluate("""async (element, timeout) => {
      if (!globalThis.axe || typeof axe.run !== 'function') throw new Error('axe-core API unavailable');
      let timer;
      const result = await Promise.race([axe.run(element, {reporter: 'v2'}),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('axe-core budget exhausted')), timeout); })
      ]).finally(() => clearTimeout(timer));
      return {version: result.testEngine.version,
        violations: result.violations.map(r => ({id: r.id, impact: r.impact,
          help: r.help, helpUrl: r.helpUrl, nodes: r.nodes.map(n => ({
            target: n.target, html: n.html, failureSummary: n.failureSummary}))})),
        incomplete: result.incomplete.map(r => ({id: r.id, nodes: r.nodes.map(n => ({target: n.target}))}))};
    }""", min(15000, timeout_milliseconds))
    if (not isinstance(value, dict) or not isinstance(value.get("version"), str) or
            not isinstance(value.get("violations"), list) or not isinstance(value.get("incomplete"), list)):
        raise RuntimeError("Invalid axe-core result")
    return value


def measure_size(target):
    value = target.evaluate("""element => {
      const r = element.getBoundingClientRect();
      return {width: r.width, height: r.height, x: r.x, y: r.y,
        deviceScale: window.devicePixelRatio};
    }""")
    if (not isinstance(value, dict) or any(type(value.get(key)) not in {int, float} or
            not math.isfinite(value[key]) for key in ("width", "height", "x", "y", "deviceScale")) or
            value["width"] < 0 or value["height"] < 0 or value["deviceScale"] <= 0):
        raise RuntimeError("Invalid rendered CSS-pixel geometry")
    return value
