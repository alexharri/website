const monthsFull = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthsShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDate(date: string, short = false) {
  const [year, month, day] = date.split("-").map(Number);
  const monthsArr = short ? monthsShort : monthsFull;
  return `${monthsArr[month - 1]} ${day}, ${year}`;
}
