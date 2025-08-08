import React, { useEffect, useState } from 'react';
import { Home, Play, BookOpen, Trophy, Clock, Settings, BarChart3, RotateCcw, Layers } from 'lucide-react';
import { hardReset } from '../utils/resetData';
import ItemDetailModal from './ItemDetailModal';
import AdvancedStats from './AdvancedStats';
import DevPanel from './DevPanel';

const Dashboard = ({ srs, wanoKuniData, onNavigate }) => {
  const stats = srs.getStats();
  const detailedStats = srs.getDetailedStats();
  const reviewCount = srs.getReviewCount();
  const lessonCount = srs.getLessonCount();
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  // Force refresh function for dev panel
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  // Raccourci clavier pour reset (Ctrl+Shift+R)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        hardReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="container mx-auto px-4 py-6 max-w-full">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">🐊</div>
              <div>
                <h1 className="text-white text-2xl font-bold">WanoKuni SRS</h1>
                <p className="text-white/70">Niveau {srs.getCurrentLevel()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('home')}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Home className="w-6 h-6" />
              </button>
              <button className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                <Settings className="w-6 h-6" />
              </button>
              <button 
                onClick={hardReset}
                className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Reset complet (efface tout)"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* 3-Column Layout: Left Sidebar | Main Content | Right Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
          {/* Left Sidebar - WanoKuni-Style SRS Statistics */}
          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 gap-4">
              {/* Apprentice */}
              <div className="bg-gradient-to-r from-pink-500/80 to-pink-600/80 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg border border-white/10">
                <div className="p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-pink-600 text-sm font-bold">A</span>
                      </div>
                      <span className="font-bold text-lg">Apprentice</span>
                    </div>
                    <span className="text-3xl font-bold">{stats.apprentice}</span>
                  </div>
                  <div className="space-y-2">
                    {detailedStats && (
                      <>
                        <div className="bg-pink-600/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Radicaux</span>
                            <span className="font-bold">{detailedStats.byStage.apprentice.stage1.radical + detailedStats.byStage.apprentice.stage2.radical + detailedStats.byStage.apprentice.stage3.radical + detailedStats.byStage.apprentice.stage4.radical}</span>
                          </div>
                        </div>
                        <div className="bg-pink-600/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Kanji</span>
                            <span className="font-bold">{detailedStats.byStage.apprentice.stage1.kanji + detailedStats.byStage.apprentice.stage2.kanji + detailedStats.byStage.apprentice.stage3.kanji + detailedStats.byStage.apprentice.stage4.kanji}</span>
                          </div>
                        </div>
                        <div className="bg-pink-600/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Vocabulary</span>
                            <span className="font-bold">{detailedStats.byStage.apprentice.stage1.vocabulary + detailedStats.byStage.apprentice.stage2.vocabulary + detailedStats.byStage.apprentice.stage3.vocabulary + detailedStats.byStage.apprentice.stage4.vocabulary}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Guru */}
              <div className="bg-gradient-to-r from-purple-500/80 to-purple-600/80 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg border border-white/10">
                <div className="p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-purple-600 text-sm font-bold">G</span>
                      </div>
                      <span className="font-bold text-lg">Guru</span>
                    </div>
                    <span className="text-3xl font-bold">{stats.guru}</span>
                  </div>
                  <div className="space-y-2">
                    {detailedStats && (
                      <>
                        <div className="bg-purple-600/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Radicaux</span>
                            <span className="font-bold">{detailedStats.byStage.guru.stage1.radical + detailedStats.byStage.guru.stage2.radical}</span>
                          </div>
                        </div>
                        <div className="bg-purple-600/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Kanji</span>
                            <span className="font-bold">{detailedStats.byStage.guru.stage1.kanji + detailedStats.byStage.guru.stage2.kanji}</span>
                          </div>
                        </div>
                        <div className="bg-purple-600/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Vocabulary</span>
                            <span className="font-bold">{detailedStats.byStage.guru.stage1.vocabulary + detailedStats.byStage.guru.stage2.vocabulary}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Master */}
              <div className="bg-gradient-to-r from-blue-500/80 to-blue-600/80 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg border border-white/10">
                <div className="p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-bold">M</span>
                      </div>
                      <span className="font-bold text-lg">Master</span>
                    </div>
                    <span className="text-3xl font-bold">{stats.master}</span>
                  </div>
                  <div className="space-y-2">
                    {detailedStats && (
                      <>
                        <div className="bg-blue-600/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Radicaux</span>
                            <span className="font-bold">{detailedStats.byStage.master.radical}</span>
                          </div>
                        </div>
                        <div className="bg-blue-600/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Kanji</span>
                            <span className="font-bold">{detailedStats.byStage.master.kanji}</span>
                          </div>
                        </div>
                        <div className="bg-blue-600/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Vocabulary</span>
                            <span className="font-bold">{detailedStats.byStage.master.vocabulary}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Enlightened */}
              <div className="bg-gradient-to-r from-yellow-400/80 to-yellow-500/80 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg border border-white/10">
                <div className="p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-sm font-bold">E</span>
                      </div>
                      <span className="font-bold text-lg">Enlightened</span>
                    </div>
                    <span className="text-3xl font-bold">{stats.enlightened}</span>
                  </div>
                  <div className="space-y-2">
                    {detailedStats && (
                      <>
                        <div className="bg-yellow-500/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Radicaux</span>
                            <span className="font-bold">{detailedStats.byStage.enlightened.radical}</span>
                          </div>
                        </div>
                        <div className="bg-yellow-500/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Kanji</span>
                            <span className="font-bold">{detailedStats.byStage.enlightened.kanji}</span>
                          </div>
                        </div>
                        <div className="bg-yellow-500/30 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Vocabulary</span>
                            <span className="font-bold">{detailedStats.byStage.enlightened.vocabulary}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Burned */}
              <div className="bg-gradient-to-r from-gray-600/80 to-gray-700/80 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg border border-white/10">
                <div className="p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-bold">B</span>
                      </div>
                      <span className="font-bold text-lg">Burned</span>
                    </div>
                    <span className="text-3xl font-bold">{stats.burned}</span>
                  </div>
                  <div className="space-y-2">
                    {detailedStats && (
                      <>
                        <div className="bg-gray-700/50 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Radicaux</span>
                            <span className="font-bold">{detailedStats.byStage.burned?.radical || 0}</span>
                          </div>
                        </div>
                        <div className="bg-gray-700/50 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Kanji</span>
                            <span className="font-bold">{detailedStats.byStage.burned?.kanji || 0}</span>
                          </div>
                        </div>
                        <div className="bg-gray-700/50 rounded p-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Vocabulary</span>
                            <span className="font-bold">{detailedStats.byStage.burned?.vocabulary || 0}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Column */}
          <div className="xl:col-span-8 space-y-6">

            {/* Main Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reviews */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Révisions</h2>
                  <Clock className="w-6 h-6 text-white/60" />
                </div>
                
                <div className="mb-6">
                  <div className="text-4xl font-bold text-white mb-2">{reviewCount}</div>
                  <p className="text-white/70">éléments disponibles maintenant</p>
                </div>

                <button
                  onClick={() => reviewCount > 0 && onNavigate('review')}
                  disabled={reviewCount === 0}
                  className={`w-full p-4 rounded-xl text-white font-bold text-lg transition-all ${
                    reviewCount > 0
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg transform hover:scale-105'
                      : 'bg-gray-500/30 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <Play className="w-6 h-6 mr-2" />
                    {reviewCount > 0 ? 'Commencer les révisions' : 'Aucune révision disponible'}
                  </div>
                </button>
              </div>

              {/* Lessons */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Leçons</h2>
                  <BookOpen className="w-6 h-6 text-white/60" />
                </div>
                
                <div className="mb-6">
                  <div className="text-4xl font-bold text-white mb-2">{lessonCount}</div>
                  <p className="text-white/70">nouveaux éléments à apprendre</p>
                </div>

                <button
                  onClick={() => lessonCount > 0 && onNavigate('lessons')}
                  disabled={lessonCount === 0}
                  className={`w-full p-4 rounded-xl text-white font-bold text-lg transition-all ${
                    lessonCount > 0
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:shadow-lg transform hover:scale-105'
                      : 'bg-gray-500/30 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <BookOpen className="w-6 h-6 mr-2" />
                    {lessonCount > 0 ? 'Commencer les leçons' : 'Aucune leçon disponible'}
                  </div>
                </button>
              </div>
            </div>

            {/* WanoKuni-Style Level Progress */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              {/* Level Progress Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-3">Level {srs.getCurrentLevel()} Progress</h2>
                
              </div>

              {/* Items Display */}
              <div className="space-y-6">
                {/* Radicals Section */}
                {wanoKuniData && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-blue-300 font-bold text-lg">Radicals</h3>
                      {detailedStats && (
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-300 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, ((detailedStats.currentLevel.radical.apprentice + detailedStats.currentLevel.radical.guru + detailedStats.currentLevel.radical.master + detailedStats.currentLevel.radical.enlightened + detailedStats.currentLevel.radical.burned) / Math.max(1, wanoKuniData.radicals.filter(r => r.level === srs.getCurrentLevel()).length)) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-blue-300 text-sm font-medium">
                            {detailedStats.currentLevel.radical.apprentice + detailedStats.currentLevel.radical.guru + detailedStats.currentLevel.radical.master + detailedStats.currentLevel.radical.enlightened + detailedStats.currentLevel.radical.burned}/{wanoKuniData.radicals.filter(r => r.level === srs.getCurrentLevel()).length}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16 gap-3">
                      {wanoKuniData.radicals
                        .filter(radical => radical.level === srs.getCurrentLevel())
                        .map((radical, index) => {
                          const progress = srs.getUserProgress()[`radical_${radical.id}`];
                          const isGuru = progress && progress.srs_stage >= 4;
                          const isStarted = progress && progress.srs_stage >= -1;
                          const isApprentice = progress && progress.srs_stage >= 0 && progress.srs_stage <= 3;
                          const hasRecentFailure = progress && progress.incorrect_count > 0 && progress.correct_streak === 0;
                          
                          return (
                            <div key={radical.id} className="flex flex-col items-center">
                              {/* Case du radical */}
                              <div 
                                onClick={() => setSelectedItem(radical)}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg cursor-pointer ${
                                isGuru ? 'bg-blue-500 text-white' :
                                isApprentice ? 'bg-blue-400 text-white' :
                                isStarted ? 'bg-blue-300 text-white' :
                                'bg-blue-400 text-white opacity-50'
                              } ${
                                !isStarted ? 'relative' : ''
                              } ${
                                hasRecentFailure ? 'ring-4 ring-red-500/70 ring-offset-1 heartbeat border-2 border-red-600' : ''
                              }`}>
                                {radical.character || radical.characters || '部'}
                                
                                {/* Hachures pour les non commencés */}
                                {!isStarted && (
                                  <div 
                                    className="absolute inset-0 rounded-lg pointer-events-none"
                                    style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)'}}
                                  />
                                )}
                              </div>
                              
                              {/* Barre de progression sous le radical */}
                              <div className="flex gap-0.5 mt-1">
                                {[...Array(5)].map((_, segmentIndex) => {
                                  let filledSegments = 0;
                                  if (progress) {
                                    if (progress.srs_stage === -1) filledSegments = progress.lesson_completed ? 1 : 0;
                                    else if (progress.srs_stage >= 0 && progress.srs_stage <= 3) filledSegments = progress.srs_stage + 1;
                                    else if (progress.srs_stage >= 4) filledSegments = 5;
                                  }
                                  
                                  const isActive = segmentIndex < filledSegments;
                                  
                                  return (
                                    <div
                                      key={segmentIndex}
                                      className={`w-1.5 h-1 rounded-sm ${
                                        isActive ? 'bg-blue-400' : 'bg-gray-500/30'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Kanji Section */}
                {wanoKuniData && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-pink-300 font-bold text-lg">Kanji</h3>
                      {detailedStats && (
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-300 rounded-full h-2">
                            <div 
                              className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, ((detailedStats.currentLevel.kanji.apprentice + detailedStats.currentLevel.kanji.guru + detailedStats.currentLevel.kanji.master + detailedStats.currentLevel.kanji.enlightened + detailedStats.currentLevel.kanji.burned) / Math.max(1, wanoKuniData.kanji.filter(k => k.level === srs.getCurrentLevel()).length)) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-pink-300 text-sm font-medium">
                            {detailedStats.currentLevel.kanji.apprentice + detailedStats.currentLevel.kanji.guru + detailedStats.currentLevel.kanji.master + detailedStats.currentLevel.kanji.enlightened + detailedStats.currentLevel.kanji.burned}/{wanoKuniData.kanji.filter(k => k.level === srs.getCurrentLevel()).length}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16 gap-3">
                      {wanoKuniData.kanji
                        .filter(kanji => kanji.level === srs.getCurrentLevel())
                        .map((kanji, index) => {
                          const progressMeaning = srs.getUserProgress()[`kanji_${kanji.id}_meaning`];
                          const progressReading = srs.getUserProgress()[`kanji_${kanji.id}_reading`];
                          const progress = progressMeaning || progressReading;
                          const isGuru = (progressMeaning && progressMeaning.srs_stage >= 4) || (progressReading && progressReading.srs_stage >= 4);
                          const isStarted = (progressMeaning && progressMeaning.srs_stage >= -1) || (progressReading && progressReading.srs_stage >= -1);
                          const isApprentice = (progressMeaning && progressMeaning.srs_stage >= 0 && progressMeaning.srs_stage <= 3) || (progressReading && progressReading.srs_stage >= 0 && progressReading.srs_stage <= 3);
                          const hasRecentFailure = (progressMeaning && progressMeaning.incorrect_count > 0 && progressMeaning.correct_streak === 0) || (progressReading && progressReading.incorrect_count > 0 && progressReading.correct_streak === 0);
                          
                          return (
                            <div key={kanji.id} className="flex flex-col items-center">
                              {/* Case du kanji */}
                              <div 
                                onClick={() => setSelectedItem(kanji)}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg cursor-pointer ${
                                isGuru ? 'bg-pink-500 text-white' :
                                isApprentice ? 'bg-pink-400 text-white' :
                                isStarted ? 'bg-pink-300 text-white' :
                                'bg-pink-400 text-white opacity-50'
                              } ${
                                !isStarted ? 'relative' : ''
                              } ${
                                hasRecentFailure ? 'ring-4 ring-red-500/70 ring-offset-1 heartbeat border-2 border-red-600' : ''
                              }`}>
                                {kanji.character || kanji.characters || '漢'}
                                
                                {/* Hachures pour les non commencés */}
                                {!isStarted && (
                                  <div 
                                    className="absolute inset-0 rounded-lg pointer-events-none"
                                    style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)'}}
                                  />
                                )}
                              </div>
                              
                              {/* Barre de progression sous le kanji */}
                              <div className="flex gap-0.5 mt-1">
                                {[...Array(5)].map((_, segmentIndex) => {
                                  let filledSegments = 0;
                                  const maxStage = Math.max(
                                    progressMeaning ? progressMeaning.srs_stage : -2,
                                    progressReading ? progressReading.srs_stage : -2
                                  );
                                  
                                  if (maxStage >= -1) {
                                    if (maxStage === -1) {
                                      const lessonCompleted = (progressMeaning && progressMeaning.lesson_completed) || (progressReading && progressReading.lesson_completed);
                                      filledSegments = lessonCompleted ? 1 : 0;
                                    } else if (maxStage >= 0 && maxStage <= 3) {
                                      filledSegments = maxStage + 1;
                                    } else if (maxStage >= 4) {
                                      filledSegments = 5;
                                    }
                                  }
                                  
                                  const isActive = segmentIndex < filledSegments;
                                  
                                  return (
                                    <div
                                      key={segmentIndex}
                                      className={`w-1.5 h-1 rounded-sm ${
                                        isActive ? 'bg-pink-400' : 'bg-gray-500/30'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Level Browser */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Navigateur</h2>
                <Layers className="w-6 h-6 text-white/60" />
              </div>
              
              <div className="mb-4">
                <p className="text-white/70 mb-4">Explorez tous les éléments par niveau</p>
              </div>

              <button
                onClick={() => onNavigate('levels')}
                className="w-full p-4 rounded-xl text-white font-bold text-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:shadow-lg transform hover:scale-105 transition-all"
              >
                <div className="flex items-center justify-center">
                  <Layers className="w-6 h-6 mr-2" />
                  Parcourir par niveaux
                </div>
              </button>
            </div>
          </div>

          {/* Right Sidebar - Quick Statistics */}
          <div className="xl:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {showAdvancedStats ? 'Statistiques avancées' : 'Statistiques rapides'}
                </h2>
                <button
                  onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                  className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
                >
                  <BarChart3 className="w-6 h-6" />
                  <span className="text-sm">{showAdvancedStats ? 'Rapides' : 'Avancées'}</span>
                </button>
              </div>
              
              {!showAdvancedStats ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                    <div className="text-white/70 text-sm">Total éléments</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-3xl mb-2">📈</div>
                    <div className="text-2xl font-bold text-white">{Math.round(((stats.guru + stats.master + stats.enlightened + stats.burned) / Math.max(1, stats.total)) * 100)}%</div>
                    <div className="text-white/70 text-sm">Progression</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-3xl mb-2">🔥</div>
                    <div className="text-2xl font-bold text-white">0</div>
                    <div className="text-white/70 text-sm">Série actuelle</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-3xl mb-2">⏰</div>
                    <div className="text-2xl font-bold text-white">{srs.getNextReviewTime()}</div>
                    <div className="text-white/70 text-sm">Prochaine révision</div>
                  </div>
                </div>
              ) : (
                <AdvancedStats srs={srs} wanoKuniData={wanoKuniData} />
              )}
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">Zone de reset</h3>
              <p className="text-red-300 text-sm">Effacer toute progression et recommencer</p>
              <p className="text-red-400/70 text-xs mt-1">Raccourci: Ctrl+Shift+R</p>
            </div>
            <button 
              onClick={hardReset}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold text-sm hover:shadow-lg transform hover:scale-105 transition-all flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Complet
            </button>
          </div>
        </div>

      </div>

      {/* Modal pour afficher les détails d'un élément */}
      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem}
          wanoKuniData={wanoKuniData}
          onClose={() => setSelectedItem(null)}
          onNavigateToItem={(item) => setSelectedItem(item)}
        />
      )}

      {/* Dev Panel */}
      <DevPanel 
        srs={srs}
        wanoKuniData={wanoKuniData}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default Dashboard;