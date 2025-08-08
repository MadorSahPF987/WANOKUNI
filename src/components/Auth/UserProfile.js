import React, { useState } from 'react';
import { User, Mail, Calendar, LogOut, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const UserProfile = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');

  if (!isOpen || !currentUser) return null;

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSave = async () => {
    // TODO: Implémenter la mise à jour du profil
    setIsEditing(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Mon Profil</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 
               currentUser.email[0].toUpperCase()}
            </div>
            
            {/* Display Name */}
            <div className="mt-4 flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-center font-medium"
                    placeholder="Nom d'utilisateur"
                  />
                  <button
                    onClick={handleSave}
                    className="text-green-600 hover:text-green-700 p-1 rounded"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(currentUser.displayName || '');
                    }}
                    className="text-gray-600 hover:text-gray-700 p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-medium text-gray-900">
                    {currentUser.displayName || 'Utilisateur'}
                  </h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900 font-medium">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Membre depuis</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(currentUser.metadata.creationTime)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <p className="text-gray-900 font-medium">
                  {currentUser.emailVerified ? 'Email vérifié' : 'Email non vérifié'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;