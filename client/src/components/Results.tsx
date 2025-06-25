import React from 'react';
import type { LotteryData, WinningNumbersData } from '../App';

interface ResultsProps {
  extractedData: LotteryData;
  onFetchWinningNumbers: () => void;
  winningLoading: boolean;
  winningError: string | null;
  winningNumbers: WinningNumbersData | null;
}


// Helper to format date as DD.MM.YYYY
function formatDateDDMMYYYY(dateStr: string): string {
  // Accepts YYYY-MM-DD or ISO or DD.MM.YYYY
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}.${m}.${y}`;
  }
  // Already in DD.MM.YYYY
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) return dateStr;
  // Try to parse with Date
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }
  return dateStr; // fallback
}

const Results: React.FC<ResultsProps> = ({
  extractedData,
  onFetchWinningNumbers,
  winningLoading,
  winningError,
  winningNumbers,
}) => (
  <div className="results-container">
    <h2>Vsazená čísla:</h2>
    <p><strong>Datum losovani:</strong> {extractedData.date}</p>
    
    <div>
      {extractedData.winningNumbers.map((row, index) => (
        <p key={index}>{row}</p>
      ))}
    </div>

    <p><strong>Šance:</strong> {extractedData.sanceNumber}</p>
    <button onClick={onFetchWinningNumbers} className="fetch-winning-button" disabled={winningLoading}>
      {winningLoading ? 'Loading Winning Numbers...' : 'Show Official Winning Numbers'}
    </button>
    {winningError && <p className="error-message">{winningError}</p>}
    {winningNumbers && (
      <div className="winning-numbers-container">
        <h2>Výsledky</h2>
        <p><strong>Výsledky pro datum:</strong> {formatDateDDMMYYYY(winningNumbers.drawDate)}</p>
        <p>
          <strong>1. TAH:</strong> {winningNumbers.mainGame1Numbers.slice().sort((a, b) => a - b).join(' ')}
          {winningNumbers.mainGame1Extra !== null && (
            <span> | <strong>{winningNumbers.mainGame1Extra}</strong></span>
          )}
        </p>
        <p>
          <strong>2. TAH:</strong> {winningNumbers.mainGame2Numbers.slice().sort((a, b) => a - b).join(' ')}
          {winningNumbers.mainGame2Extra !== null && (
            <span> | <strong>{winningNumbers.mainGame2Extra}</strong></span>
          )}
        </p>
        <p><strong>Šance: </strong>{winningNumbers.addonNumbers.join('')}</p>
      </div>
    )}
  </div>
);

export default Results; 
