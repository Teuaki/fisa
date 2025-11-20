import frappe
from frappe.utils import cint

# Import the whitelisted function from the DocType controller
# NOTE: Replace 'fisa_ticketing' with your actual app/module name if different
from my_app.fisa_ticketing.doctype.fisa_booking_online.fisa_booking_online import get_total_seats_by_voyage 

def get_context(context):
	# Do not cache this script as seat counts are dynamic
	context.no_cache = 1
	
	# The document object is passed as context.doc for a web form
	doc = context.doc
	
	# Ensure context.doc exists and has the necessary fields
	if not doc:
		return

	# If voyage_no is already set (e.g., loading a draft or via URL parameters)
	if doc.get("voyage_no"):
		try:
			# Call the reusable function to get the remaining seats
			total_seats = get_total_seats_by_voyage(doc.get("voyage_no"))
			
			# Set the remaining_seats value in the document context
			
		except Exception:
			# Fallback if the function call fails
			doc.remaining_seats = 400
	else:
		# Default to full capacity for a new, unselected voyage
		doc.remaining_seats = 400

	pass