"""Iteration 3 — Backend tests for restructured fulfillment outputs + per-output comments."""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
try:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.strip().split('=', 1)[1].rstrip('/')
                break
except Exception:
    pass
API = f"{BASE_URL}/api"

ADMIN = "jaskaran.sethi@owledmedia.com"
OM = "om@owledmedia.com"
CORE_BD = "core.bd@owledmedia.com"
SNOBALL_BD = "snoball.bd@owledmedia.com"


def tok(email):
    r = requests.post(f"{API}/auth/dev-session", json={"email": email}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["session_token"]


def hdr(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def tokens():
    return {"admin": tok(ADMIN), "om": tok(OM), "core": tok(CORE_BD), "snoball": tok(SNOBALL_BD)}


@pytest.fixture(scope="module")
def notion_deal_id(tokens):
    r = requests.get(f"{API}/deals", headers=hdr(tokens["admin"]))
    assert r.status_code == 200
    notion = next(d for d in r.json() if d["brand_name"] == "Notion")
    return notion["deal_id"]


# ---------- OUTPUTS ----------
class TestOutputs:
    def test_create_default_status_draft(self, tokens, notion_deal_id):
        r = requests.post(f"{API}/outputs", headers=hdr(tokens["om"]),
                          json={"deal_id": notion_deal_id, "output_type": "Writeup",
                                "title": "TEST_draft_default"})
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "Draft"
        assert body["created_by_role"] == "fulfillment"
        pytest.shared_om_output = body["output_id"]

    def test_om_can_update_own(self, tokens, notion_deal_id):
        r = requests.post(f"{API}/outputs", headers=hdr(tokens["om"]),
                          json={"deal_id": notion_deal_id, "output_type": "Canva Link",
                                "title": "TEST_om_own", "status": "Shared with BD"})
        assert r.status_code == 200
        oid = r.json()["output_id"]
        r2 = requests.put(f"{API}/outputs/{oid}", headers=hdr(tokens["om"]),
                          json={"title": "TEST_om_updated", "status": "Approved",
                                "link": "https://canva.com/x"})
        assert r2.status_code == 200
        assert r2.json()["title"] == "TEST_om_updated"
        assert r2.json()["status"] == "Approved"

    def test_second_fulfillment_cannot_edit_om_output(self, tokens, notion_deal_id):
        # Create a second fulfillment user via admin assign, then RESTORE role afterwards
        users = requests.get(f"{API}/users", headers=hdr(tokens["admin"])).json()
        second = next((u for u in users if u["email"] == "pending.test@owledmedia.com"), None)
        assert second, "Expected pending.test seeded user"
        original_role = second["role"]
        try:
            r0 = requests.put(f"{API}/users/{second['user_id']}/assign", headers=hdr(tokens["admin"]),
                              json={"role": "fulfillment", "active": True})
            assert r0.status_code == 200
            second_tok = tok("pending.test@owledmedia.com")
            rc = requests.post(f"{API}/outputs", headers=hdr(tokens["om"]),
                               json={"deal_id": notion_deal_id, "output_type": "Other",
                                     "title": "TEST_only_om_can_edit"})
            oid = rc.json()["output_id"]
            re_ = requests.put(f"{API}/outputs/{oid}", headers={"Authorization": f"Bearer {second_tok}",
                                                                "Content-Type": "application/json"},
                               json={"title": "HACK"})
            assert re_.status_code == 403
        finally:
            # restore original role to avoid breaking other test suites
            requests.put(f"{API}/users/{second['user_id']}/assign", headers=hdr(tokens["admin"]),
                         json={"role": original_role, "active": True})

    def test_admin_can_override_any_output(self, tokens, notion_deal_id):
        rc = requests.post(f"{API}/outputs", headers=hdr(tokens["om"]),
                           json={"deal_id": notion_deal_id, "output_type": "Other",
                                 "title": "TEST_admin_override"})
        oid = rc.json()["output_id"]
        ra = requests.put(f"{API}/outputs/{oid}", headers=hdr(tokens["admin"]),
                          json={"title": "TEST_admin_set", "status": "Final"})
        assert ra.status_code == 200
        assert ra.json()["title"] == "TEST_admin_set"

    def test_bd_cannot_edit_output(self, tokens, notion_deal_id):
        rc = requests.post(f"{API}/outputs", headers=hdr(tokens["om"]),
                           json={"deal_id": notion_deal_id, "output_type": "Other",
                                 "title": "TEST_bd_blocked"})
        oid = rc.json()["output_id"]
        rb = requests.put(f"{API}/outputs/{oid}", headers=hdr(tokens["core"]),
                          json={"title": "HACKBD"})
        assert rb.status_code == 403

    def test_delete_cascades_comments(self, tokens, notion_deal_id):
        # Create output
        rc = requests.post(f"{API}/outputs", headers=hdr(tokens["om"]),
                           json={"deal_id": notion_deal_id, "output_type": "Other",
                                 "title": "TEST_cascade", "status": "Shared with BD"})
        oid = rc.json()["output_id"]
        # Add 2 comments
        for txt in ["TEST_c1", "TEST_c2"]:
            rcm = requests.post(f"{API}/feedback", headers=hdr(tokens["core"]),
                                json={"deal_id": notion_deal_id, "output_id": oid,
                                      "feedback_text": txt})
            assert rcm.status_code == 200
        # Verify present
        det = requests.get(f"{API}/deals/{notion_deal_id}", headers=hdr(tokens["admin"])).json()
        cnt_before = sum(1 for f in det["client_feedback"] if f.get("output_id") == oid)
        assert cnt_before >= 2
        # Delete output
        rd = requests.delete(f"{API}/outputs/{oid}", headers=hdr(tokens["om"]))
        assert rd.status_code == 200
        # Verify comments gone
        det2 = requests.get(f"{API}/deals/{notion_deal_id}", headers=hdr(tokens["admin"])).json()
        cnt_after = sum(1 for f in det2["client_feedback"] if f.get("output_id") == oid)
        assert cnt_after == 0

    def test_bd_does_not_see_draft_outputs(self, tokens, notion_deal_id):
        # Om creates a Draft output explicitly visible_to_bd=True
        rc = requests.post(f"{API}/outputs", headers=hdr(tokens["om"]),
                           json={"deal_id": notion_deal_id, "output_type": "Other",
                                 "title": "TEST_DRAFT_HIDDEN", "status": "Draft",
                                 "visible_to_bd": True})
        oid = rc.json()["output_id"]
        # Admin sees it
        det_a = requests.get(f"{API}/deals/{notion_deal_id}", headers=hdr(tokens["admin"])).json()
        assert any(o["output_id"] == oid for o in det_a["fulfillment_outputs"])
        # Fulfillment sees it
        det_f = requests.get(f"{API}/deals/{notion_deal_id}", headers=hdr(tokens["om"])).json()
        assert any(o["output_id"] == oid for o in det_f["fulfillment_outputs"])
        # BD does NOT see it
        det_b = requests.get(f"{API}/deals/{notion_deal_id}", headers=hdr(tokens["core"])).json()
        assert not any(o["output_id"] == oid for o in det_b["fulfillment_outputs"])


# ---------- FEEDBACK (per-output comments) ----------
class TestFeedback:
    def test_fulfillment_can_create_comment_on_output(self, tokens, notion_deal_id):
        # find any non-draft output
        det = requests.get(f"{API}/deals/{notion_deal_id}", headers=hdr(tokens["admin"])).json()
        outs = [o for o in det["fulfillment_outputs"] if o.get("status") != "Draft"]
        assert outs, "Need at least one non-draft output"
        oid = outs[0]["output_id"]
        r = requests.post(f"{API}/feedback", headers=hdr(tokens["om"]),
                          json={"deal_id": notion_deal_id, "output_id": oid,
                                "feedback_text": "TEST_fulfillment_comment"})
        assert r.status_code == 200
        body = r.json()
        assert body["added_by_role"] == "fulfillment"
        assert body["output_id"] == oid

    def test_bd_role_and_team_captured(self, tokens, notion_deal_id):
        r = requests.post(f"{API}/feedback", headers=hdr(tokens["core"]),
                          json={"deal_id": notion_deal_id,
                                "feedback_text": "TEST_bd_general_comment"})
        assert r.status_code == 200
        body = r.json()
        assert body["added_by_role"] == "bd"
        assert body["added_by_team"] == "OWLED Core"
        assert body["output_id"] is None
        pytest.shared_bd_fb_id = body["feedback_id"]

    def test_admin_role_captured(self, tokens, notion_deal_id):
        r = requests.post(f"{API}/feedback", headers=hdr(tokens["admin"]),
                          json={"deal_id": notion_deal_id,
                                "feedback_text": "TEST_admin_general"})
        assert r.status_code == 200
        assert r.json()["added_by_role"] == "admin"
        pytest.shared_admin_fb_id = r.json()["feedback_id"]

    def test_author_can_edit_own_text(self, tokens):
        fid = pytest.shared_bd_fb_id
        r = requests.put(f"{API}/feedback/{fid}", headers=hdr(tokens["core"]),
                         json={"feedback_text": "TEST_bd_edited"})
        assert r.status_code == 200
        assert r.json()["feedback_text"] == "TEST_bd_edited"

    def test_non_author_non_admin_cannot_edit_text(self, tokens):
        fid = pytest.shared_bd_fb_id
        r = requests.put(f"{API}/feedback/{fid}", headers=hdr(tokens["om"]),
                         json={"feedback_text": "HACK_TEXT"})
        assert r.status_code == 403

    def test_any_role_with_access_can_change_status(self, tokens, notion_deal_id):
        # BD created a comment, Om (fulfillment, different role) flips to Resolved
        fid = pytest.shared_bd_fb_id
        r = requests.put(f"{API}/feedback/{fid}", headers=hdr(tokens["om"]),
                         json={"status": "Resolved"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "Resolved"
        # Admin flips to Open
        r2 = requests.put(f"{API}/feedback/{fid}", headers=hdr(tokens["admin"]),
                          json={"status": "Open"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "Open"

    def test_non_author_non_admin_cannot_delete(self, tokens):
        fid = pytest.shared_bd_fb_id
        r = requests.delete(f"{API}/feedback/{fid}", headers=hdr(tokens["om"]))
        assert r.status_code == 403

    def test_author_can_delete_own(self, tokens):
        fid = pytest.shared_admin_fb_id
        r = requests.delete(f"{API}/feedback/{fid}", headers=hdr(tokens["admin"]))
        assert r.status_code == 200

    def test_bd_cross_team_cannot_create_feedback(self, tokens, notion_deal_id):
        # Snoball BD has no access to Notion deal (OWLED Core)
        r = requests.post(f"{API}/feedback", headers=hdr(tokens["snoball"]),
                          json={"deal_id": notion_deal_id,
                                "feedback_text": "TEST_cross_team"})
        assert r.status_code == 403

    def test_get_deal_returns_output_id_on_comments(self, tokens, notion_deal_id):
        det = requests.get(f"{API}/deals/{notion_deal_id}", headers=hdr(tokens["admin"])).json()
        # at least one comment with output_id, at least one general (None or absent)
        has_output_scoped = any(f.get("output_id") for f in det["client_feedback"])
        assert has_output_scoped
