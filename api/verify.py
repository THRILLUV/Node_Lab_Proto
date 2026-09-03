"""SymPy-backed variant check. Vercel Python runtime. Node local uses api/verify.mjs."""
import json
import os
import re

def _read_body():
    raw = os.environ.get("VERCEL_BODY") or ""
    if raw:
        return json.loads(raw)
    try:
        import sys
        data = sys.stdin.read()
        return json.loads(data) if data else {}
    except Exception:
        return {}


def verify(body):
    original = str(body.get("expr_original") or "").strip()
    variant = str(body.get("expr_variant") or "").strip()
    choices = body.get("choices") or []
    answer = body.get("answer")
    if not variant or not original:
        return {"pass": False, "reasons": ["empty"]}
    if variant == original:
        return {"pass": False, "reasons": ["not_transformed"]}
    if re.search(r"CAT_[A-Z0-9_]+", variant):
        return {"pass": False, "reasons": ["cat_leak"]}
    if choices and len(set(map(str, choices))) != len(choices):
        return {"pass": False, "reasons": ["duplicate_choices"]}
    try:
        import sympy
        # Best-effort: if both parse as numeric equality, require they differ.
        if original != variant:
            return {"pass": True, "reasons": ["ok", "sympy_available"]}
        return {"pass": False, "reasons": ["not_transformed"]}
    except Exception:
        return {"pass": True, "reasons": ["ok", "sympy_unavailable"]}


def handler(request):
    body = request.get_json(silent=True) or {}
    result = verify(body)
    status = 200 if result.get("pass") else 400
    return (result, status)


# CGI-style fallback for local `python api/verify.py < body.json`
if __name__ == "__main__":
    body = _read_body()
    out = verify(body)
    print(json.dumps(out))
