import nodemailer from 'nodemailer';

const user = process.env.EMAIL_USER || 'wit.mmvi@gmail.com';
const pass = process.env.EMAIL_PASS || 'hees dekq mnxs uprf';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: user.replace(/\s+/g, ''),
    pass: pass.replace(/\s+/g, ''),
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    const fromAddress = user.replace(/\s+/g, '');
    const info = await transporter.sendMail({
      from: `"สวนครอบครัว Maiv Zev" <${fromAddress}>`,
      to,
      subject,
      text: text || '',
      html: html || text || '',
    });
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending email via Nodemailer:', error);
    return { success: false, error: error.message };
  }
}

export async function sendOtpEmail(to: string, otpCode: string) {
  const subject = `[Maiv Zev Shop] รหัสยืนยัน OTP สำหรับรีเซ็ตรหัสผ่าน: ${otpCode}`;
  const html = `
    <div style="font-family: 'Kanit', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; rounded: 24px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #166534; font-size: 22px; font-weight: 800; margin: 0;">🍇 สวนครอบครัว Maiv Zev</h2>
        <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">ระบบยืนยันตัวตนอัตโนมัติ</p>
      </div>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; text-align: center; border-radius: 16px; margin-bottom: 20px;">
        <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">รหัสยืนยัน OTP ของคุณคือ</p>
        <h1 style="color: #15803d; font-size: 36px; font-weight: 900; letter-spacing: 6px; margin: 0;">${otpCode}</h1>
        <p style="color: #6b7280; font-size: 11px; margin: 8px 0 0 0;">(รหัสมีอายุใช้งาน 5 นาที กรุณาห้ามเปิดเผยแก่บุคคลอื่น)</p>
      </div>
      <p style="color: #4b5563; font-size: 13px; line-height: 1.6;">
        หากคุณไม่ได้ทำรายการลืมรหัสผ่านหรือไม่ได้ร้องขอรหัส OTP นี้ กรุณาเพิกเฉยต่ออีเมลนี้ บัญชีของคุณจะยังคงปลอดภัย
      </p>
      <div style="border-t: 1px solid #e5e7eb; margin-top: 24px; pt: 16px; text-align: center; color: #9ca3af; font-size: 11px;">
        © ${new Date().getFullYear()} สวนครอบครัว Maiv Zev. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({ to, subject, html, text: `รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ: ${otpCode}` });
}
