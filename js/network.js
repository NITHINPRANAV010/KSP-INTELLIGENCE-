/* =========================================================
   NETWORK.JS — D3.js Criminal Network Force Graph
   KSP AI Crime Intelligence Command Center
   ========================================================= */

(function () {
  'use strict';

  let simulation = null;
  let svg = null;

  // Node type color map
  const NODE_COLORS = {
    suspect:  '#EF4444',
    location: '#F59E0B',
    vehicle:  '#3B82F6',
    phone:    '#22D3EE',
    incident: '#8B5CF6',
  };

  const NODE_ICONS = {
    suspect:  '👤',
    location: '📍',
    vehicle:  '🚗',
    phone:    '📱',
    incident: '🔴',
  };

  const NODE_SIZES = {
    suspect:  16,
    location: 12,
    vehicle:  12,
    phone:    10,
    incident: 14,
  };

  /**
   * Initialize the D3 force-directed network graph.
   * @param {string} containerId - SVG parent div ID
   * @param {object} options
   */
  function initNetwork(containerId, options = {}) {
    if (!window.d3) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const W = container.clientWidth  || 800;
    const H = container.clientHeight || 600;

    // Copy data so we can mutate it
    const nodes = (options.nodes || window.KSPData.networkNodes).map(d => ({ ...d }));
    const links = (options.links || window.KSPData.networkLinks).map(d => ({ ...d }));

    // Clear existing
    container.innerHTML = '';

    // Create SVG
    svg = d3.select('#' + containerId)
      .append('svg')
      .attr('id', 'network-svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .style('background', 'transparent');

    // Defs: glow filter, arrowhead marker
    const defs = svg.append('defs');

    defs.append('filter')
      .attr('id', 'glow')
      .html(`
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      `);

    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', 'rgba(255,255,255,0.15)');

    // Zoomable group
    const g = svg.append('g').attr('class', 'network-g');

    const zoomBehavior = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);
    // Expose zoom behaviour globally so zoom/reset buttons can use it
    window._kspZoomBehavior = zoomBehavior;

    // ── Simulation ─────────────────────────────────────
    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => {
        // Suspects close together, others further
        if (d.type === 'associate') return 110;
        return 140;
      }).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius(d => NODE_SIZES[d.type] + 12))
      .alphaDecay(0.025);

    // ── Links ──────────────────────────────────────────
    const linkGroup = g.append('g').attr('class', 'links');

    const link = linkGroup.selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => {
        const typeColors = {
          associate: 'rgba(239,68,68,0.35)',
          location:  'rgba(245,158,11,0.35)',
          vehicle:   'rgba(59,130,246,0.35)',
          phone:     'rgba(34,211,238,0.35)',
          incident:  'rgba(139,92,246,0.35)',
          scene:     'rgba(245,158,11,0.25)',
          evidence:  'rgba(59,130,246,0.25)',
        };
        return typeColors[d.type] || 'rgba(255,255,255,0.1)';
      })
      .attr('stroke-width', d => d.strength * 2.5)
      .attr('marker-end', 'url(#arrowhead)');

    // ── Node Groups ────────────────────────────────────
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const node = nodeGroup.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'network-node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag',  dragged)
        .on('end',   dragEnded)
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        selectNode(d);
        highlightConnections(d, link, node);
      });

    // Node background circle (halo)
    node.append('circle')
      .attr('r', d => NODE_SIZES[d.type] + 6)
      .attr('fill', d => NODE_COLORS[d.type] + '15')
      .attr('stroke', d => NODE_COLORS[d.type] + '30')
      .attr('stroke-width', 1);

    // Main circle
    node.append('circle')
      .attr('r', d => NODE_SIZES[d.type])
      .attr('fill', d => NODE_COLORS[d.type] + 'CC')
      .attr('stroke', d => NODE_COLORS[d.type])
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#glow)');

    // Label
    node.append('text')
      .text(d => d.label.length > 16 ? d.label.slice(0, 14) + '…' : d.label)
      .attr('dy', d => NODE_SIZES[d.type] + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#CBD5E1')
      .attr('font-size', '9px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('pointer-events', 'none');

    // Risk score for suspects
    node.filter(d => d.type === 'suspect')
      .append('text')
      .text(d => d.riskScore)
      .attr('text-anchor', 'middle')
      .attr('dy', '4px')
      .attr('fill', 'white')
      .attr('font-size', '8px')
      .attr('font-weight', '700')
      .attr('font-family', 'Inter, sans-serif')
      .attr('pointer-events', 'none');

    // Tick update
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Click on background → deselect
    svg.on('click', () => {
      clearHighlight(link, node);
      clearNodeDetail();
    });

    // ── Drag handlers ──────────────────────────────────
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return { simulation, svg };
  }

  // ── Node Selection ────────────────────────────────────
  function selectNode(d) {
    const panel = document.getElementById('network-detail-panel');
    if (!panel) return;

    const riskColor = {
      critical: '#EF4444',
      high: '#F59E0B',
      medium: '#3B82F6',
      low: '#22C55E',
    };

    const getRiskClass = (score) => score >= 85 ? 'critical' : score >= 65 ? 'high' : score >= 45 ? 'medium' : 'low';

    if (d.type === 'suspect') {
      const off = window.KSPData?.offenders?.find(o => o.name.includes(d.label.split(' ')[0]));
      const risk = d.riskScore ? getRiskClass(d.riskScore) : 'medium';
      const color = riskColor[risk];

      panel.innerHTML = `
        <div class="flex items-center gap-md mb-md">
          <div class="offender-avatar" style="font-size:1.25rem">👤</div>
          <div>
            <div class="font-semibold text-base">${d.label}</div>
            <div class="text-xs text-muted">${d.district || '—'}</div>
          </div>
          <span class="risk-badge risk-${risk}" style="margin-left:auto">${d.riskScore || '—'}</span>
        </div>
        <div class="divider"></div>
        <div class="flex flex-col gap-sm mt-sm">
          <div class="flex justify-between text-sm">
            <span class="text-muted">Type</span>
            <span class="badge badge-critical">SUSPECT</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted">Risk Level</span>
            <span style="color:${color};font-weight:600">${risk.toUpperCase()}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted">Crimes</span>
            <span class="text-primary font-semibold">${d.crimes || '—'} recorded</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted">District</span>
            <span class="text-primary">${d.district || '—'}</span>
          </div>
        </div>
        <div class="confidence-gauge mt-md">
          <span class="text-xs text-muted">Risk Score</span>
          <div class="confidence-track" style="flex:1;margin:0 var(--space-sm)">
            <div class="confidence-fill" style="width:${d.riskScore || 0}%;background:${color}"></div>
          </div>
          <span class="text-xs font-mono" style="color:${color}">${d.riskScore || 0}%</span>
        </div>
        ${off ? `
        <div class="mt-md">
          <div class="section-label">Crime History</div>
          <div class="timeline">
            ${off.crimeHistory.map(c => `
              <div class="timeline-item">
                <div class="timeline-dot timeline-dot-red"></div>
                <div class="timeline-date">${c.date}</div>
                <div class="timeline-title">${c.crime}</div>
                <div><span class="badge ${c.status === 'Open' ? 'badge-critical' : c.status === 'Convicted' ? 'badge-low' : 'badge-high'}">${c.status}</span></div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
        <div class="mt-md">
          <button class="btn btn-primary w-full" onclick="window.location.href='offenders.html'">
            <i data-lucide="external-link" style="width:14px;height:14px"></i>
            Full Profile
          </button>
        </div>
      `;
    } else {
      const typeLabels = { location: '📍 Location', vehicle: '🚗 Vehicle', phone: '📱 Phone', incident: '🔴 Incident' };
      panel.innerHTML = `
        <div class="flex items-center gap-md mb-md">
          <div style="width:40px;height:40px;border-radius:var(--radius-md);background:${NODE_COLORS[d.type]}22;border:1px solid ${NODE_COLORS[d.type]}44;display:flex;align-items:center;justify-content:center;font-size:1.2rem">${NODE_ICONS[d.type]}</div>
          <div>
            <div class="font-semibold">${typeLabels[d.type] || d.type}</div>
            <div class="text-xs text-muted">${d.district || ''}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="text-sm mt-md">
          <div class="font-medium text-primary">${d.label}</div>
          <div class="text-muted mt-sm text-xs">Click on connected nodes to explore associations</div>
        </div>
      `;
    }

    if (window.lucide) lucide.createIcons({ nodes: [panel] });
  }

  function clearNodeDetail() {
    const panel = document.getElementById('network-detail-panel');
    if (panel) {
      panel.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="mouse-pointer-2"></i></div>
          <p>Click on any node to view details</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ nodes: [panel] });
    }
  }

  // ── Highlight connected nodes ──────────────────────────
  function highlightConnections(selectedNode, linkSel, nodeSel) {
    const connectedIds = new Set([selectedNode.id]);
    linkSel.each(d => {
      if (d.source.id === selectedNode.id) connectedIds.add(d.target.id);
      if (d.target.id === selectedNode.id) connectedIds.add(d.source.id);
    });

    nodeSel.selectAll('circle')
      .attr('opacity', d => connectedIds.has(d.id) ? 1 : 0.2);

    nodeSel.selectAll('text')
      .attr('opacity', d => connectedIds.has(d.id) ? 1 : 0.2);

    linkSel
      .attr('opacity', d =>
        d.source.id === selectedNode.id || d.target.id === selectedNode.id ? 0.85 : 0.1
      );
  }

  function clearHighlight(linkSel, nodeSel) {
    nodeSel.selectAll('circle').attr('opacity', 1);
    nodeSel.selectAll('text').attr('opacity', 1);
    linkSel.attr('opacity', 1);
  }

  // ── Legend Builder ─────────────────────────────────────
  function buildLegend(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = Object.entries(NODE_COLORS).map(([type, color]) => `
      <div class="flex items-center gap-sm text-xs" style="margin-bottom:6px">
        <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
        <span class="text-secondary" style="text-transform:capitalize">${type}</span>
      </div>
    `).join('');
  }

  // Expose
  window.KSPNetwork = { initNetwork, buildLegend, selectNode };

})();
