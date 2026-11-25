import pytest


@pytest.mark.asyncio
async def test_health_and_seeded_user(client, test_db):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "database": "ok"}

    user = await test_db["users"].find_one({"username": "siddhartha"})
    assert user is not None
    assert user["password"] == "sidd@1996"
    assert isinstance(user["_id"], str) and user["_id"].startswith("usr-")
