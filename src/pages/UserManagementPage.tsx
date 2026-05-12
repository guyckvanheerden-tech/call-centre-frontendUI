import { useState, useRef, useCallback, useEffect } from 'react'
import { UserCheck, UserX, PenLine, Check, X, ImagePlus, Trash2, UserPlus } from 'lucide-react'
import { useUsers, useUpdateUser, useCreateUser } from '@/hooks/useUsers'
import type { User, UserRole } from '@/types'
import { cn, formatRelative } from '@/lib/utils'

const roleConfig: Record<UserRole, { label: string; color: string; bg: string }> = {
  admin:       { label: 'Admin',       color: 'text-purple-700', bg: 'bg-purple-50'  },
  agent:       { label: 'Agent',       color: 'text-emerald-700', bg: 'bg-emerald-50' },
  super_admin: { label: 'Super Admin', color: 'text-blue-700',   bg: 'bg-blue-50'    },
}

const ACCEPTED = 'image/png,image/jpeg'

export default function UserManagementPage() {
  const { data: users = [] } = useUsers()
  const updateUserMutation   = useUpdateUser()
  const addUserMutation      = useCreateUser()
  const updateUser = (id: string, patch: Partial<User>) => updateUserMutation.mutate({ id, patch })
  const [filter,       setFilter]       = useState<UserRole | 'all'>('all')
  const [sigEditId,    setSigEditId]    = useState<string | null>(null)
  const [sigDraft,     setSigDraft]     = useState('')
  const [imgDraft,     setImgDraft]     = useState<string | undefined>(undefined)
  const [showAddUser,  setShowAddUser]  = useState(false)

  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter)
  const counts: Record<string, number> = { all: users.length }
  users.forEach((u) => { counts[u.role] = (counts[u.role] || 0) + 1 })

  const openSigEditor = (user: User) => {
    setSigEditId(user.id)
    setSigDraft(user.signature ?? '')
    setImgDraft(user.signatureImage)
  }
  const saveSig = (userId: string) => {
    updateUser(userId, { signature: sigDraft, signatureImage: imgDraft })
    setSigEditId(null)
  }
  const cancelSig = () => setSigEditId(null)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} users · {users.filter((u) => u.enabled).length} active
          </p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
        >
          <UserPlus size={13} />
          Add User
        </button>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'admin', 'agent'] as const).map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === role
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            {role === 'all' ? 'All' : roleConfig[role].label}
            <span className={cn(
              'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]',
              filter === role ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            )}>
              {counts[role] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onAdd={(input) => {
            addUserMutation.mutate(input, { onSuccess: () => setShowAddUser(false) })
          }}
          existingEmails={users.map((u) => u.email.toLowerCase())}
        />
      )}

      {/* User cards */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {filtered.map((user) => (
          <div key={user.id}>
            {/* User row */}
            <div className={cn(
              'flex items-center gap-4 px-5 py-4 transition-colors',
              !user.enabled && 'opacity-60',
              sigEditId === user.id && 'bg-blue-50/40'
            )}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs text-white font-semibold flex-shrink-0">
                {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                <div className="text-xs text-gray-400 truncate">{user.email}</div>
              </div>
              <select
                value={user.role}
                onChange={(e) => updateUser(user.id, { role: e.target.value as UserRole })}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-medium border-0 outline-none cursor-pointer flex-shrink-0',
                  roleConfig[user.role].bg, roleConfig[user.role].color
                )}
              >
                {Object.entries(roleConfig).map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
              <span className={cn(
                'hidden sm:inline-flex items-center gap-1.5 text-xs font-medium flex-shrink-0',
                user.enabled ? 'text-emerald-700' : 'text-gray-400'
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', user.enabled ? 'bg-emerald-500' : 'bg-gray-300')} />
                {user.enabled ? 'Active' : 'Disabled'}
              </span>
              <span className="hidden md:block text-xs text-gray-400 flex-shrink-0 w-24 text-right">
                {formatRelative(user.createdAt)}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => sigEditId === user.id ? cancelSig() : openSigEditor(user)}
                  title="Edit email signature"
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    sigEditId === user.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  )}
                >
                  <PenLine size={12} />
                  <span className="hidden sm:inline">Signature</span>
                  {(user.signature || user.signatureImage) && sigEditId !== user.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Signature set" />
                  )}
                </button>
                <button
                  onClick={() => updateUser(user.id, { enabled: !user.enabled })}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    user.enabled
                      ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  )}
                >
                  {user.enabled
                    ? <><UserX size={12} /><span className="hidden sm:inline">Disable</span></>
                    : <><UserCheck size={12} /><span className="hidden sm:inline">Enable</span></>
                  }
                </button>
              </div>
            </div>

            {/* Inline signature editor */}
            {sigEditId === user.id && (
              <SignatureEditor
                user={user}
                sigDraft={sigDraft}
                imgDraft={imgDraft}
                onSigChange={setSigDraft}
                onImgChange={setImgDraft}
                onSave={() => saveSig(user.id)}
                onCancel={cancelSig}
                onRemoveAll={() => {
                  updateUser(user.id, { signature: '', signatureImage: undefined })
                  cancelSig()
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Signature editor panel ───────────────────────────────────────────────────

interface EditorProps {
  user: User
  sigDraft: string
  imgDraft: string | undefined
  onSigChange: (v: string) => void
  onImgChange: (v: string | undefined) => void
  onSave: () => void
  onCancel: () => void
  onRemoveAll: () => void
}

function SignatureEditor({ user, sigDraft, imgDraft, onSigChange, onImgChange, onSave, onCancel, onRemoveAll }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [imgError, setImgError] = useState('')

  const loadFile = useCallback((file: File) => {
    setImgError('')
    if (!file.type.startsWith('image/png') && !file.type.startsWith('image/jpeg')) {
      setImgError('Only PNG and JPEG files are supported.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setImgError('Image must be under 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => onImgChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [onImgChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
    e.target.value = ''
  }

  const hasContent = sigDraft.trim() || imgDraft

  return (
    <div className="px-5 pb-5 pt-2 bg-blue-50/30 border-t border-blue-100 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <PenLine size={12} className="text-blue-500" />
          Email signature for <span className="text-blue-700">{user.name}</span>
        </label>
        <span className="text-[10px] text-gray-400">Appended to every outbound reply</span>
      </div>

      {/* Text signature */}
      <div>
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
          Signature text
        </label>
        <textarea
          value={sigDraft}
          onChange={(e) => onSigChange(e.target.value)}
          rows={4}
          placeholder={`e.g.\nKind regards,\n${user.name}\nSupport Agent | SupportDesk\n${user.email}`}
          className="w-full text-sm text-gray-800 font-mono border border-blue-200 rounded-lg px-3 py-2.5 outline-none resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white leading-relaxed placeholder-gray-300"
          autoFocus
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
          Signature image <span className="normal-case font-normal">(PNG or JPEG, max 2 MB)</span>
        </label>

        {imgDraft ? (
          /* Image preview */
          <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
            <img
              src={imgDraft}
              alt="Signature"
              className="max-h-16 max-w-[200px] object-contain rounded border border-gray-100"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 font-medium">Image uploaded</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Will appear below signature text</p>
            </div>
            <button
              onClick={() => { onImgChange(undefined); setImgError('') }}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 flex-shrink-0 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 size={11} />
              Remove
            </button>
          </div>
        ) : (
          /* Drop zone */
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
              dragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
            )}
          >
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              dragging ? 'bg-blue-100' : 'bg-gray-100'
            )}>
              <ImagePlus size={16} className={dragging ? 'text-blue-500' : 'text-gray-400'} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-700">
                {dragging ? 'Drop image here' : 'Drop image here, or click to browse'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">PNG or JPEG · max 2 MB · recommended max 300 × 100 px</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {imgError && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <X size={11} /> {imgError}
          </p>
        )}
      </div>

      {/* Live preview */}
      {hasContent && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Preview</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 border-t border-dashed border-gray-200" />
            <span className="text-[10px] text-gray-300">signature</span>
          </div>
          {sigDraft.trim() && (
            <pre className="text-xs text-gray-500 font-sans whitespace-pre-wrap leading-relaxed mb-2">
              {sigDraft}
            </pre>
          )}
          {imgDraft && (
            <img
              src={imgDraft}
              alt="Signature preview"
              className="max-h-16 max-w-[240px] object-contain"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Check size={12} />
          Save Signature
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:bg-gray-100 text-xs font-medium rounded-lg transition-colors"
        >
          <X size={12} />
          Cancel
        </button>
        {(user.signature || user.signatureImage) && (
          <button
            onClick={onRemoveAll}
            className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:underline"
          >
            <Trash2 size={11} />
            Remove signature
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Add User Modal ────────────────────────────────────────────────────────────

interface AddUserInput { name: string; email: string; role: UserRole; password: string }

function AddUserModal({ onClose, onAdd, existingEmails }: {
  onClose: () => void
  onAdd: (input: AddUserInput) => void
  existingEmails: string[]
}) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState<UserRole>('agent')
  const [emailErr, setEmailErr] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const validateEmail = (v: string) => {
    if (!v.includes('@')) return 'Enter a valid email address.'
    if (existingEmails.includes(v.toLowerCase())) return 'A user with this email already exists.'
    return ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateEmail(email.trim())
    if (err) { setEmailErr(err); return }
    if (!name.trim() || !password.trim()) return
    onAdd({ name: name.trim(), email: email.trim().toLowerCase(), role, password })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus size={15} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Add New User</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Botha"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailErr('') }}
              onBlur={() => { if (email) setEmailErr(validateEmail(email.trim())) }}
              placeholder="sarah@company.com"
              className={cn(
                'w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300',
                emailErr ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-blue-400'
              )}
              required
            />
            {emailErr && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <X size={11} /> {emailErr}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              minLength={8}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(roleConfig) as [UserRole, typeof roleConfig[UserRole]][]).map(([r, cfg]) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-left',
                    role === r
                      ? `${cfg.bg} ${cfg.color} border-current ring-2 ring-blue-100`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <span className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    role === r ? cfg.color.replace('text-', 'bg-') : 'bg-gray-300'
                  )} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            The user will be created as <span className="font-medium text-gray-600">active</span> and can be enabled or disabled afterwards.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={!name.trim() || !email.trim() || !password || !!emailErr}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Create User
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
