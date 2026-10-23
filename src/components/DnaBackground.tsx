// Full-screen background made from the logo itself. The five paths below are
// copied 1:1 from favicon.svg (black strands, yellow hydrogen bonds). The logo
// is exactly one crossing whose ends line up with themselves when stacked
// every TILE_H units, so repeating it builds a complete, continuous double
// helix with the logo's own curves. A pattern then tiles many chains and the
// whole field is turned diagonal.

const YELLOW = '#F9DB08'; // hydrogen bonds
const BLACK = '#111416'; // strands
const PAPER = '#F5F0EB'; // page colour

const SCALE = 0.08; // size of every chain relative to the logo
const ANGLE = 38; // degrees, chains run bottom-left -> top-right
const TILE_W = 175; // logo width  (362 -> 535)
const TILE_H = 244.089; // logo height between matching ends (374.659 -> 618.748)
const GAP = 8; // space between neighbouring chains
const CELL_W = 2 * (TILE_W + GAP);
const OPACITY = 0.5;

const W = 1600;
const H = 1000;

// The logo, moved so its top-left corner is at (0, 0).
function Tile({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 362} ${y - 374.659})`}>
      <g fill={BLACK}>
        <path d="M372.497 374.659C391.205 373.858 387.706 388.534 389.417 400.469C396.411 449.252 428.222 472.758 468.918 493.224C504.203 510.97 530.602 552.805 533.734 591.72C534.629 602.843 537.83 613.116 524.469 618.748C520.506 619.246 517.526 619.079 513.936 616.921C506.092 612.206 508.099 600.5 507.344 592.517C505.371 571.672 497.183 554.963 483.497 539.479C469.226 523.334 452.393 513.7 433.434 504.107C407.219 488.999 386.128 468.391 373.649 440.333C366.827 424.994 359.443 399.616 363.321 382.316C364.169 378.531 369.037 376.034 372.497 374.659Z" />
        <path d="M415.408 502.145C423.848 508.197 430.557 512.097 439.596 517.058C438.112 518.445 435.85 520.152 434.264 521.309C410.053 538.959 391.565 563.437 389.42 594.271C388.83 602.755 389.648 609.78 383.466 616.537C380.251 618.349 379.135 618.595 375.548 619.468C362.014 616.744 361.368 607.492 362.224 596.008C364.251 568.803 374.23 542.285 393.227 522.368C400.32 514.932 407.603 508.82 415.408 502.145Z" />
        <path d="M518.804 374.685C537.155 374.111 535.33 389.849 533.565 402.762C528.811 437.544 510.51 470.904 481.954 492.021L477.264 488.512C469.855 483.856 464.669 480.953 456.658 477.494C488.053 455.362 505.813 429.836 507.991 390.958C508.479 382.255 510.16 377.888 518.804 374.685Z" />
      </g>
      <g fill={YELLOW}>
        <path d="M405.976 566.016C421.02 565.378 437.438 566.085 452.649 565.84C464.146 565.947 475.678 565.635 487.167 566.016C494.174 566.248 496.107 570.11 498.155 575.849C496.159 582.123 495.747 583.575 489.682 586.313C479.93 586.566 408.073 587.557 403.987 585.66C401.339 584.431 399.454 582.225 398.609 579.434C397.764 576.647 397.934 573.413 399.397 570.861C400.929 568.188 403.103 566.887 405.976 566.016Z" />
        <path d="M406.602 403.907C417.065 403.361 485.843 402.899 491.097 404.572C493.255 405.259 495.035 407.263 496.061 409.211C497.401 411.757 497.922 414.842 496.992 417.607C495.846 421.015 494.174 422.774 490.996 424.341C471.369 425.105 450.885 423.994 431.183 424.481C423.179 424.679 413.604 424.776 405.674 424.137C396.339 418.34 397.009 408.992 406.602 403.907Z" />
      </g>
    </g>
  );
}

export default function DnaBackground() {
  const S = TILE_W + GAP;
  return (
    <svg
      className="dna-bg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width={W} height={H} fill={PAPER} />
      <defs>
        <pattern
          id="dna-field"
          width={CELL_W}
          height={TILE_H}
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${ANGLE}) scale(${SCALE})`}
        >
          <Tile x={0} y={0} />
          {/* neighbouring chain, offset half a tile so the field isn't a grid */}
          <Tile x={S} y={TILE_H / 2} />
          <Tile x={S} y={TILE_H / 2 - TILE_H} />
        </pattern>
      </defs>
      <rect
        x={-W}
        y={-H}
        width={W * 3}
        height={H * 3}
        fill="url(#dna-field)"
        opacity={OPACITY}
      />
    </svg>
  );
}
