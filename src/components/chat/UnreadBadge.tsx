interface UnreadBadgeProps {
  count: number
}

export const UnreadBadge = ({ count }: UnreadBadgeProps) => {
  if (count <= 0) {
    return null
  }

  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

