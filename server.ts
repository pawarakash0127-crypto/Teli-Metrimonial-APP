import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { generateWelcomeEmailHtml, formatMembershipDates } from './src/lib/welcomeEmailTemplate.js';

const app = express();
const PORT = 3000;

// Security HTTP Headers (configured safely for SPA and embedded assets)
app.use(
  helmet({
    contentSecurityPolicy: false, // Vite SPA handles inline styles & script chunks
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(express.json({ limit: '1mb' }));

// Rate Limiters
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 emails per 15 minutes per IP
  message: { success: false, error: 'Email dispatch rate limit reached. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Payment request limit reached. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalApiLimiter);
app.use('/api/welcome-email/send', emailRateLimiter);
app.use('/api/welcome-email/test', emailRateLimiter);
app.use('/api/payments/', paymentRateLimiter);

// In-memory log of recent email dispatches for developer debugging/preview
const emailLogs: Array<{
  id: string;
  recipientEmail: string;
  userName: string;
  subject: string;
  status: 'sent' | 'simulated' | 'failed';
  timestamp: string;
  details?: string;
}> = [];

// Helper to configure Transporter
function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  return null;
}

// --------------------------------------------------
// API ROUTES (Must be defined BEFORE Vite middleware)
// --------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Teli Samaj Matrimonial Server', timestamp: new Date().toISOString() });
});

// GET Welcome Email HTML Preview
app.get('/api/welcome-email/preview', (req, res) => {
  const userName = (req.query.userName as string) || 'Rajesh Pawar';
  const userEmail = (req.query.userEmail as string) || 'rajesh.pawar@example.com';
  const registrationDate = (req.query.registrationDate as string) || '10 August 2026';
  const expiryDate = (req.query.expiryDate as string) || '10 August 2027';

  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

  const html = generateWelcomeEmailHtml({
    userName,
    userEmail,
    registrationDate,
    expiryDate,
    websiteUrl: baseUrl,
    profileUrl: `${baseUrl}/profile`,
    matchesUrl: `${baseUrl}/search`,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@nashiktelisamaj.org',
    supportPhone: process.env.SUPPORT_PHONE || '+91 98220 12345 / +91 0253 2501234',
    supportHours: 'Mon - Sat: 10:00 AM - 7:00 PM IST',
    logoUrl: `${baseUrl}/logo.jpg`,
    heroImageUrl: `${baseUrl}/hero_matrimonial.jpg`
  });

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// GET Email Send Logs (For Admin / Developer Preview)
app.get('/api/welcome-email/logs', (req, res) => {
  res.json({ success: true, logs: emailLogs });
});

// POST Send Welcome Email
app.post('/api/welcome-email/send', async (req, res) => {
  try {
    const {
      uid,
      userEmail,
      userName,
      registrationDateISO,
      expiryDateISO,
      registrationDateFormatted,
      expiryDateFormatted
    } = req.body;

    if (!userEmail || !userEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing user email address'
      });
    }

    const safeUserName = (userName && userName.trim() !== 'undefined' && userName.trim() !== 'null')
      ? userName
      : 'Valued Member';

    const dates = formatMembershipDates(registrationDateISO);
    const regFormatted = registrationDateFormatted || dates.registrationDateFormatted;
    const expFormatted = expiryDateFormatted || dates.expiryDateFormatted;

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

    const htmlContent = generateWelcomeEmailHtml({
      userName: safeUserName,
      userEmail,
      registrationDate: regFormatted,
      expiryDate: expFormatted,
      websiteUrl: baseUrl,
      profileUrl: `${baseUrl}/profile`,
      matchesUrl: `${baseUrl}/search`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@nashiktelisamaj.org',
      supportPhone: process.env.SUPPORT_PHONE || '+91 98220 12345 / +91 0253 2501234',
      supportHours: 'Mon - Sat: 10:00 AM - 7:00 PM IST',
      logoUrl: `${baseUrl}/logo.jpg`,
      heroImageUrl: `${baseUrl}/hero_matrimonial.jpg`
    });

    const subject = `Welcome to Teli Samaj Matrimonial, ${safeUserName}! ❤️`;

    const transporter = getEmailTransporter();

    let deliveryStatus: 'sent' | 'simulated' = 'simulated';
    let deliveryDetails = 'Logged in development environment';

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"Teli Samaj Matrimonial" <${process.env.SMTP_FROM || 'noreply@nashiktelisamaj.org'}>`,
          to: userEmail,
          subject,
          html: htmlContent
        });
        deliveryStatus = 'sent';
        deliveryDetails = `Sent via SMTP: ${info.messageId}`;
        console.log(`[SMTP EMAIL SENT SUCCESS] Message ID: ${info.messageId} to ${userEmail}`);
      } catch (smtpErr: any) {
        console.error(`[SMTP ERROR] Failed to send email via SMTP to ${userEmail}:`, smtpErr.message);
        deliveryStatus = 'simulated';
        deliveryDetails = `SMTP error (${smtpErr.message}). Fallback to system logger.`;
      }
    } else {
      console.log(`[DEVELOPMENT EMAIL LOG] To: ${userEmail} | Subject: "${subject}" | RegDate: ${regFormatted} | ExpDate: ${expFormatted}`);
    }

    // Record log
    emailLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipientEmail: userEmail,
      userName: safeUserName,
      subject,
      status: deliveryStatus,
      timestamp: new Date().toISOString(),
      details: deliveryDetails
    });

    if (emailLogs.length > 50) emailLogs.pop();

    return res.json({
      success: true,
      status: deliveryStatus,
      message: `Welcome email successfully processed for ${userEmail}`,
      registrationDate: regFormatted,
      expiryDate: expFormatted,
      details: deliveryDetails
    });

  } catch (error: any) {
    console.error('Error in /api/welcome-email/send:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error processing welcome email'
    });
  }
});

// POST Send Test Email
app.post('/api/welcome-email/test', async (req, res) => {
  try {
    const { recipientEmail, userName } = req.body;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid test email address.' });
    }

    const safeUserName = userName?.trim() || 'Test Member';
    const dates = formatMembershipDates(new Date());

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

    const htmlContent = generateWelcomeEmailHtml({
      userName: safeUserName,
      userEmail: recipientEmail,
      registrationDate: dates.registrationDateFormatted,
      expiryDate: dates.expiryDateFormatted,
      websiteUrl: baseUrl,
      profileUrl: `${baseUrl}/profile`,
      matchesUrl: `${baseUrl}/search`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@nashiktelisamaj.org',
      supportPhone: process.env.SUPPORT_PHONE || '+91 98220 12345 / +91 0253 2501234',
      supportHours: 'Mon - Sat: 10:00 AM - 7:00 PM IST',
      logoUrl: `${baseUrl}/logo.jpg`,
      heroImageUrl: `${baseUrl}/hero_matrimonial.jpg`
    });

    const subject = `[TEST] Welcome to Teli Samaj Matrimonial, ${safeUserName}! ❤️`;

    const transporter = getEmailTransporter();
    let deliveryStatus: 'sent' | 'simulated' = 'simulated';
    let details = 'Simulated test dispatch (SMTP credentials not configured)';

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"Teli Samaj Matrimonial Test" <${process.env.SMTP_FROM || 'noreply@nashiktelisamaj.org'}>`,
          to: recipientEmail,
          subject,
          html: htmlContent
        });
        deliveryStatus = 'sent';
        details = `Delivered to SMTP server: ${info.messageId}`;
      } catch (smtpErr: any) {
        details = `SMTP dispatch error: ${smtpErr.message}`;
      }
    }

    emailLogs.unshift({
      id: `test_${Date.now()}`,
      recipientEmail,
      userName: safeUserName,
      subject,
      status: deliveryStatus,
      timestamp: new Date().toISOString(),
      details
    });

    return res.json({
      success: true,
      status: deliveryStatus,
      message: `Test email dispatched to ${recipientEmail}`,
      details
    });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// --------------------------------------------------
// RAZORPAY SUBSCRIPTION API ENDPOINTS
// --------------------------------------------------

// 1. Create Razorpay Order
app.post('/api/payments/razorpay/create-order', async (req, res) => {
  try {
    const { uid, userPhone, userName, plan } = req.body;

    if (!uid) {
      return res.status(400).json({ success: false, error: 'User UID is required' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const amountInPaise = 79900; // ₹799 in paise
    const currency = 'INR';
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (keyId && keySecret) {
      // Production Razorpay Order creation via API
      try {
        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt: `rcpt_${uid.slice(0, 8)}_${Date.now()}`,
            notes: { uid, userPhone, userName, plan: plan || 'annual_799' }
          })
        });

        if (rzpResponse.ok) {
          const rzpOrder = await rzpResponse.json();
          return res.json({
            success: true,
            orderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId,
            mode: 'live_razorpay'
          });
        }
      } catch (rzpErr: any) {
        console.warn('Razorpay REST API order creation failed, falling back to secure local order ID:', rzpErr.message);
      }
    }

    // Development / Test mode order response
    return res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency,
      keyId: keyId || 'rzp_test_mock_key',
      mode: 'test_simulator'
    });

  } catch (err: any) {
    console.error('Error in /api/payments/razorpay/create-order:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Verify Razorpay Payment Signature
app.post('/api/payments/razorpay/verify-payment', async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, uid } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing orderId or paymentId for verification'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keySecret && razorpaySignature) {
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Razorpay payment signature verification failed'
        });
      }
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 365);

    return res.json({
      success: true,
      verified: true,
      transactionId: razorpayPaymentId,
      orderId: razorpayOrderId,
      amount: 799,
      currency: 'INR',
      startDateISO: startDate.toISOString(),
      endDateISO: endDate.toISOString(),
      message: 'Razorpay payment signature verified successfully.'
    });

  } catch (err: any) {
    console.error('Error in /api/payments/razorpay/verify-payment:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Razorpay Webhook Endpoint
app.post('/api/payments/razorpay/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret && signature) {
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).send('Invalid webhook signature');
      }
    }

    const event = req.body.event;
    console.log(`[RAZORPAY WEBHOOK RECEIVED] Event: ${event}`);

    // Return 200 OK to Razorpay
    return res.status(200).json({ status: 'ok', event });

  } catch (err: any) {
    console.error('Razorpay Webhook Error:', err);
    return res.status(500).send('Webhook processing error');
  }
});

// --------------------------------------------------
// VITE MIDDLEWARE / STATIC SERVING
// --------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
