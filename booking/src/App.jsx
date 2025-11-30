import { useState } from "react";
import "./App.css";

const API_URL = "http://192.168.25.13/api/resource/FISA Booking Online";

export default function App() {
  const [step, setStep] = useState(1);
  const [bookingId, setBookingId] = useState("");
  const [remainingSeats, setRemainingSeats] = useState(null);

  // Form State
  const [form, setForm] = useState({
    client_name: "",
    last_name: "",
    dob: "",
    phone_number: "",
    email: "",
    voyage_no: "",
    passengers: [],
    card_number: "",
    expire_date: "",
    cvv_cvc: "",
    cardholder_name: "",
  });

  const updateField = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  // ------------------------------
  // Add Passenger
  // ------------------------------
  const addPassenger = () => {
    setForm({
      ...form,
      passengers: [
        ...form.passengers,
        {
          name: "",
          dob: "",
          age: "",
          gender: "",
          type: "",
          departure_port: "",
          arrival_port: "",
          ticket_type: "",
          fare: 0,
        },
      ],
    });
  };

  const removePassenger = (index) => {
    const updated = form.passengers.filter((_, i) => i !== index);
    setForm({ ...form, passengers: updated });
  };

  // ------------------------------
  // Seat Availability Fetch
  // ------------------------------
  const fetchRemainingSeats = async (voyage) => {
    if (!voyage) {
      setRemainingSeats(null);
      return;
    }

    const filters = encodeURIComponent(
      JSON.stringify([["voyage_no", "=", voyage]])
    );

    const fields = encodeURIComponent(JSON.stringify(["total_passenger"]));

    const res = await fetch(
      `http://192.168.25.13/api/resource/FISA Booking Online?filters=${filters}&fields=${fields}`
    );

    const data = await res.json();

    const totalBooked = data.data.reduce(
      (sum, row) => sum + (row.total_passenger || 0),
      0
    );

    const remaining = 400 - totalBooked;
    setRemainingSeats(remaining < 0 ? 0 : remaining);

    console.log("Remaining seats:", remaining);
  };

  // ------------------------------
  // Age + Passenger Type
  // ------------------------------
  const calculateAgeFromDob = (dob) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();

    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    return age;
  };

  const determinePassengerType = (age) => {
    if (age <= 1) return "Infant";
    if (age <= 11) return "Child";
    return "Adult";
  };

  // ------------------------------
  // Fare Fetch
  // ------------------------------
  const fetchFare = async (departure, arrival, category, ticketType) => {
    if (!departure || !arrival || !category || !ticketType) return 0;

    const docName = `${departure}-${arrival}-${category}-${ticketType}`;

    const res = await fetch(
      `http://192.168.25.13/api/resource/FISA Fares/${encodeURIComponent(
        docName
      )}`
    );

    const data = await res.json();
    return data?.data?.ticket_fare || 0;
  };

  // ------------------------------
  // Update Passenger
  // ------------------------------
  const updatePassenger = async (index, key, value) => {
    const updated = [...form.passengers];

    updated[index][key] = value;

    if (key === "dob") {
      const age = calculateAgeFromDob(value);
      updated[index].age = age;
      updated[index].type = determinePassengerType(age);
    }

    const p = updated[index];
    if (["type", "ticket_type", "departure_port", "arrival_port", "dob"].includes(key)) {
      const fare = await fetchFare(
        p.departure_port,
        p.arrival_port,
        updated[index].type,
        p.ticket_type
      );
      updated[index].fare = fare;
    }

    setForm({ ...form, passengers: updated });
  };

  // ------------------------------
  // Total Amount
  // ------------------------------
  const calculateTotalAmount = () =>
    form.passengers.reduce((sum, p) => sum + (p.fare || 0), 0);

  // ------------------------------
  // Submit Booking
  // ------------------------------
  const submit = async () => {
    const csrfToken = window.csrf_token;

    const payload = {
      doctype: "FISA Booking Online",

      client_name: form.client_name,
      last_name: form.last_name,
      dob: form.dob,
      phone_number: form.phone_number,
      email: form.email,
      voyage_no: form.voyage_no,

      total_passenger: form.passengers.length,
      total_amount: calculateTotalAmount(),

      add_new_passenger: form.passengers.map((p) => ({
        doctype: "FISA Passenger",
        parenttype: "FISA Booking Online",
        parentfield: "add_new_passenger",
        full_name: p.name,
        dob: p.dob,
        category: p.type,
        gender: p.gender,
        departure_port: p.departure_port,
        arrival_port: p.arrival_port,
        ticket_type: p.ticket_type,
        ticket_price: p.fare || 0,
      })),

      card_number: form.card_number,
      expire_date: form.expire_date,
      cvv_cvc: form.cvv_cvc,
      cardholder_name: form.cardholder_name,
    };

    const res = await fetch(API_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Frappe-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Submit result:", data);

    if (data?.data?.name) {
      setBookingId(data.data.name);
      setStep(4);
    } else {
      alert("❌ Failed to save booking.");
    }
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div className="booking-wrapper">
      <h1 className="app-title">FISA Online Booking</h1>

      {/* Step Indicator */}
      {step !== 4 && (
        <div className="step-indicator">
          <div className={`step ${step === 1 ? "active" : ""}`}>Contact Information</div>
          <div className={`step ${step === 2 ? "active" : ""}`}>Passenger Information</div>
          <div className={`step ${step === 3 ? "active" : ""}`}>Payment Details</div>
        </div>
      )}

      {/* STEP 1 — CONTACT */}
      {step === 1 && (
        <div>
          <h2 className="booking-title">Contact Information</h2>

          <div className="form-grid">
            <div>
              <label>First Name</label>
              <input value={form.client_name} onChange={(e) => updateField("client_name", e.target.value)} />
            </div>

            <div>
              <label>Last Name</label>
              <input value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} />
            </div>

            <div>
              <label>Date of Birth</label>
              <input type="date" value={form.dob} onChange={(e) => updateField("dob", e.target.value)} />
            </div>

            <div>
              <label>Phone Number</label>
              <input value={form.phone_number} onChange={(e) => updateField("phone_number", e.target.value)} />
            </div>

            <div>
              <label>Email</label>
              <input value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            </div>

            <div>
              <label>Voyage No</label>
              <select
                value={form.voyage_no}
                onChange={(e) => {
                  const v = e.target.value;
                  updateField("voyage_no", v);
                  fetchRemainingSeats(v);
                }}
              >
                <option value="">Select...</option>
                <option value="V001">V001</option>
                <option value="V002">V002</option>
                <option value="V003">V003</option>
                <option value="V004">V004</option>
                <option value="V005">V005</option>
              </select>

              {remainingSeats !== null && (
                <p
                  style={{
                    marginTop: "8px",
                    color: remainingSeats > 50 ? "green" : "red",
                    fontWeight: "bold",
                  }}
                >
                  Remaining Seats: {remainingSeats} / 400
                </p>
              )}
            </div>
          </div>

          <div className="button-row">
            <button className="btn-primary" onClick={() => setStep(2)}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — PASSENGERS */}
      {step === 2 && (
        <div>
          <h2 className="booking-title">Passenger Information</h2>

          {form.passengers.map((p, index) => (
            <div className="passenger-row" key={index}>
              <input
                placeholder="Passenger Name"
                value={p.name}
                onChange={(e) => updatePassenger(index, "name", e.target.value)}
              />

              <input
                type="date"
                placeholder="DOB"
                value={p.dob || ""}
                onChange={(e) => updatePassenger(index, "dob", e.target.value)}
              />

              <input value={p.type} readOnly />

              <select
                value={p.gender}
                onChange={(e) => updatePassenger(index, "gender", e.target.value)}
              >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <select
                value={p.departure_port}
                onChange={(e) => updatePassenger(index, "departure_port", e.target.value)}
              >
                <option value="">Departure</option>
                <option value="Nukualofa">Nukualofa</option>
                <option value="Nomuka">Nomuka</option>
                <option value="Haafeva">Haafeva</option>
                <option value="Pangai">Pangai</option>
                <option value="Neiafu">Neiafu</option>
              </select>

              <select
                value={p.arrival_port}
                onChange={(e) => updatePassenger(index, "arrival_port", e.target.value)}
              >
                <option value="">Arrival</option>
                <option value="Nukualofa">Nukualofa</option>
                <option value="Nomuka">Nomuka</option>
                <option value="Haafeva">Haafeva</option>
                <option value="Pangai">Pangai</option>
                <option value="Neiafu">Neiafu</option>
              </select>

              <select
                value={p.ticket_type}
                onChange={(e) => updatePassenger(index, "ticket_type", e.target.value)}
              >
                <option value="">Ticket Type</option>
                <option value="Economy">Economy</option>
                <option value="VIP">VIP</option>
              </select>

              <input
                type="text"
                value={p.fare ? `TOP ${p.fare}` : "No fare"}
                readOnly
                style={{ background: "#eef", fontWeight: "600" }}
              />

              <button
                className="btn-secondary"
                style={{ background: "#ff4d4d", color: "#fff" }}
                onClick={() => removePassenger(index)}
              >
                Remove
              </button>
            </div>
          ))}

          <button className="add-passenger-btn" onClick={addPassenger}>
            + Add Passenger
          </button>

          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "#f1f5ff",
              borderRadius: "10px",
              border: "1px solid #cdd7f0",
            }}
          >
            <p><strong>Total Passengers:</strong> {form.passengers.length}</p>
            <p><strong>Total Amount:</strong> TOP {calculateTotalAmount().toFixed(2)}</p>
          </div>

          {remainingSeats !== null &&
            form.passengers.length > remainingSeats && (
              <p style={{ color: "red", fontWeight: "bold" }}>
                Not enough seats for this voyage.
              </p>
            )}

          <div className="button-row">
            <button className="btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>

            <button
              className="btn-primary"
              disabled={
                remainingSeats !== null &&
                form.passengers.length > remainingSeats
              }
              onClick={() => setStep(3)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — PAYMENT */}
      {step === 3 && (
        <div>
          <h2 className="booking-title">Payment Details</h2>

          <div className="payment-box">
            <div className="form-grid">
              <div>
                <label>Card Number</label>
                <input
                  value={form.card_number}
                  onChange={(e) => updateField("card_number", e.target.value)}
                />
              </div>

              <div>
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={form.expire_date || ""}
                  onChange={(e) => updateField("expire_date", e.target.value)}
                />
              </div>

              <div>
                <label>CVV</label>
                <input
                  value={form.cvv_cvc}
                  onChange={(e) => updateField("cvv_cvc", e.target.value)}
                />
              </div>

              <div>
                <label>Cardholder Name</label>
                <input
                  value={form.cardholder_name}
                  onChange={(e) => updateField("cardholder_name", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="button-row">
            <button className="btn-secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <button className="btn-primary" onClick={submit}>
              Submit
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — SUCCESS PAGE */}
      {step === 4 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#e8f8e8",
            borderRadius: "12px",
            marginTop: "20px",
          }}
        >
          <h2 style={{ color: "#2d7c2d" }}>Booking Successful!</h2>

          <p style={{ fontSize: "20px", marginTop: "10px" }}>
            Your booking has been created successfully.
          </p>

          <p
            style={{
              fontSize: "24px",
              marginTop: "20px",
              fontWeight: "bold",
              color: "#0a4",
            }}
          >
            Booking ID: {bookingId}
          </p>

          <button
            className="btn-primary"
            style={{ marginTop: "30px" }}
            onClick={() => (window.location.href = "/booking")}
          >
            Make Another Booking
          </button>
        </div>
      )}
    </div>
  );
}
