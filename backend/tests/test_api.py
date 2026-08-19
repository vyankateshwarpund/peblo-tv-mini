import io
import os
import json
import pytest
from PIL import Image
from backend.app.models.show import Show
from backend.app.models.season import Season
from backend.app.models.episode import Episode
from backend.app.models.artwork import Artwork

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_login_success_and_failure(client):
    # Success
    res = client.post("/auth/login", json={"email": "admin@example.com", "password": "adminpassword123"})
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["user"]["role"] == "admin"

    # Failure
    res = client.post("/auth/login", json={"email": "admin@example.com", "password": "wrongpassword"})
    assert res.status_code == 401

def test_editor_can_crud_show(client, editor_token):
    headers = {"Authorization": f"Bearer {editor_token}"}
    
    # Create Show
    res = client.post("/admin/shows", headers=headers, json={
        "title": "Test Show",
        "slug": "test-show",
        "synopsis": "A test show description",
        "section": "series",
        "categories": ["adventure", "science"],
        "status": "draft"
    })
    assert res.status_code == 201
    show_id = res.json()["id"]

    # Read Show
    res = client.get(f"/admin/shows/{show_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Test Show"

    # Update Show
    res = client.patch(f"/admin/shows/{show_id}", headers=headers, json={
        "title": "Test Show Updated"
    })
    assert res.status_code == 200
    assert res.json()["title"] == "Test Show Updated"

    # Delete Show
    res = client.delete(f"/admin/shows/{show_id}", headers=headers)
    assert res.status_code == 204

def test_editor_cannot_publish_admin_can(client, editor_token, admin_token):
    # Editor attempt publish -> 403 Forbidden
    res = client.post("/admin/catalog/publish", headers={"Authorization": f"Bearer {editor_token}"})
    assert res.status_code == 403

    # Admin attempt publish -> allowed
    res = client.post("/admin/catalog/publish", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code in [200, 400]

def test_duplicate_content_group_language_rejected(client, editor_token):
    headers = {"Authorization": f"Bearer {editor_token}"}
    
    s_res = client.post("/admin/shows", headers=headers, json={"title": "Show 1", "slug": "show-1", "section": "series", "status": "draft"})
    show_id = s_res.json()["id"]
    sn_res = client.post(f"/admin/shows/{show_id}/seasons", headers=headers, json={"season_number": 1, "title": "Season 1"})
    season_id = sn_res.json()["id"]

    ep1 = client.post(f"/admin/seasons/{season_id}/episodes", headers=headers, json={
        "episode_number": 1,
        "episode_title": "Ep 1 EN",
        "duration_seconds": 300,
        "language": "en",
        "content_group": "group-101",
        "status": "draft"
    })
    assert ep1.status_code == 201

    # Duplicate content_group and language -> 400 Bad Request
    ep2 = client.post(f"/admin/seasons/{season_id}/episodes", headers=headers, json={
        "episode_number": 2,
        "episode_title": "Ep 2 EN Dup",
        "duration_seconds": 300,
        "language": "en",
        "content_group": "group-101",
        "status": "draft"
    })
    assert ep2.status_code == 400

    # Different language with same content_group -> 201 Created
    ep3 = client.post(f"/admin/seasons/{season_id}/episodes", headers=headers, json={
        "episode_number": 1,
        "episode_title": "Ep 1 HI",
        "duration_seconds": 300,
        "language": "hi",
        "content_group": "group-101",
        "status": "draft"
    })
    assert ep3.status_code == 201

def test_invalid_language_rejected(client, editor_token):
    headers = {"Authorization": f"Bearer {editor_token}"}
    s_res = client.post("/admin/shows", headers=headers, json={"title": "Show Lang", "slug": "show-lang", "section": "series", "status": "draft"})
    show_id = s_res.json()["id"]
    sn_res = client.post(f"/admin/shows/{show_id}/seasons", headers=headers, json={"season_number": 1, "title": "Season 1"})
    season_id = sn_res.json()["id"]

    res = client.post(f"/admin/seasons/{season_id}/episodes", headers=headers, json={
        "episode_number": 1,
        "episode_title": "French Ep",
        "duration_seconds": 120,
        "language": "fr",
        "content_group": "fr-group",
        "status": "draft"
    })
    assert res.status_code == 422

def test_artwork_validation_file_size_and_aspect_ratio(client, editor_token):
    headers = {"Authorization": f"Bearer {editor_token}"}
    s_res = client.post("/admin/shows", headers=headers, json={"title": "Art Show", "slug": "art-show", "section": "series", "status": "draft"})
    show_id = s_res.json()["id"]
    sn_res = client.post(f"/admin/shows/{show_id}/seasons", headers=headers, json={"season_number": 1, "title": "Season 1"})
    season_id = sn_res.json()["id"]
    ep_res = client.post(f"/admin/seasons/{season_id}/episodes", headers=headers, json={
        "episode_number": 1, "episode_title": "Art Ep", "duration_seconds": 120, "language": "en", "content_group": "art-ep-1", "status": "draft"
    })
    ep_id = ep_res.json()["id"]

    # 1. Valid poster (600x900, 2:3)
    img_poster = Image.new("RGB", (600, 900), color="blue")
    buf = io.BytesIO()
    img_poster.save(buf, format="JPEG")
    poster_bytes = buf.getvalue()

    res = client.post(
        f"/admin/episodes/{ep_id}/artworks",
        headers=headers,
        data={"artwork_type": "poster"},
        files={"file": ("poster.jpg", poster_bytes, "image/jpeg")}
    )
    assert res.status_code == 200
    assert res.json()["artwork_type"] == "poster"

    # 2. Poster with wrong aspect ratio (600x600, 1:1) -> 400 Bad Request
    img_square = Image.new("RGB", (600, 600), color="red")
    buf_sq = io.BytesIO()
    img_square.save(buf_sq, format="JPEG")
    res_bad_ratio = client.post(
        f"/admin/episodes/{ep_id}/artworks",
        headers=headers,
        data={"artwork_type": "poster"},
        files={"file": ("poster_sq.jpg", buf_sq.getvalue(), "image/jpeg")}
    )
    assert res_bad_ratio.status_code == 400
    assert "aspect ratio" in res_bad_ratio.json()["detail"]["message"].lower()

    # 3. Banner > 200 KB -> 400 Bad Request
    large_bytes = b"x" * (250 * 1024)
    res_large = client.post(
        f"/admin/episodes/{ep_id}/artworks",
        headers=headers,
        data={"artwork_type": "banner"},
        files={"file": ("banner_huge.jpg", large_bytes, "image/jpeg")}
    )
    assert res_large.status_code == 400
    assert "200 kb" in res_large.json()["detail"]["message"].lower()

def test_validation_report_blocks_publish_on_missing_artwork_or_duration(client, editor_token, admin_token, db_session):
    headers = {"Authorization": f"Bearer {editor_token}"}
    
    s_res = client.post("/admin/shows", headers=headers, json={"title": "Pub Show", "slug": "pub-show", "section": "featured", "status": "published"})
    show_id = s_res.json()["id"]
    sn_res = client.post(f"/admin/shows/{show_id}/seasons", headers=headers, json={"season_number": 1, "title": "Season 1"})
    season_id = sn_res.json()["id"]

    ep_res = client.post(f"/admin/seasons/{season_id}/episodes", headers=headers, json={
        "episode_number": 1, "episode_title": "Ep No Art", "duration_seconds": 200, "language": "en", "content_group": "no-art-cg", "status": "published"
    })
    ep_id = ep_res.json()["id"]

    val_res = client.get("/admin/validation-report", headers=headers)
    assert val_res.status_code == 200
    assert val_res.json()["can_publish"] is False
    assert any("artwork" in err["message"].lower() for err in val_res.json()["errors"])

    pub_res = client.post("/admin/catalog/publish", headers={"Authorization": f"Bearer {admin_token}"})
    assert pub_res.status_code == 400

def test_content_group_language_collapsing_and_season_zero_in_catalogue(client, editor_token, admin_token):
    headers = {"Authorization": f"Bearer {editor_token}"}
    
    s_res = client.post("/admin/shows", headers=headers, json={
        "title": "Bilingual Show", "slug": "bilingual-show", "section": "series", "categories": ["adventure"], "status": "published"
    })
    show_id = s_res.json()["id"]

    # Season 0 (Trailer)
    s0_res = client.post(f"/admin/shows/{show_id}/seasons", headers=headers, json={"season_number": 0, "title": "Trailers"})
    s0_id = s0_res.json()["id"]
    ep0_res = client.post(f"/admin/seasons/{s0_id}/episodes", headers=headers, json={
        "episode_number": 1, "episode_title": "Trailer 1", "duration_seconds": 60, "language": "en", "content_group": "trailer-cg", "status": "published"
    })
    ep0_id = ep0_res.json()["id"]

    # Season 1
    s1_res = client.post(f"/admin/shows/{show_id}/seasons", headers=headers, json={"season_number": 1, "title": "Season 1"})
    s1_id = s1_res.json()["id"]
    
    ep1_res = client.post(f"/admin/seasons/{s1_id}/episodes", headers=headers, json={
        "episode_number": 1, "episode_title": "Ep One", "duration_seconds": 300, "language": "en", "content_group": "bi-cg-1", "status": "published"
    })
    ep1_id = ep1_res.json()["id"]

    ep2_res = client.post(f"/admin/seasons/{s1_id}/episodes", headers=headers, json={
        "episode_number": 1, "episode_title": "Ep One", "duration_seconds": 300, "language": "hi", "content_group": "bi-cg-1", "status": "published"
    })
    ep2_id = ep2_res.json()["id"]

    # Upload artworks for all 3 episodes
    for epid in [ep0_id, ep1_id, ep2_id]:
        p_img = Image.new("RGB", (600, 900), "blue")
        p_buf = io.BytesIO(); p_img.save(p_buf, "JPEG")
        client.post(f"/admin/episodes/{epid}/artworks", headers=headers, data={"artwork_type": "poster"}, files={"file": ("p.jpg", p_buf.getvalue(), "image/jpeg")})
        
        b_img = Image.new("RGB", (1280, 720), "green")
        b_buf = io.BytesIO(); b_img.save(b_buf, "JPEG")
        client.post(f"/admin/episodes/{epid}/artworks", headers=headers, data={"artwork_type": "banner"}, files={"file": ("b.jpg", b_buf.getvalue(), "image/jpeg")})
        
        t_img = Image.new("RGB", (640, 360), "yellow")
        t_buf = io.BytesIO(); t_img.save(t_buf, "JPEG")
        client.post(f"/admin/episodes/{epid}/artworks", headers=headers, data={"artwork_type": "thumbnail"}, files={"file": ("t.jpg", t_buf.getvalue(), "image/jpeg")})

    val = client.get("/admin/validation-report", headers=headers).json()
    assert val["can_publish"] is True

    pub = client.post("/admin/catalog/publish", headers={"Authorization": f"Bearer {admin_token}"})
    assert pub.status_code == 200
    assert pub.json()["status"] == "success"

    cat = client.get("/catalog").json()
    assert "series" in cat["sections"]
    shows = cat["sections"]["series"]
    assert len(shows) == 1
    show = shows[0]
    
    assert len(show["seasons"]) == 1
    assert show["seasons"][0]["season_number"] == 1
    assert len(show["trailers"]) == 1
    assert show["trailers"][0]["content_group"] == "trailer-cg"

    season1_eps = show["seasons"][0]["episodes"]
    assert len(season1_eps) == 1
    assert season1_eps[0]["content_group"] == "bi-cg-1"
    assert season1_eps[0]["languages"] == ["en", "hi"]

def test_search_and_composed_filters(client, admin_token):
    res1 = client.get("/catalog/search?q=Bilingual")
    assert len(res1.json()) == 1

    res2 = client.get("/catalog/search?category=adventure")
    assert len(res2.json()) == 1

    res3 = client.get("/catalog/search?language=hi")
    assert len(res3.json()) == 1

    res4 = client.get("/catalog/search?q=Ep&category=adventure&language=en&section=series")
    assert len(res4.json()) == 1

    res5 = client.get("/catalog/search?q=NonExistent")
    assert len(res5.json()) == 0

def test_published_catalogue_excludes_draft_shows_and_episodes(client, editor_token, admin_token):
    headers = {"Authorization": f"Bearer {editor_token}"}
    
    client.post("/admin/shows", headers=headers, json={
        "title": "Draft Only Show", "slug": "draft-only-show", "section": "series", "status": "draft"
    })
    
    pub = client.post("/admin/catalog/publish", headers={"Authorization": f"Bearer {admin_token}"})
    assert pub.status_code == 200

    res = client.get("/catalog/search?q=Draft+Only")
    assert len(res.json()) == 0
