interface PageShellProps {
  title: string
  description?: string
  cta?: string
}

export default function PageShell({ title, description, cta }: PageShellProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        {cta && (
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            {cta}
          </button>
        )}
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <p className="text-gray-400 text-sm">No data yet.</p>
        {cta && (
          <button className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
            {cta}
          </button>
        )}
      </div>
    </div>
  )
}

