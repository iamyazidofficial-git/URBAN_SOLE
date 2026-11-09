const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTPEmail = async (email, otp) => {

  const mailOptions = {
    from: `"URBAN SOLE" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "URBAN SOLE - OTP Verification",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin: auto;
        padding: 30px;
        border: 1px solid #eeeeee;
      ">

        <h2 style="color: #000000;">
          URBAN SOLE
        </h2>

        <p>
          Your verification code is:
        </p>

        <h1 style="
          letter-spacing: 8px;
          color: #000000;
        ">
          ${otp}
        </h1>

        <p>
          This OTP is valid for 2 minutes.
        </p>

        <p style="color: #777777;">
          If you did not request this code, please ignore this email.
        </p>

      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };