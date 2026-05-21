# Security Specification: Firewalled Nutrition Tracker

This document details the Zero-Trust Architecture design and Attribute-Based Access Control (ABAC) rules for our Cloud-Synchronized Nutrition Tracker.

## 1. Core Data Invariants

1. **Isolation Invariant**: Every user profile and logged meal must be structurally tied to a unique Firebase Authentication User ID (`uid`).
2. **Access Control**: Users are strictly forbidden from reading, listing, modifying, or deleting any data that belongs to another authenticated user (`resource.data.userId == request.auth.uid` or matches path variable `{userId}`).
3. **Immutability Invariant**: Fields designating identity (such as profile ownership or the primary keys) cannot be changed after creation.
4. **Validation Bounds**: Any written values (body goals, weight, calories, macronutrients) must be checked against strict boundaries to prevent "Denial of Wallet" resource exhaustion or overflow attacks.

---

## 2. The "Dirty Dozen" Malicious Exploits

Below are 12 hostile payloads designed to compromise the database. Our security rules will be designed to mathematically deny every one of them:

### Payload 1: Profile Hijacking (Identity Spoofing)
- **Target**: `/users/Alice`
- **Payload**: `{ "username": "Alice", "isCalculated": true, "weightCc": 70, "heightCc": 170, "ageCc": 30, "genderCc": "female", "activityLevelCc": "sedentary", "goalCc": "lose", "targetKcal": 2000, "targetProtein": 120, "targetFat": 60, "targetCarbs": 240 }`
- **Attacker Auth**: `uid: "Bob"` (Attempting to write into Alice's path)
- **Outcome**: `PERMISSION_DENIED` (Bob is not Alice)

### Payload 2: Self-Assigned Privileges (Admin Injection)
- **Target**: `/users/Bob`
- **Payload**: `{ "isCalculated": true, "weightCc": 85, "isAdmin": true, "role": "admin" }`
- **Attacker Auth**: `uid: "Bob"` (Bob claiming admin role)
- **Outcome**: `PERMISSION_DENIED` (No schema bypass for unapproved keys)

### Payload 3: Integer Underflow (Malicious Negative Calories)
- **Target**: `/users/Bob/meals/meal1`
- **Payload**: `{ "id": "meal1", "date": "2026-05-20", "timestamp": 1779282361000, "name": "Antimatter", "weightGrams": -500, "volumeMl": 0, "proteins": -50, "fats": -20, "carbohydrates": -100, "kcal": -1500, "explanation": "Exploit" }`
- **Attacker Auth**: `uid: "Bob"`
- **Outcome**: `PERMISSION_DENIED` (Numerical parameters must be >= 0)

### Payload 4: Key Bloating / Shadow Fields (Schema Bypass)
- **Target**: `/users/Bob/meals/meal2`
- **Payload**: `{ "id": "meal2", "date": "2026-05-20", "timestamp": 1779282361000, "name": "Salad", "weightGrams": 150, "volumeMl": 0, "proteins": 2, "fats": 0, "carbohydrates": 5, "kcal": 30, "explanation": "Healthy", "hiddenPremiumKey": "unlockedSecret" }`
- **Attacker Auth**: `uid: "Bob"`
- **Outcome**: `PERMISSION_DENIED` (Shadow keys violate size/schema checks)

### Payload 5: Large Identity Spoofing Attack (ID Poisoning)
- **Target**: `/users/Bob/meals/VERY_LONG_STRING_OVER_1024_CHARACTERS_...` (Junk ID to leak storage/wallet costs)
- **Attacker Auth**: `uid: "Bob"`
- **Outcome**: `PERMISSION_DENIED` (Path variable ID sizes restricted to <= 128 chars and valid characters)

### Payload 6: Cross-User Meal Read (Eavesdropping Query)
- **Target**: `/users/Alice/meals` (Bob tries to list all Alice's food diaries)
- **Attacker Auth**: `uid: "Bob"`
- **Outcome**: `PERMISSION_DENIED` (Path variable Bob must equal Alice)

### Payload 7: Timestamp Spoofing (Client-Sided Injection)
- **Target**: `/users/Bob/meals/meal3`
- **Payload**: `{ "id": "meal3", "date": "2026-05-20", "timestamp": 100000, "name": "Apple", ..., "createdAt": "2010-01-01T00:00:00Z" }` (Injecting historical system times)
- **Attacker Auth**: `uid: "Bob"`
- **Outcome**: `PERMISSION_DENIED` (Timestamps must match server-authenticated request time)

### Payload 8: Immutable Core Field Alteration
- **Target**: `/users/Bob` (Update operation)
- **Payload**: Bob trying to alter an immutable creation stamp or registration metric.
- **Outcome**: `PERMISSION_DENIED` (Enforced key invariance)

### Payload 9: Malformed List Injection (Denial of Wallet)
- **Target**: `/users/Bob/meals/meal4`
- **Payload**: `{ "ingredients": [ { "name": 12345, "weight": -5 } ] }` (Fuzzing dynamic ingredients map array)
- **Outcome**: `PERMISSION_DENIED` (Strict sub-item check, indices must be valid strings and numbers)

### Payload 10: Unauthorized Blanket Query Scraping
- **Target**: `/users` (Listing all user documents)
- **Attacker Auth**: None / SignedIn
- **Outcome**: `PERMISSION_DENIED` (No blanket listing of profiles, must target individual documents)

### Payload 11: Spoofed Email Verification Claim
- **Target**: `/users/Bob`
- **Attacker Auth**: `uid: "Bob"`, `email_verified: false`
- **Outcome**: `PERMISSION_DENIED` (User email must be verified to write, preventing throwaway spam)

### Payload 12: Terminal State Locking Bypass
- **Target**: `/users/Bob/meals/meal5`
- **Payload**: Bob trying to modify a verified meal report representing a locked history record.
- **Outcome**: `PERMISSION_DENIED` (Once historic meals lock after deep freeze, standard fields cannot be mutated)

---

## 3. Deployment Steps

Our Firestore security rules helper will be defined in `firestore.rules`.
Once the Firebase Console configuration finishes, we will deploy these rules immediately and secure the application completely.
