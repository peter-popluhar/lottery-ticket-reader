import { useState } from 'react';
import { auth } from '../firebase';
import type { WinningNumbersData } from '../App';

function normalizeDateString(dateStr: string): string {
  const match = dateStr.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/);
  if (match) {
    const [d = '01', m = '01', y = '1970'] = dateStr.split('.');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return dateStr;
}

export function useFetchWinningNumbers(extractedData: { date: string } | null) {
  const [winningNumbers, setWinningNumbers] = useState<WinningNumbersData | null>(null);
  const [winningLoading, setWinningLoading] = useState(false);
  const [winningError, setWinningError] = useState<string | null>(null);

  const handleFetchWinningNumbers = async () => {
    if (!auth.currentUser || !extractedData?.date) return;
    setWinningLoading(true);
    setWinningError(null);
    setWinningNumbers(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const normalizedDate = normalizeDateString(extractedData.date);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/winning-numbers?date=${encodeURIComponent(normalizedDate)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data: WinningNumbersData = await response.json();
      setWinningNumbers(data);
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (err instanceof Error) message = err.message;
      setWinningError(`Failed to fetch winning numbers: ${message}`);
    } finally {
      setWinningLoading(false);
    }
  };

  return { handleFetchWinningNumbers, winningLoading, winningError, winningNumbers };
} 
