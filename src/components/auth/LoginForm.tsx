import axios from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Mail, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { getApiErrorMessage, login, resendVerification } from '../../api/authApi'
import type { User } from '../../types'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess: (token: string, user: User) => void
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setUnverifiedEmail(null)
    setResendMessage(null)
    setResendError(null)

    try {
      const response = await login(values)
      onSuccess(response.accessToken, response.user)
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to log in.')

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 403 &&
        message.toLowerCase().includes('email not verified')
      ) {
        setUnverifiedEmail(values.email)
      } else {
        setSubmitError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  })

  const handleResendVerification = async () => {
    const email = unverifiedEmail ?? getValues('email')

    if (!email) {
      return
    }

    setIsResending(true)
    setResendError(null)
    setResendMessage(null)

    try {
      await resendVerification(email)
      setResendMessage('Verification email sent. Check your inbox for the new link.')
    } catch (error) {
      setResendError(getApiErrorMessage(error, 'Unable to resend verification email.'))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {unverifiedEmail ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Your email is not verified yet.</p>
              <p className="mt-1 text-amber-700">
                Open the verification link in your inbox before signing in.
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResending ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                Resend verification link
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      {resendMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {resendMessage}
        </div>
      ) : null}

      {resendError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {resendError}
        </div>
      ) : null}

      <label className="block text-sm font-medium text-slate-700">
        Email
        <input
          type="email"
          autoComplete="email"
          {...register('email')}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          placeholder="you@example.com"
        />
        {errors.email ? (
          <span className="mt-2 block text-xs text-rose-600">{errors.email.message}</span>
        ) : null}
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Password
        <input
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          placeholder="Your password"
        />
        {errors.password ? (
          <span className="mt-2 block text-xs text-rose-600">{errors.password.message}</span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Log in
      </button>
    </form>
  )
}

