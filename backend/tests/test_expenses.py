import pytest


@pytest.mark.asyncio
async def test_create_expense_with_advance_and_invalid_category(client, auth_headers):
    cat = (
        await client.post(
            "/api/v1/categories",
            headers=auth_headers,
            json={"name": "Catering", "icon": "utensils"},
        )
    ).json()

    created = await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "categoryId": cat["id"],
            "title": " Main Banquet & Buffet ",
            "description": "   ",
            "estimatedAmount": 200000,
            "dueDate": "",
            "ceremony": "wedding",
            "vendorName": "   ",
            "vendorPhone": "",
            "advancePayment": {
                "amount": 50000,
                "paidDate": "2026-11-25",
                "label": "Advance Deposit",
                "method": "upi",
                "paidBy": "joint",
                "note": "   ",
            },
        },
    )
    assert created.status_code == 201
    body = created.json()
    assert body["id"].startswith("exp-")
    assert body["title"] == "Main Banquet & Buffet"
    assert body.get("description") is None
    assert body.get("dueDate") is None
    assert body.get("vendorName") is None
    assert body.get("vendorPhone") is None
    assert len(body["payments"]) == 1
    assert body["payments"][0]["id"].startswith("pay-")
    assert body["payments"][0]["expenseId"] == body["id"]
    assert body["payments"][0]["amount"] == 50000
    assert body["payments"][0].get("note") is None

    bad_cat = await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "categoryId": "cat-missing",
            "title": "Orphan",
            "estimatedAmount": 1000,
        },
    )
    assert bad_cat.status_code == 404

    bad_title = await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "categoryId": cat["id"],
            "title": "   ",
            "estimatedAmount": 1000,
        },
    )
    assert bad_title.status_code == 422


@pytest.mark.asyncio
async def test_expense_filters_and_status_math(client, auth_headers):
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

    await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "categoryId": c1["id"],
            "title": "Unpaid Item",
            "estimatedAmount": 100000,
            "dueDate": "2099-01-01",
        },
    )
    await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "categoryId": c1["id"],
            "title": "Zero Estimated Item",
            "estimatedAmount": 0,
        },
    )
    await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "categoryId": c1["id"],
            "title": "Partial Item",
            "estimatedAmount": 100000,
            "dueDate": "2099-01-01",
            "advancePayment": {
                "amount": 30000,
                "paidDate": "2026-11-25",
                "label": "Advance",
                "method": "bank_transfer",
                "paidBy": "bride",
            },
        },
    )
    await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "categoryId": c2["id"],
            "title": "Overpaid Settled Item",
            "estimatedAmount": 50000,
            "dueDate": "2020-01-01",
            "advancePayment": {
                "amount": 60000,
                "paidDate": "2026-11-25",
                "label": "Full",
                "method": "cash",
                "paidBy": "groom",
            },
        },
    )
    await client.post(
        "/api/v1/expenses",
        headers=auth_headers,
        json={
            "categoryId": c2["id"],
            "title": "Stage Setup",
            "description": "Includes line array speakers",
            "vendorName": "Royal Sound",
            "ceremony": "sangeet",
            "estimatedAmount": 80000,
            "dueDate": "2020-01-01",
            "advancePayment": {
                "amount": 20000,
                "paidDate": "2026-11-25",
                "label": "Booking",
                "method": "upi",
                "paidBy": "joint",
            },
        },
    )

    unpaid = (await client.get("/api/v1/expenses?status=unpaid", headers=auth_headers)).json()
    assert {e["title"] for e in unpaid} == {"Unpaid Item", "Zero Estimated Item"}

    partial = (await client.get("/api/v1/expenses?status=partial", headers=auth_headers)).json()
    assert [e["title"] for e in partial] == ["Partial Item"]

    paid = (await client.get("/api/v1/expenses?status=paid", headers=auth_headers)).json()
    assert [e["title"] for e in paid] == ["Overpaid Settled Item"]

    overdue = (await client.get("/api/v1/expenses?status=overdue", headers=auth_headers)).json()
    assert [e["title"] for e in overdue] == ["Stage Setup"]

    sangeet = (await client.get("/api/v1/expenses?ceremony=sangeet", headers=auth_headers)).json()
    assert [e["title"] for e in sangeet] == ["Stage Setup"]

    bride = (await client.get("/api/v1/expenses?paidBy=bride", headers=auth_headers)).json()
    assert [e["title"] for e in bride] == ["Partial Item"]

    search = (await client.get("/api/v1/expenses?search=royal", headers=auth_headers)).json()
    assert [e["title"] for e in search] == ["Stage Setup"]

    by_cat_res = await client.get(
        f"/api/v1/expenses?categoryId={c2['id']}",
        headers=auth_headers,
    )
    assert len(by_cat_res.json()) == 2


@pytest.mark.asyncio
async def test_patch_delete_and_payments(client, auth_headers):
    cat = (
        await client.post(
            "/api/v1/categories",
            headers=auth_headers,
            json={"name": "Photography", "icon": "camera"},
        )
    ).json()

    created = (
        await client.post(
            "/api/v1/expenses",
            headers=auth_headers,
            json={
                "categoryId": cat["id"],
                "title": "Candid Team",
                "estimatedAmount": 120000,
                "advancePayment": {
                    "amount": 40000,
                    "paidDate": "2026-11-25",
                    "label": "Booking",
                    "method": "upi",
                    "paidBy": "joint",
                },
            },
        )
    ).json()
    exp_id = created["id"]

    fetched = await client.get(f"/api/v1/expenses/{exp_id}", headers=auth_headers)
    assert fetched.status_code == 200
    assert fetched.json()["title"] == "Candid Team"
    missing_get = await client.get("/api/v1/expenses/exp-missing", headers=auth_headers)
    assert missing_get.status_code == 404

    patched = await client.patch(
        f"/api/v1/expenses/{exp_id}",
        headers=auth_headers,
        json={"title": "Candid & Drone Team", "estimatedAmount": 150000},
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "Candid & Drone Team"
    assert patched.json()["estimatedAmount"] == 150000
    assert len(patched.json()["payments"]) == 1

    bad_cat_patch = await client.patch(
        f"/api/v1/expenses/{exp_id}",
        headers=auth_headers,
        json={"categoryId": "cat-missing"},
    )
    assert bad_cat_patch.status_code == 404

    pay_res = await client.post(
        f"/api/v1/expenses/{exp_id}/payments",
        headers=auth_headers,
        json={
            "amount": 50000,
            "paidDate": "2026-12-01",
            "label": "2nd Installment",
            "method": "card",
            "paidBy": "groom",
            "note": "Online invoice",
        },
    )
    assert pay_res.status_code == 200
    payments = pay_res.json()["payments"]
    assert len(payments) == 2
    second_pay_id = payments[1]["id"]

    del_pay = await client.delete(
        f"/api/v1/expenses/{exp_id}/payments/{second_pay_id}",
        headers=auth_headers,
    )
    assert del_pay.status_code == 200
    assert len(del_pay.json()["payments"]) == 1

    missing_pay = await client.delete(
        f"/api/v1/expenses/{exp_id}/payments/pay-missing",
        headers=auth_headers,
    )
    assert missing_pay.status_code == 404

    del_exp = await client.delete(f"/api/v1/expenses/{exp_id}", headers=auth_headers)
    assert del_exp.status_code == 204
    missing_del = await client.delete(f"/api/v1/expenses/{exp_id}", headers=auth_headers)
    assert missing_del.status_code == 404
