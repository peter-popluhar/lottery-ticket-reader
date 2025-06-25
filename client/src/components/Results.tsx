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

const highlightNumber = (num: string | number, highlight: boolean) => (
  <span className={highlight ? 'highlighted-number' : undefined}>{num}</span>
);

const Results: React.FC<ResultsProps> = ({
  extractedData,
  onFetchWinningNumbers,
  winningLoading,
  winningError,
  winningNumbers,
}) => {
  // Parse extracted rows into arrays of numbers for comparison
  const parsedRows = extractedData.winningNumbers.map(row =>
    row.split(/\s+/).map(n => n.replace(/[^\d]/g, '')).filter(Boolean)
  );

  return (
    <div className="results-container">
      <h2>Vsazená čísla:</h2>
      <p><strong>Datum losovani:</strong> {extractedData.date}</p>
      <div>
        {parsedRows.map((rowArr, rowIdx) => (
          <p key={rowIdx}>
            {rowArr.map((num, idx) => (
              <React.Fragment key={idx}>
                {highlightNumber(num, false)}{' '}
              </React.Fragment>
            ))}
          </p>
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
          {/* 1. TAH */}
          <div className="draw-section">
            <h3>1. TAH</h3>
            <p>
              <strong>Výherní čísla:</strong> {winningNumbers.mainGame1Numbers.slice().sort((a, b) => a - b).join(' ')}
              {winningNumbers.mainGame1Extra !== null && (
                <span> | <strong>{winningNumbers.mainGame1Extra}</strong></span>
              )}
            </p>
            <div>
              {parsedRows.map((rowArr, rowIdx) => (
                <p key={rowIdx}>
                  {rowArr.map((num, idx) => {
                    const mainNumbers = winningNumbers.mainGame1Numbers;
                    const extra = winningNumbers.mainGame1Extra;
                    const isMatch = mainNumbers.includes(Number(num)) || (extra !== null && Number(num) === extra);
                    return (
                      <React.Fragment key={idx}>
                        {highlightNumber(num, isMatch)}{' '}
                      </React.Fragment>
                    );
                  })}
                </p>
              ))}
            </div>
          </div>
          {/* 2. TAH */}
          <div className="draw-section">
            <h3>2. TAH</h3>
            <p>
              <strong>Výherní čísla:</strong> {winningNumbers.mainGame2Numbers.slice().sort((a, b) => a - b).join(' ')}
              {winningNumbers.mainGame2Extra !== null && (
                <span> | <strong>{winningNumbers.mainGame2Extra}</strong></span>
              )}
            </p>
            <div>
              {parsedRows.map((rowArr, rowIdx) => (
                <p key={rowIdx}>
                  {rowArr.map((num, idx) => {
                    const mainNumbers = winningNumbers.mainGame2Numbers;
                    const extra = winningNumbers.mainGame2Extra;
                    const isMatch = mainNumbers.includes(Number(num)) || (extra !== null && Number(num) === extra);
                    return (
                      <React.Fragment key={idx}>
                        {highlightNumber(num, isMatch)}{' '}
                      </React.Fragment>
                    );
                  })}
                </p>
              ))}
            </div>
          </div>
          <p><strong>Šance: </strong>{highlightNumber(
            winningNumbers.addonNumbers.join(''),
            winningNumbers.addonNumbers.join('') === extractedData.sanceNumber
          )}</p>
        </div>
      )}
    </div>
  );
};

export default Results; 
