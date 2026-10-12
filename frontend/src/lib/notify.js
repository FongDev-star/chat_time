export const canNotify = () => 'Notification' in window

export const requestNotifyPermission = async () => {
  if (!canNotify()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  return await Notification.requestPermission()
}

export const showBrowserNotification = ({ title, body, tag, onClick }) => {
  if (!canNotify() || Notification.permission !== 'granted') return
  const n = new Notification(title, { body, tag })
  n.onclick = () => {
    window.focus()
    onClick?.()
    n.close()
  }
}