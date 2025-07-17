// viewer-edges-fa.js

// Utility to get the Y position of each row in the propositions table
function getPropositionRowPositions() {
  const table = document.getElementById('propositionsTable');
  if (!table) return {};
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const positions = {};
  rows.forEach((row, idx) => {
    const idCell = row.cells[0];
    const rect = idCell.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    // X, Y position relative to the canvas (right edge of ID column)
    positions[idCell.textContent] = {
      x: rect.right - tableRect.left, // right edge of first cell (شناسه)
      y: rect.top - tableRect.top + rect.height / 2,
      rowElem: row
    };
  });
  return positions;
}

// Ensure the canvas matches the table's size and position, but extends to the right for arrows
function syncCanvasToTable() {
  const table = document.getElementById('propositionsTable');
  const canvas = document.getElementById('edgesCanvas');
  if (!table || !canvas) return;
  const tableRect = table.getBoundingClientRect();
  const extraWidth = 120; // Space to the right for arrows
  canvas.width = Math.ceil(tableRect.width + extraWidth);
  canvas.height = Math.ceil(tableRect.height);
  canvas.style.position = 'absolute';
  canvas.style.left = tableRect.left + window.scrollX + 'px';
  canvas.style.top = tableRect.top + window.scrollY + 'px';
  canvas.style.pointerEvents = 'none'; // Let mouse events pass through
  canvas.style.zIndex = 10;
}

// Draw edges/arrows between proposition rows
function drawEdgesForPropositions(propositions, relations) {
  syncCanvasToTable();
  const table = document.getElementById('propositionsTable');
  const canvas = document.getElementById('edgesCanvas');
  const ctx = canvas && canvas.getContext('2d');
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Get row positions
  const rowPositions = getPropositionRowPositions();
  if (!table) return;

  // Store edge hitboxes for hover
  window._edgeHitboxes = [];

  const curveOut = 60; // How far the curve arcs out

  relations.forEach((rel, i) => {
    const src = rowPositions[rel.source];
    const tgt = rowPositions[rel.target];
    if (!src || !tgt) return;
    // Both source and target at right edge of their respective rows
    const x0 = src.x;
    const y0 = src.y;
    const x1 = tgt.x;
    const y1 = tgt.y;
    // Control points for Bezier curve (arc outward to the right)
    const curveX0 = x0 + curveOut;
    const curveY0 = y0;
    const curveX1 = x1 + curveOut;
    const curveY1 = y1;
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(curveX0, curveY0, curveX1, curveY1, x1, y1);
    ctx.stroke();
    // Draw arrowhead at the end (target)
    drawArrowhead(ctx, x1, y1, curveX1, curveY1);
    // Draw label at curve midpoint
    ctx.font = 'bold 13px Inter, Arial';
    ctx.fillStyle = '#37306b';
    ctx.textAlign = 'center';
    const label = rel.relation.join(', ');
    // Calculate midpoint of Bezier curve for label
    const t = 0.5;
    function bezier(t, p0, p1, p2, p3) {
      return (
        Math.pow(1 - t, 3) * p0 +
        3 * Math.pow(1 - t, 2) * t * p1 +
        3 * (1 - t) * Math.pow(t, 2) * p2 +
        Math.pow(t, 3) * p3
      );
    }
    const labelX = bezier(t, x0, curveX0, curveX1, x1);
    const labelY = bezier(t, y0, curveY0, curveY1, y1) - 8;
    ctx.save();
    ctx.translate(labelX, labelY);
    ctx.rotate((y1 - y0) * 0.03); // slight tilt
    ctx.fillText(label, 0, 0);
    ctx.restore();
    ctx.restore();
    // Store hitbox for hover
    window._edgeHitboxes.push({
      x0, y0, x1, y1, curveY: (y0 + y1) / 2, label, srcId: rel.source, tgtId: rel.target
    });
  });
}

function drawArrowhead(ctx, x, y, x2, y2) {
  const angle = Math.atan2(y - y2, x - x2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 12 * Math.cos(angle - 0.3), y - 12 * Math.sin(angle - 0.3));
  ctx.lineTo(x - 12 * Math.cos(angle + 0.3), y - 12 * Math.sin(angle + 0.3));
  ctx.closePath();
  ctx.fillStyle = '#6366f1';
  ctx.fill();
  ctx.restore();
}

// Improved hit detection: check distance to Bezier curve mid-point
function isNearEdge(x, y, edge, canvasWidth) {
  // Use the curve mid-point for hit detection
  const mx = canvasWidth / 2;
  const my = edge.curveY;
  return Math.abs(x - mx) < 60 && Math.abs(y - my) < 18;
}

function setupEdgeHoverEvents(rowPositions) {
  let tooltip = document.getElementById('edge-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'edge-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.background = '#fff';
    tooltip.style.border = '1.5px solid #6366f1';
    tooltip.style.borderRadius = '7px';
    tooltip.style.padding = '6px 12px';
    tooltip.style.fontSize = '1em';
    tooltip.style.color = '#37306b';
    tooltip.style.boxShadow = '0 2px 8px #a5b4fc33';
    tooltip.style.zIndex = 1000;
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
  }
  const canvas = document.getElementById('edgesCanvas');
  if (!canvas) return;
  canvas.onmousemove = function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let found = false;
    for (const edge of window._edgeHitboxes || []) {
      if (isNearEdge(x, y, edge, canvas.width)) {
        tooltip.textContent = `${edge.srcId} ${edge.label} ${edge.tgtId}`;
        tooltip.style.left = (e.clientX + 12) + 'px';
        tooltip.style.top = (e.clientY - 8) + 'px';
        tooltip.style.display = 'block';
        found = true;
        // Highlight related rows
        if (rowPositions[edge.srcId]) rowPositions[edge.srcId].rowElem.classList.add('highlight-prop-row');
        if (rowPositions[edge.tgtId]) rowPositions[edge.tgtId].rowElem.classList.add('highlight-prop-row');
      } else {
        if (rowPositions[edge.srcId]) rowPositions[edge.srcId].rowElem.classList.remove('highlight-prop-row');
        if (rowPositions[edge.tgtId]) rowPositions[edge.tgtId].rowElem.classList.remove('highlight-prop-row');
      }
    }
    if (!found) {
      tooltip.style.display = 'none';
      for (const k in rowPositions) {
        rowPositions[k].rowElem.classList.remove('highlight-prop-row');
      }
    }
  };
  canvas.onmouseleave = function() {
    tooltip.style.display = 'none';
    for (const k in rowPositions) {
      rowPositions[k].rowElem.classList.remove('highlight-prop-row');
    }
  };
}

// Add highlight style
(function addHighlightStyle() {
  const style = document.createElement('style');
  style.textContent = `.highlight-prop-row { background: #e0e7ff99 !important; }`;
  document.head.appendChild(style);
})();

// Main setup function to call after DOM is ready and data is loaded
function setupPropositionEdges(propositions, relations) {
  // Ensure canvas exists and is positioned
  let canvas = document.getElementById('edgesCanvas');
  const table = document.getElementById('propositionsTable');
  if (!canvas && table) {
    canvas = document.createElement('canvas');
    canvas.id = 'edgesCanvas';
    document.body.appendChild(canvas);
  }
  if (!canvas || !table) return;

  function redraw() {
    drawEdgesForPropositions(propositions, relations);
    const rowPositions = getPropositionRowPositions();
    setupEdgeHoverEvents(rowPositions);
  }

  // Initial draw
  redraw();

  // Redraw on resize/scroll
  window.addEventListener('resize', redraw);
  window.addEventListener('scroll', redraw, true); // true: catch scroll on ancestors
  // Optionally, observe table mutations (e.g., rows added/removed)
  const observer = new MutationObserver(redraw);
  observer.observe(table, { childList: true, subtree: true });
}

// Export for use elsewhere
window.setupPropositionEdges = setupPropositionEdges; 