import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ExtrudeGeometry, Group, Vector3 } from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { getBasicMaterial, IVector3, parseVector } from "../utils";

const aSvg =
  '<svg width="7" height="8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.449707 4.85383C0.449707 3.94013 0.793476 3.07166 1.48102 2.24842C2.16855 1.42518 2.94204 1.00904 3.80146 0.999995C4.26283 0.999995 4.66993 1.22164 5.02274 1.66492C5.16749 1.39352 5.37556 1.25782 5.64696 1.25782C5.76456 1.25782 5.8686 1.29401 5.95906 1.36638C6.04953 1.43875 6.09476 1.52922 6.09476 1.63778C6.09476 1.75538 5.9274 2.47911 5.59268 3.80895C5.25796 5.1388 5.08607 5.88966 5.07702 6.06155C5.07702 6.28771 5.10869 6.43698 5.17201 6.50935C5.23534 6.58172 5.33033 6.62243 5.45698 6.63148C5.5384 6.62243 5.62886 6.58172 5.72838 6.50935C5.91835 6.32842 6.10381 5.89419 6.28474 5.20665C6.33902 5.02572 6.38425 4.93073 6.42044 4.92168C6.43853 4.91263 6.48376 4.90811 6.55614 4.90811H6.61042C6.7823 4.90811 6.86824 4.94882 6.86824 5.03024C6.86824 5.08452 6.84563 5.20665 6.80039 5.39662C6.75516 5.5866 6.6647 5.83086 6.529 6.1294C6.3933 6.42793 6.24855 6.6541 6.09476 6.80789C5.97716 6.92549 5.83241 7.02048 5.66053 7.09286C5.58815 7.11095 5.4796 7.12 5.33485 7.12C5.02727 7.12 4.76944 7.05215 4.56137 6.91645C4.3533 6.78075 4.2176 6.64053 4.15427 6.49578L4.07286 6.29223C4.06381 6.28319 4.04572 6.28771 4.01858 6.3058C4.00048 6.3239 3.98239 6.34199 3.9643 6.36008C3.43055 6.86669 2.88776 7.12 2.33592 7.12C1.83835 7.12 1.3996 6.93906 1.01964 6.5772C0.639685 6.21534 0.449707 5.64088 0.449707 4.85383ZM4.76492 2.53339C4.76492 2.47911 4.7423 2.3796 4.69707 2.23485C4.65184 2.09011 4.5478 1.93179 4.38496 1.75991C4.22212 1.58802 4.01405 1.49756 3.76075 1.48851C3.44412 1.48851 3.14106 1.62873 2.85157 1.90917C2.56208 2.18962 2.33592 2.556 2.17308 3.00833C1.91073 3.72301 1.72527 4.46483 1.61671 5.23379C1.61671 5.26093 1.61671 5.31068 1.61671 5.38305C1.61671 5.45543 1.61219 5.50971 1.60314 5.54589C1.60314 5.95299 1.68456 6.23343 1.8474 6.38722C2.01024 6.54102 2.20474 6.62243 2.4309 6.63148C2.77467 6.63148 3.11392 6.48221 3.44864 6.18368C3.78337 5.88514 3.98239 5.65445 4.04572 5.49161C4.06381 5.45543 4.18594 4.97144 4.4121 4.03964C4.63827 3.10784 4.75587 2.60576 4.76492 2.53339Z" fill="white"/></svg>';
const bSvg =
  '<svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.992391 1.63795C0.992391 1.54745 1.01049 1.44338 1.04669 1.32573C1.08289 1.20809 1.13719 1.14927 1.20958 1.14927C1.21863 1.14927 1.54442 1.12664 2.18694 1.08139C2.82947 1.03614 3.15978 1.009 3.17788 0.999946C3.28648 0.999946 3.34077 1.04067 3.34077 1.12212C3.34077 1.20356 3.18693 1.85061 2.87924 3.06327C2.80684 3.37095 2.72992 3.68769 2.64848 4.01348C2.56703 4.33927 2.49916 4.58361 2.44486 4.7465L2.39056 5.00441C2.39056 5.03156 2.41771 5.01799 2.47201 4.96369C2.91544 4.60171 3.37245 4.42071 3.84303 4.42071C4.40411 4.42071 4.85659 4.62885 5.20048 5.04514C5.54436 5.46142 5.72083 5.9863 5.72988 6.61978C5.72988 7.62429 5.37242 8.53378 4.6575 9.34824C3.94258 10.1627 3.17336 10.5699 2.34984 10.5699C1.89736 10.5699 1.4856 10.398 1.11456 10.0541C0.743526 9.71023 0.553483 9.15368 0.544434 8.38446V8.26229C0.544434 8.07224 0.580632 7.8098 0.653029 7.47497C0.725427 7.14013 0.947143 6.24874 1.31818 4.8008C1.77066 3.01802 1.9969 2.07233 1.9969 1.96373C1.9969 1.85514 1.82496 1.79179 1.48107 1.77369C1.43582 1.77369 1.39963 1.77369 1.37248 1.77369H1.3046C1.21411 1.77369 1.15528 1.77369 1.12814 1.77369C1.10099 1.77369 1.06931 1.76012 1.03311 1.73297C0.996916 1.70582 0.983341 1.67414 0.992391 1.63795ZM4.56248 6.00893V5.92748C4.56248 5.2578 4.28646 4.92297 3.73443 4.92297C3.58059 4.92297 3.42222 4.95917 3.25933 5.03156C3.09643 5.10396 2.94711 5.19898 2.81137 5.31663C2.67563 5.43427 2.55798 5.54287 2.45843 5.64241C2.35889 5.74196 2.27744 5.84151 2.21409 5.94105L2.13265 6.04965L1.84758 7.21705C1.64849 7.99532 1.54894 8.54735 1.54894 8.87314C1.54894 9.30752 1.65754 9.63331 1.87473 9.8505C2.01953 9.99529 2.20052 10.0677 2.41771 10.0677C2.71635 10.0677 3.01951 9.9229 3.3272 9.63331C3.55344 9.42517 3.73443 9.17178 3.87018 8.87314C4.00592 8.5745 4.15524 8.09939 4.31814 7.44782C4.48103 6.79624 4.56248 6.31661 4.56248 6.00893Z" fill="white"/></svg>';
const cSvg =
  '<svg width="6" height="8" viewBox="0 0 6 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.462402 4.842C0.462402 3.85546 0.851586 2.96849 1.62995 2.18107C2.40832 1.39365 3.25004 0.999944 4.15512 0.999944C4.66196 0.999944 5.06019 1.10855 5.34982 1.32577C5.63944 1.54299 5.78878 1.82809 5.79783 2.18107C5.79783 2.44354 5.71185 2.66529 5.53989 2.8463C5.36792 3.02732 5.1507 3.12235 4.88823 3.1314C4.71627 3.1314 4.5805 3.08615 4.48095 2.99564C4.38139 2.90513 4.33161 2.76937 4.33161 2.58835C4.33161 2.40734 4.38139 2.25348 4.48095 2.12677C4.5805 2.00005 4.68006 1.90502 4.77962 1.84167C4.87918 1.77831 4.94253 1.75116 4.96969 1.76021H4.98326C4.98326 1.74211 4.95611 1.71496 4.90181 1.67875C4.8475 1.64255 4.75247 1.60635 4.61671 1.57014C4.48095 1.53394 4.32708 1.51584 4.15512 1.51584C3.88359 1.51584 3.62565 1.57919 3.38128 1.7059C3.19121 1.78736 2.99662 1.92765 2.7975 2.12677C2.39927 2.525 2.10964 3.08615 1.92863 3.81021C1.74761 4.53427 1.65258 5.05922 1.64353 5.38504C1.64353 5.80138 1.76119 6.11363 1.99651 6.3218C2.19563 6.53902 2.4581 6.64763 2.78393 6.64763H2.83823C3.85192 6.64763 4.68911 6.26297 5.34982 5.49365C5.43128 5.40314 5.48558 5.35789 5.51273 5.35789C5.54894 5.35789 5.60777 5.39862 5.68922 5.48008C5.77068 5.56153 5.81593 5.62489 5.82499 5.67014C5.83404 5.7154 5.79331 5.78328 5.7028 5.87379C5.61229 5.96429 5.48106 6.091 5.30909 6.25392C5.13713 6.41683 4.93348 6.55259 4.69816 6.6612C4.46284 6.76981 4.17322 6.88295 3.82929 7.00061C3.48536 7.11827 3.12333 7.16805 2.7432 7.14994C2.06439 7.14994 1.51682 6.93273 1.10048 6.49829C0.684146 6.06385 0.471453 5.51175 0.462402 4.842Z" fill="white"/></svg>';
const vecnSvg =
  '<svg width="8" height="11" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.285156 6.57505C0.294203 6.52077 0.307773 6.44839 0.325866 6.35793C0.34396 6.26746 0.39824 6.09557 0.488706 5.84227C0.579173 5.58896 0.66964 5.37636 0.760106 5.20448C0.850573 5.03259 0.999843 4.86523 1.20792 4.70239C1.41599 4.53955 1.62406 4.46265 1.83214 4.4717C2.15782 4.4717 2.42922 4.55312 2.64634 4.71596C2.86346 4.8788 2.99916 5.03259 3.05344 5.17734C3.10772 5.32208 3.13486 5.41707 3.13486 5.46231C3.13486 5.4804 3.13938 5.48945 3.14843 5.48945L3.2977 5.34018C3.84954 4.76119 4.47829 4.4717 5.18393 4.4717C5.67245 4.4717 6.06598 4.59383 6.36452 4.83809C6.66306 5.08235 6.81685 5.43969 6.8259 5.91012C6.83494 6.38054 6.66306 7.09071 6.31024 8.04061C5.95742 8.99051 5.78553 9.56497 5.79458 9.764C5.79458 9.99921 5.87147 10.1168 6.02527 10.1168C6.07955 10.1168 6.12026 10.1123 6.1474 10.1032C6.40975 10.058 6.64496 9.88613 6.85304 9.58759C7.06111 9.28905 7.21943 8.92718 7.32799 8.50199C7.34608 8.42961 7.43655 8.39343 7.59939 8.39343C7.78032 8.39343 7.87079 8.42961 7.87079 8.50199C7.87079 8.51103 7.85269 8.57888 7.81651 8.70554C7.74413 8.96789 7.64462 9.22572 7.51797 9.47903C7.39131 9.73233 7.18324 9.98564 6.89375 10.2389C6.60425 10.4923 6.29214 10.6144 5.95742 10.6053C5.53222 10.6053 5.22464 10.4832 5.03466 10.2389C4.84468 9.99469 4.74969 9.74138 4.74969 9.47903C4.74969 9.30714 4.91253 8.76434 5.23821 7.85063C5.56389 6.93691 5.73125 6.24937 5.7403 5.78799C5.7403 5.25423 5.54127 4.98736 5.14322 4.98736H5.07537C4.29735 4.98736 3.64147 5.44421 3.10772 6.35793L3.01273 6.52077L2.56492 8.33915C2.26638 9.52426 2.09449 10.162 2.04926 10.2525C1.93165 10.4968 1.73715 10.6189 1.46575 10.6189C1.34814 10.6189 1.25315 10.5918 1.18078 10.5375C1.1084 10.4832 1.05865 10.4289 1.03151 10.3746C1.00437 10.3204 0.99532 10.2751 1.00437 10.2389C1.00437 10.1213 1.17625 9.38404 1.52003 8.02704C1.8638 6.67004 2.04473 5.93273 2.06283 5.81513C2.07187 5.76989 2.0764 5.66586 2.0764 5.50302C2.0764 5.1502 1.96784 4.97379 1.75072 4.97379C1.40694 4.97379 1.12197 5.42612 0.895806 6.33079C0.841526 6.51172 0.814386 6.60671 0.814386 6.61576C0.796293 6.67004 0.71035 6.69718 0.556556 6.69718H0.366576C0.312296 6.6429 0.285156 6.60219 0.285156 6.57505Z" fill="white"/><path d="M5.79458 0.631385C5.79458 0.559012 5.81719 0.495685 5.86243 0.441405C5.90766 0.387125 5.97551 0.359985 6.06598 0.359985C6.1293 0.359985 6.18358 0.382602 6.22882 0.427835C6.27405 0.464022 6.31928 0.549965 6.36452 0.685665C6.45498 1.02039 6.64044 1.27822 6.92089 1.45916C7.0204 1.52248 7.07016 1.6039 7.07016 1.70342C7.07016 1.78484 7.05659 1.83912 7.02945 1.86626C7.00231 1.8934 6.93898 1.93411 6.83947 1.98839C6.45046 2.18741 6.11121 2.47238 5.82172 2.8433C5.80362 2.86139 5.78101 2.88853 5.75387 2.92472C5.72673 2.9609 5.70411 2.98804 5.68602 3.00614C5.66792 3.02423 5.64531 3.03328 5.61817 3.03328C5.59103 3.03328 5.55936 3.0378 5.52318 3.04685C5.45985 3.04685 5.40105 3.02423 5.34677 2.979C5.29249 2.93376 5.26082 2.86591 5.25178 2.77545C5.25178 2.60356 5.46437 2.33668 5.88957 1.97482H3.5691L1.24863 1.96125C1.13102 1.87983 1.07222 1.79388 1.07222 1.70342C1.07222 1.64009 1.13102 1.54962 1.24863 1.43202H6.12026C5.90314 1.08824 5.79458 0.821365 5.79458 0.631385Z" fill="white"/><path d="M0.285156 6.57505C0.294203 6.52077 0.307773 6.44839 0.325866 6.35793C0.34396 6.26746 0.39824 6.09557 0.488706 5.84227C0.579173 5.58896 0.66964 5.37636 0.760106 5.20448C0.850573 5.03259 0.999843 4.86523 1.20792 4.70239C1.41599 4.53955 1.62406 4.46265 1.83214 4.4717C2.15782 4.4717 2.42922 4.55312 2.64634 4.71596C2.86346 4.8788 2.99916 5.03259 3.05344 5.17734C3.10772 5.32208 3.13486 5.41707 3.13486 5.46231C3.13486 5.4804 3.13938 5.48945 3.14843 5.48945L3.2977 5.34018C3.84954 4.76119 4.47829 4.4717 5.18393 4.4717C5.67245 4.4717 6.06598 4.59383 6.36452 4.83809C6.66306 5.08235 6.81685 5.43969 6.8259 5.91012C6.83494 6.38054 6.66306 7.09071 6.31024 8.04061C5.95742 8.99051 5.78553 9.56497 5.79458 9.764C5.79458 9.99921 5.87147 10.1168 6.02527 10.1168C6.07955 10.1168 6.12026 10.1123 6.1474 10.1032C6.40975 10.058 6.64496 9.88613 6.85304 9.58759C7.06111 9.28905 7.21943 8.92718 7.32799 8.50199C7.34608 8.42961 7.43655 8.39343 7.59939 8.39343C7.78032 8.39343 7.87079 8.42961 7.87079 8.50199C7.87079 8.51103 7.85269 8.57888 7.81651 8.70554C7.74413 8.96789 7.64462 9.22572 7.51797 9.47903C7.39131 9.73233 7.18324 9.98564 6.89375 10.2389C6.60425 10.4923 6.29214 10.6144 5.95742 10.6053C5.53222 10.6053 5.22464 10.4832 5.03466 10.2389C4.84468 9.99469 4.74969 9.74138 4.74969 9.47903C4.74969 9.30714 4.91253 8.76434 5.23821 7.85063C5.56389 6.93691 5.73125 6.24937 5.7403 5.78799C5.7403 5.25423 5.54127 4.98736 5.14322 4.98736H5.07537C4.29735 4.98736 3.64147 5.44421 3.10772 6.35793L3.01273 6.52077L2.56492 8.33915C2.26638 9.52426 2.09449 10.162 2.04926 10.2525C1.93165 10.4968 1.73715 10.6189 1.46575 10.6189C1.34814 10.6189 1.25315 10.5918 1.18078 10.5375C1.1084 10.4832 1.05865 10.4289 1.03151 10.3746C1.00437 10.3204 0.99532 10.2751 1.00437 10.2389C1.00437 10.1213 1.17625 9.38404 1.52003 8.02704C1.8638 6.67004 2.04473 5.93273 2.06283 5.81513C2.07187 5.76989 2.0764 5.66586 2.0764 5.50302C2.0764 5.1502 1.96784 4.97379 1.75072 4.97379C1.40694 4.97379 1.12197 5.42612 0.895806 6.33079C0.841526 6.51172 0.814386 6.60671 0.814386 6.61576C0.796293 6.67004 0.71035 6.69718 0.556556 6.69718H0.366576C0.312296 6.6429 0.285156 6.60219 0.285156 6.57505Z" stroke="white"/><path d="M5.79458 0.631385C5.79458 0.559012 5.81719 0.495685 5.86243 0.441405C5.90766 0.387125 5.97551 0.359985 6.06598 0.359985C6.1293 0.359985 6.18358 0.382602 6.22882 0.427835C6.27405 0.464022 6.31928 0.549965 6.36452 0.685665C6.45498 1.02039 6.64044 1.27822 6.92089 1.45916C7.0204 1.52248 7.07016 1.6039 7.07016 1.70342C7.07016 1.78484 7.05659 1.83912 7.02945 1.86626C7.00231 1.8934 6.93898 1.93411 6.83947 1.98839C6.45046 2.18741 6.11121 2.47238 5.82172 2.8433C5.80362 2.86139 5.78101 2.88853 5.75387 2.92472C5.72673 2.9609 5.70411 2.98804 5.68602 3.00614C5.66792 3.02423 5.64531 3.03328 5.61817 3.03328C5.59103 3.03328 5.55936 3.0378 5.52318 3.04685C5.45985 3.04685 5.40105 3.02423 5.34677 2.979C5.29249 2.93376 5.26082 2.86591 5.25178 2.77545C5.25178 2.60356 5.46437 2.33668 5.88957 1.97482H3.5691L1.24863 1.96125C1.13102 1.87983 1.07222 1.79388 1.07222 1.70342C1.07222 1.64009 1.13102 1.54962 1.24863 1.43202H6.12026C5.90314 1.08824 5.79458 0.821365 5.79458 0.631385Z" stroke="white"/></svg>';
const vecdSvg =
  '<svg width="9" height="16" viewBox="0 0 9 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.96631 5.62207C4.97535 5.62207 5.30102 5.59945 5.94329 5.55422C6.58557 5.50899 6.91575 5.48185 6.93385 5.47281C7.0424 5.47281 7.09668 5.50899 7.09668 5.58136C7.09668 5.64468 6.76649 7.01065 6.10612 9.67927C5.44575 12.3479 5.10652 13.7093 5.08843 13.7636C5.07034 13.8179 5.06582 13.8857 5.07486 13.9671C5.07486 14.3471 5.20151 14.5371 5.4548 14.5371C5.53622 14.528 5.62668 14.4873 5.72618 14.4149C5.91615 14.234 6.1016 13.7998 6.28252 13.1123C6.3368 12.9314 6.38203 12.8364 6.41822 12.8273C6.43631 12.8183 6.48154 12.8138 6.55391 12.8138H6.66246C6.79815 12.8138 6.866 12.8499 6.866 12.9223C6.866 12.9675 6.85243 13.0399 6.82529 13.1394C6.70769 13.5917 6.572 13.9581 6.41822 14.2385C6.26443 14.519 6.13778 14.6999 6.03828 14.7813C5.93877 14.8627 5.81212 14.9351 5.65834 14.9984C5.58597 15.0165 5.47742 15.0255 5.33268 15.0255C5.02511 15.0255 4.76729 14.9577 4.55923 14.822C4.35117 14.6863 4.21548 14.5461 4.15215 14.4014L4.07074 14.1978C4.06169 14.1888 4.0436 14.1933 4.01646 14.2114C3.99837 14.2295 3.98028 14.2476 3.96218 14.2657C3.42846 14.7723 2.88569 15.0255 2.33388 15.0255C1.83634 15.0255 1.3976 14.8446 1.01766 14.4828C0.637723 14.1209 0.447754 13.5465 0.447754 12.7595C0.447754 12.3253 0.538215 11.882 0.719139 11.4297C0.900062 10.9774 1.11717 10.5884 1.37046 10.2627C1.79563 9.74711 2.2208 9.38979 2.64597 9.19077C3.07114 8.99176 3.4556 8.89225 3.79935 8.89225C4.30594 8.89225 4.68588 9.08222 4.93917 9.46216C4.9844 9.51644 5.00702 9.53453 5.00702 9.51644C5.01606 9.48025 5.13818 8.98724 5.37338 8.03739C5.60858 7.08754 5.73523 6.58548 5.75332 6.53121C5.75332 6.41361 5.72166 6.34124 5.65834 6.3141C5.59502 6.28696 5.41862 6.26434 5.12914 6.24625H4.84418C4.78991 6.19197 4.76277 6.15579 4.76277 6.1377C4.76277 6.1196 4.77182 6.03367 4.78991 5.87988C4.83514 5.708 4.89394 5.62207 4.96631 5.62207ZM4.77634 10.4663C4.56828 9.75164 4.22905 9.39431 3.75865 9.39431C3.44203 9.39431 3.13898 9.53453 2.84951 9.81496C2.56003 10.0954 2.33388 10.4618 2.17105 10.9141C1.90871 11.6287 1.72326 12.3705 1.61471 13.1394C1.61471 13.1666 1.61471 13.2163 1.61471 13.2887C1.61471 13.3611 1.61018 13.4153 1.60114 13.4515C1.60114 13.8586 1.68255 14.139 1.84538 14.2928C2.00822 14.4466 2.20271 14.528 2.42886 14.5371C2.91735 14.5371 3.41942 14.2114 3.93505 13.5601L4.0436 13.4108L4.77634 10.4663Z" fill="white"/><path d="M7.51732 1.63271C7.51732 1.56034 7.53994 1.49702 7.58517 1.44274C7.6304 1.38847 7.69825 1.36133 7.78871 1.36133C7.85203 1.36133 7.90631 1.38394 7.95154 1.42917C7.99677 1.46536 8.042 1.5513 8.08723 1.68699C8.17769 2.0217 8.36314 2.27951 8.64357 2.46044C8.74308 2.52376 8.79283 2.60517 8.79283 2.70468C8.79283 2.7861 8.77926 2.84037 8.75212 2.86751C8.72498 2.89465 8.66166 2.93536 8.56215 2.98964C8.17317 3.18865 7.83394 3.47361 7.54446 3.8445C7.52637 3.86259 7.50375 3.88973 7.47662 3.92591C7.44948 3.9621 7.42686 3.98924 7.40877 4.00733C7.39068 4.02542 7.36806 4.03447 7.34092 4.03447C7.31378 4.03447 7.28212 4.03899 7.24594 4.04804C7.18262 4.04804 7.12382 4.02542 7.06954 3.98019C7.01526 3.93496 6.9836 3.86711 6.97455 3.77665C6.97455 3.60477 7.18714 3.33791 7.61231 2.97607H5.29197L2.97163 2.9625C2.85403 2.88108 2.79523 2.79514 2.79523 2.70468C2.79523 2.64136 2.85403 2.5509 2.97163 2.4333H7.84298C7.62588 2.08954 7.51732 1.82268 7.51732 1.63271Z" fill="white"/><path d="M4.96631 5.62207C4.97535 5.62207 5.30102 5.59945 5.94329 5.55422C6.58557 5.50899 6.91575 5.48185 6.93385 5.47281C7.0424 5.47281 7.09668 5.50899 7.09668 5.58136C7.09668 5.64468 6.76649 7.01065 6.10612 9.67927C5.44575 12.3479 5.10652 13.7093 5.08843 13.7636C5.07034 13.8179 5.06582 13.8857 5.07486 13.9671C5.07486 14.3471 5.20151 14.5371 5.4548 14.5371C5.53622 14.528 5.62668 14.4873 5.72618 14.4149C5.91615 14.234 6.1016 13.7998 6.28252 13.1123C6.3368 12.9314 6.38203 12.8364 6.41822 12.8273C6.43631 12.8183 6.48154 12.8138 6.55391 12.8138H6.66246C6.79815 12.8138 6.866 12.8499 6.866 12.9223C6.866 12.9675 6.85243 13.0399 6.82529 13.1394C6.70769 13.5917 6.572 13.9581 6.41822 14.2385C6.26443 14.519 6.13778 14.6999 6.03828 14.7813C5.93877 14.8627 5.81212 14.9351 5.65834 14.9984C5.58597 15.0165 5.47742 15.0255 5.33268 15.0255C5.02511 15.0255 4.76729 14.9577 4.55923 14.822C4.35117 14.6863 4.21548 14.5461 4.15215 14.4014L4.07074 14.1978C4.06169 14.1888 4.0436 14.1933 4.01646 14.2114C3.99837 14.2295 3.98028 14.2476 3.96218 14.2657C3.42846 14.7723 2.88569 15.0255 2.33388 15.0255C1.83634 15.0255 1.3976 14.8446 1.01766 14.4828C0.637723 14.1209 0.447754 13.5465 0.447754 12.7595C0.447754 12.3253 0.538215 11.882 0.719139 11.4297C0.900062 10.9774 1.11717 10.5884 1.37046 10.2627C1.79563 9.74711 2.2208 9.38979 2.64597 9.19077C3.07114 8.99176 3.4556 8.89225 3.79935 8.89225C4.30594 8.89225 4.68588 9.08222 4.93917 9.46216C4.9844 9.51644 5.00702 9.53453 5.00702 9.51644C5.01606 9.48025 5.13818 8.98724 5.37338 8.03739C5.60858 7.08754 5.73523 6.58548 5.75332 6.53121C5.75332 6.41361 5.72166 6.34124 5.65834 6.3141C5.59502 6.28696 5.41862 6.26434 5.12914 6.24625H4.84418C4.78991 6.19197 4.76277 6.15579 4.76277 6.1377C4.76277 6.1196 4.77182 6.03367 4.78991 5.87988C4.83514 5.708 4.89394 5.62207 4.96631 5.62207ZM4.77634 10.4663C4.56828 9.75164 4.22905 9.39431 3.75865 9.39431C3.44203 9.39431 3.13898 9.53453 2.84951 9.81496C2.56003 10.0954 2.33388 10.4618 2.17105 10.9141C1.90871 11.6287 1.72326 12.3705 1.61471 13.1394C1.61471 13.1666 1.61471 13.2163 1.61471 13.2887C1.61471 13.3611 1.61018 13.4153 1.60114 13.4515C1.60114 13.8586 1.68255 14.139 1.84538 14.2928C2.00822 14.4466 2.20271 14.528 2.42886 14.5371C2.91735 14.5371 3.41942 14.2114 3.93505 13.5601L4.0436 13.4108L4.77634 10.4663Z" stroke="white"/><path d="M7.51732 1.63271C7.51732 1.56034 7.53994 1.49702 7.58517 1.44274C7.6304 1.38847 7.69825 1.36133 7.78871 1.36133C7.85203 1.36133 7.90631 1.38394 7.95154 1.42917C7.99677 1.46536 8.042 1.5513 8.08723 1.68699C8.17769 2.0217 8.36314 2.27951 8.64357 2.46044C8.74308 2.52376 8.79283 2.60517 8.79283 2.70468C8.79283 2.7861 8.77926 2.84037 8.75212 2.86751C8.72498 2.89465 8.66166 2.93536 8.56215 2.98964C8.17317 3.18865 7.83394 3.47361 7.54446 3.8445C7.52637 3.86259 7.50375 3.88973 7.47662 3.92591C7.44948 3.9621 7.42686 3.98924 7.40877 4.00733C7.39068 4.02542 7.36806 4.03447 7.34092 4.03447C7.31378 4.03447 7.28212 4.03899 7.24594 4.04804C7.18262 4.04804 7.12382 4.02542 7.06954 3.98019C7.01526 3.93496 6.9836 3.86711 6.97455 3.77665C6.97455 3.60477 7.18714 3.33791 7.61231 2.97607H5.29197L2.97163 2.9625C2.85403 2.88108 2.79523 2.79514 2.79523 2.70468C2.79523 2.64136 2.85403 2.5509 2.97163 2.4333H7.84298C7.62588 2.08954 7.51732 1.82268 7.51732 1.63271Z" stroke="white"/></svg>';
const bsubaSvg =
  '<svg width="30" height="12" viewBox="0 0 30 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.99093 1.6391C0.99093 1.54861 1.00903 1.44453 1.04523 1.32689C1.08143 1.20924 1.13573 1.15042 1.20812 1.15042C1.21717 1.15042 1.54296 1.12779 2.18549 1.08255C2.82802 1.0373 3.15834 1.01015 3.17644 1.0011C3.28503 1.0011 3.33933 1.04182 3.33933 1.12327C3.33933 1.20472 3.18549 1.85177 2.8778 3.06443C2.8054 3.37212 2.72847 3.68886 2.64703 4.01465C2.56558 4.34044 2.49771 4.58479 2.44341 4.74768L2.38911 5.0056C2.38911 5.03275 2.41626 5.01917 2.47056 4.96487C2.91399 4.60289 3.371 4.42189 3.84159 4.42189C4.40267 4.42189 4.85516 4.63003 5.19905 5.04632C5.54294 5.46261 5.71941 5.98749 5.72846 6.62097C5.72846 7.62549 5.37099 8.53499 4.65606 9.34946C3.94114 10.1639 3.17191 10.5712 2.34839 10.5712C1.8959 10.5712 1.48414 10.3992 1.1131 10.0553C0.742062 9.71145 0.552018 9.15489 0.542969 8.38567V8.2635C0.542969 8.07345 0.579168 7.81101 0.651565 7.47617C0.723963 7.14133 0.945681 6.24993 1.31672 4.80198C1.76921 3.01919 1.99545 2.07349 1.99545 1.96489C1.99545 1.8563 1.8235 1.79295 1.47961 1.77485C1.43437 1.77485 1.39817 1.77485 1.37102 1.77485H1.30314C1.21265 1.77485 1.15382 1.77485 1.12668 1.77485C1.09953 1.77485 1.06785 1.76127 1.03165 1.73413C0.995455 1.70698 0.98188 1.6753 0.99093 1.6391ZM4.56104 6.01012V5.92867C4.56104 5.25899 4.28503 4.92415 3.73299 4.92415C3.57915 4.92415 3.42078 4.96035 3.25788 5.03275C3.09499 5.10514 2.94567 5.20017 2.80992 5.31781C2.67418 5.43546 2.55653 5.54406 2.45698 5.6436C2.35744 5.74315 2.27599 5.8427 2.21264 5.94224L2.13119 6.05084L1.84613 7.21825C1.64703 7.99653 1.54749 8.54856 1.54749 8.87435C1.54749 9.30874 1.65608 9.63453 1.87328 9.85172C2.01807 9.99652 2.19907 10.0689 2.41626 10.0689C2.7149 10.0689 3.01807 9.92412 3.32576 9.63453C3.552 9.42638 3.73299 9.17299 3.86874 8.87435C4.00448 8.57571 4.15381 8.1006 4.3167 7.44902C4.4796 6.79744 4.56104 6.31781 4.56104 6.01012Z" fill="white"/><path d="M9.98001 7.20468C9.98001 7.20468 9.98001 7.14586 9.98001 7.02821C9.98001 6.91056 10.0434 6.82007 10.1701 6.75672H18.0569C18.1926 6.82911 18.2605 6.91961 18.2605 7.02821C18.2605 7.13681 18.1926 7.2273 18.0569 7.2997H10.1701C10.0434 7.23635 9.98001 7.14586 9.98001 7.02821V7.20468Z" fill="white"/><path d="M22.865 8.29064C22.865 7.37662 23.2089 6.50785 23.8967 5.68433C24.5844 4.8608 25.3582 4.44452 26.2179 4.43547C26.6795 4.43547 27.0867 4.65718 27.4396 5.10062C27.5844 4.82913 27.7926 4.69338 28.0641 4.69338C28.1817 4.69338 28.2858 4.72958 28.3763 4.80198C28.4668 4.87438 28.512 4.96487 28.512 5.07347C28.512 5.19112 28.3446 5.91509 28.0098 7.2454C27.6749 8.57571 27.503 9.32684 27.4939 9.49878C27.4939 9.72502 27.5256 9.87434 27.5889 9.94674C27.6523 10.0191 27.7473 10.0599 27.874 10.0689C27.9555 10.0599 28.046 10.0191 28.1455 9.94674C28.3355 9.76575 28.5211 9.33136 28.7021 8.64358C28.7564 8.46259 28.8016 8.36757 28.8378 8.35852C28.8559 8.34947 28.9012 8.34494 28.9736 8.34494H29.0279C29.1998 8.34494 29.2858 8.38567 29.2858 8.46711C29.2858 8.52141 29.2631 8.64358 29.2179 8.83363C29.1726 9.02367 29.0822 9.26801 28.9464 9.56665C28.8107 9.86529 28.6659 10.0915 28.512 10.2454C28.3944 10.363 28.2496 10.4581 28.0776 10.5304C28.0052 10.5485 27.8966 10.5576 27.7518 10.5576C27.4442 10.5576 27.1862 10.4897 26.9781 10.354C26.77 10.2182 26.6342 10.078 26.5709 9.93317L26.4894 9.72955C26.4804 9.7205 26.4623 9.72502 26.4351 9.74312C26.417 9.76122 26.3989 9.77932 26.3808 9.79742C25.8469 10.3042 25.3039 10.5576 24.7519 10.5576C24.2541 10.5576 23.8152 10.3766 23.4351 10.0146C23.055 9.65263 22.865 9.07797 22.865 8.29064ZM27.1817 5.96939C27.1817 5.91509 27.1591 5.81555 27.1138 5.67075C27.0686 5.52596 26.9645 5.36759 26.8016 5.19564C26.6387 5.0237 26.4306 4.9332 26.1772 4.92415C25.8605 4.92415 25.5573 5.06442 25.2677 5.34496C24.9781 5.6255 24.7519 5.99202 24.589 6.4445C24.3265 7.15943 24.141 7.90151 24.0324 8.67073C24.0324 8.69788 24.0324 8.74765 24.0324 8.82005C24.0324 8.89245 24.0279 8.94675 24.0188 8.98295C24.0188 9.39018 24.1003 9.67073 24.2632 9.82457C24.4261 9.97842 24.6206 10.0599 24.8469 10.0689C25.1908 10.0689 25.5301 9.91959 25.865 9.62095C26.1998 9.32231 26.3989 9.09154 26.4623 8.92865C26.4804 8.89245 26.6025 8.40829 26.8288 7.47617C27.055 6.54405 27.1727 6.04179 27.1817 5.96939Z" fill="white"/></svg>';
const csubaSvg =
  '<svg width="30" height="8" viewBox="0 0 30 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.461426 4.75709C0.461426 3.77068 0.85056 2.88382 1.62883 2.0965C2.4071 1.30919 3.24871 0.915527 4.15367 0.915527C4.66045 0.915527 5.05864 1.02412 5.34822 1.24131C5.63781 1.4585 5.78713 1.74357 5.79618 2.0965C5.79618 2.35894 5.71021 2.58066 5.53827 2.76165C5.36632 2.94264 5.14913 3.03766 4.88669 3.04671C4.71475 3.04671 4.57901 3.00147 4.47946 2.91097C4.37991 2.82047 4.33014 2.68473 4.33014 2.50374C4.33014 2.32274 4.37991 2.1689 4.47946 2.04221C4.57901 1.91551 4.67855 1.82049 4.7781 1.75714C4.87764 1.6938 4.94099 1.66665 4.96814 1.6757H4.98171C4.98171 1.6576 4.95456 1.63045 4.90027 1.59425C4.84597 1.55805 4.75095 1.52185 4.6152 1.48565C4.47946 1.44946 4.32562 1.43136 4.15367 1.43136C3.88218 1.43136 3.62427 1.4947 3.37993 1.6214C3.18989 1.70284 2.99532 1.84311 2.79623 2.04221C2.39805 2.44039 2.10846 3.00147 1.92746 3.72544C1.74647 4.44941 1.65145 4.97428 1.6424 5.30007C1.6424 5.71635 1.76005 6.02857 1.99534 6.23671C2.19443 6.4539 2.45687 6.56249 2.78265 6.56249H2.83695C3.85051 6.56249 4.6876 6.17788 5.34822 5.40867C5.42967 5.31817 5.48397 5.27292 5.51112 5.27292C5.54732 5.27292 5.60614 5.31364 5.68758 5.39509C5.76903 5.47654 5.81428 5.53989 5.82333 5.58513C5.83238 5.63038 5.79165 5.69825 5.70116 5.78875C5.61066 5.87925 5.47944 6.00594 5.3075 6.16883C5.13556 6.33173 4.93194 6.46747 4.69665 6.57607C4.46136 6.68466 4.17177 6.79778 3.82789 6.91543C3.484 7.03307 3.12202 7.08285 2.74193 7.06475C2.06321 7.06475 1.51571 6.84756 1.09942 6.41317C0.683142 5.97879 0.470475 5.42677 0.461426 4.75709Z" fill="white"/><path d="M10.0341 3.69829C10.0341 3.69829 10.0341 3.63946 10.0341 3.52182C10.0341 3.40417 10.0975 3.31368 10.2242 3.25033H18.1109C18.2467 3.32273 18.3145 3.41322 18.3145 3.52182C18.3145 3.63041 18.2467 3.72091 18.1109 3.79331H10.2242C10.0975 3.72996 10.0341 3.63946 10.0341 3.52182V3.69829Z" fill="white"/><path d="M22.919 4.78424C22.919 3.87023 23.2629 3.00147 23.9506 2.17795C24.6384 1.35443 25.4121 0.938151 26.2719 0.929102C26.7334 0.929102 27.1406 1.15082 27.4936 1.59425C27.6384 1.32276 27.8465 1.18702 28.118 1.18702C28.2356 1.18702 28.3397 1.22321 28.4302 1.29561C28.5207 1.36801 28.5659 1.4585 28.5659 1.5671C28.5659 1.68475 28.3985 2.40872 28.0637 3.73901C27.7289 5.0693 27.5569 5.82042 27.5479 5.99237C27.5479 6.21861 27.5795 6.36793 27.6429 6.44032C27.7062 6.51272 27.8012 6.55344 27.9279 6.56249C28.0094 6.55344 28.0999 6.51272 28.1994 6.44032C28.3895 6.25933 28.575 5.82495 28.756 5.13718C28.8103 4.95618 28.8555 4.86116 28.8917 4.85211C28.9098 4.84306 28.9551 4.83854 29.0275 4.83854H29.0818C29.2537 4.83854 29.3397 4.87926 29.3397 4.96071C29.3397 5.01501 29.3171 5.13718 29.2718 5.32722C29.2266 5.51726 29.1361 5.7616 29.0003 6.06024C28.8646 6.35888 28.7198 6.58512 28.5659 6.73896C28.4483 6.85661 28.3035 6.95163 28.1316 7.02402C28.0592 7.04212 27.9506 7.05117 27.8058 7.05117C27.4981 7.05117 27.2402 6.9833 27.032 6.84756C26.8239 6.71181 26.6881 6.57154 26.6248 6.42675L26.5434 6.22313C26.5343 6.21408 26.5162 6.21861 26.4891 6.23671C26.471 6.25481 26.4529 6.2729 26.4348 6.291C25.9008 6.79778 25.3578 7.05117 24.8058 7.05117C24.3081 7.05117 23.8692 6.87018 23.4891 6.5082C23.109 6.14621 22.919 5.57156 22.919 4.78424ZM27.2356 2.46301C27.2356 2.40872 27.213 2.30917 27.1678 2.16438C27.1225 2.01958 27.0185 1.86121 26.8556 1.68927C26.6927 1.51733 26.4845 1.42683 26.2311 1.41778C25.9144 1.41778 25.6112 1.55805 25.3217 1.83859C25.0321 2.11913 24.8058 2.48564 24.6429 2.93812C24.3805 3.65304 24.195 4.39511 24.0864 5.16433C24.0864 5.19148 24.0864 5.24125 24.0864 5.31364C24.0864 5.38604 24.0819 5.44034 24.0728 5.47654C24.0728 5.88377 24.1542 6.16431 24.3171 6.31815C24.48 6.472 24.6746 6.55344 24.9008 6.56249C25.2447 6.56249 25.5841 6.41317 25.9189 6.11454C26.2538 5.8159 26.4529 5.58513 26.5162 5.42224C26.5343 5.38604 26.6565 4.90189 26.8827 3.96978C27.109 3.03766 27.2266 2.53541 27.2356 2.46301Z" fill="white"/></svg>';

const labels: Record<string, string> = {
  a: aSvg,
  b: bSvg,
  c: cSvg,
  vec_d: vecdSvg,
  vec_n: vecnSvg,
  b_sub_a: bsubaSvg,
  c_sub_a: csubaSvg,
};

interface Props {
  label: string;
  position: IVector3;
  scale?: number;
  offset?: IVector3;
}

export const MathLabel: React.FC<Props> = (props) => {
  const userScale = props.scale ?? 1;

  const geometries = useMemo(() => {
    const svg = labels[props.label];
    if (!svg) {
      console.warn(`No definition exists for math label '${props.label}'`);
      console.log(
        "SVG",
        (document.querySelector(`[data-varlabel="${props.label}"]`)?.firstChild as HTMLElement)
          ?.innerHTML,
      );
      return [];
    }

    const loader = new SVGLoader();
    const svgData = loader.parse(svg!);

    const geometries: ExtrudeGeometry[] = [];

    for (const path of svgData.paths) {
      for (const shape of path.toShapes(true)) {
        const geometry = new ExtrudeGeometry(shape, {
          depth: 0.1,
          bevelEnabled: false,
        });
        geometries.push(geometry);
      }
    }
    return geometries;
  }, [props.label]);

  const groupRef = useRef<Group>(null);
  useFrame((state) => {
    const { x, y, z } = parseVector(props.position);
    const group = groupRef.current;
    if (!group) return;

    const cameraPos = state.camera.position.clone();

    // This offset fixes the look-at rotation when looking straight up/down
    const vec = new Vector3(0, cameraPos.y > 0 ? -10 : 10, 100).applyQuaternion(
      state.camera.quaternion,
    );
    cameraPos.add(vec);

    // Make label appear fixed-size
    const distance = group.position.distanceTo(state.camera.position);
    const scale = distance * 0.004 * userScale;
    group.scale.set(scale, scale, scale);

    group.lookAt(cameraPos);
    group.position.set(x, y, z);
    const offset = parseVector(props.offset)
      .applyQuaternion(state.camera.quaternion)
      .multiplyScalar(scale * 18);
    group.position.add(offset);
  });

  return (
    <group scale={0} ref={groupRef}>
      {geometries.map((geometry, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={getBasicMaterial(0xffffff)}
          rotation={[Math.PI, 0, 0]}
        />
      ))}
    </group>
  );
};
