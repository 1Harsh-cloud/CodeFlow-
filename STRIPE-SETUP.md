# Stripe Setup for CodeFlow

The payment flow is already wired. Activate it with these steps:

## 1. Get your Stripe keys

1. Sign up at [stripe.com](https://stripe.com)
2. Open [Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
3. Use **Test mode** (toggle in the top right)
4. Copy the **Secret key** (starts with `sk_test_`)

## 2. Add to backend

Edit `backend/.env` and add:

```
STRIPE_SECRET_KEY=sk_test_your_key_here
```

## 3. Restart backend

```bash
cd backend && python app.py
```

## 4. Test

1. Open the app → click **Pricing**
2. Click **Get Started** on Pro ($9.99) or Ultimate ($19.99)
3. You’ll be redirected to Stripe Checkout
4. Use test card: **4242 4242 4242 4242**
   - Expiry: any future date (e.g. 12/34)
   - CVC: any 3 digits
   - No real charges in Test mode

## Production (Vercel + Railway)

- **Backend (Railway):** Add `STRIPE_SECRET_KEY` in Environment Variables
- **Stripe Dashboard:** Switch to Live mode and use `sk_live_...` for real payments
