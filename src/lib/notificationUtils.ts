export interface NotificationLog {
  id: string;
  type: 'creation' | 'deletion_request' | 'deletion_approval' | 'deletion_rejection';
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  timestamp: string;
}

export function sendAccountNotification(
  type: 'creation' | 'deletion_request' | 'deletion_approval' | 'deletion_rejection',
  details: {
    userName?: string;
    email?: string;
    phone?: string;
    reason?: string;
  }
) {
  const { userName = 'Member', email, phone, reason } = details;
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  let title = '';
  let message = '';

  switch (type) {
    case 'creation':
      title = '🎉 Account Created Successfully';
      message = `Namaste ${userName}! Welcome to Nashik Teli Samaj Matrimony. Your profile has been registered and activated. Email confirmation sent to ${email || 'your registered email'} and SMS alert sent to ${phone || 'your phone'}.`;
      break;
    case 'deletion_request':
      title = '⏳ Deletion Request Submitted';
      message = `Hello ${userName}, your account deletion request has been submitted to Nashik Teli Samaj Admin for review. You will receive an email/SMS notification once processed.`;
      break;
    case 'deletion_approval':
      title = '✅ Account Deletion Approved';
      message = `Hello ${userName}, your profile deletion request was reviewed and ACCEPTED by Admin. Your profile and account data have been removed from Nashik Teli Samaj Matrimony. Confirmation email sent to ${email || 'your email'}.`;
      break;
    case 'deletion_rejection':
      title = 'ℹ️ Account Deletion Request Update';
      message = `Hello ${userName}, your profile deletion request was reviewed by Admin and REJECTED${reason ? `: ${reason}` : '.'}. Your account remains active.`;
      break;
  }

  // Log simulation to console
  console.log(`[SIMULATED EMAIL & SMS DISPATCH] (${time})`, {
    type,
    email,
    phone,
    title,
    message
  });

  return { title, message };
}
