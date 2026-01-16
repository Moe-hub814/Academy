# CyberMoe Academy - Student Management System

A complete backend system for CyberMoe Academy with student authentication, subscription management (via Stripe), admin dashboard, and progress tracking.

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │────▶│   Supabase      │────▶│     Stripe      │
│   (Frontend +   │     │   (Database)    │     │   (Payments)    │
│   API Routes)   │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🚀 Quick Start Deployment

### 1. Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **SQL Editor**
3. Copy the contents of `database/schema.sql` and run it
4. Go to **Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Set Up Stripe Webhooks

1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. URL: `https://YOUR-DOMAIN.vercel.app/api/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 3. Generate Admin Password Hash

Run this command to generate a hashed password for your admin account:

```bash
npx bcryptjs-cli hash "YOUR_SECURE_PASSWORD"
```

Copy the output → `ADMIN_PASSWORD_HASH`

### 4. Deploy to Vercel

1. Push this code to your GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add these environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Admin Auth
JWT_SECRET=your_random_64_char_string
ADMIN_EMAIL=moe@cybermoe.academy
ADMIN_PASSWORD_HASH=your_bcrypt_hash

# Site
NEXT_PUBLIC_SITE_URL=https://cybermoe.academy
```

4. Deploy!

### 5. Update Your Existing Site

Add links to your current HTML site:

```html
<!-- Student Login Button -->
<a href="/login" class="btn">Student Login</a>

<!-- Update existing Stripe payment links -->
<!-- They'll automatically create student accounts via webhooks -->
```

## 📁 Project Structure

```
cybermoe-academy/
├── app/
│   ├── admin/                 # Admin dashboard pages
│   │   ├── login/
│   │   ├── students/
│   │   │   └── [id]/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/                   # API routes
│   │   ├── admin/stats/
│   │   ├── auth/
│   │   │   ├── admin/
│   │   │   └── student/
│   │   ├── progress/
│   │   ├── students/
│   │   │   └── [id]/
│   │   └── webhooks/stripe/
│   ├── dashboard/             # Student dashboard
│   ├── login/                 # Student login
│   ├── course/                # Course content pages
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   ├── auth.ts                # Authentication helpers
│   ├── stripe.ts              # Stripe helpers
│   └── supabase.ts            # Database client
├── database/
│   └── schema.sql             # Supabase setup
└── package.json
```

## 🔐 Authentication Flow

### Student Login
1. Student enters email/password at `/login`
2. API validates credentials against database
3. If subscription is `active`, JWT token is set as cookie
4. If subscription is `past_due`, error shown with payment update prompt
5. If subscription is `canceled`, access denied

### Admin Login
1. Admin enters credentials at `/admin/login`
2. Validated against environment variables
3. JWT token set as cookie (24h expiry)

## 💳 Stripe Integration

### Payment Flow
1. Student clicks payment link on your site
2. Stripe processes payment
3. Webhook hits `/api/webhooks/stripe`
4. System creates pending enrollment or activates existing student
5. Student receives login credentials

### Subscription Events Handled
- `checkout.session.completed` → Create/activate student
- `invoice.payment_failed` → Set status to `past_due` (blocks access)
- `invoice.payment_succeeded` → Reactivate student
- `customer.subscription.deleted` → Set status to `canceled`
- `customer.subscription.updated` → Sync status

## 📊 Admin Features

### Dashboard (`/admin`)
- Total students count
- Active subscriptions
- Past due count
- Tier breakdown
- Recent signups

### Student Management (`/admin/students`)
- Search by name/email
- Filter by tier and status
- View progress
- Add students manually
- Click to view details

### Student Details (`/admin/students/[id]`)
- Full account info
- Module-by-module progress
- Payment history
- Change subscription status
- Revoke access (with/without Stripe cancellation)

## 🎓 Student Features

### Dashboard (`/dashboard`)
- Progress overview
- Continue learning prompt
- All 8 modules with status

### Course Access (`/course/module-[1-8]`)
- Content gated by subscription status
- Progress tracking
- Mark modules complete

## 🔧 API Reference

### Authentication
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/student/logout` - Student logout
- `GET /api/auth/student/check` - Verify student session
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/admin/logout` - Admin logout
- `GET /api/auth/admin/check` - Verify admin session

### Students (Admin Only)
- `GET /api/students` - List all students
- `POST /api/students` - Create student manually
- `GET /api/students/[id]` - Get student details
- `PATCH /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Revoke access

### Progress
- `GET /api/progress` - Get current student's progress
- `PATCH /api/progress` - Update module progress

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## 🛡️ Security Notes

1. **JWT Secrets**: Use a strong, random 64+ character string
2. **Admin Password**: Use bcrypt with cost factor 12+
3. **Service Role Key**: Never expose on client side
4. **Webhook Signature**: Always verify Stripe signatures

## 📝 Common Tasks

### Manually Add a Student
1. Go to `/admin/students`
2. Click "Add Student"
3. Fill in details
4. Copy the generated temporary password
5. Email it to the student

### Revoke Student Access
1. Go to `/admin/students/[id]`
2. Click "Revoke Access"
3. Choose whether to also cancel Stripe subscription

### Check Why a Student Can't Login
1. Search for student in admin panel
2. Check `subscription_status`:
   - `past_due` = Payment failed
   - `canceled` = Subscription ended
   - `pending` = Never completed setup

## 🆘 Troubleshooting

### "Unauthorized" on Admin Login
- Verify `ADMIN_EMAIL` matches exactly
- Regenerate password hash if needed

### Students Not Being Created from Stripe
- Check webhook is receiving events in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Vercel function logs for errors

### Progress Not Saving
- Verify student has `active` subscription status
- Check browser console for API errors

---

Built with ❤️ for CyberMoe Academy
