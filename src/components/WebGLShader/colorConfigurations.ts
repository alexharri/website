export type ColorConfiguration = keyof typeof colorConfigurations;

export const colorConfigurations = {
  default: {
    gradient: [
      "hsl(240deg 100% 20%)",
      "hsl(281deg 100% 21%)",
      "hsl(304deg 100% 23%)",
      "hsl(319deg 100% 30%)",
      "hsl(329deg 100% 36%)",
      "hsl(336deg 100% 41%)",
      "hsl(346deg 83% 51%)",
      "hsl(3deg 95% 61%)",
      "hsl(17deg 100% 59%)",
      "hsl(30deg 100% 55%)",
      "hsl(40deg 100% 50%)",
      "hsl(48deg 100% 50%)",
      "hsl(55deg 100% 50%)",
    ],
  },

  black_white: {
    gradient: [
      "hsl(0deg 0% 0%)",
      "hsl(0deg 0% 20%)",
      "hsl(0deg 0% 40%)",
      "hsl(0deg 0% 60%)",
      "hsl(0deg 0% 80%)",
      "hsl(0deg 0% 100%)",
    ],
  },

  lightgreen: {
    gradient: [
      "hsl(135deg 91% 33%)",
      "hsl(137deg 88% 35%)",
      "hsl(138deg 87% 37%)",
      "hsl(140deg 86% 38%)",
      "hsl(141deg 85% 40%)",
      "hsl(143deg 85% 41%)",
      "hsl(145deg 85% 43%)",
      "hsl(146deg 86% 44%)",
      "hsl(148deg 87% 45%)",
      "hsl(149deg 88% 47%)",
      "hsl(150deg 89% 48%)",
      "hsl(152deg 91% 49%)",
      "hsl(153deg 94% 50%)",
      "hsl(155deg 98% 50%)",
    ],
    accentColor: "#17FFF2",
  },

  orange: {
    gradient: [
      "hsl(345deg 100% 37%)",
      "hsl(1deg 67% 48%)",
      "hsl(13deg 75% 48%)",
      "hsl(23deg 86% 47%)",
      "hsl(31deg 100% 45%)",
      "hsl(36deg 100% 46%)",
      "hsl(42deg 100% 46%)",
      "hsl(49deg 100% 45%)",
      "hsl(56deg 100% 44%)",
      "hsl(64deg 84% 50%)",
      "hsl(75deg 100% 61%)",
    ],
    // accentColor: "#ff5338",
  },

  green: {
    gradient: [
      "hsl(170deg 31% 19%)",
      "hsl(163deg 48% 24%)",
      "hsl(152deg 49% 30%)",
      "hsl(133deg 38% 40%)",
      "hsl(105deg 39% 47%)",
      "hsl(83deg 52% 49%)",
      "hsl(68deg 68% 49%)",
      "hsl(56deg 100% 48%)",
      "hsl(54deg 95% 63%)",
      "hsl(53deg 99% 71%)",
      "hsl(52deg 100% 77%)",
    ],
  },

  pastel: {
    gradient: ["hsl(141 75% 72%)", "hsl(41 90% 62%)", "hsl(358 64% 50%)"],
  },

  blue: {
    gradient: [
      "hsl(253deg 95% 59%)",
      "hsl(248deg 95% 61%)",
      "hsl(242deg 95% 63%)",
      "hsl(237deg 94% 62%)",
      "hsl(232deg 94% 60%)",
      "hsl(227deg 93% 57%)",
      "hsl(223deg 92% 54%)",
      "hsl(214deg 100% 50%)",
      "hsl(207deg 100% 50%)",
      "hsl(202deg 100% 50%)",
      "hsl(197deg 100% 50%)",
      "hsl(192deg 100% 50%)",
      "hsl(185deg 100% 47%)",
      "hsl(178deg 85% 50%)",
    ],
    accentColor: "#f26bff",
  },

  blue_to_yellow: {
    gradient: [
      "hsl(204deg 100% 22%)",
      "hsl(199deg 100% 29%)",
      "hsl(189deg 100% 32%)",
      "hsl(173deg 100% 33%)",
      "hsl(154deg 100% 39%)",
      "hsl( 89deg  70% 56%)",
      "hsl( 55deg 100% 50%)",
    ],
  },
};
