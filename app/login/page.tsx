import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import LoginForm from './LoginForm'

export default async function Login() {
  const user = await requireUser()
  if (user) redirect('/dashboard')
  return <LoginForm />
}
