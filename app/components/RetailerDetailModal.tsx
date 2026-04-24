'use client'

type Retailer = {
  id: number
  retailer: string
  category: string
  shopify: string
  area: string
  website: string
  linkedin: string
  contact_email: string
  decision_maker: string
  commercial_contact: string
  notes: string
  robots_txt: string
  last_researched_at: string
}

export default function RetailerDetailModal({ retailer, onClose }: { retailer: Retailer; onClose: () => void }) {
  function shopifyBadge(s: string) {
    if (s === 'Yes') return 'bg-[#CDFF00]/10 text-[#CDFF00] border-[#CDFF00]/20'
    if (s === 'No') return 'bg-red-500/10 text-red-400 border-red-500/20'
    return 'bg-[#2a2a2a] text-[#6b7280] border-[#2a2a2a]'
  }

  const date = retailer.last_researched_at
    ? new Date(retailer.last_researched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const Field = ({ label, value, href }: { label: string; value?: string; href?: string }) => {
    if (!value) return null
    return (
      <div>
        <div className="text-xs text-[#4b5563] mb-1 tracking-wide">{label}</div>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-sm text-[#CDFF00] hover:underline break-all">
            {value}
          </a>
        ) : (
          <div className="text-sm text-white break-words">{value}</div>
        )}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#2a2a2a] rounded-xl w-full max-w-xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#2a2a2a]">
          <div>
            <h2 className="text-white font-semibold text-base">{retailer.retailer}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              {retailer.area && <span className="text-xs text-[#6b7280]">{retailer.area}, London</span>}
              {retailer.area && retailer.shopify && <span className="text-[#2a2a2a]">·</span>}
              {retailer.shopify && (
                <span className={`text-xs px-2 py-0.5 rounded border ${shopifyBadge(retailer.shopify)}`}>
                  Shopify {retailer.shopify}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#4b5563] hover:text-white transition-colors duration-150 text-xl leading-none cursor-pointer ml-4 mt-0.5"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" value={retailer.category} />
            <Field label="Website" value={retailer.website} href={retailer.website} />
            <Field label="LinkedIn" value={retailer.linkedin} href={retailer.linkedin} />
            <Field label="Contact Email" value={retailer.contact_email} href={`mailto:${retailer.contact_email}`} />
          </div>

          {retailer.decision_maker && (
            <div>
              <div className="text-xs text-[#4b5563] mb-1 tracking-wide">Decision Maker</div>
              {retailer.decision_maker.includes('linkedin.com') ? (() => {
                const parts = retailer.decision_maker.split('—')
                const name = parts[0]?.trim()
                const url = parts[1]?.trim()
                return (
                  <div className="text-sm text-white">
                    {name}
                    {url && <> — <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#CDFF00] hover:underline">{url}</a></>}
                  </div>
                )
              })() : (
                <div className="text-sm text-white">{retailer.decision_maker}</div>
              )}
            </div>
          )}

          {retailer.commercial_contact && (
            <div>
              <div className="text-xs text-[#4b5563] mb-1 tracking-wide">Commercial Contact</div>
              {retailer.commercial_contact.includes('linkedin.com') ? (() => {
                const parts = retailer.commercial_contact.split('—')
                const name = parts[0]?.trim()
                const url = parts[1]?.trim()
                return (
                  <div className="text-sm text-white">
                    {name}
                    {url && <> — <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#CDFF00] hover:underline">{url}</a></>}
                  </div>
                )
              })() : (
                <div className="text-sm text-white">{retailer.commercial_contact}</div>
              )}
            </div>
          )}

          {retailer.notes && (
            <div>
              <div className="text-xs text-[#4b5563] mb-1 tracking-wide">Notes</div>
              <div className="text-sm text-[#9ca3af] leading-relaxed">{retailer.notes}</div>
            </div>
          )}

          {retailer.robots_txt && (
            <div>
              <div className="text-xs text-[#4b5563] mb-1 tracking-wide">robots.txt</div>
              <a href={retailer.robots_txt} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#6b7280] hover:text-[#CDFF00] transition-colors duration-150 break-all">
                {retailer.robots_txt}
              </a>
            </div>
          )}

          {date && (
            <div className="pt-2 border-t border-[#1a1a1a]">
              <span className="text-xs text-[#4b5563]">Last researched {date}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
