import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  LogarithmicScale,
} from "chart.js";

ChartJS.register(CategoryScale, LogarithmicScale, LinearScale, BarElement, Tooltip, Legend);
