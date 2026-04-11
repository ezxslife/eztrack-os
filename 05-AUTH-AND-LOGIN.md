# Phase 5 — Auth & Login Redesign

> Replace the EZTrack card-based login with a welcome surface + bottom sheet auth flow matching EZXS-OS.

---

## 1. What Gets Deleted

| Current Element | Action |
|-----------------|--------|
| Card container wrapping entire form | **Delete** — content goes on page background |
| "EZTRACK" pill badge (top-left of card) | **Move** — becomes centered logo on welcome surface |
| Shield/checkmark icon (top-right of card) | **Delete** — unnecessary chrome |
| "Demo login" label + dropdown | **Move** → hidden debug sheet (5-tap on logo) |
| Email input (inline on landing) | **Move** → Sign In bottom sheet |
| Password input (inline on landing) | **Move** → Sign In bottom sheet |
| "Sign In" button (inline on landing) | **Move** → Sign In bottom sheet |
| "PREVIEW" yellow label | **Delete** |
| "Preview mode is available on this build." text | **Delete** |
| "Continue in Preview" button | **Move** → hidden debug sheet (5-tap on logo) |

---

## 2. New Welcome Surface

The landing screen becomes a full-screen branded surface with two action buttons at the bottom. No inputs, no cards.

### Layout

```
┌─────────────────────────────┐
│                             │
│    [gradient backdrop]      │
│    (dark bg + teal orb)     │
│                             │
│                             │
│         🦋                  │  ← EZTRACK logo, centered
│       EZTRACK               │  ← brand name
│                             │
│   Your events, simplified.  │  ← tagline
│                             │
│                             │
│                             │
│  ┌───────────────────────┐  │
│  │     Get Started       │  │  ← brand cyan, GlassPill filled/lg
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │       Sign In         │  │  ← tinted variant, GlassPill tinted/lg
│  └───────────────────────┘  │
│                             │
│   Terms of Use · Privacy    │  ← caption1 links
│                             │
└─────────────────────────────┘
```

### Implementation

```typescript
export default function WelcomeScreen() {
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const isDark = useIsDark()
  const [showSignIn, setShowSignIn] = useState(false)
  const [showGetStarted, setShowGetStarted] = useState(false)

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Backdrop gradient + subtle orb */}
      <CinematicBackdrop isDark={isDark} />

      {/* Content */}
      <View style={{
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: Math.max(insets.bottom, 16) + 16,
      }}>
        {/* Logo + tagline (positioned in upper area via spacer) */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <EZTrackLogo size={108} />
          <Text style={{
            fontSize: 34,          // largeTitle
            fontWeight: '800',
            letterSpacing: -0.8,
            color: colors.textPrimary,
            marginTop: 16,
          }}>
            EZTRACK
          </Text>
          <Text style={{
            fontSize: 17,          // body
            fontWeight: '400',
            color: colors.textSecondary,
            marginTop: 8,
          }}>
            Your events, simplified.
          </Text>
        </View>

        {/* Action buttons */}
        <View style={{ gap: 12 }}>
          <GlassPill
            label="Get Started"
            variant="filled"
            size="lg"
            onPress={() => setShowGetStarted(true)}
          />
          <GlassPill
            label="Sign In"
            variant="tinted"
            size="lg"
            onPress={() => setShowSignIn(true)}
          />
        </View>

        {/* Footer */}
        <Text style={{
          fontSize: 12,          // caption1
          color: colors.textTertiary,
          textAlign: 'center',
          marginTop: 16,
        }}>
          Terms of Use · Privacy Policy
        </Text>
      </View>

      {/* Sheets */}
      <SignInSheet visible={showSignIn} onDismiss={() => setShowSignIn(false)} />
      <GetStartedSheet visible={showGetStarted} onDismiss={() => setShowGetStarted(false)} />
    </View>
  )
}
```

### Backdrop

Reuse the existing dark gradient + teal orb from the current EZTrack login. Optionally add EZXS-OS style enhancements:

```typescript
function CinematicBackdrop({ isDark }: { isDark: boolean }) {
  const palette = isDark
    ? { bgTop: '#0A0C11', bgBottom: '#05070B', orbColor: 'rgba(6,182,212,0.15)' }
    : { bgTop: '#F7F8FA', bgBottom: '#EEF1F5', orbColor: 'rgba(6,182,212,0.08)' }

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Gradient via SVG or LinearGradient */}
      <LinearGradient colors={[palette.bgTop, palette.bgBottom]} style={StyleSheet.absoluteFill} />
      
      {/* Teal orb — positioned top-right like current EZTrack */}
      <View style={{
        position: 'absolute',
        top: -120,
        right: -110,
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: palette.orbColor,
      }} />
    </View>
  )
}
```

### Button Styling

| Button | Variant | Background | Text | Border |
|--------|---------|------------|------|--------|
| Get Started | `filled/lg` | `colors.interactive` (`#0891B2` / `#22D3EE`) | `#FFFFFF` | None |
| Sign In | `tinted/lg` | `colors.surfaceTintMedium` | `colors.textPrimary` | `1px colors.borderLight` |

Both: `borderRadius: 26`, `paddingVertical: 18`, `fontSize: 17, fontWeight: 700`

### Animation

Staggered entrance matching EZXS-OS welcome screen:

| Element | Delay | Translate Y Start | Spring |
|---------|-------|-------------------|--------|
| Logo | 90ms | 16px | `damping: 14, stiffness: 120` |
| Brand name | 150ms | 24px | `damping: 14, stiffness: 120` |
| Tagline | 230ms | 18px | `damping: 14, stiffness: 120` |
| Get Started btn | 420ms | 28px | `damping: 14, stiffness: 120` |
| Sign In btn | 500ms | 20px | `damping: 14, stiffness: 120` |
| Footer | 620ms | 12px | `damping: 18, stiffness: 82` |

---

## 3. Sign In Bottom Sheet

For existing users with email + password.

### Sheet Config

```typescript
snapPoints: ['55%']
enablePanDownToClose: true
keyboardBehavior: 'interactive'
keyboardBlurBehavior: 'restore'

// Spring
damping: 20, stiffness: 150, mass: 0.8

// Glass background
blurIntensity: 90
tint: 'systemUltraThinMaterial'
backdropOpacity: 0.25
```

### Content

```
┌────────────────────────────────┐
│          ──── (handle)         │
│                                │
│  Sign in to EZTRACK      ✕    │  ← title1 (28px/700) + GlassButton close
│                                │
│  Email                         │  ← subheadline (15px/600) label
│  ┌────────────────────────┐    │
│  │ name@eztrack.io        │    │  ← surfaceContainerLow bg, 12px radius
│  └────────────────────────┘    │
│                                │  ← 16px gap
│  Password                      │
│  ┌────────────────────────┐    │
│  │ ••••••••               │    │  ← secureTextEntry, same styling
│  └────────────────────────┘    │
│                                │  ← 24px gap
│  ┌────────────────────────┐    │
│  │       Sign In          │    │  ← GlassPill filled/lg, brand cyan
│  └────────────────────────┘    │
│                                │
│     Forgot password?           │  ← colors.brandText, 14px
│                                │
└────────────────────────────────┘
```

### Input Styling

```typescript
const inputStyle = {
  backgroundColor: colors.surfaceContainerLow,  // #F7F5FA / #1D1B20
  borderWidth: 1.5,
  borderColor: colors.border,                    // #D1D5DB / rgba(255,255,255,0.20)
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  fontSize: 17,
  color: colors.textPrimary,
}

// Focus: borderColor → colors.focusBorder (#1F2937 / #FAFAFA)
// Error: borderColor → BRAND.error (#EF4444)
```

---

## 4. Get Started Bottom Sheet

For new users. Mirrors EZXS-OS method picker:

```
┌────────────────────────────────┐
│          ──── (handle)         │
│                                │
│  Create your account     ✕    │
│  Join EZTRACK to manage       │
│  and discover events.         │
│                                │
│  ┌────────────────────────┐    │
│  │  Continue with Phone   │    │  ← GlassPill filled/lg, brand cyan
│  └────────────────────────┘    │
│                                │  ← 12px gap
│  ┌────────────────────────┐    │
│  │  Continue with Email   │    │  ← GlassPill tinted/lg
│  └────────────────────────┘    │
│                                │  ← 12px gap
│  ┌──────────┐ ┌──────────┐    │
│  │  Apple  │ │  Google  │    │  ← row, surfaceContainerHigh bg
│  └──────────┘ └──────────┘    │
│                                │
│  Terms of Use · Privacy        │  ← caption1
│                                │
└────────────────────────────────┘
```

### Method Selection Flow

When user picks a method, the sheet dismisses and a full-screen route pushes:

```typescript
const handleMethodSelect = async (method: 'phone' | 'email') => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  sheetRef.current?.close()
  
  // 100ms stagger for spatial layering
  await new Promise(resolve => setTimeout(resolve, 100))
  
  router.push(`/(auth)/${method}-signin`)
}
```

The full-screen routes (`phone-signin.tsx`, `email-signin.tsx`, `phone-verify.tsx`, `email-verify.tsx`) handle the actual auth flow.

---

## 5. Full-Screen Auth Routes

These screens use `presentation: 'formSheet'` for native iOS sheet behavior:

### Phone Sign In (`phone-signin.tsx`)

```
┌────────────────────────────────┐
│  ← Back                       │  ← native header, 44px
│                                │
│  Enter your phone number       │  ← largeTitle (34px/800)
│  We'll send a one-time code.   │  ← body (17px/400)
│                                │
│  ┌────────────────────────┐    │
│  │ 🇺🇸 +1  (555) 123-4567 │    │  ← CountryPhoneInput
│  └────────────────────────┘    │
│                                │
│  ┌────────────────────────┐    │
│  │     Send Code          │    │  ← GlassPill filled/lg, brand cyan
│  └────────────────────────┘    │
│                                │
│  Paste from clipboard          │  ← colors.brandText, 14px
│                                │
└────────────────────────────────┘
```

### Phone Verify (`phone-verify.tsx`)

```
┌────────────────────────────────┐
│  ← Back                       │
│                                │
│  Enter verification code       │  ← largeTitle
│  Sent to 🇺🇸 +1 (555) 123-4567│  ← body
│                                │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐│
│  │ 1│ │ 2│ │ 3│ │ 4│ │ 5│ │  ││  ← OTPInput (52×60 cells)
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘│
│                                │
│  Didn't receive a code?        │
│  Resend Code (42s)             │  ← ResendTimer
│                                │
│  Paste code                    │  ← colors.brandText
│                                │
└────────────────────────────────┘
```

---

## 6. Auth Lifecycle State Machine

Port from EZXS-OS. This is the backbone of auth flow control:

```
signed_out ──→ authenticating ──→ onboarding ──→ welcoming ──→ authenticated
     ↑                │                                              │
     └────────────────┘ (on error)                                   │
     └───────────────────────────────────────────────────────────────┘ (session restored)
```

### Critical Rules

1. **Set lifecycle BEFORE async call.** `transitionAuthLifecycle('authenticating', reason)` must fire before `supabase.auth.verifyOtp()`. This prevents race conditions with `onAuthStateChange`.

2. **Update auth store BEFORE navigation.** After successful verify, call `authStore.setSession()` and `authStore.setUser()` before `router.replace()`. Prevents brief unauthenticated flash.

3. **Resolve onboarding state after verify.** Check if profile is complete → route to `profile-completion` or `welcome-animation`.

### Transition Reason Codes

```typescript
type TransitionReason =
  | 'phone_verify_otp_submit'
  | 'email_verify_otp_submit'
  | 'signin_sheet_otp_submit'
  | 'profile_completion_done'
  | 'google_signin_callback'
  | 'apple_signin_callback'
  | 'session_restored'
  | 'sign_out'
```

---

## 7. Haptics

| Event | Haptic Type |
|-------|-------------|
| Button press (method selection) | `impactAsync(ImpactFeedbackStyle.Light)` |
| OTP digit entered | None (too frequent) |
| OTP auto-submit (6th digit) | `impactAsync(ImpactFeedbackStyle.Medium)` |
| OTP correct | `notificationAsync(NotificationFeedbackType.Success)` |
| OTP wrong | `notificationAsync(NotificationFeedbackType.Error)` |
| Sheet open/close | `impactAsync(ImpactFeedbackStyle.Light)` |

---

## 8. Hidden Debug Sheet

Dev/QA tooling hidden behind a 5-tap gesture on the logo:

```typescript
const [tapCount, setTapCount] = useState(0)
const tapTimer = useRef<NodeJS.Timeout>()
const [showDebug, setShowDebug] = useState(false)

const handleLogoTap = () => {
  setTapCount(prev => prev + 1)
  clearTimeout(tapTimer.current)
  tapTimer.current = setTimeout(() => setTapCount(0), 1500)
  
  if (tapCount >= 4) {
    setTapCount(0)
    setShowDebug(true)
  }
}
```

Debug sheet contains:
- Demo login dropdown (fills email, selects password)
- "Continue in Preview" toggle
- Build info (version, environment)
- Only renders when `__DEV__` or `EXPO_PUBLIC_DEBUG_ENABLED === '1'`

---

## 9. EZTrack Adaptation Checklist

- [ ] Create `welcome.tsx` with cinematic backdrop + two CTA buttons
- [ ] Create `SignInSheet` component (email + password in GlassSheet)
- [ ] Create `GetStartedSheet` component (method picker in GlassSheet)
- [ ] Create full-screen `phone-signin.tsx` with CountryPhoneInput
- [ ] Create full-screen `phone-verify.tsx` with OTPInput
- [ ] Create full-screen `email-signin.tsx` (if OTP path, mirror phone)
- [ ] Create full-screen `email-verify.tsx`
- [ ] Port auth lifecycle state machine
- [ ] Port `transitionAuthLifecycle()` with reason codes
- [ ] Port `resolveAuthOnboardingState()` for post-verify routing
- [ ] Add haptics to all auth interactions
- [ ] Move demo login to hidden debug sheet
- [ ] Move preview mode to hidden debug sheet
- [ ] Gate debug sheet behind `__DEV__` flag
- [ ] Delete card container from current login
- [ ] Delete inline PREVIEW section
- [ ] Test: welcome → sheet → full screen → verify → main app (both themes)
