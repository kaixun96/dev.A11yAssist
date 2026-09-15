"""Actual browser measurements and local pinned axe-core integration."""
import hashlib
import math
from pathlib import Path


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
