// Copyright (c) 2025, Joseph Tokai and contributors
// For license information, please see license.txt

frappe.ui.form.on("FISA Booking Online", {
    // Define the total capacity locally for messaging purposes


    // Event triggered when a form is loaded or refreshed
    refresh: function(frm) {
        // Trigger the check on refresh as well, in case voyage_no is already set
        if (frm.doc.voyage_no) {
            frm.trigger('voyage_no');
        }
    },
    
    // Event triggered when the voyage_no field changes
    voyage_no: function (frm) {
        const TOTAL_CAPACITY = 400;
        const voyage_no = frm.doc.voyage_no;
        
        if (voyage_no) {
            frappe.call({
                // The full path to the whitelisted Python function
                // NOTE: Using the correct full path you provided
                method: "my_app.fisa_ticketing.doctype.fisa_booking_online.fisa_booking_online.get_total_seats_by_voyage", 
                args: {
                    voyage_no: voyage_no
                },
                callback: function(r) {
                    if (r.message !== undefined) {
                        const remaining_seats = r.message;
                        const total_booked = TOTAL_CAPACITY - remaining_seats;

                        // --- START: Changes to remove field usage ---
                        
                        // 1. Removed: frm.set_value("remaining_seats", remaining_seats);
                        // 2. Removed: frm.refresh_field("remaining_seats");

                        // Display the availability message
                        if (remaining_seats > 0) {
                            frappe.msgprint(
                                __("Voyage **{0}** status: {1} seats booked, **{2} seats remaining** (Capacity: {3}).", 
                                    [voyage_no, total_booked, remaining_seats, TOTAL_CAPACITY]), 
                                __("Seat Availability")
                            );

                            // You might want to remove a previous warning message if seats become available
                            frm.set_intro("");
                        } else {
                            // Show a warning message in the form's introduction area and as a pop-up
                            const warning_msg = __("Warning: This voyage is fully booked (0 remaining seats).");
                            frappe.msgprint(warning_msg, __("Fully Booked"));
                            frm.set_intro(warning_msg, 'red');

                            // You might want to disable the submit button here for DocType forms too
                            // frm.disable_save();
                        }
                        // --- END: Changes to remove field usage ---
                    }
                }
            });
        } else {
            // If voyage_no is cleared, clear any messages and intro text
            // 3. Removed: frm.set_value("remaining_seats", 400);
            // 4. Removed: frm.refresh_field("remaining_seats");
            frm.set_intro("");
            // frm.enable_save(); // Re-enable save if it was disabled
            // frappe.show_alert({
            //     message: __("Please select a Voyage Number to check seat availability."),
            //     indicator: 'blue'
            // });
        }
    }
});