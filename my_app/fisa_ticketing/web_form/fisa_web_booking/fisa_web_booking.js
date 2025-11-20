// Define a reusable function to check and update remaining seats
const check_remaining_seats = () => {
	const voyage_no = frappe.web_form.get_value("voyage_no");
	const client_name = frappe.web_form.get_value("client_name"); // Added check for client_name
    const TOTAL_CAPACITY = 400; // Define capacity locally for messaging

    if (voyage_no) {
        frappe.call({
            // Ensure this method path is correct (it seems correct now)
            method: "my_app.fisa_ticketing.doctype.fisa_booking_online.fisa_booking_online.get_total_seats_by_voyage",
            args: {
                voyage_no: voyage_no
            },
            callback: function(r) {
				if (r.message !== undefined) {
					console.log("Total booked seats received:", r.message);
                    const total_booked = r.message;
                    const remaining_seats = TOTAL_CAPACITY - total_booked
                    
                    // --- START OF REQUIRED CHANGE ---
                    // 1. DO NOT set the field value, preventing it from being saved.
                    // frappe.web_form.set_value("remaining_seats", remaining_seats); 

                    // 2. Display the availability message using frappe.msgprint
					if (remaining_seats > 0) {
						const message = __(
							"Voyage:          {0}<br>" +
							"Booked Seats:    {1}<br>" +
							"Remaining Seats: {2}<br>" +
							"Capacity:        {3}",
							[voyage_no, total_booked, remaining_seats, TOTAL_CAPACITY]
						);

                    	frappe.msgprint(message, __("Seat Availability"), { indicator: 'green' });
                    
						// Enable primary action (Pay Now button)
						frappe.web_form.set_primary_action_status(true);
                    } else {
                        frappe.msgprint(
                            __("Warning: Voyage **{0}** is fully booked (0 remaining seats). Please select another voyage.", 
                                [voyage_no]), 
                            __("Fully Booked")
                        );
                    }

                    // Optional: Add client-side validation logic if needed (e.g., hiding submit button)
                    if (remaining_seats <= 0) {
                        // Example: Disable the submit button if fully booked
                        frappe.web_form.set_primary_action_label("Fully Booked");
                        frappe.web_form.set_primary_action_status(false);
                    } else {
                        // Reset button if seats are available
                        frappe.web_form.set_primary_action_label("Pay Now"); // Or your original label
                        frappe.web_form.set_primary_action_status(true);
                    }
                    // --- END OF REQUIRED CHANGE ---
                }
            }
        });
    } else {
        // DO NOT set the field value here either.
        frappe.msgprint(__("Please select a Voyage Number to check seat availability."), __("Information"));
    }
};

// =============================
//  FISA BOOKING ONLINE - WEB FORM CLIENT SCRIPT
// =============================

frappe.ready(function() {
    // 1. Trigger on page load
    frappe.web_form.after_load = () => {
        // Removed unnecessary set_value for remaining_seats as per request.
        if (frappe.web_form.get_value("voyage_no")) {
            check_remaining_seats();
        }
        
        // Ensure other calculation functions are called if needed for the form
        // calculate_main_ticket(); 
        // calculate_all_child();
        // calculate_total(); 
    };

    // 2. Trigger when Voyage No. is selected/changed
    frappe.web_form.on("voyage_no", () => {
        check_remaining_seats();
    });

    // 3. Example: Override the total calculation function to not save total_passengers
    // IMPORTANT: Assuming you have a function named 'calculate_total' in your full script.
    if (typeof calculate_total === 'function') {
        window.calculate_total = function() {
            let total_amount = frappe.web_form.get_value("ticket_price") || 0;
            let total_passengers = 1; // Count the main passenger

            const child_rows = frappe.web_form.get_value("add_new_passenger");
            if(child_rows && child_rows.length){
                child_rows.forEach(row => {
                    total_amount += row.ticket_price || 0;
                    total_passengers += 1; // Count child passenger
                });
            }
            frappe.web_form.set_value("total_amount", total_amount);
            
            // REMOVED frappe.web_form.set_value("total_passengers", total_passengers); 
            // as requested by the user to not save this field.
        }
    }
    
    // Add any other existing frappe.web_form.on events here
});