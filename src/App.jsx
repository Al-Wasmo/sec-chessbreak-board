import { useState, useEffect } from 'react';

const LEAGUES = [
  { id: "509129f8a23947578f7a4cb1b33dceb7", name: "League 1", tables: Array.from({ length: 16 }, (_, i) => `A${i + 1}`) },
  { id: "923c9d43b68b4c7993447369edeb0778", name: "League 2", tables: Array.from({ length: 16 }, (_, i) => `B${i + 1}`) }
];

const BOT_ID = "AlphaSec";
const BOT_TABLE = "C1";

export default function ChessTournamentBoard() {
  const [leagueIndex, setLeagueIndex] = useState(() => Number(localStorage.getItem("leagueIndex")) || 0);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(() => Number(localStorage.getItem("roundIndex")) || 0);

  const currentLeague = LEAGUES[leagueIndex];

  useEffect(() => {
    localStorage.setItem("leagueIndex", leagueIndex);
    setLoading(true);

    const url = `https://api.swisssystem.org/api/tournament/Rounds/${currentLeague.id}`;
    const headers = {
      'accept': 'application/json, text/plain, */*',
      'authorization': 'Bearer YOUR_TOKEN_HERE'
    };

    fetch(url, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.result?.rounds) setRounds(data.result.rounds);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, [leagueIndex]);

  useEffect(() => {
    localStorage.setItem("roundIndex", selectedRound);
  }, [selectedRound]);

  const getResultBadge = (result, whiteResult) => {
    if (result === 'Bye') return { text: 'BYE', class: 'bg-purple-500' };
    if (whiteResult === 1) return { text: '1-0', class: 'bg-green-500' };
    if (whiteResult === 0.5) return { text: '½-½', class: 'bg-yellow-500' };
    if (whiteResult === 0) return { text: '0-1', class: 'bg-red-500' };
    return { text: 'TBD', class: 'bg-gray-500' };
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-white text-xl sm:text-2xl animate-pulse">Loading tournament data...</div>
    </div>
  );

  const currentRound = rounds[selectedRound] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">

        {/* League Tabs */}
        <div className="mb-2 sm:mb-4 flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 overflow-x-auto">
          {LEAGUES.map((league, idx) => (
            <button
              key={league.id}
              onClick={() => setLeagueIndex(idx)}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-semibold text-xs sm:text-base whitespace-nowrap ${
                leagueIndex === idx
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {league.name}
            </button>
          ))}
        </div>

        {/* Round Selector */}
        <div className="mb-4 sm:mb-6 flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-2">
          {rounds.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedRound(idx)}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-semibold text-xs sm:text-base whitespace-nowrap ${
                selectedRound === idx
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Round {idx + 1}
            </button>
          ))}
        </div>

        {/* Pairings Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          {/* Header */}
          <div className="bg-slate-700/50 px-3 sm:px-6 py-2 sm:py-4 border-b border-slate-600 grid grid-cols-[50px_1fr_1fr] sm:flex sm:justify-between text-slate-300 text-xs sm:text-sm font-semibold uppercase tracking-wider">
            <span className="hidden sm:block w-12">Board</span>
            <span>White</span>
            <span>Black</span>
          </div>

          {/* Pairings */}
          <div className="divide-y divide-slate-700">
            {currentRound.map((pairing, idx) => {
              const badge = getResultBadge(pairing.result, pairing.whiteResult);
              const isBye = pairing.result === 'Bye';
              const tableName =
                pairing.white.name === BOT_ID || pairing.black.name === BOT_ID
                  ? BOT_TABLE
                  : currentLeague.tables[idx];

              return (
                <div key={pairing.pairNum} className="px-3 sm:px-6 py-2 sm:py-4 hover:bg-slate-700/30 transition-colors flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  {/* Board */}
                  <div className="sm:w-12 flex-shrink-0 flex justify-start sm:justify-center mb-1 sm:mb-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg text-sm sm:text-base">
                      {tableName}
                    </div>
                  </div>

                  {/* White */}
                  <div className={`flex-1 flex items-center gap-2 sm:gap-3 ${pairing.white.disabled ? 'opacity-50' : ''}`}>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm bg-white shadow-md flex-shrink-0"></div>
                    <div className="font-semibold text-white truncate text-xl">{pairing.white.name}</div>
                  </div>

                  {/* Black */}
                  <div className={`flex-1 flex items-center gap-2 sm:gap-3 ${!isBye && pairing.black.disabled ? 'opacity-50' : ''}`}>
                    {!isBye ? (
                      <>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm bg-slate-900 shadow-md border-2 border-slate-600 flex-shrink-0"></div>
                        <div className="font-semibold text-white truncate text-xl">{pairing.black.name}</div>
                      </>
                    ) : (
                      <div className="text-slate-500 italic">No opponent</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
