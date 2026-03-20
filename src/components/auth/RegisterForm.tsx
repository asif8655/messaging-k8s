import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { getApiErrorMessage, register } from '../../api/authApi'

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required.'),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess: (email: string) => void
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await register({ fullName, email, password })
      onSuccess(email)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Unable to create your account.'))
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {submitError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      <label className="block text-sm font-medium text-slate-700">
        Full Name
        <input
          type="text"
          autoComplete="name"
          {...registerField('fullName')}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          placeholder="Ava Patel"
        />
        {errors.fullName ? (
          <span className="mt-2 block text-xs text-rose-600">{errors.fullName.message}</span>
        ) : null}
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Email
        <input
          type="email"
          autoComplete="email"
          {...registerField('email')}
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
          autoComplete="new-password"
          {...registerField('password')}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          placeholder="At least 8 characters"
        />
        {errors.password ? (
          <span className="mt-2 block text-xs text-rose-600">{errors.password.message}</span>
        ) : null}
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Confirm Password
        <input
          type="password"
          autoComplete="new-password"
          {...registerField('confirmPassword')}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          placeholder="Repeat your password"
        />
        {errors.confirmPassword ? (
          <span className="mt-2 block text-xs text-rose-600">
            {errors.confirmPassword.message}
          </span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Create account
      </button>
    </form>
  )
}

