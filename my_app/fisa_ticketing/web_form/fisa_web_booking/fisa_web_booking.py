import frappe

def get_context(context):
    context.no_cache = 1
    doc = context.doc

    if not doc:
        return

    # Ensure total_passenger is always correct server-side too
    calculate_total_passenger_server(doc)


def calculate_total_passenger_server(doc):
    """Server-side total passenger calculation"""
    try:
        child_rows = doc.get("add_new_passenger") or []
        total = len(child_rows)
        doc.total_passenger = total
    except Exception:
        doc.total_passenger = 0