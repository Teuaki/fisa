// -----------------------------
// UPDATE ALL PRICES
// -----------------------------
async function update_all_ticket_prices() {
    let passengers = frappe.web_form.get_value("add_new_passenger") || [];

    for (let i = 0; i < passengers.length; i++) {
        let row = passengers[i];

        let price = await fetch_dynamic_fare(
            row.departure_port,
            row.arrival_port,
            row.category,
            row.ticket_type
        );

        frappe.web_form.set_value_in_grid(
            "add_new_passenger",
            i,
            "ticket_price",
            price
        );
    }

    update_total_price();
}

// -----------------------------
// SERVER API LOOKUP
// -----------------------------
async function fetch_dynamic_fare(from, to, category, ticket_type) {
    if (!from || !to) return 0;

    let res = await frappe.call({
        method: "my_app.api.fisa_price.get_fare",
        args: {
            departure: from,
            arrival: to,
            category: category,
            ticket_type: ticket_type
        }
    });

    return res?.message || 0;
}

// -----------------------------
// TOTAL PRICE CALCULATOR
// -----------------------------
function update_total_price() {
    let passengers = frappe.web_form.get_value("add_new_passenger") || [];
    let total = 0;
    console.log("Passenger : ", passengers)
    passengers.forEach(row => {
        total += Number(row.ticket_price || 0);
    });

    frappe.web_form.set_value("ticket_price", total);
}

// -----------------------------
// CRITICAL: CHILD TABLE SAVE FIX
// -----------------------------
frappe.web_form.validate = () => {
    let data = frappe.web_form.get_values();

    // Web Form does NOT save child table automatically → FIX:
    frappe.web_form.doc["add_new_passenger"] = data.add_new_passenger;

    return true;
};
