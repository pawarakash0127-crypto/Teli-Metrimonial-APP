# 🧪 Nashik Teli Samaj Vadhu-Var Parichay - QA Test Cases Suite

**Document Version:** 1.0.0  
**Project:** Nashik Teli Samaj Vadhu-Var Parichay Matrimonial Portal  
**Target Environment:** Firebase Firestore (`ai-studio-6e832d62-8208-4671-99db-0478071b0a01`), Cloud Run Runtime  
**Lead Test Automation Architect:** Senior QA Engineer & Test Automation Architect  
**Date Created:** August 14, 2026  

---

## 🔑 Test Credentials & Account Setup

For executing test scenarios across user roles and regression validations, use the following test account parameters:

| Account Type | Identifier / Email / Phone | Password / Auth Mode | User UID (`request.auth.uid`) | Role / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Admin** | `pawarakash0127@gmail.com` | `[Configured Firebase Admin Pass]` | Primary Admin UID | Admin Dashboard, Moderation, Approvals |
| **Problematic Test User 1** | `+91 8149909817` | `[Configured User Pass]` | `aJ0gRR0saRPG1KcK6a1EdBIwQi22` | Phone Auth, Missing `var/vadhuId` Regression |
| **Problematic Test User 2** | `q4A5gbNCrOZnKYVp6KF5VHD5EE93` | `[Configured User Pass]` | `q4A5gbNCrOZnKYVp6KF5VHD5EE93` | Member Selection Stale UID Display Regression |
| **QA Standard Email User** | `QA_TEST_EMAIL_001@example.com` | `TestPass123!` | Auto-generated on registration | Email Registration & Normal User Flow |
| **QA Standard Phone User** | `+919876543210` | `TestPass123!` | Auto-generated on registration | Phone Registration & Normal User Flow |
| **QA Pending Approval User** | `QA_TEST_PENDING@example.com` | `TestPass123!` | Auto-generated on registration | Admin Approval Workflow Verification |
| **QA 0-Match User** | `QA_TEST_ZEROMATCH@example.com` | `TestPass123!` | Auto-generated on registration | Real-time Zero Match Admin Dashboard Sync |
| **QA Deletion User** | `QA_TEST_DELETION@example.com` | `TestPass123!` | Auto-generated on registration | 30-Day Deletion Countdown & Self-Service Flow |

---

## 📋 Standard Status Definitions

- **`NOT TESTED`**: Test case defined, awaiting execution in execution run.
- **`PASS`**: Executed and verified meeting all expected UI and Firestore state conditions.
- **`FAIL`**: Executed and produced an error or deviated from expected specification.
- **`BLOCKED`**: Execution blocked by a dependency or fatal environment bug.

---

## 📁 Test Cases Index & Coverage Matrix

1. **[AUTH] Authentication & Authorization** (TC-AUTH-001 to TC-AUTH-016)
2. **[FORGOT] Forgot Password & Reset Flow** (TC-FORGOT-001 to TC-FORGOT-011)
3. **[PROF] Profile Creation & Management** (TC-PROF-001 to TC-PROF-014)
4. **[DATA] Firestore Data Integrity & Schema Consistency** (TC-DATA-001 to TC-DATA-010)
5. **[APPV] Admin Approval & Workflow** (TC-APPV-001 to TC-APPV-008)
6. **[ADM-MEM] Admin Member Profiles & Pagination** (TC-ADM-MEM-001 to TC-ADM-MEM-009)
7. **[ADM-EXCL] Admin Account Exclusion** (TC-ADM-EXCL-001 to TC-ADM-EXCL-007)
8. **[FEAT] Featured Profiles Carousel & Timer Logic** (TC-FEAT-001 to TC-FEAT-013)
9. **[SEARCH] Search Profiles & Filtering** (TC-SEARCH-001 to TC-SEARCH-012)
10. **[MATCH] My Matches & Real-Time Sync** (TC-MATCH-001 to TC-MATCH-008)
11. **[DEL] 30-Day Profile Deletion Flow** (TC-DEL-001 to TC-DEL-009)
12. **[REV-SUB] Feedback & Member Reviews Submission** (TC-REV-SUB-001 to TC-REV-SUB-010)
13. **[REV-ADM] Admin Feedback Management & Home Show/Hide Control** (TC-REV-ADM-001 to TC-REV-ADM-008)
14. **[REV-HOME] Home Page Community Reviews** (TC-REV-HOME-001 to TC-REV-HOME-008)
15. **[CONTACT] Contact Us Form** (TC-CONTACT-001 to TC-CONTACT-006)
16. **[SEC] Security & Access Control** (TC-SEC-001 to TC-SEC-010)
17. **[RTIME] Real-Time Sync & Multi-Session Listening** (TC-RTIME-001 to TC-RTIME-007)
18. **[PERF] Performance, Scale & Memory Leak Testing** (TC-PERF-001 to TC-PERF-008)
19. **[RESP] Responsive Design & Layout** (TC-RESP-001 to TC-RESP-006)
20. **[BROWSER] Cross-Browser Compatibility** (TC-BROWSER-001 to TC-BROWSER-006)
21. **[REG] Complete Regression Test Suite** (TC-REG-001 to TC-REG-016)

---

## Module 1: Authentication & Authorization

### TC-AUTH-001: Email Registration with Valid Credentials
- **Module/Feature**: Authentication / Registration
- **Test Scenario**: Register a new user account using a valid email address, password, and mandatory fields.
- **Preconditions**: User is logged out; on `/register`.
- **Test Data**: Email: `QA_TEST_EMAIL_001@example.com`, Password: `TestPass123!`, Phone: `9876543210`, Name: `Rahul Teli`, Gender: `Male`, Marital Status: `Unmarried`, Birth Date: `1998-05-15`.
- **Step-by-step Test Steps**:
  1. Navigate to `/register`.
  2. Select "Email" as registration method.
  3. Fill in First Name, Last Name, Email, Password, Phone Number, Gender, Date of Birth.
  4. Click "Create Account & Continue".
- **Expected Result**: Account created successfully in Firebase Auth; redirected to Profile Creation wizard `/profile`. User session persisted.
- **Actual Result**: Pending verification during test run.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Must verify Firebase Auth user creation and initial Firestore document generation.
- **Firestore Verification**: Document created in `users/{uid}` with `email: "QA_TEST_EMAIL_001@example.com"`, `registrationMethod: "email"`, `approved: false` (or pending status), and matching `profiles/{uid}` initialized.

---

### TC-AUTH-002: Phone Registration with Valid 10-Digit Mobile Number
- **Module/Feature**: Authentication / Registration
- **Test Scenario**: Register a new user account using a valid 10-digit phone number.
- **Preconditions**: User is logged out; on `/register`.
- **Test Data**: Phone: `9812345678`, Password: `TestPass123!`, Name: `Pooja Teli`, Gender: `Female`.
- **Step-by-step Test Steps**:
  1. Navigate to `/register`.
  2. Select "Mobile Number" registration method.
  3. Enter 10-digit mobile number `9812345678` and password.
  4. Complete mandatory personal fields and submit.
- **Expected Result**: Phone formatted via `validateAndFormatPhone` to `+91 9812345678`. Synthetic Firebase Auth account or SMS token issued. Account created successfully.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Verify `+91` prefix auto-formatting.
- **Firestore Verification**: Document created in `users/{uid}` with `phoneNumber: "+91 9812345678"`, `registrationMethod: "phone"`.

---

### TC-AUTH-003: Login with Valid Email and Password
- **Module/Feature**: Authentication / Login
- **Test Scenario**: Log in using existing registered email credentials.
- **Preconditions**: Account `QA_TEST_EMAIL_001@example.com` exists in Firebase Auth.
- **Test Data**: Email: `QA_TEST_EMAIL_001@example.com`, Password: `TestPass123!`.
- **Step-by-step Test Steps**:
  1. Navigate to `/login`.
  2. Enter email and password.
  3. Click "Sign In".
- **Expected Result**: Authentication succeeds; user redirected to `/profile` or `/search`; header displays logged-in state.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: None.
- **Firestore Verification**: `users/{uid}` queried and session populated in `AuthContext`.

---

### TC-AUTH-004: Login with Valid Phone Number Across Format Variations
- **Module/Feature**: Authentication / Login
- **Test Scenario**: Log in using phone number entered as raw 10 digits `9812345678`, formatted `+91 9812345678`, or `09812345678`.
- **Preconditions**: User registered with phone `+91 9812345678`.
- **Test Data**: Phone variations: `9812345678`, `09812345678`, `+919812345678`, `+91 9812345678`.
- **Step-by-step Test Steps**:
  1. Navigate to `/login`.
  2. Test each phone variation with valid password.
  3. Click "Sign In".
- **Expected Result**: All valid formatting variants resolve via `findAccountByPhone` or Firebase Auth lookup and successfully log in the user.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Tests `phoneUtils.ts` normalization logic.
- **Firestore Verification**: None.

---

### TC-AUTH-005: Reject Registration with Invalid Email Format
- **Module/Feature**: Authentication / Registration
- **Test Scenario**: Attempt registration with malformed email strings.
- **Preconditions**: On `/register`.
- **Test Data**: Emails: `invalidemail`, `test@`, `test@domain`, `@domain.com`.
- **Step-by-step Test Steps**:
  1. Enter malformed email in registration form.
  2. Click submit.
- **Expected Result**: Inline validation error displayed: "Please enter a valid email address". Form submission blocked.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Medium
- **Severity**: Minor
- **Notes**: Client-side regex check.
- **Firestore Verification**: No document created.

---

### TC-AUTH-006: Reject Registration with Duplicate Email
- **Module/Feature**: Authentication / Registration
- **Test Scenario**: Attempt registration using an email that already exists in Firebase Auth.
- **Preconditions**: `QA_TEST_EMAIL_001@example.com` exists.
- **Test Data**: Email: `QA_TEST_EMAIL_001@example.com`.
- **Step-by-step Test Steps**:
  1. On `/register`, enter `QA_TEST_EMAIL_001@example.com` and fill out form.
  2. Click submit.
- **Expected Result**: Firebase Auth returns `auth/email-already-in-use`. Friendly error banner displayed: "This email address is already registered."
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: No duplicate document created.

---

### TC-AUTH-007: Reject Registration with Duplicate Phone Number
- **Module/Feature**: Authentication / Registration
- **Test Scenario**: Attempt registration using a phone number already assigned to an existing profile.
- **Preconditions**: Profile with contact number `+91 9812345678` exists.
- **Test Data**: Phone: `9812345678`.
- **Step-by-step Test Steps**:
  1. On `/register`, select phone registration and enter `9812345678`.
  2. Submit form.
- **Expected Result**: Application checks existing records or Firebase Auth. Error banner displayed: "Mobile number is already registered."
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: No duplicate profile created.

---

### TC-AUTH-008: Password Strength Validation Minimum Length
- **Module/Feature**: Authentication / Password Validation
- **Test Scenario**: Attempt registration/password set with less than 6 characters.
- **Preconditions**: On `/register`.
- **Test Data**: Passwords: `12345`, `abc`.
- **Step-by-step Test Steps**:
  1. Enter password `12345`.
  2. Submit form.
- **Expected Result**: Error displayed: "Password must be at least 6 characters long."
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Medium
- **Severity**: Minor
- **Notes**: Firebase Auth requirement.
- **Firestore Verification**: None.

---

### TC-AUTH-009: Session Persistence Across Page Refresh and Tab Reload
- **Module/Feature**: Authentication / Session
- **Test Scenario**: Verify user remains authenticated after hard page refresh or opening new tab.
- **Preconditions**: User logged in as `QA_TEST_EMAIL_001@example.com`.
- **Test Data**: N/A.
- **Step-by-step Test Steps**:
  1. Log in successfully.
  2. Perform `CTRL + R` (hard refresh) on `/profile`.
  3. Open a new browser tab to app URL `/search`.
- **Expected Result**: User session restored instantly via Firebase Auth state listener; profile data loaded without requesting re-login.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: `onAuthStateChanged` persistence check.
- **Firestore Verification**: `users/{uid}` read successfully on boot.

---

### TC-AUTH-010: Logout Functionality and Session Clearing
- **Module/Feature**: Authentication / Logout
- **Test Scenario**: Click Sign Out button and verify token/state destruction.
- **Preconditions**: User logged in.
- **Test Data**: N/A.
- **Step-by-step Test Steps**:
  1. Click user avatar menu in header.
  2. Select "Sign Out".
  3. Attempt to navigate back via browser back button to `/profile`.
- **Expected Result**: Firebase `signOut` called; session cleared; user redirected to `/login` or `/`. Protected route redirects unauthenticated user back to `/login`.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Auth token invalidated.

---

### TC-AUTH-011: Protected Route Access Restrictions for Unauthenticated Users
- **Module/Feature**: Authentication / Protected Routes
- **Test Scenario**: Attempt direct URL navigation to protected pages while logged out.
- **Preconditions**: User is logged out.
- **Test Data**: Routes: `/profile`, `/matches`, `/admin`.
- **Step-by-step Test Steps**:
  1. Paste `https://[app-url]/profile` directly in browser address bar.
  2. Paste `https://[app-url]/matches` directly in address bar.
  3. Paste `https://[app-url]/admin` directly in address bar.
- **Expected Result**: Navigation intercepted by Auth Guard / ProtectedRoute wrapper; user redirected to `/login` with prompt.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: None.

---

### TC-AUTH-012: Admin Route Protection Against Non-Admin Logged-In Users
- **Module/Feature**: Authentication / Authorization
- **Test Scenario**: Log in as normal non-admin user `QA_TEST_EMAIL_001@example.com` and attempt accessing `/admin`.
- **Preconditions**: User logged in with `role: "user"` or `isAdmin: false`.
- **Test Data**: Target route: `/admin`.
- **Step-by-step Test Steps**:
  1. Log in as regular member.
  2. Navigate directly to `/admin`.
- **Expected Result**: Access denied. User redirected to `/` or `/profile` with alert banner: "Unauthorized access. Admin privileges required."
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Verify both client route guard and Firestore security rules.
- **Firestore Verification**: Read request to admin resources denied by rules.

---

## Module 2: Forgot Password & Reset Flow

### TC-FORGOT-001: Password Reset Request for Registered Email
- **Module/Feature**: Forgot Password / Email
- **Test Scenario**: Submit password reset request for registered email address.
- **Preconditions**: Account `QA_TEST_EMAIL_001@example.com` exists.
- **Test Data**: Email: `QA_TEST_EMAIL_001@example.com`.
- **Step-by-step Test Steps**:
  1. Open `/login` and click "Forgot Password?".
  2. Select "Email" tab.
  3. Enter `QA_TEST_EMAIL_001@example.com`.
  4. Click "Send Reset Link".
- **Expected Result**: Firebase `sendPasswordResetEmail` executed successfully. Success message displayed: "Password reset link sent to your email."
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Verify user receives email.
- **Firestore Verification**: None.

---

### TC-FORGOT-002: Password Reset Handling for Unregistered Email
- **Module/Feature**: Forgot Password / Email
- **Test Scenario**: Submit password reset request for non-existent email address.
- **Preconditions**: `nonexistent_qa_999@example.com` does not exist in system.
- **Test Data**: Email: `nonexistent_qa_999@example.com`.
- **Step-by-step Test Steps**:
  1. Open Forgot Password modal.
  2. Enter `nonexistent_qa_999@example.com`.
  3. Click "Send Reset Link".
- **Expected Result**: Graceful error handling or generic security notice displayed: "No account found with this email address."
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Medium
- **Severity**: Minor
- **Notes**: Prevents user enumeration if security guidelines dictate.
- **Firestore Verification**: None.

---

### TC-FORGOT-003: [REGRESSION] Password Reset for Registered Phone Number `+91 8149909817`
- **Module/Feature**: Forgot Password / Phone Regression
- **Test Scenario**: Verify registered phone number `+91 8149909817` (User ID `aJ0gRR0saRPG1KcK6a1EdBIwQi22`) is correctly located by `findAccountByPhone` during Forgot Password lookup.
- **Preconditions**: Document exists in Firestore with `phoneNumber: "+91 8149909817"` or `contactNumber: "+91 8149909817"`.
- **Test Data**: Input phone: `+91 8149909817` or `8149909817`.
- **Step-by-step Test Steps**:
  1. Open Forgot Password modal.
  2. Select "Mobile Number" tab.
  3. Enter `+91 8149909817`.
  4. Click "Find Account / Reset Password".
- **Expected Result**: Account located successfully without returning "No account found registered with phone number +91 8149909817". Password reset instructions or OTP modal presented.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Regression test for previously reported issue where `+91 8149909817` failed lookup.
- **Firestore Verification**: `findAccountByPhone` queries `profiles` and `users` collections across format variations (`+91 8149909817`, `8149909817`, `08149909817`).

---

### TC-FORGOT-004: Phone Number Lookup with Spaces (`+91 81499 09817`)
- **Module/Feature**: Forgot Password / Phone Formats
- **Test Scenario**: Enter phone number containing spaces in Forgot Password modal.
- **Preconditions**: Account exists for `8149909817`.
- **Test Data**: Input: `+91 81499 09817`.
- **Step-by-step Test Steps**:
  1. Open Forgot Password modal.
  2. Enter `+91 81499 09817`.
  3. Click submit.
- **Expected Result**: Input stripped of spaces via `validateAndFormatPhone`; normalized to `+91 8149909817`; account located.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Checks formatting resilience.
- **Firestore Verification**: None.

---

### TC-FORGOT-005: Phone Number Lookup Without Country Code (`8149909817`)
- **Module/Feature**: Forgot Password / Phone Formats
- **Test Scenario**: Enter raw 10-digit mobile number without leading country code or zeros.
- **Preconditions**: Account exists for `+91 8149909817`.
- **Test Data**: Input: `8149909817`.
- **Step-by-step Test Steps**:
  1. Open Forgot Password modal.
  2. Enter `8149909817`.
  3. Click submit.
- **Expected Result**: System prepends `+91 ` automatically; matches database record `+91 8149909817`.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: None.

---

### TC-FORGOT-006: Phone Number Lookup with Leading Zero (`08149909817`)
- **Module/Feature**: Forgot Password / Phone Formats
- **Test Scenario**: Enter phone number with leading `0`.
- **Preconditions**: Account exists for `+91 8149909817`.
- **Test Data**: Input: `08149909817`.
- **Step-by-step Test Steps**:
  1. Open Forgot Password modal.
  2. Enter `08149909817`.
  3. Click submit.
- **Expected Result**: Leading zero stripped; converted to `+91 8149909817`; account located.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Medium
- **Severity**: Minor
- **Notes**: None.
- **Firestore Verification**: None.

---

### TC-FORGOT-007: Reject Invalid Phone Length/Format
- **Module/Feature**: Forgot Password / Phone Formats
- **Test Scenario**: Enter incomplete phone number (e.g. 5 digits or containing alphabets).
- **Preconditions**: On Forgot Password modal.
- **Test Data**: Inputs: `12345`, `abcdefghij`, `98765`.
- **Step-by-step Test Steps**:
  1. Enter `12345`.
  2. Click submit.
- **Expected Result**: Validation error displayed: "Please enter a valid 10-digit mobile number."
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Medium
- **Severity**: Minor
- **Notes**: None.
- **Firestore Verification**: None.

---

### TC-FORGOT-008: Unregistered Phone Number Search
- **Module/Feature**: Forgot Password / Phone Formats
- **Test Scenario**: Enter valid 10-digit phone number that does not exist in database.
- **Preconditions**: Phone `9990000000` is unassigned.
- **Test Data**: Input: `9990000000`.
- **Step-by-step Test Steps**:
  1. Open Forgot Password modal.
  2. Enter `9990000000`.
  3. Click submit.
- **Expected Result**: Error banner displayed: "No account found registered with phone number +91 9990000000."
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Query returns empty snapshot.

---

### TC-FORGOT-009: Successful Password Reset Execution via Account Prompt
- **Module/Feature**: Forgot Password / Reset Execution
- **Test Scenario**: Complete password reset flow for identified account and update password in Firebase Auth.
- **Preconditions**: Valid email or phone account located.
- **Test Data**: Account: `QA_TEST_EMAIL_001@example.com`, New Password: `NewSecurePass123!`.
- **Step-by-step Test Steps**:
  1. Initiate reset for `QA_TEST_EMAIL_001@example.com`.
  2. Follow link/reset modal to enter new password `NewSecurePass123!`.
  3. Submit new password.
- **Expected Result**: Password updated in Firebase Auth; success modal shown; user prompted to log in.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Auth record updated.

---

### TC-FORGOT-010: Login Verification After Password Reset
- **Module/Feature**: Forgot Password / Login Verification
- **Test Scenario**: Log in using newly set password and verify old password is rejected.
- **Preconditions**: Password reset completed in TC-FORGOT-009.
- **Test Data**: Account: `QA_TEST_EMAIL_001@example.com`, Old Password: `TestPass123!`, New Password: `NewSecurePass123!`.
- **Step-by-step Test Steps**:
  1. Attempt login with Old Password `TestPass123!`.
  2. Observe error `auth/wrong-password`.
  3. Enter New Password `NewSecurePass123!`.
  4. Submit login.
- **Expected Result**: Old password fails; new password succeeds and logs user in.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: None.

---

## Module 3: Profile Creation & Management

### TC-PROF-001: Complete Profile Creation with All Required & Optional Fields
- **Module/Feature**: Profile Creation / Full Submission
- **Test Scenario**: Create complete matrimonial profile including Personal, Education, Work, Family, Kundali/Horoscope details and photo uploads.
- **Preconditions**: Logged-in user on `/profile` wizard.
- **Test Data**: 
  - Personal: Title: `Mr`, First: `Amit`, Middle: `Suresh`, Last: `Teli`, DOB: `1996-08-20`, Gender: `Male`, Height: `5 feet 10 inches`, Weight: `72 kg`, Marital Status: `Unmarried`, Blood Group: `O+`.
  - Place of Birth: `Nashik`, Native Place: `Pimpalgaon`, Time of Birth: `08:30`.
  - Education & Career: Degree: `B.E. Computer Engineering`, Category: `Engineering / IT`, Occupation: `Software Engineer`, Income: `10 - 15 Lakhs`.
  - Family Details: Father's Name: `Suresh Teli`, Father's Occupation: `Business`, Mother's Name: `Sunita Teli`, Mother's Occupation: `Homemaker`, Hometown: `Nashik`, Brothers: `1`, Sisters: `0`.
  - Contact Details: Marriage Contact: `9822001122`, Parent Contact: `9822001133`.
- **Step-by-step Test Steps**:
  1. Complete all wizard tabs.
  2. Upload primary photo.
  3. Click "Save & Submit Profile".
- **Expected Result**: Profile saved successfully; Toast notification displayed; Profile status updated; Completeness calculation updates to 100%.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Verify completeness indicator in UI.
- **Firestore Verification**: `profiles/{uid}` document created/updated with exact specified fields.

---

### TC-PROF-002: Parent Name Validation Rule - Father's Name Only
- **Module/Feature**: Profile / Parent Name Validation
- **Test Scenario**: Provide Father's Name while leaving Mother's Name blank.
- **Preconditions**: On Profile Edit -> Family Details tab.
- **Test Data**: Father's Name: `Suresh Teli`, Mother's Name: `""` (empty).
- **Step-by-step Test Steps**:
  1. Fill Father's Name as `Suresh Teli`.
  2. Clear Mother's Name field.
  3. Save Family Details section.
- **Expected Result**: Validation passes (`PASS`). Profile saves without error.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Business rule requirement.
- **Firestore Verification**: `profiles/{uid}.fatherName == "Suresh Teli"`.

---

### TC-PROF-003: Parent Name Validation Rule - Mother's Name Only
- **Module/Feature**: Profile / Parent Name Validation
- **Test Scenario**: Provide Mother's Name while leaving Father's Name blank.
- **Preconditions**: On Profile Edit -> Family Details tab.
- **Test Data**: Father's Name: `""` (empty), Mother's Name: `Sunita Teli`.
- **Step-by-step Test Steps**:
  1. Clear Father's Name field.
  2. Fill Mother's Name as `Sunita Teli`.
  3. Save Family Details section.
- **Expected Result**: Validation passes (`PASS`). Profile saves without error.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Business rule requirement.
- **Firestore Verification**: `profiles/{uid}.motherName == "Sunita Teli"`.

---

### TC-PROF-004: Parent Name Validation Rule - Both Parent Names Provided
- **Module/Feature**: Profile / Parent Name Validation
- **Test Scenario**: Provide both Father's Name and Mother's Name.
- **Preconditions**: On Profile Edit -> Family Details tab.
- **Test Data**: Father's Name: `Suresh Teli`, Mother's Name: `Sunita Teli`.
- **Step-by-step Test Steps**:
  1. Fill Father's Name and Mother's Name.
  2. Save Family Details section.
- **Expected Result**: Validation passes (`PASS`). Profile saves successfully.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Both fields populated in Firestore document.

---

### TC-PROF-005: Parent Name Validation Rule - Neither Parent Name Provided
- **Module/Feature**: Profile / Parent Name Validation
- **Test Scenario**: Leave both Father's Name and Mother's Name blank during profile save.
- **Preconditions**: On Profile Edit -> Family Details tab.
- **Test Data**: Father's Name: `""`, Mother's Name: `""`.
- **Step-by-step Test Steps**:
  1. Clear both Father's Name and Mother's Name fields.
  2. Attempt to save profile or advance wizard.
- **Expected Result**: Validation fails (`FAIL`). Clear inline warning banner displayed: "At least one parent's name (Father's Name or Mother's Name) is required." Form save blocked.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Crucial business rule guard.
- **Firestore Verification**: Save blocked; Firestore document unchanged.

---

### TC-PROF-006: Place of Birth & Native Place Input Validation
- **Module/Feature**: Profile / Personal & Family Fields
- **Test Scenario**: Enter Place of Birth and Native Place, verifying special characters handling and capitalization.
- **Preconditions**: On Profile Edit.
- **Test Data**: Place of Birth: `nashik`, Native Place: `pimpalgaon baswant`.
- **Step-by-step Test Steps**:
  1. Enter lowercase `nashik` in Place of Birth.
  2. Enter `pimpalgaon baswant` in Native Place.
  3. Click Save.
- **Expected Result**: Input formatted via `capitalizeWords` to `Nashik` and `Pimpalgaon Baswant`. Saved to profile.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Medium
- **Severity**: Minor
- **Notes**: Tests capitalization utilities.
- **Firestore Verification**: Values saved as capitalized strings in Firestore.

---

### TC-PROF-007: Hometown Under Family Details Preservation
- **Module/Feature**: Profile / Family Details
- **Test Scenario**: Ensure Hometown field under Family Details saves correctly without overwriting Native Place.
- **Preconditions**: On Profile Edit -> Family Details.
- **Test Data**: Hometown: `Pune`, Native Place: `Nashik`.
- **Step-by-step Test Steps**:
  1. Set Native Place to `Nashik`.
  2. Set Hometown under Family Details to `Pune`.
  3. Save profile.
- **Expected Result**: Both fields stored independently in Firestore (`nativePlace: "Nashik"`, `hometown: "Pune"`).
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Distinct fields check.
- **Firestore Verification**: Both `nativePlace` and `hometown` exist as separate top-level fields in `profiles/{uid}`.

---

### TC-PROF-008: Preferred Birth Year Range Visibility & Filter Matching
- **Module/Feature**: Profile / Partner Preferences
- **Test Scenario**: Set Preferred Birth Year min and max values and verify profile matching logic.
- **Preconditions**: User setting partner preferences.
- **Test Data**: Min Birth Year: `1995`, Max Birth Year: `2001`.
- **Step-by-step Test Steps**:
  1. Navigate to Partner Preferences.
  2. Set Preferred Birth Year range: 1995 to 2001.
  3. Save profile.
- **Expected Result**: Preferences stored in `profiles/{uid}.partnerPreferences`. Used accurately in match filtering.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Medium
- **Severity**: Minor
- **Notes**: None.
- **Firestore Verification**: `profiles/{uid}.preferredBirthYearMin == 1995`, `preferredBirthYearMax == 2001`.

---

### TC-PROF-009: Contact Number (For Marriage) Formatting and Validation
- **Module/Feature**: Profile / Contact Fields
- **Test Scenario**: Enter Contact Number (For Marriage) and verify validation rule.
- **Preconditions**: Profile Edit -> Contact Info.
- **Test Data**: Input: `9876543210`.
- **Step-by-step Test Steps**:
  1. Enter `9876543210` in Contact Number (For Marriage).
  2. Save section.
- **Expected Result**: Formatted via `validateAndFormatPhone` to `+91 9876543210`. Saved to profile.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: `contactNumber == "+91 9876543210"`.

---

### TC-PROF-010: Parents' Contact Details Separate Storage
- **Module/Feature**: Profile / Contact Fields
- **Test Scenario**: Verify Parents' Contact Details stored separately from candidate's marriage contact number.
- **Preconditions**: Profile Edit -> Contact Info.
- **Test Data**: Candidate Marriage Contact: `9876543210`, Parent Contact: `9123456789`.
- **Step-by-step Test Steps**:
  1. Fill Marriage Contact: `9876543210`.
  2. Fill Parents' Contact: `9123456789`.
  3. Save section.
- **Expected Result**: Both formatted cleanly and stored in separate fields (`contactNumber` and `parentsContact`).
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: `profiles/{uid}.contactNumber` and `profiles/{uid}.parentsContact` hold distinct formatted values.

---

### TC-PROF-011: Editing Existing Profile Section and Partial Save
- **Module/Feature**: Profile / Edit Section
- **Test Scenario**: Edit specific section (e.g. Education details) without altering other profile fields.
- **Preconditions**: Complete profile exists.
- **Test Data**: Updated Degree: `M.Tech Computer Science`.
- **Step-by-step Test Steps**:
  1. Click "Edit" on Education section.
  2. Change Degree to `M.Tech Computer Science`.
  3. Click Save Education.
- **Expected Result**: Only Education fields updated in Firestore; all other personal/family/photo data preserved intact.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Tests updateDoc vs setDoc behavior.
- **Firestore Verification**: `profiles/{uid}.education` updated; other document fields unchanged.

---

### TC-PROF-012: Data Persistence Verification After Browser Reload
- **Module/Feature**: Profile / Persistence
- **Test Scenario**: Reload browser immediately after saving profile edits.
- **Preconditions**: Profile edited and saved.
- **Test Data**: N/A.
- **Step-by-step Test Steps**:
  1. Save profile updates.
  2. Refresh page via browser reload button (`F5`).
- **Expected Result**: Profile view renders newly updated values directly from Firestore snapshot/getDoc call.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Firestore read confirms persistent write.

---

## Module 4: Firestore Data Integrity & Schema Consistency

### TC-DATA-001: Phone Registration Schema Completeness & Document Structure
- **Module/Feature**: Data Integrity / Phone Registration
- **Test Scenario**: Create a new account via Phone Registration and inspect created `users` and `profiles` Firestore documents.
- **Preconditions**: Phone `9888877777` unassigned.
- **Test Data**: Phone: `9888877777`, Gender: `Male`, Name: `Siddharth Teli`.
- **Step-by-step Test Steps**:
  1. Register account via Phone registration option.
  2. Complete initial wizard.
  3. Inspect Firestore documents in `users/{uid}` and `profiles/{uid}`.
- **Expected Result**:
  - `users/{uid}` created with required fields: `uid`, `phoneNumber` (`+91 9888877777`), `role: "user"`, `createdAt`, `registrationMethod: "phone"`, `var/vadhuId` assigned (e.g., `VAR-101`).
  - `profiles/{uid}` created with matching `id: uid`, `gender: "Male"`, `approved: false` (or pending status), `createdAt`, `displayProfileId`.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: None.
- **Firestore Verification**: Verify document schema in Firestore console/emulator.

---

### TC-DATA-002: Email Registration Schema Completeness & Document Structure
- **Module/Feature**: Data Integrity / Email Registration
- **Test Scenario**: Create a new account via Email Registration and inspect created `users` and `profiles` Firestore documents.
- **Preconditions**: Email `QA_TEST_EMAIL_SCHEMA@example.com` unassigned.
- **Test Data**: Email: `QA_TEST_EMAIL_SCHEMA@example.com`, Gender: `Female`, Name: `Anjali Teli`.
- **Step-by-step Test Steps**:
  1. Register account via Email registration option.
  2. Complete initial wizard.
  3. Inspect Firestore documents in `users/{uid}` and `profiles/{uid}`.
- **Expected Result**:
  - `users/{uid}` created with required fields: `uid`, `email`, `role: "user"`, `createdAt`, `registrationMethod: "email"`, `var/vadhuId` assigned (e.g., `VADHU-102`).
  - `profiles/{uid}` created with matching `id: uid`, `gender: "Female"`, `approved: false`, `createdAt`, `displayProfileId`.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Schema parity check between email and phone registration.
- **Firestore Verification**: Verify both registration modes output identical required fields.

---

### TC-DATA-003: [REGRESSION] Missing `var/vadhuId` on UID `aJ0gRR0saRPG1KcK6a1EdBIwQi22`
- **Module/Feature**: Data Integrity / ID Assignment Regression
- **Test Scenario**: Investigate and verify fix for existing problematic user UID `aJ0gRR0saRPG1KcK6a1EdBIwQi22` missing `var/vadhuId` in `users` document.
- **Preconditions**: Document `users/aJ0gRR0saRPG1KcK6a1EdBIwQi22` exists in Firestore.
- **Test Data**: UID: `aJ0gRR0saRPG1KcK6a1EdBIwQi22`.
- **Step-by-step Test Steps**:
  1. Query `users/aJ0gRR0saRPG1KcK6a1EdBIwQi22` document.
  2. Execute `getOrAssignProfileId` helper on login or admin inspection.
- **Expected Result**: System detects missing `var/vadhuId`; automatically generates and assigns unique Var/Vadhu ID based on gender (e.g., `VAR-xxx`); updates document seamlessly.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Regression scenario for previously unassigned ID bug.
- **Firestore Verification**: Document `users/aJ0gRR0saRPG1KcK6a1EdBIwQi22` contains valid string `var/vadhuId`.

---

### TC-DATA-004: UID Consistency Between `users` and `profiles` Collections
- **Module/Feature**: Data Integrity / Primary Keys
- **Test Scenario**: Verify that every `profiles` document ID exactly matches its corresponding `users` document ID (`doc.id == uid`).
- **Preconditions**: Multiple user profiles exist in Firestore.
- **Test Data**: All documents in `profiles` collection.
- **Step-by-step Test Steps**:
  1. Query all `profiles` documents.
  2. For each document, verify `users/{profile.id}` exists.
- **Expected Result**: 1-to-1 relationship maintained; zero orphan documents or mismatched UIDs.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Prevents orphan records.
- **Firestore Verification**: Key match across collections.

---

### TC-DATA-005: Prevention of Duplicate Profile Creation for Single User
- **Module/Feature**: Data Integrity / Uniqueness
- **Test Scenario**: Attempt calling profile initialization multiple times for same authenticated user.
- **Preconditions**: Authenticated user session.
- **Test Data**: UID: `QA_TEST_EMAIL_001@example.com`.
- **Step-by-step Test Steps**:
  1. Trigger profile save.
  2. Rapidly trigger secondary profile save or wizard completion.
- **Expected Result**: System uses `setDoc(..., { merge: true })` or checks existing doc; existing document updated rather than creating duplicate documents or overwriting static fields (`createdAt`, `var/vadhuId`).
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Exactly one document exists in `profiles` for given UID.

---

## Module 5: Admin Approval & Workflow

### TC-APPV-001: End-to-End Registration to Admin Approval Flow
- **Module/Feature**: Admin Approval / Workflow
- **Test Scenario**: Register new profile -> Verify Pending Approval state -> Admin receives notification -> Admin approves -> Profile activated.
- **Preconditions**: Admin logged in on Browser B; New user registering on Browser A.
- **Test Data**: User: `QA_TEST_PENDING@example.com`.
- **Step-by-step Test Steps**:
  1. Browser A: Register `QA_TEST_PENDING@example.com` and complete profile.
  2. Browser B: Open **Admin Dashboard -> Pending Approvals**. Verify new registration appears in pending list.
  3. Browser B: Check **Admin Notifications & Queries** tab for real-time registration alert.
  4. Browser B: Click "Approve Profile".
  5. Browser A: Refresh or observe profile status badge update.
- **Expected Result**:
  - Profile initially marked `approved: false` (or pending).
  - Admin notification received in real time on Admin Dashboard.
  - On approval click, Firestore updated to `approved: true`.
  - Profile removed from Pending Approvals tab and becomes visible in search/matches.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Core business workflow.
- **Firestore Verification**: `profiles/{uid}.approved == true`. `admin_notifications` document marked read or updated.

---

### TC-APPV-002: Real-Time Admin Notification Generation on New Registration
- **Module/Feature**: Admin Approval / Real-Time Alert
- **Test Scenario**: Verify new user registration instantly emits an `admin_notifications` document visible without refreshing Admin Dashboard.
- **Preconditions**: Admin Dashboard open on `/admin`.
- **Test Data**: User: `QA_TEST_NEWREG@example.com`.
- **Step-by-step Test Steps**:
  1. Keep Admin Dashboard open on **Admin Notifications & Queries**.
  2. In separate window, complete registration for `QA_TEST_NEWREG@example.com`.
- **Expected Result**: Notification card appears instantly in Admin Dashboard stream via Firestore `onSnapshot`.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Real-time listener verification.
- **Firestore Verification**: `admin_notifications` collection gains document with `type: "new_profile"`.

---

### TC-APPV-003: [REGRESSION] Approval Status Update for problematic UID `aJ0gRR0saRPG1KcK6a1EdBIwQi22`
- **Module/Feature**: Admin Approval / Regression
- **Test Scenario**: Verify admin approval successfully updates status in Firestore for UID `aJ0gRR0saRPG1KcK6a1EdBIwQi22`.
- **Preconditions**: Profile `aJ0gRR0saRPG1KcK6a1EdBIwQi22` in pending state.
- **Test Data**: UID: `aJ0gRR0saRPG1KcK6a1EdBIwQi22`.
- **Step-by-step Test Steps**:
  1. Open Admin Dashboard -> Pending Approvals.
  2. Locate profile `aJ0gRR0saRPG1KcK6a1EdBIwQi22`.
  3. Click Approve.
- **Expected Result**: Profile status transitions to `approved: true`; removed from pending list; no console errors.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Regression test for approval update failures.
- **Firestore Verification**: `profiles/aJ0gRR0saRPG1KcK6a1EdBIwQi22.approved == true`.

---

### TC-APPV-004: Admin Rejection Flow with Reason
- **Module/Feature**: Admin Approval / Rejection
- **Test Scenario**: Reject a pending profile with specified feedback reason.
- **Preconditions**: Pending profile exists.
- **Test Data**: Target UID: `QA_TEST_REJECT@example.com`, Reason: "Incomplete details or invalid photo".
- **Step-by-step Test Steps**:
  1. In Pending Approvals tab, click "Reject".
  2. Provide rejection reason in prompt.
  3. Submit rejection.
- **Expected Result**: Profile status updated to `approved: false` / `status: "rejected"`; user notified via account notification.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: `profiles/{uid}.status == "rejected"`, `rejectionReason` stored.

---

## Module 6: Admin Member Profiles & Pagination

### TC-ADM-MEM-001: Strict 50 Profiles Per Page Pagination Enforcment
- **Module/Feature**: Admin Dashboard / Pagination
- **Test Scenario**: Verify **Admin Dashboard -> All Member Profiles** strictly limits list display to 50 profiles per page.
- **Preconditions**: Total member profiles count > 50 (e.g. 129 profiles).
- **Test Data**: 129 total profiles in Firestore.
- **Step-by-step Test Steps**:
  1. Navigate to **Admin Dashboard -> All Member Profiles**.
  2. Count rendered profile cards/rows on Page 1.
- **Expected Result**: Exactly 50 profiles rendered on Page 1. Pagination summary reads "Showing 1 - 50 of 129 profiles".
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Prevents DOM slowdown and excessive Firestore memory consumption.
- **Firestore Verification**: Pagination query uses `limit(50)`.

---

### TC-ADM-MEM-002: Page Navigation Boundaries (Page 1, Page 2, Page 3)
- **Module/Feature**: Admin Dashboard / Pagination Navigation
- **Test Scenario**: Test Next, Previous, and Page Number buttons across 3 pages for 129 profiles.
- **Preconditions**: 129 member profiles exist.
- **Test Data**: 129 total profiles.
- **Step-by-step Test Steps**:
  1. Verify Page 1 displays items 1 to 50. Click "Next".
  2. Verify Page 2 displays items 51 to 100. Click "Next".
  3. Verify Page 3 displays items 101 to 129. "Next" button disabled.
  4. Click "Previous" to return to Page 2, then Page 1. "Previous" disabled on Page 1.
- **Expected Result**: Navigation smooth; page indicators update accurately; boundary buttons disable appropriately at start and end.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: None.

---

### TC-ADM-MEM-003: Ascending Numeric Sorting by Var/Vadhu Sequence ID
- **Module/Feature**: Admin Dashboard / Sorting Logic
- **Test Scenario**: Verify member list is sorted numerically by Var/Vadhu ID (1, 2, 3... 10, 11) rather than string sorting ("1", "10", "11", "2").
- **Preconditions**: Profiles with IDs `VAR-2`, `VAR-10`, `VAR-1`, `VAR-20` exist.
- **Test Data**: Mixed sequence Var/Vadhu IDs.
- **Step-by-step Test Steps**:
  1. Open All Member Profiles tab.
  2. Inspect sequential order of profile IDs on Page 1.
- **Expected Result**: Order is strictly numeric ascending: `VAR-1`, `VAR-2`, `VAR-3` ... `VAR-10`, `VAR-11` ... `VAR-50`.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Avoids alphabetical sorting traps where 10 precedes 2.
- **Firestore Verification**: Custom numeric extractor used during sorting.

---

### TC-ADM-MEM-004: [REGRESSION] Selected Member Profile UID Binding (`q4A5gbNCrOZnKYVp6KF5VHD5EE93`)
- **Module/Feature**: Admin Dashboard / Stale Selection Regression
- **Test Scenario**: Verify clicking on member `q4A5gbNCrOZnKYVp6KF5VHD5EE93` opens modal/view displaying that exact member's UID and data, rather than a previously cached UID.
- **Preconditions**: Member `q4A5gbNCrOZnKYVp6KF5VHD5EE93` exists in Firestore.
- **Test Data**: Target UID: `q4A5gbNCrOZnKYVp6KF5VHD5EE93`.
- **Step-by-step Test Steps**:
  1. Open All Member Profiles tab.
  2. Locate member `q4A5gbNCrOZnKYVp6KF5VHD5EE93`.
  3. Click "View Details" / "Manage Profile".
- **Expected Result**: Detail view header and fields display profile data for `q4A5gbNCrOZnKYVp6KF5VHD5EE93`. No state leakage from prior selected cards.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Regression test for stale state bug when opening member details.
- **Firestore Verification**: Modal fetches `profiles/q4A5gbNCrOZnKYVp6KF5VHD5EE93`.

---

## Module 7: Admin Account Exclusion

### TC-ADM-EXCL-001: Exclude Admin Accounts from Search Results
- **Module/Feature**: Admin Exclusion / Search
- **Test Scenario**: Perform general search and verify admin accounts (e.g. `pawarakash0127@gmail.com`) never appear in candidate search cards.
- **Preconditions**: Admin account exists in `users` collection with `role: "admin"` or `isAdmin: true`.
- **Test Data**: Admin Email: `pawarakash0127@gmail.com`.
- **Step-by-step Test Steps**:
  1. Navigate to `/search`.
  2. Execute search with no filters (all candidates).
  3. Inspect returned search results list.
- **Expected Result**: Zero admin accounts present in results. Only genuine candidate profiles rendered.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Core business constraint: Admins are staff, not matrimonial candidates.
- **Firestore Verification**: Query filters out `role == "admin"` or `isAdmin == true`.

---

### TC-ADM-EXCL-002: Exclude Admin Accounts from Featured Profiles Carousel
- **Module/Feature**: Admin Exclusion / Featured Profiles
- **Test Scenario**: Verify admin accounts are never selected for Home Page Featured Profiles rotation.
- **Preconditions**: Featured profiles active on Home Page.
- **Test Data**: N/A.
- **Step-by-step Test Steps**:
  1. Observe Home Page Featured Profiles carousel over multiple 10-second rotation cycles.
  2. Inspect candidate IDs in carousel.
- **Expected Result**: Admin account UIDs never appear in carousel rotation.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Eligibility filter excludes admin profiles.

---

### TC-ADM-EXCL-003: Exclude Admin Accounts from My Matches Engine
- **Module/Feature**: Admin Exclusion / Matrimonial Matches
- **Test Scenario**: Verify logged-in user never receives admin profiles in My Matches recommendations.
- **Preconditions**: Logged-in user viewing `/matches`.
- **Test Data**: User UID: `QA_TEST_EMAIL_001@example.com`.
- **Step-by-step Test Steps**:
  1. Navigate to `/matches`.
  2. Review matches list.
- **Expected Result**: Admin accounts excluded from match calculations and listing.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Match algorithm filters out `isAdmin == true`.

---

### TC-ADM-EXCL-004: Exclude Admin Accounts from Total Public Candidate Counts
- **Module/Feature**: Admin Exclusion / Metrics
- **Test Scenario**: Verify Home Page "Registered Brides & Grooms" stats metrics exclude admin accounts.
- **Preconditions**: N/A.
- **Test Data**: Total users = 130 (128 candidates + 2 admins).
- **Step-by-step Test Steps**:
  1. Check public candidate counters on Home Page and Search header.
- **Expected Result**: Counter displays 128 (excluding the 2 admins).
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Medium
- **Severity**: Minor
- **Notes**: None.
- **Firestore Verification**: Count aggregation queries filter by `role != "admin"`.

---

## Module 8: Featured Profiles Carousel & Timer Logic

### TC-FEAT-001: [REGRESSION] Simultaneous 3-Profile Replacement Every 10 Seconds
- **Module/Feature**: Featured Profiles / Rotation Logic
- **Test Scenario**: Verify that every 10 seconds, **all 3 featured profiles change simultaneously** rather than updating only 1 profile card.
- **Preconditions**: At least 6 eligible candidate profiles exist in Firestore.
- **Test Data**: 6+ approved candidates.
- **Step-by-step Test Steps**:
  1. Open Home Page `/` in browser.
  2. Observe the 3 rendered Featured Profile cards at T = 0s. Record UIDs: `[P1, P2, P3]`.
  3. Wait 10 seconds until transition triggers at T = 10s.
  4. Inspect the 3 new Featured Profile cards: `[P4, P5, P6]`.
- **Expected Result**: **ALL 3 profiles update simultaneously** to a fresh set `[P4, P5, P6]`. Zero partial updates (e.g. only 1 card swapping while 2 remain stagnant).
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Regression test for reported issue where only 1 profile updated per cycle.
- **Firestore Verification**: Rotation state manager updates full array batch `[idx1, idx2, idx3]`.

---

### TC-FEAT-002: Prevention of Duplicate Profiles Within Same Featured Set
- **Module/Feature**: Featured Profiles / Uniqueness
- **Test Scenario**: Verify no duplicate profile appears twice in the same 3-card set.
- **Preconditions**: Home Page loaded.
- **Test Data**: N/A.
- **Step-by-step Test Steps**:
  1. Observe featured set `[Card1, Card2, Card3]`.
  2. Compare profile IDs across all 3 cards.
- **Expected Result**: All 3 profile IDs are distinct (`Card1.id != Card2.id != Card3.id`).
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Unique index algorithm check.
- **Firestore Verification**: None.

---

### TC-FEAT-003: Exhaustive Cycle Rotation Before Repeating Profiles
- **Module/Feature**: Featured Profiles / Rotation Cycle
- **Test Scenario**: Verify featured rotation cycles through all eligible profiles before repeating previously displayed candidates.
- **Preconditions**: 9 eligible candidate profiles exist.
- **Test Data**: 9 profiles (`P1` through `P9`).
- **Step-by-step Test Steps**:
  1. Cycle 1 (T=0s): Displays `[P1, P2, P3]`.
  2. Cycle 2 (T=10s): Displays `[P4, P5, P6]`.
  3. Cycle 3 (T=20s): Displays `[P7, P8, P9]`.
  4. Cycle 4 (T=30s): Repeats `[P1, P2, P3]`.
- **Expected Result**: Profiles do not repeat until all 9 candidates have been featured once.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Tests index offset calculation.
- **Firestore Verification**: None.

---

### TC-FEAT-004: Timer Cleanup On Component Unmount / Page Navigation
- **Module/Feature**: Featured Profiles / Memory Management
- **Test Scenario**: Verify `setInterval` timer is cleared cleanly when navigating away from Home Page to prevent memory leaks and background CPU cycles.
- **Preconditions**: Home Page open.
- **Test Data**: N/A.
- **Step-by-step Test Steps**:
  1. Open Home Page `/`.
  2. Navigate to `/search` or `/login`.
  3. Inspect console logs / React Profiler timer threads.
- **Expected Result**: Timer interval cancelled via `clearInterval(timerRef.current)` in `useEffect` cleanup return function. No background state updates on unmounted component.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Prevents React state update on unmounted component warnings.
- **Firestore Verification**: None.

---

### TC-FEAT-005: Handling Fewer Than 3 Eligible Profiles
- **Module/Feature**: Featured Profiles / Graceful Degradation
- **Test Scenario**: Verify behavior when total eligible candidates in system is less than 3 (e.g., 2 profiles).
- **Preconditions**: Database seeded with only 2 approved candidates.
- **Test Data**: 2 candidate profiles.
- **Step-by-step Test Steps**:
  1. Open Home Page.
- **Expected Result**: Renders available 2 profiles without throwing array out-of-bounds errors or blank cards.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Medium
- **Severity**: Minor
- **Notes**: Edge case protection.
- **Firestore Verification**: Array slice handles length < 3 safely.

---

## Module 9: Search Profiles & Filtering

### TC-SEARCH-001: Search Functionality for Logged-Out Guest Users
- **Module/Feature**: Search / Guest Access
- **Test Scenario**: Execute search as unauthenticated guest and verify candidate cards render with appropriate privacy protection.
- **Preconditions**: User logged out.
- **Test Data**: Search route `/search`.
- **Step-by-step Test Steps**:
  1. Navigate to `/search`.
  2. Select Age Filter: 22 to 28.
  3. Click "Search Profiles".
- **Expected Result**: Matching approved candidate profiles rendered. Sensitive contact numbers masked with "Login to View Contact" prompt.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Guest privacy requirement.
- **Firestore Verification**: Public query retrieves approved candidates.

---

### TC-SEARCH-002: Individual Filter Execution - Education Filter
- **Module/Feature**: Search / Filtering
- **Test Scenario**: Filter search candidates by specific Education Category (e.g. "Engineering / IT").
- **Preconditions**: Approved profiles with various education backgrounds exist.
- **Test Data**: Education Filter: `Engineering / IT`.
- **Step-by-step Test Steps**:
  1. On `/search`, select Education Category = `Engineering / IT`.
  2. Click Search.
- **Expected Result**: Every rendered candidate profile possesses an education category matching `Engineering / IT`.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Query filters by `educationCategory == "Engineering / IT"`.

---

### TC-SEARCH-003: Combined Multi-Filter Execution (Age + Marital Status + Location)
- **Module/Feature**: Search / Complex Filtering
- **Test Scenario**: Apply age range, marital status, and location filters simultaneously.
- **Preconditions**: Multiple profiles loaded.
- **Test Data**: Age: `24-30`, Marital Status: `Unmarried`, Location: `Nashik`.
- **Step-by-step Test Steps**:
  1. Set Age: 24 to 30.
  2. Set Marital Status: `Unmarried`.
  3. Set Location: `Nashik`.
  4. Execute search.
- **Expected Result**: Results strictly satisfy all three criteria. If no candidates match all criteria, "No profiles found matching your search criteria" empty state rendered.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Tests multi-clause filtering logic.
- **Firestore Verification**: Client/server multi-filter execution.

---

## Module 10: My Matches & Real-Time Sync

### TC-MATCH-001: My Matches Access Block for Logged-Out Users
- **Module/Feature**: My Matches / Auth Access
- **Test Scenario**: Attempt opening `/matches` while unauthenticated.
- **Preconditions**: User logged out.
- **Test Data**: Target route `/matches`.
- **Step-by-step Test Steps**:
  1. Navigate directly to `/matches`.
- **Expected Result**: Access blocked; redirected to `/login` with notification modal "Please sign in to view your matrimonial matches."
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: None.

---

### TC-MATCH-002: Real-Time Zero Match Users Sync in Admin Dashboard
- **Module/Feature**: My Matches / Admin Real-Time Sync
- **Test Scenario**: Verify user with 0 matches dynamically populates in **Admin Dashboard -> Zero Matches Tab** in real time.
- **Preconditions**: Admin viewing **Admin Dashboard -> Zero Matches Tab**. User with strict non-matching preferences logs in.
- **Test Data**: User UID: `QA_TEST_ZEROMATCH@example.com`.
- **Step-by-step Test Steps**:
  1. Admin opens `/admin` -> Zero Matches tab.
  2. In separate browser, `QA_TEST_ZEROMATCH@example.com` updates partner preferences to hyper-restrictive criteria resulting in 0 matches.
  3. Observe Admin Dashboard.
- **Expected Result**: User appears dynamically in Admin's Zero Matches list without requiring manual page refresh.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Tests real-time zero match listener.
- **Firestore Verification**: Document state synced via real-time listener.

---

## Module 11: 30-Day Profile Deletion Flow

### TC-DEL-001: Self-Service Profile Deletion Request Initiation
- **Module/Feature**: Profile Deletion / Request
- **Test Scenario**: Initiate 30-day profile deletion request from Profile Settings menu.
- **Preconditions**: User logged in as `QA_TEST_DELETION@example.com`.
- **Test Data**: User UID: `QA_TEST_DELETION@example.com`.
- **Step-by-step Test Steps**:
  1. Navigate to `/profile` -> Settings.
  2. Click "Request Account Deletion".
  3. Confirm warning prompt in deletion modal.
- **Expected Result**: Deletion timestamp stored in Firestore (`deletionRequestedAt: ISOString`, `scheduledDeletionDate: ISOString + 30 days`). Banner displayed: "Your account is scheduled for permanent deletion in 30 days."
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Non-destructive initial phase.
- **Firestore Verification**: `profiles/{uid}.deletionRequestedAt` populated.

---

### TC-DEL-002: Admin Dashboard Deletion Requests Listing and Countdown Calculation
- **Module/Feature**: Profile Deletion / Admin Visibility
- **Test Scenario**: Verify pending deletion requests appear in **Admin Dashboard -> Deletion Requests** with accurate remaining days counter.
- **Preconditions**: Account deletion requested in TC-DEL-001.
- **Test Data**: Target UID: `QA_TEST_DELETION@example.com`.
- **Step-by-step Test Steps**:
  1. Open **Admin Dashboard -> Deletion Requests**.
  2. Locate `QA_TEST_DELETION@example.com`.
  3. Inspect remaining days indicator.
- **Expected Result**: Request displayed with "30 Days Remaining" badge (or exact difference between current date and scheduled date).
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Remaining days = `Math.ceil((scheduledDate - currentDate) / (1000 * 3600 * 24))`.

---

### TC-DEL-003: Self-Service Deletion Cancellation
- **Module/Feature**: Profile Deletion / Cancellation
- **Test Scenario**: User cancels pending deletion request prior to 30-day expiry.
- **Preconditions**: Account in pending deletion state.
- **Test Data**: User UID: `QA_TEST_DELETION@example.com`.
- **Step-by-step Test Steps**:
  1. Log in as `QA_TEST_DELETION@example.com`.
  2. On banner prompt, click "Cancel Deletion Request".
- **Expected Result**: Deletion flags (`deletionRequestedAt`, `scheduledDeletionDate`) removed from Firestore; deletion banner cleared; profile fully restored.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Restoration verification.
- **Firestore Verification**: Deletion fields deleted/set to `null` in Firestore document.

---

## Module 12: Feedback & Member Reviews Submission

### TC-REV-SUB-001: Valid Feedback Submission with 5-Star Rating
- **Module/Feature**: Feedback / Submission
- **Test Scenario**: Submit feedback with name, phone, email, 5-star rating, and review text from Contact Us page.
- **Preconditions**: On `/contact` -> "Submit Feedback & Review" tab.
- **Test Data**: Name: `Ramesh Teli`, Phone: `9822334455`, Email: `ramesh@example.com`, Rating: `5`, Review: "Excellent platform! Very helpful for Nashik Teli Samaj families."
- **Step-by-step Test Steps**:
  1. Navigate to `/contact`. Click "Submit Feedback & Review" tab.
  2. Select 5 stars.
  3. Fill Name, Phone, Email, Review Text.
  4. Click "Submit Review".
- **Expected Result**: Review submitted successfully; success toast displayed: "Thank you for your feedback!"; form fields cleared.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Core feedback pipeline.
- **Firestore Verification**: Document added to `reviews` collection with `status: "pending"`, `showOnHome: false`, `rating: 5`, `reviewText`, `createdAt`. Document also added to `admin_notifications` and `contactQueries`.

---

### TC-REV-SUB-002: Guest Visitor Feedback Submission
- **Module/Feature**: Feedback / Unauthenticated Submission
- **Test Scenario**: Submit feedback as unauthenticated guest user.
- **Preconditions**: User logged out.
- **Test Data**: Name: `Sunil Teli`, Phone: `9876501234`, Rating: `4`, Review: "Very easy to use portal."
- **Step-by-step Test Steps**:
  1. On `/contact`, submit feedback form as guest.
- **Expected Result**: Guest feedback accepted and saved to Firestore with `uid: null`.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Guest submission check.
- **Firestore Verification**: `reviews` document created with `uid: null`.

---

### TC-REV-SUB-003: Reject Feedback Submission with Missing Mandatory Fields
- **Module/Feature**: Feedback / Form Validation
- **Test Scenario**: Attempt submitting feedback without review text or phone number.
- **Preconditions**: On `/contact` feedback tab.
- **Test Data**: Name: `Ramesh`, Review: `""` (empty).
- **Step-by-step Test Steps**:
  1. Fill Name `Ramesh`. Leave Review Text empty.
  2. Click Submit.
- **Expected Result**: Validation error displayed: "Please enter your review or feedback." Form submission blocked.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Medium
- **Severity**: Minor
- **Notes**: None.
- **Firestore Verification**: No document created in Firestore.

---

## Module 13: Admin Feedback Management & Home Show/Hide Control

### TC-REV-ADM-001: Real-Time Feedback Arrival in Admin Notifications & Queries
- **Module/Feature**: Admin Feedback / Real-Time Arrival
- **Test Scenario**: Verify newly submitted user feedback appears immediately in **Admin Dashboard -> Admin Notifications & Queries** under "Feedback & Reviews Submissions".
- **Preconditions**: Admin viewing `/admin` -> Admin Notifications & Queries tab.
- **Test Data**: User submits feedback "Great community initiative".
- **Step-by-step Test Steps**:
  1. Keep Admin Dashboard open on Notifications tab.
  2. Submit feedback in separate window.
- **Expected Result**: Feedback item appears instantly in Admin list stream without requiring manual page refresh.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Real-time admin feedback inspection.
- **Firestore Verification**: `admin_notifications` and `reviews` real-time listeners trigger component state update.

---

### TC-REV-ADM-002: Admin Show on Home Page Toggle ON Behavior
- **Module/Feature**: Admin Feedback / Show Toggle
- **Test Scenario**: Admin checks `☑ Show on Home Page` checkbox for a submitted review.
- **Preconditions**: Pending review exists in Admin Dashboard.
- **Test Data**: Target Review ID: `[review_id_001]`.
- **Step-by-step Test Steps**:
  1. Locate review in Admin Dashboard.
  2. Click `☑ Show on Home Page` checkbox to enable (ON).
- **Expected Result**: Firestore document updated immediately to `showOnHome: true`, `status: "approved"`. Toast notification displayed: "Review enabled for Home Page!".
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Admin show/hide toggle.
- **Firestore Verification**: `reviews/{review_id}.showOnHome == true`.

---

### TC-REV-ADM-003: Admin Show on Home Page Toggle OFF Non-Destructive Behavior
- **Module/Feature**: Admin Feedback / Hide Toggle
- **Test Scenario**: Admin unchecks `☐ Show on Home Page` checkbox for a previously featured review.
- **Preconditions**: Review currently has `showOnHome: true`.
- **Test Data**: Target Review ID: `[review_id_001]`.
- **Step-by-step Test Steps**:
  1. Uncheck `Show on Home Page` checkbox (OFF).
- **Expected Result**: Firestore document updated to `showOnHome: false`. Review removed from Home Page display, but **safely preserved in Firestore database** and Admin Dashboard list.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Non-destructive toggle verification.
- **Firestore Verification**: Document remains intact in `reviews` collection with `showOnHome: false`.

---

## Module 14: Home Page Community Reviews

### TC-REV-HOME-001: Community Reviews Placement Directly Below "Why Choose Us?" Section
- **Module/Feature**: Home Page / Layout Position
- **Test Scenario**: Verify the DOM order of "What Our Community Members Say" section on `/`.
- **Preconditions**: Home Page loaded.
- **Test Data**: Route `/`.
- **Step-by-step Test Steps**:
  1. Open `/`.
  2. Inspect page layout structure from top to bottom.
- **Expected Result**: Order is strictly:
  1. Hero Banner / Search
  2. **Why Choose Us?**
  3. **What Our Community Members Say** (Community Reviews Section)
  4. Community News / Next Home Section.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Structural positioning requirement.
- **Firestore Verification**: None.

---

### TC-REV-HOME-002: Dynamic Display of Approved/Enabled Reviews Only
- **Module/Feature**: Home Page / Review Filtering
- **Test Scenario**: Verify Home Page displays ONLY reviews where `showOnHome == true` and `status == "approved"`.
- **Preconditions**: 3 reviews exist: Review A (`showOnHome: true`), Review B (`showOnHome: false`), Review C (`status: "pending"`).
- **Test Data**: Reviews A, B, C.
- **Step-by-step Test Steps**:
  1. Load Home Page.
  2. Inspect rendered cards in "What Our Community Members Say".
- **Expected Result**: Only Review A is displayed. Review B and Review C are hidden from public display.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Major
- **Notes**: Privacy and moderation guard.
- **Firestore Verification**: `onSnapshot` query filters by `showOnHome == true`.

---

### TC-REV-HOME-003: Privacy Shielding of Member Phone & Email on Public Reviews
- **Module/Feature**: Home Page / Privacy Shielding
- **Test Scenario**: Inspect rendered review cards on Home Page to ensure phone numbers and email addresses are never publicly exposed.
- **Preconditions**: Featured review has email `ramesh@example.com` and phone `9822334455` stored in Firestore.
- **Test Data**: Featured review document.
- **Step-by-step Test Steps**:
  1. Inspect HTML source and DOM text of Home Page review cards.
- **Expected Result**: Card renders Name, Star Rating, Review Text, "Verified Community Member" badge, and Date. Phone number and Email address are **completely absent from DOM**.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Privacy compliance guard.
- **Firestore Verification**: Client rendering code omits `rev.phone` and `rev.email` in public Home component.

---

## Module 15: Contact Us Form

### TC-CONTACT-001: Valid Contact Form Message Submission
- **Module/Feature**: Contact Us / Submission
- **Test Scenario**: Submit inquiry message with Name, Phone, Email, Subject, and Message text.
- **Preconditions**: On `/contact`.
- **Test Data**: Name: `Vijay Teli`, Phone: `9811223344`, Email: `vijay@example.com`, Subject: `Registration Help`, Message: `Need assistance with photo upload.`
- **Step-by-step Test Steps**:
  1. Fill Contact form.
  2. Click "Send Message".
- **Expected Result**: Inquiry submitted; success alert displayed; message stored in Firestore `contactQueries`; notification emitted to Admin.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: `contactQueries` document created with `status: "new"`.

---

## Module 16: Security & Access Control

### TC-SEC-001: Prevent Unauthorized Profile Modification Across Users
- **Module/Feature**: Security / Authorization Rules
- **Test Scenario**: Authenticated User A attempts writing/updating profile document belonging to User B (`profiles/UserB_UID`).
- **Preconditions**: Logged in as User A (`request.auth.uid == "UserA"`).
- **Test Data**: Target document `profiles/UserB_UID`.
- **Step-by-step Test Steps**:
  1. Execute updateDoc script targeting `profiles/UserB_UID` while authenticated as User A.
- **Expected Result**: Operation rejected by Firestore Security Rules with error: `Missing or insufficient permissions`.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Security rule rule check: `allow update: if request.auth.uid == userId || isAdmin();`.
- **Firestore Verification**: Write blocked at database engine level.

---

### TC-SEC-002: Prevent Non-Admin Modifying `showOnHome` or Approval Status
- **Module/Feature**: Security / Privilege Escalation
- **Test Scenario**: Non-admin user attempts updating `approved: true` or `showOnHome: true` on their own profile or review document.
- **Preconditions**: Logged in as regular member.
- **Test Data**: Review document `reviews/{reviewId}`.
- **Step-by-step Test Steps**:
  1. Attempt client write modifying `showOnHome` field directly on a review document.
- **Expected Result**: Operation blocked by Firestore Security Rules.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: Critical
- **Severity**: Blocker
- **Notes**: Protects against client-side parameter tampering.
- **Firestore Verification**: Security rules restrict administrative field modifications to `isAdmin()`.

---

## Module 17: Real-Time Sync & Multi-Session Listening

### TC-RTIME-001: Two-Browser Multi-Session Live Admin Approval Verification
- **Module/Feature**: Real-Time Sync / Cross-Session
- **Test Scenario**: Perform profile approval in Browser B (Admin) and verify immediate UI update in Browser A (User) without page refresh.
- **Preconditions**: Browser A logged in as candidate; Browser B logged in as Admin.
- **Test Data**: Candidate UID: `QA_TEST_PENDING@example.com`.
- **Step-by-step Test Steps**:
  1. Browser A: Open `/profile`. Note "Pending Admin Approval" banner.
  2. Browser B: Open `/admin` -> Pending Approvals. Click "Approve Profile".
  3. Observe Browser A without touching keyboard/mouse.
- **Expected Result**: Browser A UI updates live via `onSnapshot` listener; "Pending Approval" banner replaced by "Profile Verified & Active" badge within 1 second.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Tests real-time reactive architecture.
- **Firestore Verification**: Real-time snapshot emission.

---

## Module 18: Performance, Scale & Memory Leak Testing

### TC-PERF-001: Admin Pagination Memory & DOM Overhead with 100+ Profiles
- **Module/Feature**: Performance / Large Dataset
- **Test Scenario**: Measure memory footprint and initial render time of Admin Dashboard when collection contains 100+ member profiles.
- **Preconditions**: Database populated with 100+ profiles.
- **Test Data**: 100+ profile documents.
- **Step-by-step Test Steps**:
  1. Open Chrome DevTools Performance & Memory panel.
  2. Load **Admin Dashboard -> All Member Profiles**.
  3. Measure DOM node count and JS Heap size.
- **Expected Result**: DOM node count remains low (< 1,500 nodes) due to 50-item pagination chunking; JS Heap usage increases by < 15MB; render time < 300ms.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Ensures UI remains responsive as membership scales.
- **Firestore Verification**: Firestore reads bounded by page size `limit(50)`.

---

## Module 19: Responsive Design & Layout

### TC-RESP-001: Mobile Layout Verification (375px - iPhone SE / Android)
- **Module/Feature**: Responsive / Mobile
- **Test Scenario**: Verify key user workflows (Home, Profile, Search, Matches, Login) on 375px mobile viewport.
- **Preconditions**: Viewport set to 375px x 667px.
- **Test Data**: N/A.
- **Step-by-step Test Steps**:
  1. Open Chrome DevTools Device Mode -> iPhone SE (375px width).
  2. Test hamburger menu, form controls, profile card stacks, and admin table responsiveness.
- **Expected Result**: Mobile navigation drawer operates cleanly; zero horizontal overflow/scrollbar; touch targets >= 44px; text labels fit on single lines.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: Mobile-first design compliance.
- **Firestore Verification**: None.

---

## Module 20: Cross-Browser Compatibility

### TC-BROWSER-001: Full Workflow Verification on Desktop Chrome & Firefox
- **Module/Feature**: Browser Compatibility / Modern Browsers
- **Test Scenario**: Execute registration, search, and admin controls across Chrome v120+ and Firefox v120+.
- **Preconditions**: Tested on Chrome and Firefox.
- **Test Data**: N/A.
- **Step-by-step Test Steps**:
  1. Execute core test suite on Chrome.
  2. Execute core test suite on Firefox.
- **Expected Result**: Zero browser-specific rendering bugs or CSS grid breakdown.
- **Actual Result**: Pending execution.
- **Status**: `NOT TESTED`
- **Priority**: High
- **Severity**: Major
- **Notes**: None.
- **Firestore Verification**: Cross-browser parity.

---

## Module 21: Complete Regression Test Suite

| Test Case ID | Regression Scenario Description | Target Module | Severity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-REG-001** | Featured Profiles carousel only updating 1 profile instead of all 3 | Featured Profiles | Major | `NOT TESTED` |
| **TC-REG-002** | Featured Profiles repeating candidate cards before exhausting pool | Featured Profiles | Major | `NOT TESTED` |
| **TC-REG-003** | New candidate registration missing from Admin Pending Approvals list | Admin Approvals | Blocker | `NOT TESTED` |
| **TC-REG-004** | Admin profile status approval click failing to update Firestore document | Admin Approvals | Blocker | `NOT TESTED` |
| **TC-REG-005** | Phone registration user missing `var/vadhuId` (`aJ0gRR0saRPG1KcK6a1EdBIwQi22`) | Data Integrity | Major | `NOT TESTED` |
| **TC-REG-006** | Schema discrepancy between Phone and Email registration outputs | Data Integrity | Major | `NOT TESTED` |
| **TC-REG-007** | Stale UID displayed when opening member profile (`q4A5gbNCrOZnKYVp6KF5VHD5EE93`) | Admin Dashboard | Major | `NOT TESTED` |
| **TC-REG-008** | Admin account appearing in candidate Search & Matrimonial Matches | Admin Exclusion | Critical | `NOT TESTED` |
| **TC-REG-009** | Admin member list displaying > 50 items and causing browser slowdown | Pagination | Major | `NOT TESTED` |
| **TC-REG-010** | Var/Vadhu ID sorting alphabetically ("1", "10", "2") instead of numerically | Sorting | Major | `NOT TESTED` |
| **TC-REG-011** | User feedback missing from Admin Notifications & Queries stream | Feedback | Major | `NOT TESTED` |
| **TC-REG-012** | Admin unable to toggle review visibility (`showOnHome`) on Home Page | Feedback Control | Major | `NOT TESTED` |
| **TC-REG-013** | Community Reviews section rendered in incorrect position on Home Page | Home Page Layout | Major | `NOT TESTED` |
| **TC-REG-014** | Registered phone `+91 8149909817` returning "No account found" in Forgot Password | Forgot Password | Blocker | `NOT TESTED` |
| **TC-REG-015** | Users with 0 matches failing to sync in real time on Admin Dashboard | Real-Time Sync | Major | `NOT TESTED` |
| **TC-REG-016** | Real-time registration notification card failing to arrive in Admin Dashboard | Real-Time Sync | Major | `NOT TESTED` |

---

## 24. Automated Test Recommendations

Based on the project's technology stack (**React 18 + Vite + TypeScript + Firebase Firestore**), here is the recommended automated testing architecture:

### 1. Component & Unit Testing (Vitest + React Testing Library)
- **Framework**: Vitest (natively compatible with Vite configuration).
- **Scope**:
  - `phoneUtils.ts` (`validateAndFormatPhone`, `findAccountByPhone`).
  - `profileIdUtils.ts` (`getOrAssignProfileId`, numeric ID extraction).
  - Parent Name Validation Rule logic (Father vs. Mother mandatory rules).
  - Profile completeness metric calculator.

### 2. Database & Security Rules Testing (Firebase Rules Unit Testing Framework + Firestore Emulator)
- **Framework**: `@firebase/rules-unit-testing`.
- **Scope**:
  - Validate that regular users cannot modify another user's profile (`profiles/{otherUid}`).
  - Validate that non-admin users cannot write to `admin_notifications` or set `showOnHome: true` on `reviews`.
  - Validate public read permissions for approved profiles and enabled reviews.

### 3. End-to-End Browser Testing (Playwright)
- **Framework**: Playwright.
- **Scope**:
  - Full registration -> Pending Approval -> Admin Approval -> Profile Search activation E2E pipeline.
  - Multi-browser session testing (User Browser + Admin Browser) verifying real-time Firestore synchronization.
  - Featured Profiles 10-second simultaneous 3-card carousel transition.

---

## 25. Test Data Strategy

To maintain data cleanliness and prevent accidental modification of production candidate data:
1. **Isolated Testing Identifiers**: All automated and manual test accounts must use the prefixes `QA_TEST_EMAIL_` (for email auth) and `+9198765432XX` (for phone auth).
2. **Dedicated Test Database**: Execute destructive tests (such as account deletion, status rejection) on a Firebase Staging/Emulator project (`ai-studio-staging`).
3. **Automated Cleanup Hooks**: Implement `afterAll` teardown routines in test runners to delete documents matching `QA_TEST_*` across `users`, `profiles`, `reviews`, `admin_notifications`, and `contactQueries`.

---

## 26. Test Case Summary Table

| Severity / Priority Level | Total Defined Cases | NOT TESTED | PASS | FAIL | BLOCKED |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Critical / Blocker** | 32 | 32 | 0 | 0 | 0 |
| **High / Major** | 48 | 48 | 0 | 0 | 0 |
| **Medium / Minor** | 18 | 18 | 0 | 0 | 0 |
| **Low / Trivial** | 6 | 6 | 0 | 0 | 0 |
| **TOTAL TEST CASES** | **104** | **104** | **0** | **0** | **0** |

---

## 27. Missing/Required Functionality Discovered During QA Review

During the QA code architecture review, the following missing or required functional enhancements were identified:

1. **Explicit Session Timeout & Re-Authentication for Admin Operations**:
   - **Missing**: Admin Dashboard stays unlocked as long as Firebase auth token is valid without prompting for password re-verification on sensitive operations (such as permanently deleting profiles or updating roles).
   - **Recommendation**: Implement `reauthenticateWithCredential` prompt before executing destructive admin actions.
   - **Priority**: High.

2. **Automated Email / SMS Notification Dispatch on Profile Approval**:
   - **Missing**: When an admin approves a pending profile in the Admin Dashboard, a Firestore notification is created, but no external SMS/Email gateway trigger is fired to notify the user on their phone.
   - **Recommendation**: Integrate Firebase Cloud Functions / Twilio trigger on `profiles/{uid}` update where `approved` transitions from `false` to `true`.
   - **Priority**: Medium.

3. **CSV / Excel Export for Admin Member Directory**:
   - **Missing**: Admin Dashboard lacks an export utility to download filtered member lists for offline record keeping at community events.
   - **Recommendation**: Add a "Export Filtered Members to CSV" button in **Admin Dashboard -> All Member Profiles**.
   - **Priority**: Low.

---
*End of QA_TEST_CASES.md*
