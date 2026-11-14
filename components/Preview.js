// Draws a simple product shape in SVG and prints the customer's text on it.
// `path` is the outline; `nameSpot` and `numberSpot` are [x, y, fontSize].
const SHAPES = {
  tee: {
    path: 'M70 22 L38 38 L14 78 L40 92 L56 76 L56 182 L144 182 L144 76 L160 92 L186 78 L162 38 L130 22 Q100 44 70 22Z',
    nameSpot: [100, 112, 13],
    numberSpot: [100, 158, 40],
  },
  hoodie: {
    path: 'M66 30 L30 48 L12 130 L40 136 L56 100 L56 184 L144 184 L144 100 L160 136 L188 130 L170 48 L134 30 Q100 56 66 30Z',
    nameSpot: [100, 118, 13],
    numberSpot: [100, 164, 40],
  },
  tote: {
    path: 'M45 70 H155 L162 184 H38Z',
    nameSpot: [100, 112, 13],
    numberSpot: [100, 158, 40],
  },
  mug: {
    path: 'M52 58 H138 V148 Q138 178 108 178 H82 Q52 178 52 148Z',
    nameSpot: [95, 108, 12],
    numberSpot: [95, 150, 30],
  },
  bottle: {
    path: 'M86 28 H114 V50 Q136 60 136 86 V176 Q136 186 126 186 H74 Q64 186 64 176 V86 Q64 60 86 50Z',
    nameSpot: [100, 118, 12],
    numberSpot: [100, 160, 28],
  },
  cap: {
    path: 'M42 124 Q42 52 100 52 Q158 52 158 124 Z M28 124 H178 Q178 142 122 142 H28Z',
    nameSpot: [100, 100, 12],
    numberSpot: [100, 130, 11],
  },
};

// Use light text on dark fabric and dark text on light fabric.
function isDarkColor(hex) {
  const [red, green, blue] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
  return brightness < 140;
}

export default function Preview({ productId, color = '#CCCCCC', printName = '', printNumber = '', label = 'LPU’26' }) {
  const shape = SHAPES[productId] || SHAPES.tee;
  const textColor = isDarkColor(color) ? '#FFFDF5' : '#14152B';
  const [nameX, nameY, nameSize] = shape.nameSpot;
  const [numX, numY, numSize] = shape.numberSpot;

  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={`${productId} preview`} className="preview">
      {/* Extras that only some products have */}
      {productId === 'bottle' && (
        <rect x="88" y="14" width="24" height="16" rx="3" fill={color} stroke="#14152B" strokeWidth="3" />
      )}
      {productId === 'mug' && (
        <path d="M138 80 H154 Q170 80 170 108 Q170 136 138 136" fill="none" stroke={color} strokeWidth="8" />
      )}
      {productId === 'tote' && (
        <path d="M72 72 Q72 22 100 22 Q128 22 128 72" fill="none" stroke={color} strokeWidth="7" />
      )}
      {productId === 'hoodie' && (
        <path d="M72 30 Q100 -2 128 30 Q100 52 72 30Z" fill={color} stroke="#14152B" strokeWidth="3" />
      )}

      {/* The product itself */}
      <path d={shape.path} fill={color} stroke="#14152B" strokeWidth="3" strokeLinejoin="round" />

      {/* The printed text */}
      <g fill={textColor} textAnchor="middle" fontWeight="800">
        <text x={nameX} y={nameY - 14} fontSize="9" letterSpacing="1.5">{label}</text>
        <text x={nameX} y={nameY} fontSize={nameSize}>{printName}</text>
        <text x={numX} y={numY} fontSize={numSize}>{printNumber}</text>
      </g>
    </svg>
  );
}
