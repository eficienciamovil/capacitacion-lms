import React, { useEffect, useState } from 'react';
import { usersApi } from '../../services/api';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'student', is_active: 1 };

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | { mode: 'create'|'edit', user? }
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [deleteId, setDeleteId] = useState(null);

  function load() {
    setLoading(true);
    usersApi.list()
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setModal({ mode: 'create' });
  }

  function openEdit(user) {
    setForm({ name: user.name, email: user.email, password: '', role: user.role, is_active: user.is_active });
    setError('');
    setModal({ mode: 'edit', user });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal.mode === 'create') {
        await usersApi.create(form);
      } else {
        const payload = { name: form.name, email: form.email, is_active: form.is_active };
        if (form.password) payload.password = form.password;
        await usersApi.update(modal.user.id, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await usersApi.remove(id);
      setDeleteId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h2>
          <p className="text-slate-500 mt-1">{users.filter(u => u.role === 'student').length} alumnos registrados</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Rol</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={u.role === 'admin' ? 'badge-blue' : 'badge-yellow'}>
                      {u.role === 'admin' ? 'Admin' : 'Alumno'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={u.is_active ? 'badge-green' : 'badge-red'}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(u)} className="btn-secondary text-xs px-3 py-1.5">
                        Editar
                      </button>
                      {u.role !== 'admin' && (
                        <button onClick={() => setDeleteId(u.id)} className="btn-danger text-xs px-3 py-1.5">
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-slate-500 py-12">No hay usuarios registrados aún</p>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {modal.mode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}
              <div>
                <label className="label">Nombre completo</label>
                <input className="input" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Correo electrónico</label>
                <input className="input" type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">
                  {modal.mode === 'create' ? 'Contraseña' : 'Nueva contraseña (dejar vacío para no cambiar)'}
                </label>
                <input className="input" type="password" required={modal.mode === 'create'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              {modal.mode === 'create' && (
                <div>
                  <label className="label">Rol</label>
                  <select className="input" value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="student">Alumno</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              )}
              {modal.mode === 'edit' && (
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="is_active" checked={!!form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked ? 1 : 0 }))}
                    className="rounded border-slate-300 text-blue-600" />
                  <label htmlFor="is_active" className="text-sm text-slate-700">Usuario activo</label>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirmar eliminación</h3>
            <p className="text-slate-600 mb-6">¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
