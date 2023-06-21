import { renderToStaticMarkup } from "react-dom/server";

export const SquiggleIcon10x7 = (props: { color?: string }) => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#squiggle)">
      <path
        d="M-3.09375 1C-0.09375 1 -1.09375 5 1.90625 5C4.90625 5 3.90625 1 6.90625 1C9.90625 1 8.90625 5 11.9062 5"
        stroke={props.color || "currentColor"}
        strokeWidth="1.5"
      />
    </g>
    <defs>
      <clipPath id="squiggle">
        <rect width="10" height="6" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const squiggleIcon10x7Base64Red = btoa(
  renderToStaticMarkup(<SquiggleIcon10x7 color="#d1535d" />),
);
export const squiggleIcon10x7Base64Blue = btoa(
  renderToStaticMarkup(<SquiggleIcon10x7 color="#4574d4" />),
);
