import frappe

@frappe.whitelist()
def update_remaining_seats(booking_name):
    """Deduct booked passengers from total seats when payment is made"""
    booking = frappe.get_doc("FISA Booking Online", booking_name)

    # Default total seats = 400 if not set
    total_seats = booking.total_seats or 400
    booked_passengers = booking.total_passengers or 0

    # Calculate remaining seats
    remaining = total_seats - booked_passengers
    if remaining < 0:
        remaining = 0

    # Update booking document
    booking.remaining_seats = remaining
    booking.payment_status = "Paid"
    booking.save(ignore_permissions=True)
    frappe.db.commit()

    return remaining
