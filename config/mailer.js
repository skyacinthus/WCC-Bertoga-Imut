const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "b91674277d5866",
    pass: "5ebca6e128f492"
  }
});

async function sendBookingConfirmation(toEmail, bookingDetails) {
  const {
    id_booking,
    room_type_name,
    room_number,
    check_in,
    check_out,
    num_guests,
    total_price
  } = bookingDetails;

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const formatIDR = (n) => `IDR ${Number(n).toLocaleString("id-ID")}`;

  await transporter.sendMail({
    from: '"Alodie" <noreply@alodie.com>',
    to: toEmail,
    subject: `Booking Confirmed — #${id_booking}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: auto; padding: 32px; background: #f9f6f1; border-radius: 16px;">
        
        <h1 style="color: #3D2B1F; font-size: 28px;">Booking Confirmed!</h1>
        <p style="color: #666; margin-top: 8px;">Thank you for booking with Alodie. Here are your details:</p>

        <div style="background: white; border-radius: 12px; padding: 24px; margin-top: 24px;">
          <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Booking ID</p>
          <h2 style="color: #3D2B1F;">#${id_booking}</h2>

          <hr style="border: none; border-top: 1px solid #e0d9cf; margin: 16px 0;">

          <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Room</p>
          <p style="font-size: 18px; font-weight: 600; color: #2f2f2f;">${room_type_name} — Room ${room_number}</p>

          <hr style="border: none; border-top: 1px solid #e0d9cf; margin: 16px 0;">

          <div style="display: flex; gap: 40px;">
            <div>
              <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Check In</p>
              <p style="font-weight: 600;">${formatDate(check_in)}</p>
            </div>
            <div>
              <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Check Out</p>
              <p style="font-weight: 600;">${formatDate(check_out)}</p>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid #e0d9cf; margin: 16px 0;">

          <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Guests</p>
          <p style="font-weight: 600;">${num_guests}</p>

          <hr style="border: none; border-top: 1px solid #e0d9cf; margin: 16px 0;">

          <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Total Price</p>
          <p style="font-size: 20px; font-weight: 700; color: #3D2B1F;">${formatIDR(total_price)}</p>
        </div>

        <p style="color: #888; font-size: 13px; margin-top: 24px; text-align: center;">
          Alodie — Jl. Wijaya Kusuma, Condongcatur, Sleman, Yogyakarta
        </p>

      </div>
    `
  });
}

module.exports = { sendBookingConfirmation };