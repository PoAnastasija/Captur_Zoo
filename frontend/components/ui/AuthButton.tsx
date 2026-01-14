'use client';

import { useState, useEffect } from 'react';
import { LogIn, UserCircle, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost';
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT;
const AUTH_TOKEN_KEY = 'captur_zoo_auth_token';
const AUTH_USERNAME_KEY = 'captur_zoo_username';
export const AUTH_CHANGED_EVENT = 'captur_zoo_auth_changed';

const notifyAuthChange = (token: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { token } }));
};

interface AuthButtonProps {
  className?: string;
}

export function AuthButton({ className = '' }: AuthButtonProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [inputUsername, setInputUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUsername = localStorage.getItem(AUTH_USERNAME_KEY);
    if (token && savedUsername) {
      setIsAuthenticated(true);
      setUsername(savedUsername);
    }
  }, []);

  const handleAuth = async () => {
    if (!inputUsername.trim()) {
      setError('Veuillez entrer un nom d\'utilisateur');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? 'login' : 'register';
      const backendUrl = BACKEND_PORT
        ? `${BACKEND_URL}:${BACKEND_PORT}`
        : BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: inputUsername.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USERNAME_KEY, inputUsername.trim());
        setIsAuthenticated(true);
        setUsername(inputUsername.trim());
        notifyAuthChange(data.token);
        setDialogOpen(false);
        setInputUsername('');
      } else {
        throw new Error('Token non reçu');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USERNAME_KEY);
    setIsAuthenticated(false);
    setUsername('');
    notifyAuthChange(null);
  };

  const openDialog = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setDialogOpen(true);
    setError(null);
    setInputUsername('');
  };

  if (isAuthenticated) {
    return (
      <button
        onClick={handleLogout}
        className={`inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/90 px-4 py-2 text-xs font-medium text-[#1f2c27] shadow-md transition hover:bg-white ${className}`}
        title="Cliquez pour vous déconnecter"
      >
        <UserCircle className="h-4 w-4" />
        <span>{username}</span>
        <LogOut className="h-3.5 w-3.5 opacity-60" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => openDialog(true)}
        className={`inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 p-2 text-white transition hover:bg-white/20 ${className}`}
        title="Connexion / Inscription"
      >
        <UserCircle className="h-4 w-4" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-2xl font-bold text-[#1f2a24]">
            {isLogin ? 'Connexion' : 'Inscription'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#4a5a51]">
            {isLogin
              ? 'Connectez-vous à votre compte'
              : 'Créez un nouveau compte'}
          </DialogDescription>

          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                type="text"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="Entrez votre nom d'utilisateur"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAuth}
                disabled={loading}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'S\'inscrire'}
              </button>
              <button
                onClick={() => setDialogOpen(false)}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                {isLogin
                  ? 'Pas encore de compte ? Inscrivez-vous'
                  : 'Déjà un compte ? Connectez-vous'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export helper to get auth token for API calls
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
