import pytest


@pytest.mark.asyncio
async def test_wedding_requires_auth(client):
    assert (await client.get("/api/v1/wedding")).status_code == 401
    assert (
        await client.put(
            "/api/v1/wedding",
            json={
                "brideName": "Aanya",
                "groomName": "Rohan",
                "weddingDate": "2027-02-14",
                "totalBudget": 2500000,
                "contingencyPercent": 10,
            },
        )
    ).status_code == 401
    assert (await client.post("/api/v1/wedding/reset")).status_code == 401


@pytest.mark.asyncio
async def test_get_wedding_bootstraps_unonboarded(client, auth_headers):
    res = await client.get("/api/v1/wedding", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["id"].startswith("wed-")
    assert body["brideName"] == ""
    assert body["groomName"] == ""
    assert body["weddingDate"] == ""
    assert body["totalBudget"] == 2500000
    assert body["contingencyPercent"] == 10
    assert body["currency"] == "INR"
    assert body["isOnboarded"] is False


@pytest.mark.asyncio
async def test_put_wedding_saves_profile_and_validates(client, auth_headers):
    res = await client.put(
        "/api/v1/wedding",
        headers=auth_headers,
        json={
            "brideName": " Aanya ",
            "groomName": " Rohan ",
            "weddingDate": "2027-02-14",
            "totalBudget": 3000000,
            "contingencyPercent": 10,
            "isOnboarded": True,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["brideName"] == "Aanya"
    assert body["groomName"] == "Rohan"
    assert body["weddingDate"] == "2027-02-14"
    assert body["totalBudget"] == 3000000
    assert body["contingencyPercent"] == 10
    assert body["isOnboarded"] is True

    bad = await client.put(
        "/api/v1/wedding",
        headers=auth_headers,
        json={
            "brideName": "   ",
            "groomName": "Rohan",
            "weddingDate": "2027-02-14",
            "totalBudget": 3000000,
            "contingencyPercent": 10,
        },
    )
    assert bad.status_code == 422


@pytest.mark.asyncio
async def test_reset_wedding_clears_data_preserves_user(client, auth_headers, test_db):
    put_res = await client.put(
        "/api/v1/wedding",
        headers=auth_headers,
        json={
            "brideName": "Aanya",
            "groomName": "Rohan",
            "weddingDate": "2027-02-14",
            "totalBudget": 3000000,
            "contingencyPercent": 10,
            "isOnboarded": True,
        },
    )
    wedding_id = put_res.json()["id"]
    me_res = await client.get("/api/v1/auth/me", headers=auth_headers)
    user_id = me_res.json()["id"]

    await test_db["categories"].insert_one(
        {
            "_id": "cat-test0001",
            "userId": user_id,
            "weddingId": wedding_id,
            "name": "Catering",
            "icon": "utensils",
            "sortOrder": 0,
            "createdAt": "2026-11-25T00:00:00Z",
        }
    )
    await test_db["expenses"].insert_one(
        {
            "_id": "exp-test0001",
            "userId": user_id,
            "weddingId": wedding_id,
            "categoryId": "cat-test0001",
            "title": "Main Feast",
            "estimatedAmount": 200000,
            "payments": [],
            "createdAt": "2026-11-25T00:00:00Z",
            "updatedAt": "2026-11-25T00:00:00Z",
        }
    )

    reset_res = await client.post("/api/v1/wedding/reset", headers=auth_headers)
    assert reset_res.status_code == 200
    reset_body = reset_res.json()
    assert reset_body["isOnboarded"] is False
    assert reset_body["brideName"] == ""
    assert reset_body["id"] != wedding_id

    assert await test_db["categories"].count_documents({"userId": user_id}) == 0
    assert await test_db["expenses"].count_documents({"userId": user_id}) == 0

    still_me = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert still_me.status_code == 200
    assert still_me.json()["username"] == "siddhartha"
