import pytest


@pytest.mark.asyncio
async def test_category_crud_and_sort_order(client, auth_headers):
    c1 = await client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": " Catering ", "icon": "utensils", "allocatedBudget": 500000},
    )
    assert c1.status_code == 201
    b1 = c1.json()
    assert b1["id"].startswith("cat-")
    assert b1["weddingId"].startswith("wed-")
    assert b1["name"] == "Catering"
    assert b1["sortOrder"] == 0
    assert b1["allocatedBudget"] == 500000

    c2 = await client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": "Venue", "icon": "building", "description": "   "},
    )
    assert c2.status_code == 201
    b2 = c2.json()
    assert b2["sortOrder"] == 1
    assert b2.get("description") is None

    listed = await client.get("/api/v1/categories", headers=auth_headers)
    assert listed.status_code == 200
    assert [c["name"] for c in listed.json()] == ["Catering", "Venue"]

    single = await client.get(f"/api/v1/categories/{b1['id']}", headers=auth_headers)
    assert single.status_code == 200
    assert single.json()["name"] == "Catering"

    missing = await client.get("/api/v1/categories/cat-missing", headers=auth_headers)
    assert missing.status_code == 404

    patched = await client.patch(
        f"/api/v1/categories/{b1['id']}",
        headers=auth_headers,
        json={"name": "Royal Catering", "allocatedBudget": 0},
    )
    assert patched.status_code == 200
    assert patched.json()["name"] == "Royal Catering"
    assert patched.json().get("allocatedBudget") is None

    invalid = await client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"name": "   ", "icon": "utensils"},
    )
    assert invalid.status_code == 422


@pytest.mark.asyncio
async def test_delete_category_cascades_expenses(client, auth_headers, test_db):
    c1 = (
        await client.post(
            "/api/v1/categories",
            headers=auth_headers,
            json={"name": "Catering", "icon": "utensils"},
        )
    ).json()
    c2 = (
        await client.post(
            "/api/v1/categories",
            headers=auth_headers,
            json={"name": "Decor", "icon": "sparkles"},
        )
    ).json()
    user_id = (await client.get("/api/v1/auth/me", headers=auth_headers)).json()["id"]

    await test_db["expenses"].insert_many(
        [
            {
                "_id": "exp-cat1",
                "userId": user_id,
                "weddingId": c1["weddingId"],
                "categoryId": c1["id"],
                "title": "Main Feast",
                "estimatedAmount": 200000,
                "payments": [],
                "createdAt": "2026-11-25T00:00:00Z",
                "updatedAt": "2026-11-25T00:00:00Z",
            },
            {
                "_id": "exp-cat2",
                "userId": user_id,
                "weddingId": c2["weddingId"],
                "categoryId": c2["id"],
                "title": "Mandap Flowers",
                "estimatedAmount": 80000,
                "payments": [],
                "createdAt": "2026-11-25T00:00:00Z",
                "updatedAt": "2026-11-25T00:00:00Z",
            },
        ]
    )

    delete_res = await client.delete(f"/api/v1/categories/{c1['id']}", headers=auth_headers)
    assert delete_res.status_code == 204

    assert await test_db["categories"].find_one({"_id": c1["id"]}) is None
    assert await test_db["expenses"].find_one({"_id": "exp-cat1"}) is None
    assert await test_db["expenses"].find_one({"_id": "exp-cat2"}) is not None

    missing_del = await client.delete("/api/v1/categories/cat-missing", headers=auth_headers)
    assert missing_del.status_code == 404
