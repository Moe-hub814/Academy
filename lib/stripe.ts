import Stripe from 'stripe'
import { supabaseAdmin } from './supabase'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

// ============================================
// STRIPE WEBHOOK HANDLERS
// ============================================

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const customerEmail = session.customer_email || session.customer_details?.email
  const customerName = session.customer_details?.name || 'Student'
  const subscriptionId = session.subscription as string

  // Determine tier from the price
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
  const priceId = lineItems.data[0]?.price?.id
  const tier = determineTierFromPrice(priceId)

  console.log(`Checkout completed: ${customerEmail}, tier: ${tier}`)

  // Check if student already exists
  const { data: existingStudent } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('email', customerEmail?.toLowerCase())
    .single()

  if (existingStudent) {
    // Reactivate existing student
    await supabaseAdmin
      .from('students')
      .update({
        subscription_status: 'active',
        tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingStudent.id)
  } else {
    // Will be created when they set their password via welcome email
    // For now, create a pending record
    await supabaseAdmin
      .from('pending_enrollments')
      .insert({
        email: customerEmail?.toLowerCase(),
        name: customerName,
        tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        created_at: new Date().toISOString()
      })
  }
}

export async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  console.log(`Payment failed for customer: ${customerId}`)

  // Find student by Stripe customer ID and update status
  const { error } = await supabaseAdmin
    .from('students')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error updating student status:', error)
  }

  // Log the failed payment
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (student) {
    await supabaseAdmin.from('payment_history').insert({
      student_id: student.id,
      stripe_payment_id: invoice.id,
      amount: invoice.amount_due / 100,
      status: 'failed',
      description: 'Subscription payment failed',
      created_at: new Date().toISOString()
    })
  }
}

export async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  console.log(`Payment succeeded for customer: ${customerId}`)

  // Reactivate student if they were past_due
  await supabaseAdmin
    .from('students')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId)

  // Log successful payment
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (student) {
    await supabaseAdmin.from('payment_history').insert({
      student_id: student.id,
      stripe_payment_id: invoice.id,
      amount: invoice.amount_paid / 100,
      status: 'succeeded',
      description: invoice.description || 'Subscription payment',
      created_at: new Date().toISOString()
    })
  }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  console.log(`Subscription canceled for customer: ${customerId}`)

  await supabaseAdmin
    .from('students')
    .update({
      subscription_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId)
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  let status: 'active' | 'past_due' | 'canceled' = 'active'

  if (subscription.status === 'past_due') {
    status = 'past_due'
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    status = 'canceled'
  }

  await supabaseAdmin
    .from('students')
    .update({
      subscription_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId)
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function determineTierFromPrice(priceId: string | undefined): 'self-paced' | 'mentorship' {
  const selfPacedPrices = [
    process.env.STRIPE_PRICE_SELF_PACED,
    process.env.STRIPE_PRICE_SELF_PACED_INSTALLMENT
  ]
  
  if (priceId && selfPacedPrices.includes(priceId)) {
    return 'self-paced'
  }
  
  return 'mentorship'
}

export async function getCustomerPaymentHistory(stripeCustomerId: string) {
  const invoices = await stripe.invoices.list({
    customer: stripeCustomerId,
    limit: 20
  })

  return invoices.data.map(invoice => ({
    id: invoice.id,
    amount: invoice.amount_paid / 100,
    status: invoice.status,
    date: new Date(invoice.created * 1000).toISOString(),
    description: invoice.description || 'Subscription payment'
  }))
}

export async function cancelStudentSubscription(stripeSubscriptionId: string) {
  return stripe.subscriptions.cancel(stripeSubscriptionId)
}
