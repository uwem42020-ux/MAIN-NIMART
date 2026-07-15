export const emailStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7; }
  .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .header { background-color: #008751; padding: 24px; text-align: center; }
  .header img { height: 36px; margin-bottom: 8px; }
  .header h1 { color: #fff; font-size: 22px; margin: 0; }
  .body { padding: 28px 24px; color: #333; }
  .body p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .details { background: #f0f7f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
  .details strong { color: #008751; }
  .footer { text-align: center; padding: 16px; font-size: 12px; color: #888; }
  .footer a { color: #008751; text-decoration: none; }
`;

export function providerNewBookingEmail(data: { serviceName: string; bookingDate: string; bookingTime: string; location: string }) {
  return `
    <html><head><style>${emailStyles}</style></head><body>
      <div class="container">
        <div class="header">
          <img src="https://nimart.ng/logo.png" alt="Nimart" style="height:36px; margin-bottom:8px;" />
          <h1>New Booking Request</h1>
        </div>
        <div class="body">
          <p>Hello,</p>
          <p>You have a new booking on <strong>Nimart</strong>. Please review the details below and log in to accept or decline the request.</p>
          <div class="details">
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.bookingDate}</p>
            <p><strong>Time:</strong> ${data.bookingTime}</p>
            <p><strong>Location:</strong> ${data.location}</p>
          </div>
          <a href="https://nimart.ng/provider/bookings" style="display: inline-block; background-color: #008751; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600;">View My Bookings</a>
        </div>
        <div class="footer">
          <p>Need help? <a href="mailto:info@nimart.ng">Contact Support</a></p>
          <p>&copy; ${new Date().getFullYear()} Nimart. All rights reserved.</p>
        </div>
      </div>
    </body></html>
  `;
}

export function customerBookingConfirmationEmail(data: { providerName: string; serviceName: string; bookingDate: string; bookingTime: string; location: string }) {
  return `
    <html><head><style>${emailStyles}</style></head><body>
      <div class="container">
        <div class="header">
          <img src="https://nimart.ng/logo.png" alt="Nimart" style="height:36px; margin-bottom:8px;" />
          <h1>Booking Submitted</h1>
        </div>
        <div class="body">
          <p>Hi there,</p>
          <p>Your booking has been successfully submitted on <strong>Nimart</strong>. The provider will review your request and respond shortly.</p>
          <div class="details">
            <p><strong>Provider:</strong> ${data.providerName}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.bookingDate}</p>
            <p><strong>Time:</strong> ${data.bookingTime}</p>
            <p><strong>Location:</strong> ${data.location}</p>
          </div>
          <p>You can track your booking status anytime from your dashboard.</p>
          <a href="https://nimart.ng/customer/bookings" style="display: inline-block; background-color: #008751; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600;">View My Bookings</a>
        </div>
        <div class="footer">
          <p>Need help? <a href="mailto:info@nimart.ng">Contact Support</a></p>
          <p>&copy; ${new Date().getFullYear()} Nimart. All rights reserved.</p>
        </div>
      </div>
    </body></html>
  `;
}