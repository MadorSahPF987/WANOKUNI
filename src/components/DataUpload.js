import React, { useState } from 'react';
import { Upload, ChevronLeft, BookOpen, AlertCircle } from 'lucide-react';

const DataUpload = ({ onDataLoad, onBack }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setError('Veuillez sélectionner un fichier JSON valide');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!data.radicals || !data.kanji || !data.vocabulary) {
        throw new Error('Structure de données invalide');
      }

      onDataLoad(data);
    } catch (err) {
      setError(`Erreur lors du chargement: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
          <button
            onClick={onBack}
            className="mb-6 text-white/80 hover:text-white flex items-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Retour
          </button>

          <div className="text-center mb-8">
            <Upload className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Charger vos données</h2>
            <p className="text-white/80">Uploadez le fichier JSON structuré généré par le parser</p>
          </div>

          <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-white/50 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="data-upload"
              disabled={loading}
            />
            <label htmlFor="data-upload" className="cursor-pointer">
              <div className="text-white/60 mb-4">
                <BookOpen className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg">
                  {loading ? 'Chargement en cours...' : 'Cliquez pour sélectionner le fichier JSON structuré'}
                </p>
                <p className="text-sm mt-2">wanokuni_structured_data.json</p>
              </div>
            </label>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
              <span className="text-red-200">{error}</span>
            </div>
          )}

          {loading && (
            <div className="mt-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-white/80">Chargement des données...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataUpload;