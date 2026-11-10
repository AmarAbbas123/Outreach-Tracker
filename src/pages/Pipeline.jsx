const STAGES = [
  'New',
  'Contact Found',
  'Email Sent',
  'Follow-up Sent',
  'Replied',
  'Negotiating',
  'Agreed',
  'Link Live',
]

export default function Pipeline() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Drag prospects through the stages below.</p>
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          Add Prospect
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="min-w-48 bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600">{stage}</span>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">0</span>
            </div>
            <div className="min-h-24 rounded-lg border-2 border-dashed border-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-300">Empty</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

