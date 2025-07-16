import sgMail from '@sendgrid/mail';
import { IUser } from '../models/user.model';
import { IBook } from '../models/book.model';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('!!! WARNING: SENDGRID_API_KEY is not defined. Emails will be logged to console instead of being sent.');
}

const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@bookverse.com';
const appUrl = process.env.APP_URL || 'http://localhost:8080'; // A bit of a guess, but better than nothing

const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.log('--- SIMULATING EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('------------------------');
    return;
  }

  const msg = {
    to,
    from: fromEmail,
    subject,
    text,
    html,
  };

  // This is a workaround for local development environments with SSL/TLS interception (e.g., corporate proxies)
  // that cause 'self-signed certificate in certificate chain' errors.
  // It temporarily disables strict SSL certificate validation for this specific API call.
  // THIS IS INSECURE AND SHOULD NOT BE USED IN PRODUCTION.
  const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  
  try {
    if (process.env.NODE_ENV !== 'production') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    
    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    if ((error as any).response) {
      console.error((error as any).response.body);
    }
  } finally {
    // Restore the original SSL/TLS setting after the API call is complete.
    if (process.env.NODE_ENV !== 'production') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    }
  }
};

export const emailService = {
  sendRegistrationApprovedEmail: async (user: IUser) => {
    const subject = `[BookVerse] Welcome! Your registration is approved.`;
    const text = `Hi ${user.name},\n\nWelcome to BookVerse! Your account has been approved by an administrator. You can now log in and start sharing and borrowing books.\n\nHappy reading,\nThe BookVerse Team`;
    const html = `<p>Hi ${user.name},</p><p>Welcome to BookVerse! Your account has been approved by an administrator. You can now log in and start sharing and borrowing books.</p><p>Happy reading,<br>The BookVerse Team</p>`;
    await sendEmail(user.email, subject, html, text);
  },

  sendRegistrationRejectedEmail: async (user: IUser) => {
    const subject = `[BookVerse] Update on your registration`;
    const text = `Hi ${user.name},\n\nThank you for your interest in BookVerse. Unfortunately, we were unable to approve your registration at this time. If you believe this is an error, please contact your community administrator.\n\nThanks,\nThe BookVerse Team`;
    const html = `<p>Hi ${user.name},</p><p>Thank you for your interest in BookVerse. Unfortunately, we were unable to approve your registration at this time. If you believe this is an error, please contact your community administrator.</p><p>Thanks,<br>The BookVerse Team</p>`;
    await sendEmail(user.email, subject, html, text);
  },
  
  sendPasswordResetEmail: async (user: IUser, resetToken: string) => {
    const resetUrl = `${appUrl}/reset-password/${resetToken}`; // In a real app, this URL would point to the frontend reset page
    const subject = `[BookVerse] Reset Your Password`;
    const text = `Hi ${user.name},\n\nYou are receiving this email because you (or someone else) have requested the reset of a password. Please make a POST request or click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\nThis link is valid for 10 minutes.\n\nThanks,\nThe BookVerse Team`;
    const html = `<p>Hi ${user.name},</p><p>You are receiving this email because you (or someone else) have requested the reset of a password. Please click the link below to reset your password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p><p>This link is valid for 10 minutes.</p><p>Thanks,<br>The BookVerse Team</p>`;
    await sendEmail(user.email, subject, html, text);
  },

  sendBookRequestEmail: async (owner: IUser, requester: IUser, book: IBook) => {
    const subject = `[BookVerse] Request for your book: ${book.title}`;
    const text = `Hi ${owner.name},\n\n${requester.name} (${requester.communityUnit}) has requested to borrow your book, "${book.title}".\nPlease log in to your BookVerse account to approve or reject this request.\n\nThanks,\nThe BookVerse Team`;
    const html = `<p>Hi ${owner.name},</p><p>${requester.name} (${requester.communityUnit}) has requested to borrow your book, "<strong>${book.title}</strong>".</p><p>Please log in to your BookVerse account to approve or reject this request.</p><p>Thanks,<br>The BookVerse Team</p>`;
    if (!owner.emailOptOut) await sendEmail(owner.email, subject, html, text);
  },

  sendRequestApprovedEmail: async (requester: IUser, owner: IUser, book: IBook) => {
    const subject = `[BookVerse] Your request for "${book.title}" was approved!`;
    const text = `Hi ${requester.name},\n\nGreat news! ${owner.name} has approved your request to borrow "${book.title}".\nPlease coordinate with them to arrange a pickup time.\n\nThanks,\nThe BookVerse Team`;
    const html = `<p>Hi ${requester.name},</p><p>Great news! ${owner.name} has approved your request to borrow "<strong>${book.title}</strong>".</p><p>Please coordinate with them to arrange a pickup time.</p><p>Thanks,<br>The BookVerse Team</p>`;
    if (!requester.emailOptOut) await sendEmail(requester.email, subject, html, text);
  },

  sendRequestRejectedEmail: async (requester: IUser, owner: IUser, book: IBook) => {
    const subject = `[BookVerse] Update on your request for "${book.title}"`;
    const text = `Hi ${requester.name},\n\nThis is an update on your request for "${book.title}". Unfortunately, ${owner.name} has rejected the request at this time. The book may become available again later.\n\nThanks,\nThe BookVerse Team`;
    const html = `<p>Hi ${requester.name},</p><p>This is an update on your request for "<strong>${book.title}</strong>". Unfortunately, ${owner.name} has rejected the request at this time. The book may become available again later.</p><p>Thanks,<br>The BookVerse Team</p>`;
    if (!requester.emailOptOut) await sendEmail(requester.email, subject, html, text);
  },
  
  sendBookReturnedEmail: async (borrower: IUser, owner: IUser, book: IBook) => {
    const subject = `[BookVerse] "${book.title}" has been returned`;
    const text = `Hi ${borrower.name},\n\nThis is a confirmation that ${owner.name} has marked "${book.title}" as returned. Thank you for participating in our community!\n\nHappy reading,\nThe BookVerse Team`;
    const html = `<p>Hi ${borrower.name},</p><p>This is a confirmation that ${owner.name} has marked "<strong>${book.title}</strong>" as returned. Thank you for participating in our community!</p><p>Happy reading,<br>The BookVerse Team</p>`;
    if (!borrower.emailOptOut) await sendEmail(borrower.email, subject, html, text);
  },
};