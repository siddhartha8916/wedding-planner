import pytest


@pytest.mark.asyncio
async def test_login_success_and_me(client):
    res = await client.post(
        "/api/v1/auth/login",
        json={"username": "siddhartha", "password": "sidd@1996"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["tokenType"] == "bearer"
    assert body["user"]["username"] == "siddhartha"
    assert body["user"]["id"].startswith("usr-")
    assert body["accessToken"]

    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {body['accessToken']}"},
    )
    assert me.status_code == 200
    assert me.json() == body["user"]


@pytest.mark.asyncio
async def test_login_invalid_and_missing_token_return_401(client):
    bad = await client.post(
        "/api/v1/auth/login",
        json={"username": "siddhartha", "password": "wrong"},
    )
    assert bad.status_code == 401

    unknown = await client.post(
        "/api/v1/auth/login",
        json={"username": "nobody", "password": "sidd@1996"},
    )
    assert unknown.status_code == 401

    unauth = await client.get("/api/v1/auth/me")
    assert unauth.status_code == 401

    tampered = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert tampered.status_code == 401


@pytest.mark.asyncio
async def test_deleted_user_token_returns_401(client, test_db):
    res = await client.post(
        "/api/v1/auth/login",
        json={"username": "siddhartha", "password": "sidd@1996"},
    )
    token = res.json()["accessToken"]

    await test_db["users"].delete_many({"username": "siddhartha"})

    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 401
