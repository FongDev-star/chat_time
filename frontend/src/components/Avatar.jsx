import { displayName } from '../lib/utils'

function Avatar({ user, size = 44, online = false }) {
  const name = displayName(user)
  const style = { width: size, height: size }

  const picture = user?.imageUrl ? (
    <img
      src={user.imageUrl}
      alt={name}
      style={style}
      className="rounded-full object-cover"
    />
  ) : (
    <div
      style={style}
      className="flex items-center justify-center rounded-full bg-emerald-600 font-semibold"
    >
      {name[0].toUpperCase()}
    </div>
  )

  return (
    <div className="relative shrink-0">
      {picture}
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-800 bg-green-400" />
      )}
    </div>
  )
}

export default Avatar