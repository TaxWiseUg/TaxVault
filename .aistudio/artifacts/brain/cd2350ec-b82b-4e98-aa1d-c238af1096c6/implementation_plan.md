# Implementation Plan — Restricting Admin Access & Guaranteeing Role Selection Prompt

## Problem Diagnosis
1. **Admin Option Exposure**: In `src/components/ProfileSettings.tsx`, the `roles` array included `"Admin"`, allowing public users (such as `princefattahkent@gmail.com`) to select Admin rights from their Profile & Settings dropdown.
2. **Role Selection Prompt Not Triggering**: 
   - When users like `princefattahkent@gmail.com` sign in via Google, Firebase Auth preserves their session across page loads. Upon opening the applet, `onAuthStateChanged` directly restored their session and took them straight to the workspace without going through `AuthPage.tsx`.
   - Furthermore, previous automated syncs had written `role = "Tax Consultant"` into the database and local storage by default, so neither Firebase (`isNewUser` was false on subsequent logins) nor the database treated the user as "new", causing the onboarding modal to be skipped.

---

## Proposed Changes

### 1. Remove "Admin" From Public Account Settings (`src/components/ProfileSettings.tsx`)
- Update `roles` dropdown list in `ProfileSettings.tsx` to strictly include valid practitioner roles:
  - `Tax Consultant`
  - `Accountant`
  - `Tax Lawyer`
  - `Finance Manager`
  - `Business Owner`
  - `Student`
- Completely remove `"Admin"` and `"Other"`.
- If the current user is `taxwiseplatform@gmail.com`, display "Super Administrator" and lock the dropdown.
- In `handleUpdateProfile`: reject any attempt to assign the `"Admin"` role if the email is not `taxwiseplatform@gmail.com`.

### 2. Dual-Layer Role Selection Prompt (Both Sign-In and Workspace)
- **Persistent Confirmation Flag**: Track `role_confirmed` in `taxwise_active_user` and local storage key `taxwise_role_confirmed_${email}`.
- **In `src/lib/googleAuth.ts`**:
  - A user is marked `isNewUser: true` if their email is not `taxwiseplatform@gmail.com` AND their role has not been explicitly confirmed (`!profile.role_confirmed && safeStorage.getItem("taxwise_role_confirmed_" + email) !== "true"`).
  - When `updateUserRole(email, role, ...)` is called, set `role_confirmed: true` and persist `taxwise_role_confirmed_${email} = "true"`.
- **In `src/app/page.tsx` (In-App Onboarding Guard)**:
  - When a user is already signed in via Firebase Auth (e.g. session restored from browser storage like in the user's screenshot), check if `activeUser` has confirmed their role.
  - If `activeUser.email !== "taxwiseplatform@gmail.com"` and `safeStorage.getItem("taxwise_role_confirmed_" + activeUser.email) !== "true"`:
    - Render the **Professional Role Selection Modal** directly in the workspace shell as an overlay.
    - Upon selecting their role and clicking "Continue to Dashboard", save the choice via `updateUserRole`, mark `role_confirmed: true`, and immediately refresh the personalized dashboard.
- **In `src/components/AuthPage.tsx`**:
  - Keep the OAuth modal check in `handleGoogleSignIn` for fresh sign-ins through the login page.

### 3. Server API Guard (`src/app/api/auth/google-sync/route.ts`)
- Disallow `role === "Admin"` unless `email.toLowerCase() === "taxwiseplatform@gmail.com"`.
- Return `role_confirmed: true` only when the user has explicitly selected a role (or is master admin).

---

## Verification Plan
1. **Public Settings Verification**:
   - Open Profile & Settings as `princefattahkent@gmail.com`.
   - Confirm "Admin" is no longer in the dropdown.
2. **Role Selection Prompt Verification**:
   - Load the application as `princefattahkent@gmail.com`.
   - Verify that the interactive Role Selection Modal immediately appears (prompting to pick between Tax Consultant, Accountant, Tax Lawyer, Finance Manager, Business Owner, Student).
   - Select e.g. "Tax Lawyer" and confirm.
   - Verify the modal dismisses, the role updates to "Tax Lawyer", and the dashboard presents TAT disputes, legal appeals, and precedent tools.
3. **Admin Exemption**:
   - Ensure `taxwiseplatform@gmail.com` logs in as Super Administrator without being prompted.
