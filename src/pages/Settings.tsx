import React, { useState, useEffect } from 'react'
import {
  User as UserIcon,
  Mail,
  Lock,
  Building2,
  Key,
  Bell,
  Check,
  AlertCircle,
  Save,
  Globe,
  Clock,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Download,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

interface ApiKeysState {
  openai: string
  hunter: string
  googleSerp: string
  webhookUrl: string
}

interface NotificationPrefs {
  emailDigest: boolean
  replyAlerts: boolean
  taskReminders: boolean
  soundEffects: boolean
}

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New York (EST/EDT - UTC-5/-4)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT - UTC-6/-5)' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT - UTC-7/-6)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (PST/PDT - UTC-8/-7)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST - UTC+0/+1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST - UTC+1/+2)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST - UTC+1/+2)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST - UTC+4)' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT - UTC+5)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - UTC+5:30)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - UTC+9)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT - UTC+10/+11)' },
]

export default function Settings() {
  const { user, updateUser } = useAuth()

  const [activeTab, setActiveTab] = useState<
    'profile' | 'outreach' | 'security' | 'workspace' | 'integrations' | 'notifications'
  >('profile')

  // Profile Form State
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC')
  const [followUpDays, setFollowUpDays] = useState<number>(user?.followUpDays || 3)
  const [signature, setSignature] = useState(
    user?.signature ||
      `Best regards,\n${user?.name || 'Your Name'}\nOutreach & Growth Lead\nOutreachTracker.io`
  )

  // Security Form State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Integrations State (Stored in localStorage)
  const [apiKeys, setApiKeys] = useState<ApiKeysState>(() => {
    try {
      const stored = localStorage.getItem('outreach_api_keys')
      return stored
        ? JSON.parse(stored)
        : { openai: '', hunter: '', googleSerp: '', webhookUrl: '' }
    } catch {
      return { openai: '', hunter: '', googleSerp: '', webhookUrl: '' }
    }
  })

  // Notifications State (Stored in localStorage)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() => {
    try {
      const stored = localStorage.getItem('outreach_notif_prefs')
      return stored
        ? JSON.parse(stored)
        : {
            emailDigest: true,
            replyAlerts: true,
            taskReminders: true,
            soundEffects: false,
          }
    } catch {
      return {
        emailDigest: true,
        replyAlerts: true,
        taskReminders: true,
        soundEffects: false,
      }
    }
  })

  // UI States
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [apiKeySuccess, setApiKeySuccess] = useState('')

  // Sync state when user object updates
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setTimezone(user.timezone || 'UTC')
      if (user.followUpDays) setFollowUpDays(user.followUpDays)
      if (user.signature) setSignature(user.signature)
    }
  }, [user])

  // Clear messages after 4 seconds
  useEffect(() => {
    if (successMsg || errorMsg || apiKeySuccess) {
      const timer = setTimeout(() => {
        setSuccessMsg('')
        setErrorMsg('')
        setApiKeySuccess('')
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg, errorMsg, apiKeySuccess])

  // Handle Profile / Outreach update
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        timezone,
        signature: signature.trim(),
        followUpDays: Number(followUpDays),
      }

      const res = await api.put('/auth/me', payload)
      if (res.data?.success) {
        updateUser(res.data.data)
        setSuccessMsg('Profile and preferences updated successfully!')
      } else {
        setErrorMsg(res.data?.message || 'Failed to update profile')
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error updating profile settings')
    } finally {
      setSaving(false)
    }
  }

  // Handle Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      setErrorMsg('Please enter a new password')
      return
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match')
      return
    }

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await api.put('/auth/me', { password: newPassword })
      if (res.data?.success) {
        setSuccessMsg('Password updated successfully!')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setErrorMsg(res.data?.message || 'Failed to update password')
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  // Handle Save API Keys
  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('outreach_api_keys', JSON.stringify(apiKeys))
    setApiKeySuccess('API keys and integrations saved successfully!')
  }

  // Handle Save Notification Preferences
  const handleToggleNotif = (key: keyof NotificationPrefs) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] }
      localStorage.setItem('outreach_notif_prefs', JSON.stringify(updated))
      return updated
    })
  }

  const tabs = [
    { id: 'profile', label: 'Profile & Account', icon: UserIcon },
    { id: 'outreach', label: 'Email & Outreach Defaults', icon: Mail },
    { id: 'security', label: 'Security & Password', icon: Lock },
    { id: 'workspace', label: 'Workspace & Plan', icon: Building2 },
    { id: 'integrations', label: 'API Keys & Connectors', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 tracking-tight flex items-center gap-2">
            <span>Settings & Preferences</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
              Workspace Settings
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your personal profile, email signature, outreach defaults, API keys, and workspace controls.
          </p>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in">
            <Check size={14} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in">
            <AlertCircle size={14} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* ─── Navigation Tabs & Content Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-2 shadow-2xs space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id)
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                  activeTab === id
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} className={activeTab === id ? 'text-indigo-600' : 'text-gray-400'} />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          {/* Quick Info Box */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/40 border border-indigo-100/70 text-xs text-gray-600 space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-medium">
              <Sparkles size={14} />
              <span>Autonomous Outreach Engine</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Preferences like default follow-up cadence and email signatures automatically populate new pitch campaigns and scheduled tasks.
            </p>
          </div>
        </div>

        {/* Active Tab Panel */}
        <div className="lg:col-span-9">
          {/* ─── Tab 1: Profile & Account ────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Account Profile</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update your display name and regional time zone settings.
                </p>
              </div>

              {/* User Avatar & Role Badge */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium text-xl flex items-center justify-center shrink-0 shadow-2xs">
                  {name
                    ? name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">{name || 'Your Account'}</h4>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {user?.role === 'owner' ? 'Workspace Owner' : 'Team Member'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{email}</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      required
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Timezone */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <Globe size={13} className="text-indigo-600" />
                      <span>Preferred Timezone</span>
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-indigo-600" />
                      <span>Permission Level</span>
                    </label>
                    <input
                      type="text"
                      value={user?.role || 'owner'}
                      disabled
                      className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 text-gray-500 uppercase font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-2xs transition-colors disabled:opacity-60"
                  >
                    <Save size={13} />
                    <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── Tab 2: Email & Outreach Defaults ───────────────────────────────── */}
          {activeTab === 'outreach' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Email & Pitch Defaults</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Set default follow-up cadence, signatures, and pitch sequences.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Follow-up cadence */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-indigo-600" />
                    <span>Default Follow-up Delay</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Number of days to automatically schedule a follow-up task after initial pitch.
                  </p>
                  <div className="flex items-center gap-3">
                    {[2, 3, 5, 7].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setFollowUpDays(days)}
                        className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all ${
                          followUpDays === days
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={followUpDays}
                        onChange={(e) => setFollowUpDays(Number(e.target.value))}
                        className="w-16 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-center font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-gray-500">custom</span>
                    </div>
                  </div>
                </div>

                {/* Email Signature */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Default Email Signature
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Appended to pitch templates and outbound emails sent from OutreachTracker.
                  </p>
                  <textarea
                    rows={4}
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Best regards,..."
                    className="w-full p-3 text-xs font-mono border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white leading-relaxed"
                  />
                </div>

                {/* Live Signature Preview */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80">
                  <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Signature Preview
                  </div>
                  <div className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed border-l-2 border-indigo-300 pl-3">
                    {signature || 'No signature configured.'}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-2xs transition-colors disabled:opacity-60"
                  >
                    <Save size={13} />
                    <span>{saving ? 'Saving...' : 'Save Outreach Defaults'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── Tab 3: Security & Password ─────────────────────────────────────── */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Security & Authentication</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update your login password and review active workspace sessions.
                </p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    New Password (min. 8 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-2xs transition-colors disabled:opacity-60"
                >
                  <Lock size={13} />
                  <span>{saving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </form>

              {/* Security Session Info */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-medium text-gray-800 mb-2">Active Session</h4>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <span className="font-medium text-gray-800">Current Web Session</span>
                      <p className="text-[11px] text-gray-400">Authenticated with JWT Bearer Token</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab 4: Workspace & Plan ────────────────────────────────────────── */}
          {activeTab === 'workspace' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Workspace & Subscription</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Workspace scope, team limits, and subscription tier.
                </p>
              </div>

              {/* Plan Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                    Active Plan
                  </span>
                  <h4 className="text-lg font-semibold text-gray-900 mt-1.5">
                    Growth Outreach Engine
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Unlimited campaigns, automated follow-up cadences, and ROI reporting.
                  </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <div className="text-2xl font-semibold text-indigo-600">$49<span className="text-xs text-gray-400 font-normal">/mo</span></div>
                  <span className="text-[10px] text-emerald-600 font-medium">Active Renewal</span>
                </div>
              </div>

              {/* Quotas & Capacity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50">
                  <span className="text-[10px] font-medium text-gray-400 uppercase">Monthly Prospects</span>
                  <p className="text-base font-semibold text-gray-800 mt-0.5">50,000 / mo</p>
                  <p className="text-[10px] text-gray-400">Scraper & CSV import</p>
                </div>
                <div className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50">
                  <span className="text-[10px] font-medium text-gray-400 uppercase">Campaign Slots</span>
                  <p className="text-base font-semibold text-gray-800 mt-0.5">Unlimited</p>
                  <p className="text-[10px] text-gray-400">Active link projects</p>
                </div>
                <div className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50">
                  <span className="text-[10px] font-medium text-gray-400 uppercase">Email Templates</span>
                  <p className="text-base font-semibold text-gray-800 mt-0.5">Unlimited</p>
                  <p className="text-[10px] text-gray-400">Merge variables supported</p>
                </div>
              </div>

              {/* Data Export Action */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-800">Export Workspace Data</h4>
                  <p className="text-[11px] text-gray-400">
                    Download full archives of your campaigns, prospects, and won links.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const data = {
                      user: { name, email, timezone },
                      exportedAt: new Date().toISOString(),
                    }
                    const blob = new Blob([JSON.stringify(data, null, 2)], {
                      type: 'application/json',
                    })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `workspace-backup-${new Date().toISOString().substring(0, 10)}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors shadow-2xs shrink-0"
                >
                  <Download size={13} className="text-indigo-600" />
                  <span>Download Backup JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* ─── Tab 5: API Keys & Connectors ────────────────────────────────────── */}
          {activeTab === 'integrations' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">API Keys & External Connectors</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Configure external email finder APIs, AI pitch generators, and webhooks.
                </p>
              </div>

              {apiKeySuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>{apiKeySuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveApiKeys} className="space-y-4">
                {/* OpenAI Key */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>OpenAI API Key (Pitch Generator & AI Clean)</span>
                    <span className="text-[10px] text-gray-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="password"
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                    placeholder="sk-proj-..."
                    className="w-full px-3.5 py-2 text-xs font-mono border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Enables autonomous AI pitch personalization and email cleaning tools.
                  </p>
                </div>

                {/* Hunter.io */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>Hunter.io API Key (Email Discovery)</span>
                    <span className="text-[10px] text-gray-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="password"
                    value={apiKeys.hunter}
                    onChange={(e) => setApiKeys({ ...apiKeys, hunter: e.target.value })}
                    placeholder="api_key_..."
                    className="w-full px-3.5 py-2 text-xs font-mono border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Used to discover decision-maker emails directly from prospect domains.
                  </p>
                </div>

                {/* Google Serp Key */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>Google Search / SERP API Key</span>
                    <span className="text-[10px] text-gray-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="password"
                    value={apiKeys.googleSerp}
                    onChange={(e) => setApiKeys({ ...apiKeys, googleSerp: e.target.value })}
                    placeholder="serp_api_..."
                    className="w-full px-3.5 py-2 text-xs font-mono border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                </div>

                {/* Webhook Notifications */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>Inbound Webhook Endpoint</span>
                    <span className="text-[10px] text-gray-400 font-normal">Slack / Discord / Zapier</span>
                  </label>
                  <input
                    type="url"
                    value={apiKeys.webhookUrl}
                    onChange={(e) => setApiKeys({ ...apiKeys, webhookUrl: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3.5 py-2 text-xs font-mono border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-2xs transition-colors"
                  >
                    <Save size={13} />
                    <span>Save API Keys</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── Tab 6: Notifications ───────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Notification Preferences</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Choose how and when OutreachTracker alerts you about replies and tasks.
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {/* Email Daily Digest */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-800">Daily Morning Briefing</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Receive an executive summary email every morning with today's follow-ups.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotif('emailDigest')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifPrefs.emailDigest ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifPrefs.emailDigest ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Instant Reply Alerts */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-800">Prospect Reply Alerts</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Get real-time notification alerts when a prospect answers your pitch.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotif('replyAlerts')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifPrefs.replyAlerts ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifPrefs.replyAlerts ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Overdue Task Reminders */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-800">Overdue Task Warnings</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Highlight missed follow-ups and overdue deadlines with banner badges.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotif('taskReminders')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifPrefs.taskReminders ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifPrefs.taskReminders ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound Effects */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-800">Audio Feedback Chimes</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Play subtle audio cues when marking tasks complete or winning backlink placements.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotif('soundEffects')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifPrefs.soundEffects ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifPrefs.soundEffects ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
