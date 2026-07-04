import { useState, useEffect, useContext } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Trash2, Edit, X, UserPlus, Shield, ShieldCheck, Key } from 'lucide-react'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

export default function ManageAdmins() {
  const { t, isRtl, admin } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)
  const [admins, setAdmins]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState({ name:'', email:'', password:'', confirm_password:'', role:'admin', is_active:1 })
  const [editId, setEditId]   = useState(null)
  const [saving, setSaving]   = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const me = admin || JSON.parse(localStorage.getItem('yhpo_admin')||'null')

  const load = () => {
    setLoading(true)
    api.get('/admins').then(d=>setAdmins(d||[])).catch(()=>setAdmins([])).finally(()=>setLoading(false))
  }
  useEffect(load, [])

  function validateEmail(email){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  function validatePassword(pw){
    return !!pw && pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw)
  }

  const handleAdd = async () => {
    const name = (form.name||'').trim()
    const email = (form.email||'').toLowerCase().trim()
    const password = form.password
    const role = form.role

    const errors = {}
    if (!name || name.length < 2) errors.name = t.name + ' ' + (isRtl ? 'مطلوب (حرفان على الأقل)' : 'required (min 2 chars)')
    if (!email) errors.email = t.emailRequired || 'Email required'
    else if (!validateEmail(email)) errors.email = isRtl ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email'
    if (!validatePassword(password)) errors.password = isRtl ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام' : 'Password must be at least 8 characters and include letters and numbers'
    if (!['admin','super_admin'].includes(role)) errors.role = isRtl ? 'صلاحية غير مسموح بها' : 'Invalid role'
    setFormErrors(errors)
    if (Object.keys(errors).length) return

    if (saving) return
    setSaving(true)
    try {
      await api.post('/admins', { name, email, password, role })
      toast.success(t.added)
      load(); setModal(null)
    }
    catch(e){
      setFormErrors({ submit: e.message })
      toast.error(e.message)
    }
    setSaving(false)
  }

  const handleEdit = async () => {
    const name = (form.name||'').trim()
    const email = (form.email||'').toLowerCase().trim()
    const role = form.role
    const is_active = form.is_active

    const errors = {}
    if (!name || name.length < 2) errors.name = t.name + ' ' + (isRtl ? 'مطلوب' : 'required')
    if (!email) errors.email = t.emailRequired || 'Email required'
    else if (!validateEmail(email)) errors.email = isRtl ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email'
    if (!['admin','super_admin'].includes(role)) errors.role = isRtl ? 'صلاحية غير مسموح بها' : 'Invalid role'

    // prevent editing yourself to remove super_admin or deactivate
    if (editId === me?.id) {
      if (me.role === 'super_admin' && role !== 'super_admin') {
        errors.role = isRtl ? 'لا يمكنك تخفيض صلاحيات حسابك الرئيسي' : 'Cannot demote your own super_admin role'
      }
      if (me.id === editId && is_active !== 1) {
        errors.is_active = isRtl ? 'لا يمكنك إيقاف حسابك الخاص' : 'Cannot deactivate your own account'
      }
    }

    setFormErrors(errors)
    if (Object.keys(errors).length) return

    if (saving) return
    setSaving(true)
    try {
      await api.put(`/admins/${editId}`, { name, email, role, is_active })
      toast.success(t.saved)
      load(); setModal(null)
    }
    catch(e){ setFormErrors({ submit: e.message }); toast.error(e.message) }
    setSaving(false)
  }

  const handlePassword = async () => {
    const password = form.password
    const confirm = form.confirm_password
    const errors = {}
    if (!validatePassword(password)) errors.password = isRtl ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام' : 'Password must be at least 8 characters and include letters and numbers'
    if (password !== confirm) errors.confirm = isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'
    setFormErrors(errors)
    if (Object.keys(errors).length) return

    if (saving) return
    setSaving(true)
    try { await api.put(`/admins/${editId}/password`, { password }); toast.success(t.passwordChanged); setModal(null) }
    catch(e){ setFormErrors({ submit: e.message }); toast.error(e.message) }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (id === me?.id) { toast.error(t.cannotDeleteSelf); return }
    const confirmed = await requestConfirm({
      title: isRtl ? 'تأكيد حذف المشرف' : 'Delete administrator?',
      message: isRtl ? 'سيتم حذف هذا الحساب الإداري نهائياً.' : 'This administrator account will be permanently removed.',
      variant: 'danger',
      confirmText: t.delete,
    })
    if (!confirmed) return
    try { await api.delete(`/admins/${id}`); toast.success(t.deleted); load() }
    catch(e) { toast.error(e.message) }
  }

  // helpers to open modals
  const openAdd = () => { setForm({ name:'', email:'', password:'', confirm_password:'', role:'admin', is_active:1 }); setFormErrors({}); setModal('add') }
  const openEdit = (a) => { setForm({ name:a.name||'', email:a.email||'', password:'', confirm_password:'', role:a.role||'admin', is_active: a.is_active }); setEditId(a.id); setFormErrors({}); setModal('edit') }
  const openPassword = (a) => { setForm({ password:'', confirm_password:'' }); setEditId(a.id); setFormErrors({}); setModal('password') }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark">{t.manageAdmins}</h1>
        <button onClick={openAdd} className="btn-primary">
          <UserPlus size={16}/>{t.addAdmin}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto p-4 md:p-6">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className={`${isRtl?'text-right':'text-left'} p-4 font-medium text-gray-600`}>{t.name}</th>
                <th className={`${isRtl?'text-right':'text-left'} p-4 font-medium text-gray-600`}>{t.email}</th>
                <th className={`${isRtl?'text-right':'text-left'} p-4 font-medium text-gray-600`}>{t.role}</th>
                <th className={`${isRtl?'text-right':'text-left'} p-4 font-medium text-gray-600`}>{t.status}</th>
                <th className={`${isRtl?'text-right':'text-left'} p-4 font-medium text-gray-600`}>{t.lastLogin}</th>
                <th className={`${isRtl?'text-right':'text-left'} p-4 font-medium text-gray-600`}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center p-8 text-gray-400">{t.loading}</td></tr>
              : admins.map(adminItem=>(
                <tr key={adminItem.id} className="table-row border-b border-gray-50">
                  <td className="p-4 font-medium text-dark">
                    <div className="flex items-center gap-2">
                      {adminItem.role === 'super_admin'
                        ? <ShieldCheck size={14} className="text-primary"/>
                        : <Shield size={14} className="text-gray-400"/>}
                      {adminItem.name||'—'}
                      {adminItem.id===me?.id && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t.you}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500" dir="ltr">{adminItem.email}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${adminItem.role==='super_admin' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                      {adminItem.role==='super_admin' ? (isRtl ? 'رئيسي' : 'Super Admin') : (isRtl ? 'مشرف' : 'Admin')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${adminItem.is_active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {adminItem.is_active ? t.active : t.inactive}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{adminItem.last_login ? new Date(adminItem.last_login).toLocaleDateString(isRtl?'ar-YE':'en-US') : t.neverLoggedIn}</td>
                  <td className="p-4"><div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={()=>openEdit(adminItem)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title={t.edit}><Edit size={14}/></button>
                    <button onClick={()=>openPassword(adminItem)}
                      className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg" title={t.changePassword}><Key size={14}/></button>
                    {adminItem.id!==me?.id && <button onClick={()=>handleDelete(adminItem.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {modal==='add' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal-box max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-xl text-dark">{t.addNewAdmin}</h2>
              <button onClick={()=>setModal(null)} className="text-gray-400"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field" placeholder={t.fullName}/>
                {formErrors.name && <div className="text-xs text-red-500 mt-1">{formErrors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.email} *</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field" dir="ltr" placeholder="admin@example.com"/>
                {formErrors.email && <div className="text-xs text-red-500 mt-1">{formErrors.email}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.password} *</label>
                <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="input-field" dir="ltr" placeholder={t.min8Chars}/>
                {formErrors.password && <div className="text-xs text-red-500 mt-1">{formErrors.password}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirmPassword || 'Confirm password'}</label>
                <input type="password" value={form.confirm_password} onChange={e=>setForm({...form,confirm_password:e.target.value})} className="input-field" dir="ltr" placeholder={t.min8Chars}/>
                {formErrors.confirm && <div className="text-xs text-red-500 mt-1">{formErrors.confirm}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.role}</label>
                <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="input-field">
                  <option value="admin">{isRtl ? 'مشرف عادي' : 'Admin'}</option>
                  <option value="super_admin">{isRtl ? 'مشرف رئيسي' : 'Super Admin'}</option>
                </select>
                {formErrors.role && <div className="text-xs text-red-500 mt-1">{formErrors.role}</div>}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t">
              <button onClick={handleAdd} disabled={saving} className="btn-primary w-full sm:w-auto"><UserPlus size={16}/>{saving ? '...' : t.add}</button>
              <button onClick={()=>setModal(null)} className="btn-outline w-full sm:w-auto">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal==='edit' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal-box max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-xl text-dark">{t.editAdmin}</h2>
              <button onClick={()=>setModal(null)} className="text-gray-400"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field"/>
                {formErrors.name && <div className="text-xs text-red-500 mt-1">{formErrors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field" dir="ltr"/>
                {formErrors.email && <div className="text-xs text-red-500 mt-1">{formErrors.email}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.role}</label>
                <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="input-field">
                  <option value="admin">{isRtl ? 'مشرف عادي' : 'Admin'}</option>
                  <option value="super_admin">{isRtl ? 'مشرف رئيسي' : 'Super Admin'}</option>
                </select>
                {formErrors.role && <div className="text-xs text-red-500 mt-1">{formErrors.role}</div>}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active===1} onChange={e=>setForm({...form,is_active:e.target.checked?1:0})} className="w-4 h-4 accent-primary"/>
                <span className="text-sm text-gray-700">{t.activeAccount}</span>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t">
              <button onClick={handleEdit} disabled={saving} className="btn-primary w-full sm:w-auto"><Edit size={16}/>{saving ? '...' : t.save}</button>
              <button onClick={()=>setModal(null)} className="btn-outline w-full sm:w-auto">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {modal==='password' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal-box max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-xl text-dark">{t.changePassword}</h2>
              <button onClick={()=>setModal(null)} className="text-gray-400"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.newPassword}</label>
                <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="input-field" dir="ltr" placeholder={t.min8Chars}/>
                {formErrors.password && <div className="text-xs text-red-500 mt-1">{formErrors.password}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirmPassword}</label>
                <input type="password" value={form.confirm_password} onChange={e=>setForm({...form,confirm_password:e.target.value})} className="input-field" dir="ltr" placeholder={t.min8Chars}/>
                {formErrors.confirm && <div className="text-xs text-red-500 mt-1">{formErrors.confirm}</div>}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t">
              <button onClick={handlePassword} disabled={saving} className="btn-primary w-full sm:w-auto"><Key size={16}/>{saving ? '...' : t.changePassword}</button>
              <button onClick={()=>setModal(null)} className="btn-outline w-full sm:w-auto">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
