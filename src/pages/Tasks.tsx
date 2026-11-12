import { useState } from 'react'
import { Plus, CheckCircle2, Clock, AlertCircle, CheckSquare, ChevronDown } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskFilter = 'today' | 'overdue' | 'upcoming' | 'done'

interface Task {
  id: string
  title: string
  dueAt: string
  prospect?: string
  type: 'follow_up' | 'manual'
  isDone: boolean
}

const mockTasks: Task[] = []

// ─── Component ───────────────────────────────────────────────────────────────

export default function Tasks() {
  const [filter, setFilter] = useState<TaskFilter>('today')
  const [showModal, setShowModal] = useState(false)

  const tabs: { key: TaskFilter; label: string; count: number }[] = [
    { key: 'today',    label: 'Today',    count: 0 },
    { key: 'overdue',  label: 'Overdue',  count: 0 },
    { key: 'upcoming', label: 'Upcoming', count: 0 },
    { key: 'done',     label: 'Done',     count: 0 },
  ]

  const filtered = mockTasks.filter((t) => {
    if (filter === 'done') return t.isDone
    return !t.isDone
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your daily follow-up list. Nothing gets forgotten.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {key === 'overdue' && count > 0 && (
              <AlertCircle size={13} className="text-red-500" />
            )}
            {label}
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                key === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="text-green-600" size={22} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {filter === 'today' ? 'No tasks due today' :
             filter === 'overdue' ? 'No overdue tasks' :
             filter === 'upcoming' ? 'No upcoming tasks' : 'No completed tasks yet'}
          </h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            {filter === 'today' || filter === 'overdue'
              ? 'Tasks are created automatically when you mark an email as sent.'
              : 'Add a manual task or send an email to a prospect to generate follow-up tasks.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.map((task) => (
            <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <button className="text-gray-300 hover:text-green-500 transition-colors shrink-0">
                <CheckCircle2 size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                {task.prospect && (
                  <p className="text-xs text-gray-500">{task.prospect}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} /> {task.dueAt}
                </span>
                <button className="text-xs text-gray-400 hover:text-orange-600 border border-gray-200 px-2 py-1 rounded-lg hover:border-orange-300 transition-colors">
                  Snooze
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <TaskModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function TaskModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Add Task</h3>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
            <input type="text" placeholder="e.g. Follow up with example.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link to Prospect</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">None</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
