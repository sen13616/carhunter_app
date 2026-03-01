# Monetization + Streak Multiplier – Testing Checklist

Use this checklist for PR verification and QA.

## Setup
- Ensure Supabase migration `20250226500000_profiles_daily_quota_rpc.sql` has been applied (daily_spots_date, subscription column, try_consume_spot RPC).
- Set `EXPO_PUBLIC_REVENUECAT_API_KEY` in env if using RevenueCat; otherwise gating still works with profile flags (is_subscribed, extra_spots) set manually in DB for testing.

## 1. Free user: 3 spots/day then paywall
- [ ] Sign in as a user with `is_subscribed = false` and `extra_spots = 0` (or leave default).
- [ ] Save 3 spots in the same day (camera or manual upload).
- [ ] On the 4th save attempt, the paywall modal appears (not just a toast).
- [ ] Paywall shows "Daily limit reached (3/3 spots)" and upgrade options.
- [ ] Close paywall; 4th spot is not saved.

## 2. One-time purchase: 10 spots/day
- [ ] Set profile: `extra_spots = 7`, `is_subscribed = false`, `subscription = 'lifetime'` (or complete a one-time purchase in sandbox).
- [ ] Daily limit is 10 (3 + 7). Save up to 10 spots in one day.
- [ ] 11th save in the same day shows paywall with limit (10/10).

## 3. Monthly: unlimited saves; streak ≥ 7 → 2× XP
- [ ] Set profile: `is_subscribed = true`, `subscription = 'monthly'` (or have an active monthly subscription in RevenueCat).
- [ ] Save multiple spots in one day; no limit prompt.
- [ ] Set `streak_count >= 7` for that user.
- [ ] Save a new spot; confirm XP is doubled (e.g. check post-spot screen or DB: total_xp and xp_breakdown include "× streak 2x" or similar).
- [ ] With `streak_count < 7`, XP is 1× (no streak multiplier applied).

## 4. Daily reset
- [ ] As free user, use 3 spots today.
- [ ] Advance device date to the next day (or wait until next day).
- [ ] Save again; quota should be reset (e.g. 1/3 used). RPC resets when `daily_spots_date` ≠ current_date.

## 5. Restore purchases
- [ ] With RevenueCat configured, sign in and tap "Restore Purchases" in the paywall (or a restore entry point).
- [ ] After restore, profile is updated: is_subscribed / extra_spots / subscription reflect active entitlements.
- [ ] Gating updates immediately (e.g. if monthly restored, next save is not limited and streak multiplier applies when streak ≥ 7).

## 6. Streak UI (Dashboard)
- [ ] Dashboard shows streak card with current streak days.
- [ ] If subscribed and streak ≥ 7: "2× active" badge is shown.
- [ ] If not subscribed (or streak < 7): "2× locked" and "Subscribe to unlock" are shown; tapping opens paywall.

## 7. Paywall entry points
- [ ] Quota block: when daily limit is reached, paywall opens with limit message.
- [ ] Streak CTA: tapping locked "2×" streak card opens paywall.
- [ ] Paywall: Buy Monthly, Buy One-time, Restore, Close work without crash.

## 8. XP breakdown
- [ ] When streak multiplier is applied, stored xp_breakdown includes streak (e.g. "… × streak 2x").
- [ ] total_xp in spottings row equals base XP × streak multiplier when enabled.
