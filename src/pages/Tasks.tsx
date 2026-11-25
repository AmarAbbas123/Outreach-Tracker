import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  CheckSquare,
  ChevronDown,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  Mail,
  Send,
  Sparkles,
  ArrowRight,
  Check,
  Briefcase,
  Layers,
} from 'lucide-react'
import api from '../api/client'

// ─── Types ───────────────────────────────────────────────────────────────────

export type TaskFilter = 'today' | 'overdue' | 'upcoming' | 'done'

export interface Task {
  _id: string
  title: string
  dueAt: string
  type: 'follow_up' | 'manual'
  isDone: boolean
  doneAt?: string
  prospect?: {
    _id: string
    domain: string
    contactName?: string
    contactEmail?: string
    status?: string
    campaign?: {
      _id: string
      name: string
    }
  }
  createdAt: string
  updatedAt: string
}

interface ProspectOption {
  _id: string
  domain: string
  contactName?: string
  contactEmail?: string
}

interface TaskCounts {
  today: number
  overdue: number
  upcoming: number
  done: number
  urgentTotal: number
}

export default function Tasks() {
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<TaskFilter>('today')
  const [showAddModal, setShowAddModal] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [snoozeMenuTaskId, setSnoozeMenuTaskId] = useState<string | null>(null)
  const [customSnoozeTaskId, setCustomSnoozeTaskId] = useState<string | null>(null)
  const [customSnoozeDate, setCustomSnoozeDate] = useState('')
  const [followupOfferTask, setFollowupOfferTask] = useState<Task | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch counts for tabs and sidebar
  const { data: countsData } = useQuery<{ data: TaskCounts }>({
    queryKey: ['task-counts'],
    queryFn: async () => {
      const res = await api.get('/tasks/counts')
      return res.data
    },
    refetchInterval: 15000, // keep counts fresh
  })

  const counts: TaskCounts = countsData?.data || {
    today: 0,
    overdue: 0,
    upcoming: 0,
    done: 0,
    urgentTotal: 0,
  }

  // Fetch tasks for the active tab filter
  const { data: tasksData, isLoading } = useQuery<{ tasks: Task[] }>({
    queryKey: ['tasks', filter],
    queryFn: async () => {
      const res = await api.get(`/tasks?filter=${filter}&limit=100`)
      return res.data?.data
    },
  })

  const tasks = tasksData?.tasks || []

  // Create Task Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/tasks', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
      setShowAddModal(false)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to create task.')
    },
  })

  // Update Task Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await api.put(`/tasks/${id}`, updates)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
      setTaskToEdit(null)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to update task.')
    },
  })

  // Complete / Toggle Task Mutation
  const completeMutation = useMutation({
    mutationFn: async (task: Task) => {
      const res = await api.patch(`/tasks/${task._id}/complete`)
      return { data: res.data, task }
    },
    onSuccess: ({ task }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
      // If completing an unfinished follow_up task, offer to open compose follow-up
      if (!task.isDone && task.type === 'follow_up') {
        setFollowupOfferTask(task)
      }
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to update task.')
    },
  })

  // Snooze Task Mutation
  const snoozeMutation = useMutation({
    mutationFn: async ({ id, days, customDate }: { id: string; days?: number; customDate?: string }) => {
      const res = await api.patch(`/tasks/${id}/snooze`, { days, customDate })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
      setSnoozeMenuTaskId(null)
      setCustomSnoozeTaskId(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to snooze task.')
    },
  })

  // Delete Task Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/tasks/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
      setTaskToDelete(null)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to delete task.')
    },
  })

  const tabs: { key: TaskFilter; label: string; count: number }[] = [
    { key: 'today',    label: 'Today',    count: counts.today },
    { key: 'overdue',  label: 'Overdue',  count: counts.overdue },
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { key: 'done',     label: 'Done',     count: counts.done },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Tasks & Follow-ups</span>
            {counts.urgentTotal > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                {counts.urgentTotal} due now
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Your daily action list. Auto-scheduled follow-ups and manual to-dos so no lead goes cold.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shrink-0"
        >
          <Plus size={15} /> Add Task
        </button>
      </div>

      {/* Follow-up compose offer banner (Acceptance criterion) */}
      {followupOfferTask && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Mail size={16} className="text-indigo-600 shrink-0" />
            <div>
              <p className="font-bold">Follow-up Task Completed!</p>
              <p className="text-indigo-700 text-[11px] mt-0.5">
                Ready to send follow-up #2 to{' '}
                <strong>{followupOfferTask.prospect?.domain || 'this prospect'}</strong>?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFollowupOfferTask(null)}
              className="px-3 py-1.5 border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-100/60 font-semibold text-xs"
            >
              Dismiss
            </button>
            <Link
              to="/app/templates"
              onClick={() => setFollowupOfferTask(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 shadow-2xs"
            >
              <span>Open Templates to Send</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Task Action Notice</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Tabs with Live Count Badges */}
      <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar border border-gray-200/60 shrink-0">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              filter === key
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
            }`}
          >
            {key === 'overdue' && count > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
            <span>{label}</span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                key === 'overdue' && count > 0
                  ? 'bg-rose-100 text-rose-700'
                  : filter === key
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-gray-200/70 text-gray-600'
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-gray-100 rounded w-1/4" />
          <div className="h-14 bg-gray-50 rounded" />
          <div className="h-14 bg-gray-50 rounded" />
          <div className="h-14 bg-gray-50 rounded" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckSquare size={26} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {filter === 'today'
              ? 'All caught up for today!'
              : filter === 'overdue'
              ? 'Zero overdue tasks!'
              : filter === 'upcoming'
              ? 'No upcoming tasks scheduled'
              : 'No completed tasks yet'}
          </h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            {filter === 'today' || filter === 'overdue'
              ? 'Follow-up tasks generate automatically when you log an outreach email, or you can add manual to-dos.'
              : 'Add tasks for your link prospects or campaign review sessions.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
          >
            <Plus size={15} /> Add Task
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 divide-y divide-gray-100 overflow-hidden shadow-xs">
          {tasks.map((task) => {
            const isOverdue = filter === 'overdue' || (!task.isDone && new Date(task.dueAt) < new Date())

            return (
              <div
                key={task._id}
                className={`p-4 sm:px-6 sm:py-4 hover:bg-gray-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  task.isDone ? 'opacity-60 bg-gray-50/40' : isOverdue ? 'bg-rose-50/20' : ''
                }`}
              >
                {/* Left: Complete toggle + Title + Prospect */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => completeMutation.mutate(task)}
                    className={`mt-0.5 text-gray-300 hover:text-emerald-600 transition-colors shrink-0 ${
                      task.isDone ? 'text-emerald-600' : ''
                    }`}
                    title={task.isDone ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    <CheckCircle2 size={20} className={task.isDone ? 'fill-emerald-100 text-emerald-600' : ''} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold truncate ${
                          task.isDone ? 'line-through text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {task.title}
                      </span>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          task.type === 'follow_up'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {task.type === 'follow_up' ? 'Follow-Up' : 'Manual To-Do'}
                      </span>

                      {isOverdue && !task.isDone && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          Overdue
                        </span>
                      )}
                    </div>

                    {/* Prospect attachment info */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 flex-wrap">
                      {task.prospect ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 bg-gray-100/70 px-2 py-0.5 rounded-md">
                          <span>Prospect:</span>
                          <strong className="text-gray-900">{task.prospect.domain}</strong>
                          {task.prospect.contactName && <span>({task.prospect.contactName})</span>}
                        </span>
                      ) : (
                        <span className="text-gray-400">General outreach task</span>
                      )}

                      {task.prospect?.campaign?.name && (
                        <span className="text-indigo-600 font-medium">
                          • {task.prospect.campaign.name}
                        </span>
                      )}

                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <Clock size={11} />
                        Due {new Date(task.dueAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Snooze & Edit & Delete Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center relative">
                  {/* Snooze Dropdown */}
                  {!task.isDone && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setSnoozeMenuTaskId(snoozeMenuTaskId === task._id ? null : task._id)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 transition-colors"
                        title="Snooze task"
                      >
                        <Clock size={12} />
                        <span>Snooze</span>
                        <ChevronDown size={11} />
                      </button>

                      {snoozeMenuTaskId === task._id && (
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in text-xs font-medium">
                          <button
                            onClick={() => snoozeMutation.mutate({ id: task._id, days: 1 })}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between"
                          >
                            <span>Snooze 1 Day</span>
                            <span className="text-gray-400 text-[10px]">+1d</span>
                          </button>
                          <button
                            onClick={() => snoozeMutation.mutate({ id: task._id, days: 3 })}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between"
                          >
                            <span>Snooze 3 Days</span>
                            <span className="text-gray-400 text-[10px]">+3d</span>
                          </button>
                          <button
                            onClick={() => {
                              setCustomSnoozeTaskId(task._id)
                              setSnoozeMenuTaskId(null)
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-indigo-600 font-semibold"
                          >
                            Pick Custom Date…
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit */}
                  <button
                    onClick={() => setTaskToEdit(task)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit Task"
                  >
                    <Edit2 size={14} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setTaskToDelete(task)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Custom Date Snooze Modal ────────────────────────────────────────── */}
      {customSnoozeTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setCustomSnoozeTaskId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Snooze Task</h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Select New Due Date</label>
              <input
                type="date"
                min={new Date().toISOString().substring(0, 10)}
                value={customSnoozeDate}
                onChange={(e) => setCustomSnoozeDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCustomSnoozeTaskId(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={!customSnoozeDate || snoozeMutation.isPending}
                onClick={() =>
                  snoozeMutation.mutate({ id: customSnoozeTaskId, customDate: customSnoozeDate })
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {snoozeMutation.isPending ? 'Snoozing...' : 'Confirm Snooze'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create / Edit Task Modal ────────────────────────────────────────── */}
      {(showAddModal || taskToEdit) && (
        <TaskFormModal
          title={taskToEdit ? 'Edit Task' : 'New Task'}
          initialData={
            taskToEdit
              ? {
                  title: taskToEdit.title,
                  dueAt: taskToEdit.dueAt ? taskToEdit.dueAt.substring(0, 10) : '',
                  type: taskToEdit.type,
                  prospect: taskToEdit.prospect?._id || '',
                }
              : {
                  title: '',
                  dueAt: new Date().toISOString().substring(0, 10),
                  type: 'manual',
                  prospect: '',
                }
          }
          onClose={() => {
            setShowAddModal(false)
            setTaskToEdit(null)
          }}
          onSubmit={(values) => {
            if (taskToEdit) {
              updateMutation.mutate({ id: taskToEdit._id, updates: values })
            } else {
              createMutation.mutate(values)
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* ─── Delete Confirmation Modal ──────────────────────────────────────── */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setTaskToDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Task?</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to delete task <strong>"{taskToDelete.title}"</strong>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(taskToDelete._id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Task Form Modal ──────────────────────────────────────────────────────────

function TaskFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  title: string
  initialData: { title: string; dueAt: string; type: 'follow_up' | 'manual'; prospect: string }
  onClose: () => void
  onSubmit: (values: any) => void
  isSubmitting: boolean
}) {
  const [taskTitle, setTaskTitle] = useState(initialData.title)
  const [dueAt, setDueAt] = useState(initialData.dueAt)
  const [type, setType] = useState<'follow_up' | 'manual'>(initialData.type)
  const [prospectId, setProspectId] = useState(initialData.prospect)

  // Fetch prospects for selector
  const { data: prospectsData } = useQuery<{ prospects: ProspectOption[] }>({
    queryKey: ['prospects-for-task-form'],
    queryFn: async () => {
      const res = await api.get('/prospects?limit=100')
      return res.data?.data
    },
  })

  const prospects = prospectsData?.prospects || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title: taskTitle.trim(),
      dueAt,
      type,
      prospect: prospectId || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Task Description / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Send Follow-up #2 with case study link"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Task Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'follow_up' | 'manual')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="follow_up">Follow-Up</option>
                <option value="manual">Manual To-Do</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Link to Prospect (Optional)
            </label>
            <select
              value={prospectId}
              onChange={(e) => setProspectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">None (General Task)</option>
              {prospects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.domain} {p.contactName ? `(${p.contactName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !taskTitle.trim() || !dueAt}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
