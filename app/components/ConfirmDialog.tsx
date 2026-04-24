'use client'

type Props = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, onConfirm, onCancel,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#111111] border border-[#2a2a2a] rounded-xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-white font-semibold text-base mb-2">{title}</h2>
        <p className="text-sm text-[#9ca3af] leading-relaxed mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm text-[#9ca3af] border border-[#2a2a2a] hover:border-[#4b5563] hover:text-white px-4 py-2 rounded-lg transition-colors duration-150 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${
              danger
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[#CDFF00] text-black hover:bg-[#b8e600]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
