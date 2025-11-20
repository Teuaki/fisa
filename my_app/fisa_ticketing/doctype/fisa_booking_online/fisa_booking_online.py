# Copyright (c) 2025, Joseph Tokai and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

# Define the DocType controller class
class FISABookingOnline(Document):
	pass

@frappe.whitelist()
def get_total_seats_by_voyage(voyage_no):
	"""
	Calculates the remaining seats for a given voyage number.
	Total seats is fixed at 400.
	It sums up the 'total_passengers' from all Confirmed 'FISA Booking Online' documents.
	"""
	
	TOTAL_CAPACITY = 400
	
	if not voyage_no:
		# If no voyage is selected, return full capacity
		return TOTAL_CAPACITY 

	# Use frappe.db.sql for proper aggregate function support.
	# We use parameterized queries (%s) to prevent SQL injection.
	booked_passengers_query = """
		SELECT
			SUM(total_passengers)
		FROM
			`tabFISA Booking Online`
		WHERE
			voyage_no = %s AND
			payment_status = 'Confirmed'
	"""
	
	# Execute the query and fetch the result. The result is a list of tuples.
	# [0][0] gets the first (and only) column from the first (and only) row.
	result = frappe.db.sql(booked_passengers_query, (voyage_no,), as_list=True)
	
	# Extract the sum value. It can be None if no matching records are found.
	total_booked_seats = result[0][0] if result and result[0] and result[0][0] is not None else 0
		
	# Ensure remaining seats is not negative
	return max(0, total_booked_seats)