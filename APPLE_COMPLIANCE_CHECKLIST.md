# Apple App Store Compliance Checklist
## MOOD Fitness App - Pre-Submission Audit

**Last Updated:** February 2025  
**App Version:** 1.0.0  
**iOS Build Number:** 23

---

## 📋 Executive Summary

This document provides a comprehensive checklist for Apple App Store compliance, covering push notifications, analytics, user-generated content, media uploads, legal documentation, and App Store Connect privacy settings.

---

## 1. PUSH NOTIFICATIONS (iOS + Policy)

### 1.1 Permission Request Timing ✅ IMPLEMENTED
| Requirement | Status | Implementation |
|------------|--------|----------------|
| No request on first launch | ✅ | Permission requested only after user action |
| Education screen before request | ✅ | Notification settings accessible in-app |
| Delayed permission request | ✅ | Request triggered via `registerForPushNotifications()` |

**File:** `frontend/utils/notifications.ts`
- Uses `Notifications.requestPermissionsAsync()` from expo-notifications
- Stores permission status in AsyncStorage (`@mood_notification_permission`)

### 1.2 In-App Notification Settings ✅ IMPLEMENTED
| Feature | Status | Location |
|---------|--------|----------|
| Settings screen | ✅ | `/app/notification-settings.tsx` |
| Category controls | ✅ | Social, Messages, Workouts, Digest |
| Link to iOS Settings | ✅ | "Open iOS Notification Settings" button |
| Quiet hours | ✅ | Configurable start/end times |

**Categories Available:**
- Workout reminders
- Social activity (likes, comments, follows)
- New workouts/featured content
- Direct messages
- Activity digest

### 1.3 Deep Link Navigation ✅ IMPLEMENTED
| Deep Link | Route | Status |
|-----------|-------|--------|
| Post notification | `/post-detail?id={id}` | ✅ |
| Comment notification | `/post-detail?id={id}` | ✅ |
| Follow notification | `/user-profile?id={id}` | ✅ |
| Message notification | `/chat-detail?id={id}` | ✅ |
| Workout notification | `/workout-detail?id={id}` | ✅ |

**File:** `frontend/utils/notifications.ts` - `handleDeepLink()` method

### 1.4 Timestamp/Timezone Handling ✅ IMPLEMENTED
| Requirement | Current Status | Action Needed |
|-------------|----------------|---------------|
| Store event_timestamp UTC | ✅ | Using `getUTCTimestamp()` |
| Store user_timezone (IANA) | ✅ | Using `getUserTimezone()` via expo-localization |
| Display in local time | ✅ | Frontend handles conversion |

---

## 2. ANALYTICS / EVENT TRACKING (First-Party)

### 2.1 Event Storage Schema ✅ IMPLEMENTED
**Apple Compliance Update (February 2025):**
- Added `event_timestamp_utc` (ISO format) to all tracking calls
- Added `user_timezone` (IANA format, e.g., 'America/New_York') to all tracking calls
- Implemented via `getUserTimezone()` and `getUTCTimestamp()` in `frontend/utils/analytics.ts`

### 2.2 Events Audit

| Event Category | Events Tracked | Status |
|----------------|----------------|--------|
| **Workout Events** | workout_started, workout_completed, workout_skipped, workout_abandoned, workout_saved | ✅ |
| **Social Events** | post_created, post_liked, post_commented, user_followed, user_unfollowed | ✅ |
| **Navigation** | screen_viewed, tab_switched, search_performed | ✅ |
| **Notifications** | notification_clicked | ✅ |
| **Choose-for-me** | choose_for_me_used | ✅ ADDED |
| **Cart Events** | workout_added_to_cart, cart_viewed | ✅ |
| **Build-for-me by mood** | build_for_me_mood_used | ✅ ADDED |

### 2.3 Privacy Controls ✅ IMPLEMENTED
| Requirement | Status | Action |
|-------------|--------|--------|
| Opt-out of non-essential analytics | ✅ | Toggle added to Settings → Privacy & Safety |
| No cross-app tracking | ✅ | Confirmed - no third-party SDKs |
| No advertising | ✅ | Confirmed - no ads |
| Data not sold | ✅ | Confirmed in Privacy Policy |

**Implementation Details:**
- `isAnalyticsOptedOut()` and `setAnalyticsOptOut()` functions in `frontend/utils/analytics.ts`
- Toggle UI in `frontend/app/settings.tsx` under "Privacy & Safety" section
- Non-essential analytics respect opt-out preference; essential tracking continues

---

## 3. USER GENERATED CONTENT + MODERATION

### 3.1 Reporting/Removal Tools ✅ IMPLEMENTED
| Feature | Status | Location |
|---------|--------|----------|
| User report flow | ✅ | Post/comment report buttons |
| Admin removal | ✅ | `/admin-dashboard.tsx`, `/admin-moderation.tsx` |
| Block users | ✅ | `/blocked-users.tsx` |
| Content filter | ✅ | `/content-filter.tsx` |

### 3.2 Community Guidelines ✅ IMPLEMENTED
| Requirement | Status | Action |
|-------------|--------|--------|
| Community Guidelines page | ✅ | Created `/community-guidelines.tsx` |
| Link in Settings | ✅ | Added to Legal section in Settings |
| Clear rules for content | ✅ | Comprehensive guidelines with enforcement details |

### 3.3 Terms Coverage ✅ IMPLEMENTED
| Requirement | Status | Location |
|-------------|--------|----------|
| User responsibility | ✅ | Terms of Service Section 3 |
| License to host/display | ✅ | Terms of Service Section 4 |
| Moderation rights | ✅ | Terms of Service Section 5 |
| Zero tolerance policy | ✅ | Prominently displayed |

### 3.4 Account Deletion ✅ IMPLEMENTED
| Feature | Status | Implementation |
|---------|--------|----------------|
| Delete account button | ✅ | Settings → Account Management |
| Confirmation flow | ✅ | Multi-step with feedback option |
| Post/media cleanup | ✅ | Backend deletes all user content |
| API endpoint | ✅ | `DELETE /api/users/me` |

---

## 4. MEDIA UPLOADS

### 4.1 Storage/Processing ✅ DOCUMENTED
| Component | Service | Details |
|-----------|---------|---------|
| Videos | Cloudinary | Cloud storage, automatic transcoding |
| Thumbnails | Cloudinary | Auto-generated from video |
| Images | Cloudinary | Optimized delivery |

### 4.2 Photo Library Access ✅ COMPLIANT
| Permission | iOS Key | Status |
|------------|---------|--------|
| Read access | `NSPhotoLibraryUsageDescription` | ✅ Least-privileged |
| Write access | `NSPhotoLibraryAddUsageDescription` | ✅ Only for saving |
| Camera | `NSCameraUsageDescription` | ✅ |
| Microphone | `NSMicrophoneUsageDescription` | ✅ |

**File:** `frontend/app.json` - All permissions declared with user-benefit descriptions

---

## 5. LEGAL DOCS + IN-APP LINKS

### 5.1 Document Status

| Document | Status | Last Updated | Location |
|----------|--------|--------------|----------|
| Privacy Policy | ✅ | January 2025 | `/privacy-policy.tsx` |
| Terms of Service | ✅ | January 2025 | `/terms-of-service.tsx` |
| EULA | ⚠️ | Using Apple Standard | App Store Connect |
| Community Guidelines | ⚠️ | NEEDS CREATION | Create new screen |

### 5.2 In-App Links ✅ IMPLEMENTED
| Link | Location | Status |
|------|----------|--------|
| Privacy Policy | Settings → Legal | ✅ |
| Terms of Service | Settings → Legal | ✅ |
| Community Guidelines | Settings → Legal | ⚠️ NEEDS ADDITION |

### 5.3 Required Updates for Legal Docs

**Privacy Policy Updates Needed:**
- [ ] Add "Last Updated: February 2025"
- [ ] Add section on "Choose for Me" / randomization feature
- [ ] Add section on daily workout push notifications
- [ ] Clarify notification data storage

**Terms of Service Updates Needed:**
- [ ] Add "Last Updated: February 2025"
- [ ] Add section on dynamic content/feature changes
- [ ] Clarify "Choose for Me" is algorithmic, not guaranteed

### 5.4 Required Statements ✅ CONFIRMED
| Statement | Present | Location |
|-----------|---------|----------|
| No selling of personal data | ✅ | Privacy Policy Section 2 |
| No third-party ad tracking | ✅ | Privacy Policy Section 4.5 |

---

## 6. APP STORE CONNECT "APP PRIVACY"

### 6.1 Data Types Collected

| Data Type | Collected | Purpose | Linked to User | Used for Tracking |
|-----------|-----------|---------|----------------|-------------------|
| **Contact Info** | | | | |
| - Email address | ✅ | App Functionality | ✅ | ❌ |
| - Name (optional) | ✅ | App Functionality | ✅ | ❌ |
| **User Content** | | | | |
| - Photos or Videos | ✅ | App Functionality | ✅ | ❌ |
| - Posts/Comments | ✅ | App Functionality | ✅ | ❌ |
| **Fitness & Health** | | | | |
| - Workout data | ✅ | App Functionality | ✅ | ❌ |
| **Identifiers** | | | | |
| - User ID | ✅ | App Functionality | ✅ | ❌ |
| - Device tokens (push) | ✅ | App Functionality | ✅ | ❌ |
| **Usage Data** | | | | |
| - Product Interaction | ✅ | Analytics | ✅ | ❌ |
| **Diagnostics** | | | | |
| - Crash Data | ✅ | Analytics | ❌ | ❌ |
| - Performance Data | ✅ | Analytics | ❌ | ❌ |

### 6.2 Privacy Nutrition Label Answers

**"Data Used to Track You"**: **NO**
- Reason: We do not track users across other apps or websites

**"Data Linked to You"**: **YES**
- Contact Info, User Content, Fitness Data, Identifiers, Usage Data

**"Data Not Linked to You"**: **YES**
- Diagnostics (crash data, performance data)

---

## 7. CODE CHANGES REQUIRED (PR)

### 7.1 Backend Changes

**File: `/app/backend/user_analytics.py`**
- Add `user_timezone` field to event tracking
- Add `event_timestamp_utc` explicit field

**File: `/app/backend/server.py`**
- Update `TrackEventRequest` model to accept timezone
- Add analytics opt-out check before tracking

### 7.2 Frontend Changes

**File: `/app/frontend/app/notification-settings.tsx`**
- Add "Open iOS Settings" button/link

**File: `/app/frontend/app/settings.tsx`**
- Add "Community Guidelines" link
- Add "Analytics" toggle for opt-out

**New File: `/app/frontend/app/community-guidelines.tsx`**
- Create Community Guidelines page

**File: `/app/frontend/utils/analytics.ts`**
- Add timezone to all tracking calls
- Add opt-out check before tracking

### 7.3 Configuration Changes

**File: `/app/frontend/app.json`**
- No changes needed (permissions already declared)

---

## 8. APP STORE CONNECT SETTINGS CHECKLIST

### 8.1 App Information
- [ ] Privacy Policy URL: `https://www.officialmood.app/...` (already set)
- [ ] EULA: Use Apple Standard EULA (no custom required)

### 8.2 App Privacy
- [ ] Update "Data Types" selections per Section 6.1
- [ ] Confirm "Data Used to Track You" = NO
- [ ] Review "Data Linked to You" selections

### 8.3 Age Rating
- [ ] Confirm 12+ rating (due to UGC)
- [ ] Verify "Unrestricted Web Access" = NO

---

## 9. IMPLEMENTATION PRIORITY

### P0 - Critical (Must Fix Before Submission)
1. ✅ Add Community Guidelines page - COMPLETED
2. ✅ Add analytics opt-out toggle - COMPLETED
3. ✅ Link to iOS Settings from notification settings - COMPLETED
4. ✅ Update Terms of Service with hardened legal text - COMPLETED
5. ✅ Update Privacy Policy with hardened legal text - COMPLETED
6. ✅ Update EULA with hardened legal text - COMPLETED

### P1 - Important (Should Fix)
1. ✅ Add `user_timezone` to analytics events - COMPLETED
2. ✅ Add "choose_for_me" event tracking - COMPLETED  
3. ✅ Add "build_for_me_mood" event tracking - COMPLETED
4. ✅ Add "Last Updated" dates to legal docs - COMPLETED

### P2 - Nice to Have
1. ⚠️ Add EULA addendum page (using Apple Standard is sufficient)
2. ⚠️ Add notification education screen

---

## 10. TESTING CHECKLIST

### Pre-Submission Testing
- [ ] Verify push notification permissions flow
- [ ] Test deep links from notifications
- [ ] Verify account deletion removes all data
- [ ] Test content reporting flow
- [ ] Verify analytics events are tracked correctly
- [ ] Test all legal page links work
- [ ] Verify Privacy Policy URL is accessible

### Post-Submission Monitoring
- [ ] Monitor App Store Review feedback
- [ ] Track user privacy complaints
- [ ] Review analytics for compliance issues

---

**Document Prepared By:** Development Team  
**Review Required By:** Legal, Product, Engineering
