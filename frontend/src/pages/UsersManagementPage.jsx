/**
 * Users Management Page - Admin panel for user administration
 */

import React, { useState, useEffect } from 'react';
import usersService from '../services/usersService.js';
import { 
  Users, Search, Edit2, Trash2, UserCheck, UserX, Shield, 
  Download, CheckSquare, Square, History, Activity, FileText 
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import Modal from '../components/common/Modal';
import { formatDateTime, parseErrorMessage } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

const UsersManagementPage = () => {
  const { showSuccess: showToastSuccess, showErrorToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Bulk operations
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  
  // Role management
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  const [newRole, setNewRole] = useState('');
  
  // Audit log
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedUserForAudit, setSelectedUserForAudit] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'activity'

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await usersService.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await usersService.toggleUserActive(userId, !currentStatus);
      setSuccess(`Uživatel ${!currentStatus ? 'aktivován' : 'deaktivován'}`);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(parseErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await usersService.deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setSuccess('Uživatel smazán');
      showToastSuccess('Uživatel úspěšně smazán');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(parseErrorMessage(err));
      showErrorToast('Nepodařilo se smazat uživatele');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };
  
  const handleChangeRole = async () => {
    if (!userToChangeRole || !newRole) return;
    try {
      // Simulace - v produkci by zde byl API call
      // await usersService.updateUserRole(userToChangeRole.id, newRole);
      setUsers(users.map(u => 
        u.id === userToChangeRole.id ? { ...u, role: newRole } : u
      ));
      setSuccess(`Role uživatele změněna na ${newRole === 'admin' ? 'Administrátor' : 'Uživatel'}`);
      showToastSuccess('Role uživatele úspěšně změněna');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(parseErrorMessage(err));
      showErrorToast('Nepodařilo se změnit roli');
    } finally {
      setShowRoleModal(false);
      setUserToChangeRole(null);
      setNewRole('');
    }
  };
  
  const handleBulkSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };
  
  const handleBulkAction = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      if (bulkAction === 'activate') {
        // Simulace - v produkci by zde byl bulk API call
        setUsers(users.map(u => 
          selectedUsers.includes(u.id) ? { ...u, is_active: true } : u
        ));
        showToastSuccess(`${selectedUsers.length} uživatelů aktivováno`);
      } else if (bulkAction === 'deactivate') {
        setUsers(users.map(u => 
          selectedUsers.includes(u.id) ? { ...u, is_active: false } : u
        ));
        showToastSuccess(`${selectedUsers.length} uživatelů deaktivováno`);
      }
      setSelectedUsers([]);
      setShowBulkModal(false);
      setBulkAction('');
    } catch (err) {
      showErrorToast('Nepodařilo se provést hromadnou operaci');
    }
  };
  
  const handleExportCSV = () => {
    try {
      const csv = [
        ['ID', 'Jméno', 'Uživatelské jméno', 'Email', 'Role', 'Stav', 'Vytvořeno'].join(','),
        ...users.map(u => [
          u.id,
          u.full_name || '',
          u.username,
          u.email,
          u.role,
          u.is_active ? 'Aktivní' : 'Neaktivní',
          formatDateTime(u.created_at)
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToastSuccess('Seznam uživatelů exportován do CSV');
    } catch (err) {
      showErrorToast('Nepodařilo se exportovat data');
    }
  };
  
  const loadAuditLogs = async (userId) => {
    try {
      setLoadingAudit(true);
      // Simulace - v produkci by zde byl API call
      // const data = await usersService.getUserAuditLog(userId);
      
      // Mock data pro demonstraci
      const mockLogs = [
        { id: 1, action: 'login', description: 'Přihlášení do systému', timestamp: new Date().toISOString() },
        { id: 2, action: 'calculation_created', description: 'Vytvořena nová kalkulace #123', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, action: 'file_uploaded', description: 'Nahrán soubor spotřeby.csv', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 4, action: 'config_updated', description: 'Aktualizována konfigurace "Domácí FVE"', timestamp: new Date(Date.now() - 86400000).toISOString() },
      ];
      setAuditLogs(mockLogs);
    } catch (err) {
      showErrorToast('Nepodařilo se načíst audit log');
    } finally {
      setLoadingAudit(false);
    }
  };
  
  const handleShowAudit = (user) => {
    setSelectedUserForAudit(user);
    setShowAuditModal(true);
    loadAuditLogs(user.id);
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
          <Shield className="w-3 h-3" />
          Admin
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
        Uživatel
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
          <UserCheck className="w-3 h-3" />
          Aktivní
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
        <UserX className="w-3 h-3" />
        Neaktivní
        </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <LoadingSpinner text="Načítání uživatelů..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Správa uživatelů</h1>
            </div>
            <p className="text-gray-600">Administrace uživatelských účtů (pouze pro administrátory)</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} className="mb-6" />}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Celkem uživatelů</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Aktivní</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {users.filter(u => u.is_active).length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Administrátoři</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <UserX className="w-5 h-5 text-red-600" />
            <span className="text-sm text-gray-600">Neaktivní</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {users.filter(u => !u.is_active).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'users'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Uživatelé ({users.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'activity'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <span>Aktivita</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Hledat uživatele (jméno, email, uživatelské jméno)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Vybráno {selectedUsers.length} uživatelů
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setBulkAction('activate');
                      setShowBulkModal(true);
                    }}
                    className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition"
                  >
                    Aktivovat
                  </button>
                  <button
                    onClick={() => {
                      setBulkAction('deactivate');
                      setShowBulkModal(true);
                    }}
                    className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
                  >
                    Deaktivovat
                  </button>
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition"
                  >
                    Zrušit výběr
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {users.length === 0 ? 'Žádní uživatelé' : 'Žádní uživatelé neodpovídají vyhledávání'}
                </h3>
                <p className="text-gray-600">
                  {users.length === 0
                    ? 'V systému zatím nejsou registrováni žádní uživatelé'
                    : 'Zkuste změnit vyhledávací výraz'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button onClick={handleSelectAll} className="p-1 hover:bg-gray-200 rounded">
                          {selectedUsers.length === filteredUsers.length ? (
                            <CheckSquare className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uživatel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stav
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registrován
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akce
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleBulkSelect(user.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {selectedUsers.includes(user.id) ? (
                              <CheckSquare className="w-5 h-5 text-primary-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'Bez jména'}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setUserToChangeRole(user);
                              setNewRole(user.role === 'admin' ? 'user' : 'admin');
                              setShowRoleModal(true);
                            }}
                            className="hover:opacity-75 transition"
                            title="Změnit roli"
                          >
                            {getRoleBadge(user.role)}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDateTime(user.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleShowAudit(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Zobrazit aktivitu"
                            >
                              <History className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user.id, user.is_active)}
                              className={`p-2 rounded transition ${
                                user.is_active
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={user.is_active ? 'Deaktivovat' : 'Aktivovat'}
                            >
                              {user.is_active ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                              title="Smazat uživatele"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Celková aktivita systému</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Nová kalkulace vytvořena</div>
                <div className="text-sm text-gray-600 mt-1">Uživatel admin vytvořil kalkulaci #145</div>
                <div className="text-xs text-gray-500 mt-1">{formatDateTime(new Date().toISOString())}</div>
              </div>
            </div>
            <div className="text-center text-gray-500 py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>Pro zobrazení detailní aktivity klikněte na ikonu <History className="w-4 h-4 inline" /> u konkrétního uživatele</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        title="Smazat uživatele"
      >
        <div className="mb-6">
          <p className="text-gray-700">
            Opravdu chcete smazat uživatele <strong>{userToDelete?.full_name}</strong> (@{userToDelete?.username})?
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Tato akce je nevratná a smaže všechna data uživatele včetně jeho souborů a kalkulací.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setUserToDelete(null);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Zrušit
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Smazat
          </button>
        </div>
      </Modal>

      {/* Role Change Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setUserToChangeRole(null);
          setNewRole('');
        }}
        title="Změnit roli uživatele"
      >
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Změnit roli uživatele <strong>{userToChangeRole?.full_name}</strong>?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex gap-2">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">
                  {newRole === 'admin' ? 'Přidělení administrátorských práv' : 'Odebrání administrátorských práv'}
                </p>
                <p>
                  {newRole === 'admin' 
                    ? 'Uživatel získá plný přístup ke správě systému, včetně správy uživatelů a konfigurací.'
                    : 'Uživatel ztratí přístup k administrátorským funkcím.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowRoleModal(false);
              setUserToChangeRole(null);
              setNewRole('');
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Zrušit
          </button>
          <button
            onClick={handleChangeRole}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Změnit roli
          </button>
        </div>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setBulkAction('');
        }}
        title="Hromadná operace"
      >
        <div className="mb-6">
          <p className="text-gray-700">
            Opravdu chcete {bulkAction === 'activate' ? 'aktivovat' : 'deaktivovat'}{' '}
            <strong>{selectedUsers.length}</strong> {selectedUsers.length === 1 ? 'uživatele' : 'uživatelů'}?
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Tato akce se projeví okamžitě.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowBulkModal(false);
              setBulkAction('');
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Zrušit
          </button>
          <button
            onClick={handleBulkAction}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition ${
              bulkAction === 'activate'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Potvrdit
          </button>
        </div>
      </Modal>

      {/* Audit Log Modal */}
      <Modal
        isOpen={showAuditModal}
        onClose={() => {
          setShowAuditModal(false);
          setSelectedUserForAudit(null);
          setAuditLogs([]);
        }}
        title={`Aktivita uživatele ${selectedUserForAudit?.full_name || ''}`}
      >
        <div className="mb-6">
          {loadingAudit ? (
            <div className="py-8">
              <LoadingSpinner text="Načítání aktivity..." />
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Žádná aktivita nebyla zaznamenána</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{log.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{formatDateTime(log.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => {
              setShowAuditModal(false);
              setSelectedUserForAudit(null);
              setAuditLogs([]);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Zavřít
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersManagementPage;
