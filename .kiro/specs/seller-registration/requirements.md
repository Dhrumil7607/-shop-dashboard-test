# Requirements Document

## Introduction

This document specifies the Seller Registration & Admin Integration feature for the ShopLive Bharat platform. The feature adds a self-service "Become a Seller" public registration flow, an admin-facing Seller Applications review queue, and an automated post-approval provisioning workflow — all integrated seamlessly into the existing React 19 / FastAPI / MongoDB stack without disrupting any current functionality.

The feature supports two paths to seller creation:
1. **Admin-manual creation** — existing flow, kept intact and improved.
2. **Public self-registration** — multi-step wizard (7 steps) submitted by prospective sellers, reviewed by admins, and automatically provisioned on approval.

## Glossary

- **Applicant**: A user (logged-in or guest) who fills in the seller registration wizard and submits an application.
- **Application**: A seller_applications record capturing business details, store information, verification documents, bank details, shipping preferences, product categories, and current status.
- **Application_Status**: One of `draft`, `pending_review`, `needs_changes`, `approved`, `rejected`, `suspended`.
- **Seller**: A user with the `seller` role whose store has been provisioned in the shops collection.
- **Admin**: A platform operator authenticated via the existing X-Admin-Key mechanism.
- **Registration_Wizard**: The 7-step public front-end form located at `/become-a-seller`.
- **Application_Review_Panel**: The admin sub-section at `/admin/seller-applications` exposing pending, approved, rejected, needs-changes, and draft views.
- **Seller_Dashboard**: The existing seller dashboard already present in the platform — no new dashboard is created.
- **Store**: An entry in the existing `shops` collection provisioned automatically on approval.
- **Store_Slug**: A URL-safe identifier derived from the store name and guaranteed unique within the `shops` collection.
- **GST_Number**: Indian Goods and Services Tax registration number; format `[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}`.
- **PAN_Number**: Indian Permanent Account Number; format `[A-Z]{5}[0-9]{4}[A-Z]{1}`.
- **Notification**: An in-platform alert persisted to the notifications collection and optionally delivered by email.
- **Activity_Log**: An immutable record written to `application_history` capturing every status transition.

---

## Requirements

### Requirement 1: Public Registration Entry Points

**User Story:** As a prospective seller, I want to discover the "Become a Seller" path from multiple locations on the site, so that I can start my application without searching for it.

#### Acceptance Criteria

1. THE Registration_Wizard entry link SHALL be present in the MarketplaceLayout desktop navigation bar between the "Partner Stores" link and the free-shipping notice.
2. THE Registration_Wizard entry link SHALL be present in the MarketplaceLayout mobile menu, rendered after the "Contact" link.
3. THE Registration_Wizard entry link SHALL be present in the Footer component under an existing or new "Sell" section, linking to `/become-a-seller`.
4. THE Registration_Wizard entry link SHALL be present on the Marketplace page (`/marketplace`) as a call-to-action banner or section visible without scrolling past the hero area.
5. THE Registration_Wizard entry link SHALL be present on the Partner Stores page (`/partner-stores`) as a call-to-action section.
6. WHEN a logged-in customer views the account dropdown in the MarketplaceLayout header, THE Registration_Wizard entry link SHALL appear as "Become a Seller" below the "My Orders" link.
7. WHERE the platform renders the "Become a Seller" link, THE link SHALL navigate to `/become-a-seller`.

---

### Requirement 2: Multi-Step Registration Wizard

**User Story:** As a prospective seller, I want a guided multi-step form to submit my business and store details, so that the onboarding process is clear and I can save progress between sessions.

#### Acceptance Criteria

1. THE Registration_Wizard SHALL consist of exactly 7 sequential steps: Business Details, Store Information, Verification Documents, Bank Details, Shipping Preferences, Product Categories, and Review & Submit.
2. THE Registration_Wizard SHALL be accessible at the route `/become-a-seller` and loaded as a lazy-imported module to keep the initial bundle size unchanged.
3. WHEN an Applicant completes a step and clicks "Next", THE Registration_Wizard SHALL validate all required fields in the current step before advancing; IF validation fails, THEN THE Registration_Wizard SHALL display inline field-level error messages and SHALL NOT advance to the next step.
4. THE Registration_Wizard SHALL persist the in-progress Application as a `draft` record in `localStorage` after each step so that a page refresh does not lose data.
5. WHEN an Applicant reaches the Review & Submit step, THE Registration_Wizard SHALL display a summary of all collected data with an option to navigate back to any step for corrections.
6. WHEN an Applicant submits the application, THE Registration_Wizard SHALL POST the application payload to `POST /api/seller-applications`, receive an application ID, and display an Application Status page confirming receipt with the application ID.
7. IF the submitted GST_Number already exists in `seller_applications` or `shops`, THEN THE Registration_Wizard SHALL display a duplicate-registration error and SHALL NOT create a new Application.
8. IF the submitted PAN_Number already exists in `seller_applications` or `shops`, THEN THE Registration_Wizard SHALL display a duplicate-registration error and SHALL NOT create a new Application.
9. IF a logged-in user already has an Application in any non-`rejected` status, THEN THE Registration_Wizard SHALL redirect the user to their Application Status page instead of showing the wizard form.
10. THE Registration_Wizard SHALL be keyboard-navigable and SHALL meet WCAG 2.1 AA color-contrast requirements using the existing espresso/ivory/maroon/champagne palette.
11. WHEN an Applicant with a `rejected` Application opens the Registration_Wizard, THE Registration_Wizard SHALL pre-populate all fields from the previous submission and allow edits and resubmission.

---

### Requirement 3: Wizard Step — Business Details

**User Story:** As a prospective seller, I want to provide my business identity and contact information, so that the platform can verify my legitimacy.

#### Acceptance Criteria

1. THE Business_Details_Step SHALL collect: legal business name (required, 2–120 characters), business type (required; one of Sole Proprietorship / Partnership / Private Limited / LLP / Other), GST Number (required, validated against the GST_Number format), PAN Number (required, validated against the PAN_Number format), registered business address (required, 10–200 characters), city (required), state (required, one of the 28 Indian states and 8 UTs), PIN code (required, 6-digit numeric), and contact phone (required, 10-digit Indian mobile number).
2. WHEN the Applicant enters a GST_Number value, THE Business_Details_Step SHALL validate the format in real time and display an inline error if the format is invalid.
3. WHEN the Applicant enters a PAN_Number value, THE Business_Details_Step SHALL validate the format in real time and display an inline error if the format is invalid.

---

### Requirement 4: Wizard Step — Store Information

**User Story:** As a prospective seller, I want to describe my store's identity and appearance, so that customers and admins can evaluate my offering.

#### Acceptance Criteria

1. THE Store_Information_Step SHALL collect: store name (required, 2–120 characters), store tagline (optional, max 160 characters), store description (required, 10–800 characters), primary product specialty (required, 2–120 characters), store city (required), Instagram URL (optional, must begin with `https://instagram.com/` or be empty), and store logo image upload (optional, JPEG or PNG, max 5 MB).
2. WHEN the Applicant types a store name, THE Store_Information_Step SHALL generate a preview of the Store_Slug in real time by converting the name to lowercase kebab-case.
3. WHEN the Applicant uploads a logo image, THE Store_Information_Step SHALL validate that the file type is JPEG or PNG and the file size is at most 5 MB; IF validation fails, THEN THE Store_Information_Step SHALL display an inline error and SHALL NOT accept the file.

---

### Requirement 5: Wizard Step — Verification Documents

**User Story:** As a prospective seller, I want to upload identity and business verification documents, so that the platform can confirm my credentials.

#### Acceptance Criteria

1. THE Verification_Documents_Step SHALL accept the following uploads: GST certificate (required, PDF or image, max 10 MB), PAN card copy (required, PDF or image, max 10 MB), business registration proof (required, PDF or image, max 10 MB), and bank statement / cancelled cheque (required, PDF or image, max 10 MB).
2. WHEN the Applicant uploads a document, THE Verification_Documents_Step SHALL validate that the file type is PDF, JPEG, or PNG and the file size is at most 10 MB; IF either check fails, THEN THE Verification_Documents_Step SHALL display an inline error and SHALL NOT accept the file.
3. THE Verification_Documents_Step SHALL display file name and size of each accepted upload so the Applicant can confirm the correct file was chosen.

---

### Requirement 6: Wizard Step — Bank Details

**User Story:** As a prospective seller, I want to provide my bank account details, so that the platform can process payouts after sales.

#### Acceptance Criteria

1. THE Bank_Details_Step SHALL collect: account holder name (required, 2–100 characters), bank name (required, 2–100 characters), account number (required, 9–18 numeric digits), IFSC code (required, format `[A-Z]{4}0[A-Z0-9]{6}`), and account type (required; one of Savings / Current).
2. WHEN the Applicant enters an IFSC code, THE Bank_Details_Step SHALL validate the format in real time and display an inline error if the format is invalid.
3. THE Bank_Details_Step SHALL mask the account number on the Review & Submit summary, displaying only the last 4 digits prefixed with asterisks.

---

### Requirement 7: Wizard Step — Shipping Preferences

**User Story:** As a prospective seller, I want to declare my shipping capabilities, so that the platform can display accurate delivery information to buyers.

#### Acceptance Criteria

1. THE Shipping_Preferences_Step SHALL collect: domestic shipping capability (required, boolean), international shipping capability (required, boolean), list of serviceable states or regions (optional, free text or multi-select of Indian states), estimated domestic dispatch time in business days (required when domestic shipping is true, 1–30 integer), estimated international dispatch time in business days (required when international shipping is true, 1–60 integer), and preferred shipping partners (optional, free text max 200 characters).
2. IF an Applicant sets domestic shipping to false and international shipping to false, THEN THE Shipping_Preferences_Step SHALL display a validation error stating at least one shipping method must be selected before proceeding.

---

### Requirement 8: Wizard Step — Product Categories

**User Story:** As a prospective seller, I want to declare the product categories I will sell, so that the platform can correctly list my store in the right sections.

#### Acceptance Criteria

1. THE Product_Categories_Step SHALL present a predefined list of categories drawn from the platform's existing category taxonomy (e.g., Lehenga, Saree, Jewellery, Outerwear, Accessories, Home Décor, etc.).
2. THE Product_Categories_Step SHALL require the Applicant to select at least one category and at most 10 categories.
3. THE Product_Categories_Step SHALL collect a primary category (required, must be one of the selected categories) which will be used as the store specialty.
4. THE Product_Categories_Step SHALL collect an estimated monthly product listing count (required, 1–10,000 integer).

---

### Requirement 9: Application Submission and Status Tracking

**User Story:** As an Applicant, I want to receive a confirmation and track the status of my application, so that I know what to expect next.

#### Acceptance Criteria

1. WHEN the Applicant submits the Registration_Wizard, THE Application SHALL be persisted to `seller_applications` with status `pending_review` and a unique application ID (UUID v4).
2. WHEN the Application is created, THE Notification_Service SHALL create a Notification for the Applicant with message type `application_submitted`.
3. WHEN the Application is created, THE Notification_Service SHALL create a Notification for all Admin users with message type `new_seller_application`.
4. THE Application Status page at `/become-a-seller/status/:applicationId` SHALL display the current Application_Status, the submission date, and any admin notes flagged as visible to the Applicant.
5. WHEN the Application_Status is `needs_changes`, THE Application Status page SHALL display the changes requested by the Admin and a "Edit & Resubmit" button that opens the Registration_Wizard pre-populated with existing data.
6. WHEN the Application_Status is `rejected`, THE Application Status page SHALL display the rejection reason and a "Start New Application" button.
7. WHEN the Application_Status is `approved`, THE Application Status page SHALL display a congratulations message and a link to the Seller_Dashboard.

---

### Requirement 10: Admin — Seller Applications Menu

**User Story:** As an Admin, I want a dedicated Seller Applications section in the admin panel, so that I can review and action incoming applications without disrupting existing shop management.

#### Acceptance Criteria

1. THE AdminLayout sidebar SHALL include a "Seller Applications" menu item with an appropriate icon (e.g., `ClipboardList` from lucide-react), positioned after the "Bookings" item and before "Settings".
2. THE Seller_Applications_Route at `/admin/seller-applications` SHALL be protected by the existing `ProtectedAdminRoute` guard.
3. THE Application_Review_Panel SHALL display sub-navigation tabs for: Pending, Approved, Rejected, Needs Changes, and Drafts.
4. THE Application_Review_Panel SHALL list applications in each tab sorted by `submitted_at` descending, showing applicant name, business name, city, submission date, and current status badge.
5. WHEN an Admin clicks an application row, THE Application_Review_Panel SHALL open a detail view showing all submitted data including uploaded document links, admin notes, and the full activity log.

---

### Requirement 11: Admin — Application Review Actions

**User Story:** As an Admin, I want to approve, reject, request changes, or suspend a seller application, so that I can control which sellers are onboarded onto the platform.

#### Acceptance Criteria

1. WHEN an Admin clicks "Approve" on a `pending_review` or `needs_changes` Application, THE Application_Review_Panel SHALL call `POST /api/admin/seller-applications/:id/approve` and trigger the Provisioning_Workflow.
2. WHEN an Admin clicks "Reject" on a `pending_review` or `needs_changes` Application, THE Application_Review_Panel SHALL require the Admin to enter a rejection reason (min 10 characters) before calling `POST /api/admin/seller-applications/:id/reject`.
3. WHEN an Admin clicks "Request Changes" on a `pending_review` Application, THE Application_Review_Panel SHALL require the Admin to enter the changes requested (min 10 characters) before calling `POST /api/admin/seller-applications/:id/request-changes`.
4. WHEN an Admin clicks "Suspend" on an `approved` Application, THE Application_Review_Panel SHALL require the Admin to enter a suspension reason before calling `POST /api/admin/seller-applications/:id/suspend`.
5. WHEN an Admin adds a note to an Application, THE Application_Review_Panel SHALL call `POST /api/admin/seller-applications/:id/notes` with the note body and a flag indicating whether the note is visible to the Applicant.
6. AFTER any status-changing action, THE Activity_Log SHALL record the previous status, new status, acting admin identifier, timestamp, and associated reason or note.

---

### Requirement 12: Provisioning Workflow on Approval

**User Story:** As an approved seller, I want my account, store, and dashboard access created automatically when my application is approved, so that I can start selling immediately without manual intervention.

#### Acceptance Criteria

1. WHEN an Application transitions to `approved`, THE Provisioning_Service SHALL execute the following steps in order: create or locate the Seller user account, assign the `seller` role, generate a unique Store_Slug from the store name, create a Shop record in the existing `shops` collection, create default store settings, enable marketplace listing (`is_active: true`), and enable login access.
2. WHEN generating the Store_Slug, THE Provisioning_Service SHALL append a numeric suffix (e.g., `-2`, `-3`) if the base slug already exists in `shops`, incrementing until a unique value is found.
3. WHEN the Provisioning_Service creates the Shop record, THE Provisioning_Service SHALL populate the `shops` fields from the Application's Store_Information step data (name, description, specialty, city, owner_name, owner_email, image_url, instagram_url).
4. AFTER provisioning, THE Notification_Service SHALL send a Notification of type `approved` to the Seller with a link to the Seller_Dashboard.
5. AFTER provisioning, THE Notification_Service SHALL send a welcome email to the Seller's registered email address.
6. IF any provisioning step fails, THEN THE Provisioning_Service SHALL log the failure to `application_history` with details and SHALL NOT leave the Application in `approved` status without a corresponding Shop record; the Application_Status SHALL revert to `pending_review` with an admin-visible error note.

---

### Requirement 13: Rejection and Resubmission Workflow

**User Story:** As an Applicant whose application was rejected, I want to understand why it was rejected and be able to revise and resubmit, so that I am not permanently excluded from the platform.

#### Acceptance Criteria

1. WHEN an Application is rejected, THE Notification_Service SHALL create a Notification for the Applicant of type `rejected` containing the rejection reason.
2. WHEN a rejected Applicant opens the Registration_Wizard, THE Registration_Wizard SHALL pre-populate all form fields from the rejected Application's data.
3. WHEN a rejected Applicant submits a revised application, THE system SHALL create a new Application record linked to the original via a `previous_application_id` field, with initial status `pending_review`.
4. WHEN a new Application is submitted by a previously rejected Applicant, THE Notification_Service SHALL notify Admin users with message type `application_resubmitted`.

---

### Requirement 14: Needs-Changes Workflow

**User Story:** As an Applicant asked to make changes, I want to understand what to fix and submit an updated application, so that minor issues don't result in permanent rejection.

#### Acceptance Criteria

1. WHEN an Application status changes to `needs_changes`, THE Notification_Service SHALL create a Notification for the Applicant of type `changes_requested` containing the changes requested.
2. WHEN an Applicant with a `needs_changes` Application clicks "Edit & Resubmit", THE Registration_Wizard SHALL pre-populate all fields and highlight the sections flagged by the Admin.
3. WHEN the Applicant submits the updated data, THE API SHALL update the existing Application record's fields and change the status back to `pending_review`, recording the transition in `application_history`.
4. WHEN the Application is resubmitted, THE Notification_Service SHALL notify Admin users with message type `application_resubmitted`.

---

### Requirement 15: Notifications

**User Story:** As a platform participant (Applicant or Admin), I want timely notifications for every relevant event, so that I can respond promptly to application state changes.

#### Acceptance Criteria

1. THE Notification_Service SHALL create Applicant-targeted Notifications for each of the following event types: `application_submitted`, `documents_missing`, `changes_requested`, `approved`, `rejected`, `suspended`, `store_published`.
2. THE Notification_Service SHALL create Admin-targeted Notifications for each of the following event types: `new_seller_application`, `documents_updated`, `application_resubmitted`.
3. THE Notification_Service SHALL persist every Notification to the `notifications` collection with fields: `id`, `user_id`, `type`, `message`, `is_read`, `created_at`, `related_application_id`.
4. WHEN the platform sends an `approved` or `rejected` Notification, THE Notification_Service SHALL also dispatch an email to the Applicant's registered email address using the existing `email_service` module.
5. THE Admin panel header notification bell SHALL show an unread count sourced from the `notifications` collection filtered by `user_id` matching the admin identifier.

---

### Requirement 16: Data Integrity and Deduplication

**User Story:** As a platform operator, I want duplicate registrations and conflicting identifiers to be prevented, so that the seller database remains clean and trustworthy.

#### Acceptance Criteria

1. THE API SHALL reject a new Application with HTTP 409 if the submitted GST_Number already exists in any non-`rejected` Application or in the `shops` collection.
2. THE API SHALL reject a new Application with HTTP 409 if the submitted PAN_Number already exists in any non-`rejected` Application or in the `shops` collection.
3. THE API SHALL reject a new Application with HTTP 409 if the Applicant's email already corresponds to an existing Seller-role user.
4. THE Provisioning_Service SHALL ensure the generated Store_Slug is unique before inserting the Shop record, retrying with numeric suffixes as described in Requirement 12.

---

### Requirement 17: Activity Logging

**User Story:** As an Admin, I want every status change and admin action on an application to be recorded in an immutable log, so that I have a full audit trail for compliance and dispute resolution.

#### Acceptance Criteria

1. THE system SHALL write an `application_history` record for every transition between Application_Status values, capturing: `id`, `application_id`, `from_status`, `to_status`, `actor_id`, `actor_type` (admin | system | applicant), `reason`, `note`, `created_at`.
2. THE `application_history` records SHALL be immutable — no update or delete operation SHALL be permitted on these records through any API endpoint.
3. WHEN an Admin views the Application detail in the Application_Review_Panel, THE Application_Review_Panel SHALL display the full activity log in reverse-chronological order.

---

### Requirement 18: Backend Database Schema

**User Story:** As a backend developer, I want clearly defined new collections that extend the existing MongoDB schema, so that the feature integrates cleanly without modifying existing collections.

#### Acceptance Criteria

1. THE backend SHALL introduce a `seller_applications` collection with at minimum the following fields: `id` (UUID), `applicant_user_id` (optional, for logged-in users), `applicant_email`, `status` (Application_Status enum), `business_details` (object), `store_information` (object), `bank_details` (object), `shipping_preferences` (object), `product_categories` (array), `previous_application_id` (optional UUID), `submitted_at`, `updated_at`, `provisioned_shop_id` (optional, populated on approval).
2. THE backend SHALL introduce an `application_documents` collection with fields: `id`, `application_id`, `document_type`, `file_name`, `file_size_bytes`, `storage_url`, `uploaded_at`.
3. THE backend SHALL introduce an `application_history` collection as described in Requirement 17.
4. THE backend SHALL introduce an `application_notes` collection with fields: `id`, `application_id`, `author_id`, `body`, `is_visible_to_applicant`, `created_at`.
5. THE backend SHALL NOT modify the schema of existing collections (`shops`, `products`, `orders`, `waitlist`).

---

### Requirement 19: API Endpoints

**User Story:** As a frontend developer, I want well-defined API endpoints for the registration and review flows, so that the frontend can communicate with the backend reliably.

#### Acceptance Criteria

1. THE API SHALL expose `POST /api/seller-applications` (public, optionally authenticated) to create a new Application in `pending_review` status.
2. THE API SHALL expose `GET /api/seller-applications/:id` (authenticated; accessible by the owning applicant or admin) to retrieve full Application details.
3. THE API SHALL expose `PATCH /api/seller-applications/:id` (authenticated; applicant-only, only when status is `needs_changes` or `draft`) to update and resubmit an Application.
4. THE API SHALL expose `GET /api/admin/seller-applications` (admin-only) with optional query parameters `status`, `page`, and `page_size` to list Applications.
5. THE API SHALL expose `POST /api/admin/seller-applications/:id/approve` (admin-only) to trigger the Provisioning_Workflow.
6. THE API SHALL expose `POST /api/admin/seller-applications/:id/reject` (admin-only, requires `reason` body field) to reject an Application.
7. THE API SHALL expose `POST /api/admin/seller-applications/:id/request-changes` (admin-only, requires `changes_requested` body field) to move Application to `needs_changes`.
8. THE API SHALL expose `POST /api/admin/seller-applications/:id/suspend` (admin-only, requires `reason` body field) to suspend an approved seller.
9. THE API SHALL expose `POST /api/admin/seller-applications/:id/notes` (admin-only) to add a note to an Application.
10. ALL admin endpoints SHALL authenticate via the existing `X-Admin-Key` header mechanism.

---

### Requirement 20: Architecture and Code Quality Constraints

**User Story:** As a developer maintaining the platform, I want the seller registration feature to follow the existing architecture patterns and SOLID principles, so that the codebase remains maintainable and extensible.

#### Acceptance Criteria

1. THE Registration_Wizard module SHALL be lazy-loaded via `React.lazy` at the `/become-a-seller` route so that its code is not included in the initial application bundle.
2. THE Application_Review_Panel module SHALL be lazy-loaded via `React.lazy` at the `/admin/seller-applications` route.
3. THE feature SHALL NOT introduce duplicate logic, models, API endpoints, or UI components that replicate existing functionality.
4. THE feature SHALL reuse existing UI components from the existing shadcn/ui and Radix UI component library wherever applicable.
5. THE feature SHALL reuse the existing `useAuth` hook for authentication state and the existing `api` axios instance for HTTP calls.
6. THE feature SHALL apply Framer Motion entrance animations consistent with existing page transitions in the platform.
7. ALL form components SHALL use controlled inputs and validate on both blur and submit events.
8. THE backend provisioning logic SHALL be encapsulated in a dedicated service function (e.g., `provision_seller`) that is callable from the approval endpoint and independently testable.
9. THE feature SHALL apply the existing espresso/ivory/maroon/champagne color palette and Cormorant Garamond / Outfit typography for all new UI surfaces.
10. WHEN the existing seller management flows at `/admin/shops` are used, THE existing functionality SHALL continue to operate without modification.
