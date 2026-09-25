import { ArrowUpRight, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

const SERVICE_OPTIONS = ['Brand', 'Digital', 'Campaign', 'Other'] as const

export function ServicePills() {
  const [services, setServices] = useState<string[]>([])

  const toggleService = (option: string) => {
    setServices((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-medium tracking-tight mb-2">What sort of service?</h2>
      <p className="opacity-85 text-[#738273] mb-8">Select all that apply</p>

      <div className="flex flex-wrap gap-3 mb-6">
        {SERVICE_OPTIONS.map((option) => {
          const isActive = services.includes(option)

          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => toggleService(option)}
              whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-[#1C2E1E] text-white shadow-md shadow-emerald-950/5 transform'
                  : 'bg-white text-[#1C2E1E] border border-[#F1F3F1] hover:bg-[#F1F3F1]/55'
              }`}
            >
              <AnimatePresence initial={false}>
                {isActive ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, y: -8, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0, y: -8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="inline-flex"
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  </motion.span>
                ) : null}
              </AnimatePresence>
              {option}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {services.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="italic text-xs"
          >
            Please click to select services above.
          </motion.p>
        ) : (
          <motion.div
            key="active"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#FAFBF9] border border-[#E7EBE6] rounded-2xl px-5 py-4">
              <p className="text-sm text-[#1C2E1E]">
                Ready to inquire about: {services.join(', ')}
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-1.5 self-start sm:self-auto text-[#4D6D47] uppercase text-xs tracking-wide font-medium hover:opacity-70 transition-opacity"
              >
                Let's Go
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
