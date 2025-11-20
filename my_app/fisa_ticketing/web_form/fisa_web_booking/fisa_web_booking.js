const check_remaining_seats = () => {
	const voyage_no = frappe.web_form.get_value("voyage_no");
    const TOTAL_CAPACITY = 400; 

    if (voyage_no) {
        frappe.call({
            method: "my_app.fisa_ticketing.doctype.fisa_booking_online.fisa_booking_online.get_total_seats_by_voyage",
            args: {
                voyage_no: voyage_no
            },
            callback: function(r) {
				if (r.message !== undefined) {
					console.log("Total booked seats received:", r.message);
                    const total_booked = r.message;
                    const remaining_seats = TOTAL_CAPACITY - total_booked
                    
					if (remaining_seats > 0) {
						const message = __(
							"Voyage:          {0}<br>" +
							"Booked Seats:    {1}<br>" +
							"Remaining Seats: {2}<br>" +
							"Capacity:        {3}",
							[voyage_no, total_booked, remaining_seats, TOTAL_CAPACITY]
						);

                    	frappe.msgprint(message, __("Seat Availability"), { indicator: 'green' });
                    
						//frappe.web_form.set_primary_action_status(true);
                    } else {
                        frappe.msgprint(
                            __("Warning: Voyage **{0}** is fully booked (0 remaining seats). Please select another voyage.", 
                                [voyage_no]), 
                            __("Fully Booked")
                        );
                    }

                    if (remaining_seats <= 0) {
                        frappe.web_form.set_primary_action_label("Fully Booked");
                        frappe.web_form.set_primary_action_status(false);
                    } else {
                        frappe.web_form.set_primary_action_label("Pay Now"); 
                        frappe.web_form.set_primary_action_status(true);
                    }
  
                }
            }
        });
    } else {

        frappe.msgprint(__("Please select a Voyage Number to check seat availability."), __("Information"));
    }
};

// =============================
//  FISA BOOKING ONLINE - WEB FORM CLIENT SCRIPT
// =============================

frappe.ready(function() {
    frappe.web_form.after_load = () => {
        if (frappe.web_form.get_value("voyage_no")) {
            check_remaining_seats();
        }
        
    };


    frappe.web_form.on("voyage_no", () => {
        check_remaining_seats();
    });


    if (typeof calculate_total === 'function') {
        window.calculate_total = function() {
            let total_amount = frappe.web_form.get_value("ticket_price") || 0;
            let total_passengers = 1; 

            const child_rows = frappe.web_form.get_value("add_new_passenger");
            if(child_rows && child_rows.length){
                child_rows.forEach(row => {
                    total_amount += row.ticket_price || 0;
                    total_passengers += 1; // Count child passenger
                });
            }
            frappe.web_form.set_value("total_amount", total_amount);

        }
    }

});

frappe.web_form.on('add_new_passenger', (field, value, doc) => {
    calculateTotalPassengers(doc);
});

frappe.web_form.after_load = () => {
    const doc = frappe.web_form.get_values();
    calculateTotalPassengers(doc);
};

function calculateTotalPassengers(doc) {
    if (!doc) return;

    let rows = doc.add_new_passenger || [];
    let total = rows.length;

    frappe.web_form.set_value('total_passenger', total);
}
