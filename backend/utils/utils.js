export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOtp(otp) {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    
    <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; text-align: center;">
      
      <h2 style="color: #333;">🔐 OTP Verification</h2>
      
      <p style="color: #555; font-size: 16px;">
        Your One-Time Password (OTP) is:
      </p>
      
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #2d89ef; margin: 20px 0;">
        ${otp}
      </div>
      
      <p style="color: #777; font-size: 14px;">
        This OTP is valid for 5 minutes. Do not share it with anyone.
      </p>
      
      <hr style="margin: 20px 0;" />
      
      <p style="font-size: 12px; color: #aaa;">
        If you didn’t request this, please ignore this email.
      </p>
      
    </div>
    
  </div>
  `;
}