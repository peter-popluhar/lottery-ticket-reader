import React from 'react';
import type { LotteryData, WinningNumbersData } from '../App';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

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
  <Box
    component="span"
    sx={{
      px: 0.7,
      py: 0.2,
      borderRadius: 1,
      bgcolor: highlight ? 'primary.main' : 'transparent',
      color: highlight ? 'primary.contrastText' : 'inherit',
      fontWeight: highlight ? 700 : 400,
      fontSize: '1.1rem',
      transition: 'background 0.2s',
      display: 'inline-block',
    }}
  >
    {num}
  </Box>
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
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Vsazená čísla:
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Datum losovani:</strong> {extractedData.date}
        </Typography>
        <Box sx={{ mb: 2 }}>
          {parsedRows.map((rowArr, rowIdx) => (
            <Box key={rowIdx} sx={{ mb: 0.5 }}>
              {rowArr.map((num, idx) => (
                <React.Fragment key={idx}>
                  {highlightNumber(num, false)}{' '}
                </React.Fragment>
              ))}
            </Box>
          ))}
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Šance:</strong> {extractedData.sanceNumber}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={onFetchWinningNumbers}
          disabled={winningLoading}
          sx={{ mb: 2 }}
        >
          {winningLoading ? 'Loading Winning Numbers...' : 'Show Official Winning Numbers'}
        </Button>
        {winningError && (
          <Alert severity="error" sx={{ mb: 2 }}>{winningError}</Alert>
        )}
        {winningNumbers && (
          <>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Výsledky
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Výsledky pro datum:</strong> {formatDateDDMMYYYY(winningNumbers.drawDate)}
            </Typography>
            {/* 1. TAH */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                1. TAH
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Výherní čísla:</strong> {winningNumbers.mainGame1Numbers.slice().sort((a, b) => a - b).join(' ')}
                {winningNumbers.mainGame1Extra !== null && (
                  <span> | <strong>{winningNumbers.mainGame1Extra}</strong></span>
                )}
              </Typography>
              <Box>
                {parsedRows.map((rowArr, rowIdx) => (
                  <Box key={rowIdx} sx={{ mb: 0.5 }}>
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
                  </Box>
                ))}
              </Box>
            </Box>
            {/* 2. TAH */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                2. TAH
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Výherní čísla:</strong> {winningNumbers.mainGame2Numbers.slice().sort((a, b) => a - b).join(' ')}
                {winningNumbers.mainGame2Extra !== null && (
                  <span> | <strong>{winningNumbers.mainGame2Extra}</strong></span>
                )}
              </Typography>
              <Box>
                {parsedRows.map((rowArr, rowIdx) => (
                  <Box key={rowIdx} sx={{ mb: 0.5 }}>
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
                  </Box>
                ))}
              </Box>
            </Box>
            <Typography variant="body1">
              <strong>Šance: </strong>{highlightNumber(
                winningNumbers.addonNumbers.join(''),
                winningNumbers.addonNumbers.join('') === extractedData.sanceNumber
              )}
            </Typography>
            </>
        )}
      </Paper>
    </Container>
  );
};

export default Results; 
