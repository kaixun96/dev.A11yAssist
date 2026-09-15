"""Operator-owned browser connection/network policy; never supplied by scenario rows."""
from pathlib import Path
import base64
import hashlib
import json
import re
from urllib.parse import parse_qsl, urlsplit

WINDOWS_ACCOUNTS_EXTENSION_ID = "ppnbnpeolgkicgegkbkbjmhlideopiji"


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
    if type(version) is not int or version not in {1, 2, 3, 4, 5, 6, 7}:
        raise ValueError("Invalid protected browser policy version")
    fields = common if version == 1 else common | {"connection", "requests", "scanner"}
    if version >= 4:
        fields.add("telemetryBlocks")
    if version >= 5 and "bodyDiagnostics" in policy:
        fields.add("bodyDiagnostics")
    if set(policy) != fields:
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
        connection_fields = {"mode", "userDataDirectory", "authenticationOrigins", "timeoutSeconds", "ready"}
        if version >= 7 and "windowsAccountsExtension" in connection:
            connection_fields.add("windowsAccountsExtension")
        if set(connection) != connection_fields:
            raise ValueError("Incomplete persistent browser connection")
        if "windowsAccountsExtension" in connection:
            extension = connection["windowsAccountsExtension"]
            if (not isinstance(extension, dict) or set(extension) != {"directory", "treeSha256"} or
                    not isinstance(extension["directory"], str) or len(extension["directory"]) > 1024 or
                    not Path(extension["directory"]).is_absolute() or
                    extension["directory"].startswith(("\\\\", "//")) or
                    any(char in extension["directory"] for char in (",", "\x00", "\r", "\n")) or
                    not isinstance(extension["treeSha256"], str) or not re.fullmatch(r"[a-f0-9]{64}", extension["treeSha256"])):
                raise ValueError("Microsoft SSO requires a pinned existing local extension directory")
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
        if version >= 6 and isinstance(ready, dict) and set(ready) == {"jsonResponseKeys"}:
            keys = ready["jsonResponseKeys"]
            if (not isinstance(keys, list) or not 1 <= len(keys) <= 20 or
                    any(not isinstance(key, str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{0,100}", key)
                        for key in keys) or len(set(keys)) != len(keys)):
                raise ValueError("JSON readiness requires explicit unique top-level response keys")
        elif (not isinstance(ready, dict) or set(ready) != {"css"} or
              not isinstance(ready["css"], str) or not re.fullmatch(r"#[A-Za-z][A-Za-z0-9_-]{0,100}", ready["css"])):
            raise ValueError("Authentication readiness must be one exact protected element ID or v6 JSON response keys")
    if not isinstance(policy["requests"], list) or len(policy["requests"]) > (300 if version >= 5 else 100):
        raise ValueError("Invalid transaction route budget")
    signatures = {}
    for rule in policy["requests"]:
        fields = {"url", "methods", "resourceTypes"}
        if version >= 3 and isinstance(rule, dict) and "readOnly" in rule:
            fields.add("readOnly")
        if version >= 4 and isinstance(rule, dict):
            fields.update(key for key in ("queryKeys", "frame", "authentication") if key in rule)
        if not isinstance(rule, dict) or set(rule) != fields:
            raise ValueError("Transaction rules require exact URLs, methods and resource types")
        https_url(rule["url"])
        for key, allowed in (("methods", {"GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"}),
                             ("resourceTypes", {"fetch", "xhr", "document"})):
            if (not isinstance(rule[key], list) or not rule[key] or len(rule[key]) != len(set(rule[key])) or
                    any(not isinstance(item, str) or item not in allowed for item in rule[key])):
                raise ValueError("Unsupported transaction rule")
        if "queryKeys" in rule:
            if (urlsplit(rule["url"]).query or not isinstance(rule["queryKeys"], list) or
                    len(rule["queryKeys"]) > 40 or
                    any(not isinstance(key, str) or not re.fullmatch(r"[A-Za-z_$][A-Za-z0-9_$.-]{0,63}", key)
                        for key in rule["queryKeys"]) or
                    len(set(rule["queryKeys"])) != len(rule["queryKeys"]) or "readOnly" in rule):
                raise ValueError("Query-scoped rules require an exact endpoint and explicit unique parameter names")
            if not rule.get("authentication") and any(method not in {"GET", "HEAD"} for method in rule["methods"]):
                raise ValueError("Query-scoped application requests are GET/HEAD only")
        if "frame" in rule and (rule["frame"] is not True or rule["methods"] != ["GET"] or rule["resourceTypes"] != ["document"]):
            raise ValueError("Frame permissions require a child-frame GET document")
        if "authentication" in rule:
            parsed = urlsplit(rule["url"])
            if (rule["authentication"] is not True or "readOnly" in rule or
                    f"{parsed.scheme}://{parsed.netloc}" not in {
                        origin.rstrip("/") for origin in connection.get("authenticationOrigins", [])} or
                    any(method not in {"GET", "POST"} for method in rule["methods"])):
                raise ValueError("Authentication rules must use an existing trusted authentication origin")
        if ("queryKeys" in rule and "document" in rule["resourceTypes"]
                and not rule.get("frame") and not rule.get("authentication")):
            raise ValueError("Query-scoped documents require explicit frame or authentication scope")
        if "readOnly" in rule:
            qualification = rule["readOnly"]
            if not isinstance(qualification, dict):
                raise ValueError("Read-only qualification must be an operator-owned object")
            expected_fields = {"bodySha256", "responseKeys"}
            if version >= 5 and "bodyBytes" in qualification:
                expected_fields |= {"bodyBytes", "bodyFormat"}
                body_qualified = (
                    type(qualification["bodyBytes"]) is int and 1 <= qualification["bodyBytes"] <= 65536 and
                    qualification.get("bodyFormat") == "json" and
                    isinstance(qualification.get("bodySha256"), str) and
                    re.fullmatch(r"[a-f0-9]{64}", qualification["bodySha256"]) is not None)
            else:
                body_qualified = qualification.get("bodySha256") == hashlib.sha256(b"").hexdigest()
            if (rule["methods"] != ["POST"] or
                    any(kind not in {"fetch", "xhr"} for kind in rule["resourceTypes"]) or
                    set(qualification) != expected_fields or not body_qualified or
                    not isinstance(qualification["responseKeys"], list) or
                    not 1 <= len(qualification["responseKeys"]) <= 20 or
                    any(not isinstance(key, str) or not re.fullmatch("[A-Za-z][A-Za-z0-9_]{0,100}", key)
                        for key in qualification["responseKeys"]) or
                    len(set(qualification["responseKeys"])) != len(qualification["responseKeys"])):
                raise ValueError("Read-only POST rules require an exact qualified body and explicit JSON response keys")
        if version >= 3:
            for method in rule["methods"]:
                for kind in rule["resourceTypes"]:
                    signature = (rule["url"], method, kind)
                    body_hash = rule.get("readOnly", {}).get("bodySha256")
                    if signature in signatures:
                        prior = signatures[signature]
                        if version < 5 or body_hash is None or None in prior or body_hash in prior:
                            raise ValueError("Overlapping request permissions are ambiguous")
                    signatures.setdefault(signature, set()).add(body_hash)
    if version >= 4:
        blocks = policy["telemetryBlocks"]
        if not isinstance(blocks, list) or len(blocks) > 20:
            raise ValueError("Invalid telemetry denial budget")
        for rule in blocks:
            if not isinstance(rule, dict) or set(rule) != {"url", "methods", "resourceTypes", "qualification"}:
                raise ValueError("Telemetry denials need an exact endpoint and operator qualification")
            endpoint = https_url(rule["url"])
            if (endpoint.query or not isinstance(rule["qualification"], str) or
                    not 1 <= len(rule["qualification"].strip()) <= 1024):
                raise ValueError("Telemetry denials never store query values or omit qualification")
            for key, allowed in (("methods", {"GET", "HEAD", "POST"}), ("resourceTypes", {"fetch", "xhr", "ping"})):
                if (not isinstance(rule[key], list) or not rule[key] or
                        len(set(rule[key])) != len(rule[key]) or any(item not in allowed for item in rule[key])):
                    raise ValueError("Telemetry denials cannot hide document, script or other feature failures")
    diagnostic_rules = policy.get("bodyDiagnostics", [])
    if not isinstance(diagnostic_rules, list) or len(diagnostic_rules) > 10:
        raise ValueError("Invalid body diagnostic budget")
    diagnostic_urls = set()
    for rule in diagnostic_rules:
        if (not isinstance(rule, dict) or set(rule) != {"url", "jsonBooleanFields", "qualification"}):
            raise ValueError("Body diagnostics require an exact endpoint and explicit operator qualification")
        parsed = https_url(rule["url"])
        if (parsed.query or rule["url"] in diagnostic_urls or
                f"{parsed.scheme}://{parsed.netloc}" in {
                    origin.rstrip("/") for origin in connection.get("authenticationOrigins", [])} or
                not isinstance(rule["qualification"], str) or not 1 <= len(rule["qualification"].strip()) <= 1024):
            raise ValueError("Body diagnostics cannot target authentication or ambiguous endpoints")
        diagnostic_urls.add(rule["url"])
        names = rule["jsonBooleanFields"]
        if (not isinstance(names, list) or len(names) > 10 or
                any(not isinstance(name, str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{0,63}", name) for name in names) or
                len(set(names)) != len(names)):
            raise ValueError("Only explicit root-level JSON boolean fields may be diagnosed")
    scanner = policy["scanner"]
    if scanner is not None:
        if (not isinstance(scanner, dict) or set(scanner) != {"path", "sha256"} or
                not isinstance(scanner["path"], str) or not Path(scanner["path"]).is_absolute() or
                not isinstance(scanner["sha256"], str) or not re.fullmatch(r"[a-f0-9]{64}", scanner["sha256"])):
            raise ValueError("Scanner must be a pinned operator-installed axe-core script")
    return policy


def json_body_diagnostic(policy, request):
    rule = next((rule for rule in policy.get("bodyDiagnostics", [])
                 if rule["url"] == request.url), None)
    if rule is None or request.method != "POST" or request.resource_type not in {"fetch", "xhr"}:
        return None
    omitted = {"state": "unavailable", "booleanFields": {}}
    body = request.post_data_buffer or b""
    headers = {key.lower(): value for key, value in request.headers.items()}
    if not 1 <= len(body) <= 65536 or headers.get("content-type", "").split(";")[0].strip().lower() != "application/json":
        return omitted

    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("Ambiguous JSON object")
            result[key] = value
        return result

    try:
        data = json.loads(body.decode("utf-8"), object_pairs_hook=unique_object)
    except (ValueError, UnicodeDecodeError, RecursionError):
        return omitted
    if not isinstance(data, dict):
        return omitted
    flags = {name: data[name] for name in rule["jsonBooleanFields"]
             if type(data.get(name)) is bool}
    return {"state": "observed", "bodySha256": hashlib.sha256(body).hexdigest(),
            "booleanFields": flags, "booleanFieldsComplete": len(flags) == len(rule["jsonBooleanFields"])}


def endpoint_matches(url, request):
    expected, actual = urlsplit(url), urlsplit(request.url)
    return (expected.scheme, expected.netloc, expected.path) == (actual.scheme, actual.netloc, actual.path)


def telemetry_block(policy, request):
    for rule in policy.get("telemetryBlocks", []):
        if (endpoint_matches(rule["url"], request) and request.method in rule["methods"] and
                request.resource_type in rule["resourceTypes"]):
            return rule
    return None


def request_rule(policy, request):
    for rule in policy.get("requests", []):
        if request.method not in rule["methods"] or request.resource_type not in rule["resourceTypes"]:
            continue
        if "queryKeys" in rule:
            keys = [key for key, _ in parse_qsl(urlsplit(request.url).query, keep_blank_values=True)]
            if not endpoint_matches(rule["url"], request) or len(keys) != len(set(keys)) or any(key not in rule["queryKeys"] for key in keys):
                continue
        elif request.url != rule["url"]:
            continue
        if policy.get("schemaVersion", 1) >= 5 and "readOnly" in rule and not read_only_body_matches(rule, request):
            continue
        return rule
    return None


def read_only_body_matches(rule, request):
    headers = {key.lower(): value for key, value in request.headers.items()}
    body = request.post_data_buffer or b""
    qualification = rule["readOnly"]
    expected_bytes = qualification.get("bodyBytes", 0)
    if (any(key in headers for key in ("x-http-method", "x-http-method-override", "x-method-override",
                                      "transfer-encoding")) or
            headers.get("content-length", str(expected_bytes)).strip() != str(expected_bytes) or
            len(body) != expected_bytes):
        return False
    if hashlib.sha256(body).hexdigest() != qualification["bodySha256"]:
        return False
    if expected_bytes:
        if headers.get("content-type", "").split(";")[0].strip().lower() != "application/json":
            return False
        try:
            return isinstance(json.loads(body.decode("utf-8")), dict)
        except (UnicodeDecodeError, json.JSONDecodeError, RecursionError):
            return False
    return True


def rooted_at_target(request, target, final_target=None):
    frame = getattr(request, "frame", None)
    if frame is None:
        return False
    for _ in range(16):
        if frame.parent_frame is None:
            return frame.url == target or (final_target is not None and frame.url == final_target)
        frame = frame.parent_frame
    return False


def permits(policy, target, request, authenticating=False, final_target=None):
    if final_target is not None and final_target != target:
        if ("?" not in target or final_target != target.split("?", 1)[0] or
                target not in policy["allowedTargets"] or final_target not in policy["allowedTargets"]):
            raise ValueError("Canonical frame scope requires both explicit same-path protected targets")
    parsed = urlsplit(request.url)
    if parsed.scheme != "https" or parsed.username or parsed.password or "\\" in request.url:
        return False
    if telemetry_block(policy, request):
        return False
    origin = f"{parsed.scheme}://{parsed.netloc}"
    connection = policy.get("connection", {})
    rule = request_rule(policy, request)
    constrained = any("queryKeys" in candidate and endpoint_matches(candidate["url"], request)
                      and request.method in candidate["methods"] and request.resource_type in candidate["resourceTypes"]
                      for candidate in policy.get("requests", []))
    if constrained and rule is None:
        return False
    if rule is None and any(
            "readOnly" in candidate and candidate["url"] == request.url and
            request.method in candidate["methods"] and request.resource_type in candidate["resourceTypes"]
            for candidate in policy.get("requests", [])):
        return False
    if rule and rule.get("frame") and getattr(request, "frame", None) is None:
        return False
    if rule and rule.get("frame") and request.frame.parent_frame is None:
        return False
    if rule and rule.get("frame"):
        if not rooted_at_target(request, target, final_target):
            return False
        origin_value = dict(parse_qsl(parsed.query, keep_blank_values=True)).get("origin")
        target_url = urlsplit(target)
        if origin_value is not None and origin_value != f"{target_url.scheme}://{target_url.netloc}":
            return False
    if rule and rule.get("authentication") and not authenticating and not rooted_at_target(request, target, final_target):
        return False
    if rule and "readOnly" in rule:
        return read_only_body_matches(rule, request)
    if (authenticating and connection.get("mode") == "persistent" and
            origin in {value.rstrip("/") for value in connection["authenticationOrigins"]}):
        return request.method in {"GET", "HEAD", "POST"} and request.resource_type != "websocket"
    if rule:
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


def verify_windows_accounts_extension(extension):
    root = Path(extension["directory"])
    if root.is_symlink():
        raise ValueError("Microsoft SSO directory cannot be a symbolic link")
    root = root.resolve(strict=True)
    manifest_path = root / "manifest.json"
    if manifest_path.is_symlink() or manifest_path.stat().st_size > 1024 * 1024:
        raise ValueError("Invalid bounded Microsoft SSO manifest")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict) or not isinstance(manifest.get("key"), str) or len(manifest["key"]) > 8192:
        raise ValueError("Microsoft SSO manifest has no bounded public key")
    public_key = base64.b64decode(manifest["key"], validate=True)
    identity = "".join(chr(ord("a") + int(char, 16)) for char in hashlib.sha256(public_key).hexdigest()[:32])
    if not public_key or identity != WINDOWS_ACCOUNTS_EXTENSION_ID:
        raise ValueError("Pinned extension is not the approved Microsoft SSO identity")
    records = []
    total_bytes = 0
    for count, file in enumerate(root.rglob("*")):
        if count >= 512 or file.is_symlink() or not file.resolve().is_relative_to(root):
            raise ValueError("Microsoft SSO tree is unbounded or leaves the pinned directory")
        if not file.is_file():
            continue
        with file.open("rb") as stream:
            data = stream.read(32 * 1024 * 1024 - total_bytes + 1)
        total_bytes += len(data)
        if total_bytes > 32 * 1024 * 1024:
            raise ValueError("Microsoft SSO tree exceeds the byte bound")
        records.append((file.relative_to(root).as_posix(), hashlib.sha256(data).hexdigest()))
    tree = "".join(f"{name}\t{digest}\n" for name, digest in sorted(records))
    if hashlib.sha256(tree.encode("utf-8")).hexdigest() != extension["treeSha256"]:
        raise ValueError("Microsoft SSO installed tree differs from its operator pin")
    return {"id": identity, "version": str(manifest.get("version", ""))[:64],
            "treeSha256": extension["treeSha256"], "verifiedBeforeLaunch": True}


def open_context(playwright, request, policy, provenance=None):
    options = dict(viewport=request["viewport"], device_scale_factor=1,
                   locale="en-US", reduced_motion="reduce", service_workers="block",
                   accept_downloads=False)
    connection = policy.get("connection", {"mode": "ephemeral"})
    if connection["mode"] == "persistent":
        profile = Path(connection["userDataDirectory"]).resolve(strict=True)
        if not profile.is_dir():
            raise ValueError("The existing owned Chromium profile directory is required")
        extension = connection.get("windowsAccountsExtension")
        extension_proof = None
        if extension is not None:
            extension_proof = verify_windows_accounts_extension(extension)
            directory = str(Path(extension["directory"]).resolve(strict=True))
            options.update(ignore_default_args=["--disable-extensions"],
                           args=[f"--disable-extensions-except={directory}", f"--load-extension={directory}"])
        # Do not fall back to system Edge, another profile, or a headless retry.
        context = playwright.chromium.launch_persistent_context(str(profile), headless=False, **options)
        if provenance is not None and extension_proof is not None:
            provenance["windowsAccountsExtension"] = extension_proof
        return context.browser, context
    browser = playwright.chromium.launch(headless=False)
    context = None
    try:
        context = browser.new_context(**options)
        return browser, context
    finally:
        if context is None:
            browser.close()


def json_document_ready(page, keys):
    content_type = page.evaluate("document.contentType").lower()
    if content_type != "application/json" and not (
            content_type.startswith("application/") and content_type.endswith("+json")):
        return False
    body = page.locator("body > pre")
    if body.count() != 1 or not body.is_visible():
        return False
    text = body.evaluate("(element) => element.textContent.length <= 65536 ? element.textContent : null")
    if not isinstance(text, str) or len(text.encode("utf-8")) > 65536:
        return False

    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("Duplicate JSON response key")
            result[key] = value
        return result

    def reject_constant(value):
        raise ValueError("Nonstandard JSON constant")

    try:
        data = json.loads(text, object_pairs_hook=unique_object, parse_constant=reject_constant)
    except (ValueError, RecursionError):
        return False
    return isinstance(data, dict) and all(key in data for key in keys)


def wait_authenticated(page, request, policy, deadline, monotonic):
    connection = policy.get("connection", {})
    if connection.get("mode") != "persistent":
        return
    until = min(deadline, monotonic() + connection["timeoutSeconds"])
    while monotonic() < until:
        if page.url == request["target"]:
            declaration = connection["ready"]
            if "jsonResponseKeys" in declaration:
                ready = json_document_ready(page, declaration["jsonResponseKeys"])
            else:
                marker = page.locator(declaration["css"])
                ready = marker.count() == 1 and marker.is_visible()
            if ready and monotonic() < until and page.url == request["target"]:
                return
        page.wait_for_timeout(min(250, max(1, (until - monotonic()) * 1000)))
    raise RuntimeError("Visible authentication did not reach the approved target/readiness marker; "
                       "inspect the explicit login/MFA/consent or page failure, no scenario was triggered")
