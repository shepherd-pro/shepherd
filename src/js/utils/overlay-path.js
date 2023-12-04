/**
 * Generates the svg path data for a rounded rectangle overlay
 * @param {Object} props
 * @param {Object[]} props.elements - elements to highlight
 * @param {number} props.elements.width - Width.
 * @param {number} props.elements.height - Height.
 * @param {number} [props.elements.x=0] - Offset from top left corner in x axis. default 0.
 * @param {number} [props.elements.y=0] - Offset from top left corner in y axis. default 0.
 * @param {number | { topLeft: number, topRight: number, bottomRight: number, bottomLeft: number }} [r=0] - Corner Radius. Keep this smaller than half of width or height.
 * @returns {string} - Rounded rectangle overlay path data.
 */
export function makeOverlayPath({ elements, r }) {
  const { innerWidth: w, innerHeight: h } = window;
  const {
    topLeft = 0,
    topRight = 0,
    bottomRight = 0,
    bottomLeft = 0
  } = typeof r === 'number'
    ? { topLeft: r, topRight: r, bottomRight: r, bottomLeft: r }
    : r;

  const commonPart = `M${w},${h}\
H0\
V0\
H${w}\
V${h}\
Z\
`;
  const parts = elements.map(
    ({ x, y, width, height }) =>
      `M${x + topLeft},${y}\
a${topLeft},${topLeft},0,0,0-${topLeft},${topLeft}\
V${height + y - bottomLeft}\
a${bottomLeft},${bottomLeft},0,0,0,${bottomLeft},${bottomLeft}\
H${width + x - bottomRight}\
a${bottomRight},${bottomRight},0,0,0,${bottomRight}-${bottomRight}\
V${y + topRight}\
a${topRight},${topRight},0,0,0-${topRight}-${topRight}\
Z`
  );

  return commonPart + parts.join('');
}
