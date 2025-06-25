export const prompt = `
    Extract the winning numbers, date, and Šance number from this lottery ticket. 
    Format the output as a JSON object with 'date' (date is after string 'POCET SLOSOVÁNÍ'), 
    'sanceNumber' (number after string 'Šance' in a same row, like '089229' with no colons or semicolons), 
    and 'winningNumbers' (an array of strings, where each string represents a row of numbers like '05 21 32 36 38 46 NT' but remove NT from each row, and remove leading zero from each number). 
    If there is no lottery ticekt, dont return numbers used in this prompt as an examples.
`
