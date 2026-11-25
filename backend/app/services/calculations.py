from datetime import date

from app.schemas.expense import ExpenseStatus


def compute_expense_status(expense: dict, today_iso: str | None = None) -> ExpenseStatus:
    today = (today_iso or date.today().isoformat())[:10]
    paid_amount = sum(
        max(0, int(p.get("amount", 0))) for p in expense.get("payments", [])
    )
    estimated = max(0, int(expense.get("estimatedAmount", 0)))
    upcoming_amount = max(0, estimated - paid_amount)

    due_date = expense.get("dueDate")
    if estimated > 0 and paid_amount >= estimated:
        return "paid"
    if upcoming_amount > 0 and isinstance(due_date, str) and due_date and due_date[:10] < today:
        return "overdue"
    if paid_amount > 0 and upcoming_amount > 0:
        return "partial"
    return "unpaid"
