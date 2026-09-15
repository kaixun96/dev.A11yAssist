"""Operator-owned browser connection/network policy; never supplied by scenario rows."""
from pathlib import Path
import re
from urllib.parse import urlsplit


def https_url(value, origin=False):
    if not isinstance(value, str) or not 1 <= len(value) <= 2048:
        raise ValueError("Expected a bounded HTTPS URL")
    parsed = urlsplit(value)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username or
            parsed.password or parsed.fragment or "\\" in value):
        raise ValueError("Expected credential-free HTTPS without a fragment")
    if origin and (parsed.path not in {"", "/"} or parsed.query):
        raise ValueError("Authentication allow-list contains origins, not routes or queries")
    return parsed


def validate(policy):
    common = {"schemaVersion", "allowedTargets", "assetHosts"}
    version = policy.get("schemaVersion") if isinstance(policy, dict) else None
    if type(version) is not int or version not in {1, 2}:
        raise ValueError("Invalid protected browser policy version")
    if set(policy) != (common if version == 1 else common | {"connection", "requests", "scanner"}):
        raise ValueError("Unexpected protected browser policy fields")
    if (not isinstance(policy["allowedTargets"], list) or len(policy["allowedTargets"]) > 100 or
            not isinstance(policy["assetHosts"], list) or len(policy["assetHosts"]) > 30):
        raise ValueError("Invalid protected target/asset budget")
    for target in policy["allowedTargets"]:
        https_url(target)
    if any(not isinstance(host, str) or not re.fullmatch(r"[a-z0-9.-]{1,253}", host)
           for host in policy["assetHosts"]):
        raise ValueError("Asset hosts must be explicit DNS names without wildcards")
    if version == 1:
        return policy
    connection = policy["connection"]
    if not isinstance(connection, dict) or connection.get("mode") not in {"ephemeral", "persistent"}:
        raise ValueError("Unknown browser connection")
    if connection["mode"] == "ephemeral":
        if set(connection) != {"mode"}:
            raise ValueError("Ephemeral browser does not use an authenticated profile")
    else:
        if set(connection) != {"mode", "userDataDirectory", "authenticationOrigins", "timeoutSeconds", "ready"}:
            raise ValueError("Incomplete persistent browser connection")
        profile = connection["userDataDirectory"]
        if not isinstance(profile, str) or not Path(profile).is_absolute():
            raise ValueError("Persistent profile must be an operator-owned absolute directory")
        if (not isinstance(connection["authenticationOrigins"], list) or
                len(connection["authenticationOrigins"]) > 10):
            raise ValueError("Invalid authentication origin budget")
        for origin in connection["authenticationOrigins"]:
            https_url(origin, origin=True)
        if type(connection["timeoutSeconds"]) is not int or not 1 <= connection["timeoutSeconds"] <= 120:
            raise ValueError("Authentication wait must be 1-120 seconds within the original run budget")
        ready = connection["ready"]
        if (not isinstance(ready, dict) or set(ready) != {"css"} or
                not isinstance(ready["css"], str) or not re.fullmatch(r"#[A-Za-z][A-Za-z0-9_-]{0,100}", ready["css"])):
            raise ValueError("Authentication readiness must be one exact protected element ID")
    if not isinstance(policy["requests"], list) or len(policy["requests"]) > 100:
        raise ValueError("Invalid transaction route budget")
    for rule in policy["requests"]:
        if not isinstance(rule, dict) or set(rule) != {"url", "methods", "resourceTypes"}:
            raise ValueError("Transaction rules require exact URLs, methods and resource types")
        https_url(rule["url"])
        for key, allowed in (("methods", {"GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"}),
                             ("resourceTypes", {"fetch", "xhr", "document"})):
            if (not isinstance(rule[key], list) or not rule[key] or len(rule[key]) != len(set(rule[key])) or
                    any(not isinstance(item, str) or item not in allowed for item in rule[key])):
                raise ValueError("Unsupported transaction rule")
    scanner = policy["scanner"]
    if scanner is not None:
        if (not isinstance(scanner, dict) or set(scanner) != {"path", "sha256"} or
                not isinstance(scanner["path"], str) or not Path(scanner["path"]).is_absolute() or
                not isinstance(scanner["sha256"], str) or not re.fullmatch(r"[a-f0-9]{64}", scanner["sha256"])):
            raise ValueError("Scanner must be a pinned operator-installed axe-core script")
    return policy


def permits(policy, target, request, authenticating=False):
    parsed = urlsplit(request.url)
    if parsed.scheme != "https" or parsed.username or parsed.password or "\\" in request.url:
        return False
    origin = f"{parsed.scheme}://{parsed.netloc}"
    connection = policy.get("connection", {})
    if (authenticating and connection.get("mode") == "persistent" and
            origin in {value.rstrip("/") for value in connection["authenticationOrigins"]}):
        return request.method in {"GET", "HEAD", "POST"} and request.resource_type != "websocket"
    for rule in policy.get("requests", []):
        if (request.url == rule["url"] and request.method in rule["methods"] and
                request.resource_type in rule["resourceTypes"]):
            return True
    allowed = (request.method in {"GET", "HEAD"} and
               request.resource_type not in {"fetch", "xhr", "websocket", "eventsource"} and
               parsed.netloc in {urlsplit(target).netloc, *policy["assetHosts"]})
    if request.resource_type == "document":
        allowed = allowed and request.url.split("#")[0] == target
    return allowed


def authentication_request(policy, request):
    parsed = urlsplit(request.url)
    return f"{parsed.scheme}://{parsed.netloc}" in {
        value.rstrip("/") for value in policy.get("connection", {}).get("authenticationOrigins", [])}


def open_context(playwright, request, policy):
    options = dict(viewport=request["viewport"], device_scale_factor=1,
                   locale="en-US", reduced_motion="reduce", service_workers="block",
                   accept_downloads=False)
    connection = policy.get("connection", {"mode": "ephemeral"})
    if connection["mode"] == "persistent":
        profile = Path(connection["userDataDirectory"]).resolve(strict=True)
        if not profile.is_dir():
            raise ValueError("The existing owned Chromium profile directory is required")
        # Do not fall back to system Edge, another profile, or a headless retry.
        context = playwright.chromium.launch_persistent_context(str(profile), headless=False, **options)
        return context.browser, context
    browser = playwright.chromium.launch(headless=False)
    context = None
    try:
        context = browser.new_context(**options)
        return browser, context
    finally:
        if context is None:
            browser.close()


def wait_authenticated(page, request, policy, deadline, monotonic):
    connection = policy.get("connection", {})
    if connection.get("mode") != "persistent":
        return
    until = min(deadline, monotonic() + connection["timeoutSeconds"])
    while monotonic() < until:
        if page.url == request["target"]:
            ready = page.locator(connection["ready"]["css"])
            if ready.count() == 1 and ready.is_visible():
                return
        page.wait_for_timeout(min(250, max(1, (until - monotonic()) * 1000)))
    raise RuntimeError("Visible authentication did not reach the approved target/readiness marker; "
                       "inspect the explicit login/MFA/consent or page failure, no scenario was triggered")
