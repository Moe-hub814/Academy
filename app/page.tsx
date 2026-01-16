import { redirect } from 'next/navigation'

// For now, redirect to login
// You can replace this with your full homepage later
// or serve your existing static HTML files via the /public folder
export default function HomePage() {
  redirect('/login')
}
