import { injectGlobal } from "@emotion/css";
import { colors, cssVariables } from "../utils/cssVariables";

const theme = colors;

injectGlobal`

:root {
  --font-monospace: ${cssVariables.fontMonospace};
}

* {
  box-sizing: border-box;
}

html,
body {
  padding: 0;
  margin: 0;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  // For some reason, iOS makes the text on some <pre> tags (not all)
  // much larged. This property disables that behavior.
  text-size-adjust: none;
  -webkit-text-size-adjust: none;
}

body {
  color: ${theme.text};
  background: ${theme.background};
  font-size: 16px;
  line-height: 1.75;
  font-weight: 400;
  font-family: ${cssVariables.fontFamily};
  overflow-x: hidden;
  width: 100vw;
}


h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.5;
}

h1 {
  font-size: 40px;
  margin-top: 0;
  margin-bottom: 32px;
}
h2 {
  font-size: 32px;
  margin: 32px 0 8px;
}
h3 {
  font-size: 24px;
  margin: 28px 0 8px;
}
h4 {
  font-size: 20px;
  margin: 24px 0 8px;
}
h5 {
  font-size: 16px;
  margin: 24px 0 8px;
}
h6 {
  font-size: 14px;
  margin: 24px 0 8px;
}

 pre, code {
  font-family: ${cssVariables.fontMonospace};
  font-weight: 400;
}

code {
  color: ${theme.blue};
  font-size: 0.925em;
  line-height: 1;
  background: ${theme.codeBackground};
  border-radius: 4px;
  display: inline-block;
  padding: 0.3em 0.4em 0.35em;
}

a {
  color: ${theme.blue};
  text-decoration: none;

  &:hover {
    text-decoration: underline;

    code {
      text-decoration: underline;
    }
  }
}

p, li {
  font-size: 18px;
}

ul, ol, p {
  margin: 8px 0 24px;
}

ul, ol {
  padding-left: 40px;
}

ul {
  list-style: disc;
}

ol {
  list-style: decimal;
}

li {
  margin-bottom: 8px;
  
  &:last-of-type {
    margin-bottom: 0;
  }
}

table {
  border-collapse: collapse;

  &[data-align="right"] {
    td {
      text-align: right;
    }
  }
  &[data-align="center"] {
    td {
      text-align: center;
    }
  }

  display: block;
  max-width: fit-content;
  margin: 32px 0;
  overflow-x: auto;
  white-space: nowrap;
}

tbody tr:nth-child(even) {
  background-color: ${colors.background200};
}

th, td {
  border: 1px solid ${colors.darkBlue400};
  padding: 8px 16px;
}
table[data-pad-heading="true"] th {
  padding: 8px 32px;
}

button {
  cursor: pointer;
  padding: 0;
  background: transparent;
  border: none;
}

hr {
  margin: 32px 0;
  background: ${theme.medium500};
  border: none;
  height: 1px;
}

blockquote {
  position: relative;
  margin: 24px 0;
  padding-left: 16px;
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 4px;
    background: ${theme.medium500};
  }
}

@keyframes blink {
  0% { opacity: 1; }
  20% { opacity: 0; }
  50% { opacity: 0; }
  55% { opacity: 1; }
  100% { opacity: 1; }
}

.selection-cursor {
  position: relative;
  
  &:after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: -1px;
    width: 2px;
    content: "";
    background: ${theme.text};
    animation: blink 1s infinite;
    animation-delay: 1s;
  }
}
.selection-bg {
  background: rgba(19, 137, 255, 0.3);

  &.newline {
    padding-right: 12px;
    box-sizing: content-box;
  }
}

mjx-container svg {
  overflow: visible;
}

[data-varlabel] {
  display: none;
}
`;
