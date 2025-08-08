import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-800 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Une erreur s'est produite</h2>
              <p className="text-gray-600 mb-6">
                L'application a rencontré un problème inattendu. Vous pouvez essayer de recharger la page.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Recharger la page
                </button>
                
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    if (this.props.onReset) this.props.onReset();
                  }}
                  className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Réessayer
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer">
                    Détails techniques
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;