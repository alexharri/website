const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatDate (date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${months[month - 1]} ${day}, ${year}`;
}
