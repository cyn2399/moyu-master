import { cn } from '@/lib/utils'

interface IdentityAvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  crowned?: boolean
}

export function IdentityAvatar({ name, color, size = 'md', className, crowned = false }: IdentityAvatarProps) {
  return (
    <span
      className={cn('identity-avatar', `identity-avatar--${size}`, className)}
      style={{ '--avatar-color': color } as React.CSSProperties}
      aria-label={`${name}的匿名头像`}
    >
      <span className="avatar-orbit" aria-hidden="true" />
      <span className="avatar-initial" aria-hidden="true">{name.slice(0, 1)}</span>
      {crowned && <span className="avatar-crown" aria-hidden="true" />}
    </span>
  )
}
