export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  registrationDate: string; // e.g. "10 August 2026"
  expiryDate: string;       // e.g. "10 August 2027"
  websiteUrl: string;
  profileUrl: string;
  matchesUrl: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  logoUrl: string;
  heroImageUrl: string;
}

export function formatMembershipDates(startDateInput?: string | Date) {
  const startDate = startDateInput ? new Date(startDateInput) : new Date();
  if (isNaN(startDate.getTime())) {
    return formatMembershipDates(new Date());
  }

  // Format: "10 August 2026"
  const day = startDate.getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[startDate.getMonth()];
  const year = startDate.getFullYear();

  const registrationDateStr = `${day} ${month} ${year}`;

  // Expiry date = 1 year later
  const expiryDate = new Date(startDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const expDay = expiryDate.getDate();
  const expMonth = monthNames[expiryDate.getMonth()];
  const expYear = expiryDate.getFullYear();

  const expiryDateStr = `${expDay} ${expMonth} ${expYear}`;

  return {
    registrationDateISO: startDate.toISOString(),
    expiryDateISO: expiryDate.toISOString(),
    registrationDateFormatted: registrationDateStr,
    expiryDateFormatted: expiryDateStr
  };
}

export function generateWelcomeEmailHtml(data: WelcomeEmailData): string {
  const {
    userName = 'Valued Member',
    userEmail = '',
    registrationDate = '10 August 2026',
    expiryDate = '10 August 2027',
    websiteUrl = 'https://telisamajmatrimony.org',
    profileUrl = `${websiteUrl}/profile`,
    matchesUrl = `${websiteUrl}/search`,
    supportEmail = 'support@nashiktelisamaj.org',
    supportPhone = '+91 98220 12345 / +91 0253 2501234',
    supportHours = 'Mon - Sat: 10:00 AM - 7:00 PM IST',
    logoUrl = `${websiteUrl}/logo.jpg`,
    heroImageUrl = `${websiteUrl}/hero_matrimonial.jpg`
  } = data;

  const safeUserName = userName.trim() && userName !== 'undefined' && userName !== 'null' ? userName : 'Valued Member';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Encoding" content="IE=edge">
  <title>Welcome to Teli Samaj Matrimonial, ${safeUserName}!</title>
  <style>
    /* Hidden Preheader text for email clients */
    .preheader {
      display: none !important;
      visibility: hidden;
      opacity: 0;
      color: transparent;
      height: 0;
      width: 0;
      max-height: 0;
      max-width: 0;
      overflow: hidden;
      mso-hide: all;
    }
    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f7f5f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #292524;
    }
    .btn-primary {
      background-color: #ea580c;
      color: #ffffff !important;
      display: inline-block;
      padding: 14px 28px;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
    }
    .btn-secondary {
      background-color: #78350f;
      color: #ffffff !important;
      display: inline-block;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 10px;
      text-align: center;
    }
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        direction: ltr !important;
      }
      .mobile-padding {
        padding: 20px 16px !important;
      }
      .mobile-title {
        font-size: 24px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f0;">
  <!-- Visually hidden preheader -->
  <span class="preheader">Your journey toward finding a meaningful matrimonial connection within the Teli Samaj community starts here.</span>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f5f0; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Container (Width: 600px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          
          <!-- TOP HEADER WITH LOGO & BRAND -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #7c1d24 0%, #4a0e13 100%); padding: 28px 20px; text-align: center; border-bottom: 4px solid #d4af37;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <img src="${logoUrl}" alt="Teli Samaj Matrimonial" width="64" height="64" style="border-radius: 50%; border: 2px solid #d4af37; background-color: #ffffff; display: block;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="color: #fef08a; font-family: Georgia, serif; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                      तेली समाज मॅट्रिमोनी
                    </h1>
                    <p style="color: #fde047; font-size: 13px; font-weight: 600; margin: 4px 0 0 0; letter-spacing: 0.5px;">
                      Teli Samaj Matrimonial • Nashik
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO BANNER SECTION -->
          <tr>
            <td align="center" style="background-color: #fef3c7; padding: 0; position: relative;">
              <img src="${heroImageUrl}" alt="Matrimonial Traditions" width="600" style="width: 100%; max-width: 600px; height: auto; display: block; object-fit: cover;" />
            </td>
          </tr>

          <!-- WELCOME MESSAGE SECTION -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 36px 24px 36px; background-color: #ffffff;">
              <h2 class="mobile-title" style="color: #1c1917; font-family: Georgia, serif; font-size: 26px; margin: 0 0 16px 0; font-weight: bold;">
                Welcome, ${safeUserName}! ❤️
              </h2>
              <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                We are delighted to welcome you to <strong>Teli Samaj Matrimonial</strong>. Our platform is built to help members of the Teli Samaj community discover meaningful, respectful, and compatible matrimonial connections while honoring our rich cultural heritage and family values.
              </p>
              <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0;">
                Your account is now fully active, giving you complete access to verified community profiles, advanced search options, and direct interest expressions.
              </p>
            </td>
          </tr>

          <!-- MEMBERSHIP CARD SECTION -->
          <tr>
            <td class="mobile-padding" style="padding: 0 36px 28px 36px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 16px; border: 2px solid #fde68a; padding: 20px;">
                <tr>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px; border-bottom: 1px solid #fcd34d;">
                          <p style="color: #92400e; font-size: 12px; font-weight: bold; text-transform: uppercase; tracking: 1px; margin: 0;">
                            ✨ OFFICIAL MEMBERSHIP PASS
                          </p>
                          <h3 style="color: #78350f; font-family: Georgia, serif; font-size: 20px; font-weight: bold; margin: 4px 0 0 0;">
                            Community Membership Details
                          </h3>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 14px;">
                          <table border="0" cellpadding="4" cellspacing="0" width="100%" style="font-size: 14px; color: #451a03;">
                            <tr>
                              <td width="40%" style="font-weight: 600; color: #78350f;">Member Name:</td>
                              <td width="60%" style="font-weight: bold; color: #1c1917;">${safeUserName}</td>
                            </tr>
                            ${userEmail ? `
                            <tr>
                              <td style="font-weight: 600; color: #78350f;">Email Address:</td>
                              <td style="font-weight: 500; color: #1c1917;">${userEmail}</td>
                            </tr>` : ''}
                            <tr>
                              <td style="font-weight: 600; color: #78350f;">Registration Date:</td>
                              <td style="font-weight: bold; color: #1c1917;">${registrationDate}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: 600; color: #78350f;">Membership Valid Until:</td>
                              <td style="font-weight: bold; color: #b45309;">${expiryDate}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: 600; color: #78350f;">Membership Duration:</td>
                              <td style="font-weight: 500; color: #1c1917;">1 Year (Community Access)</td>
                            </tr>
                            <tr>
                              <td style="font-weight: 600; color: #78350f;">Membership Status:</td>
                              <td>
                                <span style="background-color: #dcfce7; color: #15803d; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 12px; display: inline-block; border: 1px solid #86efac;">
                                  ● Active
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CTA: EXPLORE WEBSITE -->
          <tr>
            <td align="center" style="padding: 0 36px 32px 36px;">
              <a href="${websiteUrl}" class="btn-primary" target="_blank" style="background-color: #ea580c; color: #ffffff !important; display: inline-block; padding: 15px 32px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 12px; text-align: center;">
                Explore Teli Samaj Matrimonial →
              </a>
            </td>
          </tr>

          <!-- TWO FEATURE BLOCKS: COMPLETE PROFILE & FIND MATCHES -->
          <tr>
            <td class="mobile-padding" style="padding: 0 36px 32px 36px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- BLOCK 1: COMPLETE YOUR PROFILE -->
                <tr>
                  <td style="background-color: #fafaf9; border-radius: 14px; border: 1px solid #e7e5e4; padding: 20px; margin-bottom: 20px; display: block;">
                    <h4 style="color: #7c1d24; font-family: Georgia, serif; font-size: 18px; margin: 0 0 8px 0; font-weight: bold;">
                      1. Complete Your Biodata & Profile 📝
                    </h4>
                    <p style="color: #57534e; font-size: 14px; line-height: 1.5; margin: 0 0 12px 0;">
                      A complete profile receives up to <strong>5x more interest responses</strong>! Please ensure you add:
                    </p>
                    <ul style="color: #44403c; font-size: 13px; margin: 0 0 16px 0; padding-left: 20px; line-height: 1.6;">
                      <li>Clear Profile Photos & Birth Details</li>
                      <li>Highest Education Degree & Profession</li>
                      <li>Gotra / Kul & Native Place Roots</li>
                      <li>Family Background & Parents Information</li>
                      <li>Partner Preferences & Expectations</li>
                    </ul>
                    <a href="${profileUrl}" class="btn-secondary" target="_blank" style="background-color: #78350f; color: #ffffff !important; display: inline-block; padding: 10px 20px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 8px;">
                      Complete My Profile
                    </a>
                  </td>
                </tr>

                <tr><td height="16"></td></tr>

                <!-- BLOCK 2: DISCOVER MATCHES -->
                <tr>
                  <td style="background-color: #fafaf9; border-radius: 14px; border: 1px solid #e7e5e4; padding: 20px; display: block;">
                    <h4 style="color: #7c1d24; font-family: Georgia, serif; font-size: 18px; margin: 0 0 8px 0; font-weight: bold;">
                      2. Discover Suitable Matches 🔍
                    </h4>
                    <p style="color: #57534e; font-size: 14px; line-height: 1.5; margin: 0 0 12px 0;">
                      Explore verified profiles within Nashik and surrounding regions. Filter by age, education, profession, and location:
                    </p>
                    <ul style="color: #44403c; font-size: 13px; margin: 0 0 16px 0; padding-left: 20px; line-height: 1.6;">
                      <li>Search profiles with smart compatibility matching</li>
                      <li>Send "Express Interest" requests directly</li>
                      <li>Save profiles to your Favorites list</li>
                      <li>View full contact details upon verified access</li>
                    </ul>
                    <a href="${matchesUrl}" class="btn-secondary" target="_blank" style="background-color: #78350f; color: #ffffff !important; display: inline-block; padding: 10px 20px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 8px;">
                      Find Your Matches
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- COMMUNITY VALUES MESSAGE -->
          <tr>
            <td class="mobile-padding" style="padding: 0 36px 32px 36px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fdf2f8; border-left: 4px solid #be185d; border-radius: 0 12px 12px 0; padding: 16px 20px;">
                <tr>
                  <td>
                    <h4 style="color: #831843; font-family: Georgia, serif; font-size: 16px; margin: 0 0 6px 0; font-weight: bold;">
                      Find a Meaningful Connection
                    </h4>
                    <p style="color: #9d174d; font-size: 13px; line-height: 1.5; margin: 0;">
                      Teli Samaj Matrimonial is committed to preserving community trust, privacy, and individual dignity. All profile information is securely safeguarded according to strict privacy guidelines.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SUPPORT & CONTACT SECTION -->
          <tr>
            <td class="mobile-padding" style="padding: 24px 36px; background-color: #fafaf9; border-top: 1px solid #e7e5e4;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h4 style="color: #1c1917; font-family: Georgia, serif; font-size: 16px; margin: 0 0 12px 0; font-weight: bold;">
                      Need Assistance? Our Support Team is Here for You
                    </h4>
                    <p style="color: #57534e; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
                      <strong>Email:</strong> <a href="mailto:${supportEmail}" style="color: #ea580c; text-decoration: none; font-weight: 600;">${supportEmail}</a>
                    </p>
                    <p style="color: #57534e; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
                      <strong>Helpline / Phone:</strong> <span style="color: #1c1917; font-weight: 600;">${supportPhone}</span>
                    </p>
                    <p style="color: #57534e; font-size: 13px; line-height: 1.6; margin: 0;">
                      <strong>Support Hours:</strong> ${supportHours}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECURITY NOTICE -->
          <tr>
            <td class="mobile-padding" style="padding: 16px 36px; background-color: #fef2f2; border-top: 1px solid #fee2e2;">
              <p style="color: #991b1b; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                🔒 <strong>Security Notice:</strong> For your safety, never share your account password, OTP, or financial details with anyone. Teli Samaj Matrimonial representatives will never ask for your confidential credentials.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="background-color: #4a0e13; color: #fde047; padding: 28px 20px; text-align: center; border-top: 3px solid #d4af37;">
              <p style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; margin: 0 0 6px 0; color: #fef08a;">
                नाशिक तेली समाज मॅट्रिमोनी
              </p>
              <p style="color: #fef3c7; font-size: 12px; margin: 0 0 16px 0; opacity: 0.85;">
                Preserving Community Traditions • Building Bright Futures
              </p>
              <p style="color: #fde047; font-size: 12px; margin: 0 0 16px 0;">
                <a href="${websiteUrl}" style="color: #fef08a; text-decoration: underline; margin: 0 8px;">Website Home</a> |
                <a href="${profileUrl}" style="color: #fef08a; text-decoration: underline; margin: 0 8px;">My Profile</a> |
                <a href="${matchesUrl}" style="color: #fef08a; text-decoration: underline; margin: 0 8px;">Privacy Policy</a> |
                <a href="mailto:${supportEmail}" style="color: #fef08a; text-decoration: underline; margin: 0 8px;">Support</a>
              </p>
              <p style="color: #e7e5e4; font-size: 11px; margin: 0; opacity: 0.7;">
                &copy; ${new Date().getFullYear()} Nashik Teli Samaj Matrimony. All rights reserved.<br>
                This automated welcome notification was sent to ${userEmail || 'your registered email'}.<br>
                If you wish to manage your communication preferences, you may update your settings in your profile.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
