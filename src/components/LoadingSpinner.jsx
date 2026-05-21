export default function LoadingSpinner({ size = 20, color = '#3B82F6' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid rgba(255,255,255,0.2)`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  )
}

// Inject keyframe once (idempotent)
if (typeof document !== 'undefined' && !document.getElementById('__spinner_kf')) {
  const style = document.createElement('style')
  style.id = '__spinner_kf'
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(style)
}
