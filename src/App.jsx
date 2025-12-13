import confetti from 'canvas-confetti';
import { useState, useEffect, useCallback, useRef } from 'react';


const LEAGUES = [
  { id: "1d706685527242e9a1d2cd49928a182e", name: "League 1", tables: Array.from({ length: 16 }, (_, i) => `A${i + 1}`) },
  { id: "55539c6858e342828a61c0b0aca493a5", name: "League 2", tables: Array.from({ length: 16 }, (_, i) => `B${i + 1}`) }
];

const BOT_ID = "AlphaSec";
const BOT_TABLE = "C1";
const BASE_URL = "https://sec-chessbreak-board-backend.onrender.com";


function capitalizeFirstLetter(val) {
    if (!val) return ''; // handle empty or null/undefined
    val = String(val);
    return val.charAt(0).toUpperCase() + val.slice(1);
}

export default function ChessTournamentBoard() {
  const [leagueIndex, setLeagueIndex] = useState(() => Number(localStorage.getItem("leagueIndex")) || 0);
  const [rounds, setRounds] = useState([]); // array of rounds, each round is array of pairings
  const [numberOfRounds, setNumberOfRounds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(() => Number(localStorage.getItem("roundIndex")) || 1);

  const currentLeague = LEAGUES[leagueIndex];



  const textRef = useRef();

  useEffect(() => {
    const interval = setInterval(() => {
      if (!textRef.current) return;

      const rect = textRef.current.getBoundingClientRect();

      // Random position inside the element
      const x = rect.left + Math.random() * rect.width;
      const y = rect.top + Math.random() * rect.height;

      // Random angle for 360° spread
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      // Create particle element
      const particle = document.createElement('div');
      particle.textContent = '🧑‍💻';
      particle.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      font-size: 16px;
      pointer-events: none;
      z-index: 1;
      animation: particle-fall 4s ease-out forwards;
      --dx: ${dx}px;
      --dy: ${dy}px;
    `;

      document.body.appendChild(particle);

      // Remove after animation
      setTimeout(() => particle.remove(), 500);
    }, 100);

    // Add animation styles
    if (!document.getElementById('particle-animation')) {
      const style = document.createElement('style');
      style.id = 'particle-animation';
      style.textContent = `
      @keyframes particle-fall {
        to {
          transform: translate(var(--dx), var(--dy)) rotate(360deg);
          opacity: 0;
        }
      }
    `;
      document.head.appendChild(style);
    }

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("leagueIndex", leagueIndex);
    setLoading(true);

    // Fetch from our Node.js backend
    const fetchData = async () => {
      try {
        // First, fetch the number of rounds
        const res = await fetch(`${BASE_URL}/tournament/${currentLeague.id}/1`); // fetch round 1 initially
        const data = await res.json();

        if (data.numberOfRounds) setNumberOfRounds(data.numberOfRounds);

        // Prepare rounds array
        const roundsArray = [];
        for (let r = 1; r <= data.numberOfRounds; r++) {
          const resRound = await fetch(`${BASE_URL}/tournament/${currentLeague.id}/${r}`);
          const roundData = await resRound.json();
          roundsArray.push(roundData.players);
        }

        setRounds(roundsArray);
      } catch (err) {
        console.error("Error fetching tournament data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    <div>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">

          {/* League Tabs */}
          <div className="mb-2 sm:mb-4 flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 overflow-x-auto">
            {LEAGUES.map((league, idx) => (
              <button
                key={league.id}
                onClick={() => setLeagueIndex(idx)}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-semibold text-lg sm:text-base whitespace-nowrap ${leagueIndex === idx
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
            {Array.from({ length: numberOfRounds }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedRound(idx)}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-semibold text-lg sm:text-base whitespace-nowrap ${selectedRound === idx
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
                const tableName =
                  pairing.player1 === BOT_ID || pairing.player2 === BOT_ID
                    ? BOT_TABLE
                    : currentLeague.tables[idx];

                return (
                  <div key={idx} className="px-3 sm:px-6 py-2 sm:py-4 hover:bg-slate-700/30 transition-colors flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    {/* Board */}
                    <div className="sm:w-12 flex-shrink-0 flex justify-start sm:justify-center mb-1 sm:mb-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg text-sm sm:text-base">
                        {tableName}
                      </div>
                    </div>

                    {/* White */}
                    <div className="flex-1 flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm bg-white shadow-md flex-shrink-0"></div>
                      {
                        pairing.player1.toLowerCase().includes("smail") ? (
                          <div
                            className="font-semibold text-white truncate text-xl"
                            ref={textRef}
                            style={{ position: 'relative', zIndex: 10 }}
                          >
                            {capitalizeFirstLetter(pairing.player1)}
                          </div>
                        ) : (
                          <div className="font-semibold text-white truncate text-xl">
                            {capitalizeFirstLetter(pairing.player1)}
                          </div>
                        )
                      }
                    </div>

                    {/* Black */}
                    <div className="flex-1 flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm bg-slate-900 shadow-md border-2 border-slate-600 flex-shrink-0"></div>

                      {
                        pairing.player2.toLowerCase().includes("smail") ? (
                          <div
                            className="font-semibold text-white truncate text-xl"
                            ref={textRef}
                            style={{ position: 'relative', zIndex: 10 }}
                          >
                            {capitalizeFirstLetter(pairing.player2)}
                          </div>
                        ) : (
                          <div className="font-semibold text-white truncate text-xl">
                            {capitalizeFirstLetter(pairing.player2)}
                          </div>
                        )
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>



      </div>
    </div>
  );
}

