import { geoMercator, geoPath } from 'd3-geo';
import voyageCoast from './voyage-coast.json';

export function paintKristianProjectPreview(ctx, width, height, id) {
  ctx.save();
  ctx.scale(width / 900, height / 310);
  ctx.fillStyle = id === 'careiq' ? '#f8fafc' : '#080d1c';
  ctx.fillRect(0, 0, 900, 310);
  function text(value, x, y, size, color, weight) {
    ctx.font = (weight || 400) + ' ' + size + 'px Arial,sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }
  if (id === 'careiq') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 142, 310);
    ctx.strokeStyle = '#e0e7ef';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(142, 0);
    ctx.lineTo(142, 310);
    ctx.stroke();
    text('✚ careiq', 20, 38, 25, '#0067e8', 600);
    text('Willow family practice', 20, 67, 11, '#6b7989');
    ['Today', 'Schedule', 'Patients', 'Documents', 'Templates'].forEach(function (label, i) {
      var y = 105 + i * 40;
      if (i === 0) {
        ctx.fillStyle = '#eaf3ff';
        ctx.fillRect(11, y - 22, 120, 32);
      }
      text(label, 27, y, 15, i === 0 ? '#0067e8' : '#526071', i === 0 ? 600 : 400);
    });
    text('YOUR FRONT DESK IN FOCUS', 169, 33, 11, '#6a7889', 600);
    text('Good morning, care team.', 169, 68, 27, '#202b34', 600);
    ctx.fillStyle = '#0067e8';
    ctx.fillRect(744, 29, 130, 31);
    text('Book appointment', 758, 49, 12, '#fff', 500);
    [
      ['5', 'Appointments'],
      ['2', 'Documents ready'],
      ['3', 'Need attention'],
    ].forEach(function (item, i) {
      var x = 170 + i * 208;
      text(item[0], x, 116, 29, i === 2 ? '#c27435' : '#202b34', 600);
      text(item[1], x, 138, 13, '#6b7989');
    });
    ctx.fillStyle = '#fff';
    ctx.fillRect(168, 158, 706, 152);
    ctx.strokeStyle = '#e1e7ef';
    ctx.strokeRect(168, 158, 706, 152);
    text('TODAY’S APPOINTMENTS', 183, 181, 11, '#6b7989', 600);
    text('SAMPLE DATA', 766, 181, 10, '#81909d', 500);
    ['09:00', '09:30', '10:15'].forEach(function (time, i) {
      var y = 212 + i * 36;
      text(time, 185, y, 13, '#526071');
      text('Demo visit ' + String(i + 1).padStart(2, '0'), 258, y, 14, '#202b34', 500);
      text(
        i === 1 ? 'Documents needed' : 'Ready for visit',
        551,
        y,
        12,
        i === 1 ? '#b36f2f' : '#287c71',
      );
      ctx.fillStyle = i === 1 ? '#fff0d5' : '#e6f5ed';
      ctx.fillRect(745, y - 14, 105, 21);
      text(i === 1 ? 'Review' : 'Ready', 772, y, 11, i === 1 ? '#a26322' : '#287c71');
    });
  } else {
    var glow = ctx.createRadialGradient(360, 90, 0, 360, 90, 650);
    glow.addColorStop(0, '#182c42');
    glow.addColorStop(1, '#080d1c');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 900, 310);
    var colors = ['#77f7d5', '#a8a4ff', '#f599d6'];
    ctx.lineCap = 'round';
    for (var i = 0; i < 42; i++) {
      ctx.strokeStyle = colors[i % 3];
      ctx.globalAlpha = 0.25 + (i % 5) * 0.1;
      ctx.lineWidth = 0.8 + (i % 3) * 0.7;
      ctx.beginPath();
      for (var j = 0; j <= 70; j++) {
        var x = (j / 70) * 950 - 25,
          y =
            170 +
            Math.sin(j * 0.07 + i * 0.13) * 84 +
            Math.sin(j * 0.14 + i * 0.2) * 27 +
            (i - 21) * 2.7;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function paintKristianProjectScreen(ctx, width, height, state, projects) {
  if (!ctx || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    return;
  state = state || {};
  var W = 600,
    H = 347,
    items = Array.isArray(projects) ? projects : [];
  var collection = state.collection === 'experiments' ? 'experiments' : 'work';
  var isExperiment = function (p) {
    return p.id === 'neon-drift' || /experiment/i.test(p.category || '');
  };
  var listed = items.filter(function (p) {
    return isExperiment(p) === (collection === 'experiments');
  });
  var selected =
    items.find(function (p) {
      return p.id === state.selected;
    }) || null;
  var project = selected || listed[0] || null,
    id = project && project.id;
  var header = Number(state.headerHeight) || Number(state.tabHeight) || 46;
  header = Math.max(22, Math.min(145, header));
  var scale = header / 46;
  var footer = Math.max(12, Math.min(80, Number(state.footerHeight) || 24 * scale));
  var bottom = H - footer,
    pad = 10 * scale,
    ink = '#dbfff0',
    muted = '#a5c7c3',
    mint = '#91f1ca';
  ctx.save();
  ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#071d25';
  ctx.fillRect(0, 0, W, H);
  function text(value, x, y, size, color, font, maxWidth, align) {
    ctx.font =
      '500 ' +
      size +
      'px ' +
      (font === 'display'
        ? 'Rajdhani,Arial,sans-serif'
        : font === 'mono'
          ? '"IBM Plex Mono",ui-monospace,monospace'
          : '"IBM Plex Sans",Arial,sans-serif');
    ctx.fillStyle = color || ink;
    ctx.textAlign = align || 'left';
    var s = String(value == null ? '' : value);
    if (maxWidth && ctx.measureText(s).width > maxWidth) {
      while (s && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
      s += '…';
    }
    ctx.fillText(s, x, y);
  }
  function rule(y) {
    ctx.strokeStyle = '#2b4d57';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  function preview(x, y, w, h, full) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = id === 'careiq' ? '#f8fafc' : '#080d1c';
    ctx.fillRect(x, y, w, h);
    if (id && typeof paintKristianProjectPreview === 'function') {
      if (full) {
        ctx.translate(x, y);
        paintKristianProjectPreview(ctx, w, h, id);
      } else {
        var k = (id === 'careiq' ? Math.min : Math.max)(w / 900, h / 310);
        ctx.translate(x + (w - 900 * k) / 2, y + (h - 310 * k) / 2);
        paintKristianProjectPreview(ctx, 900 * k, 310 * k, id);
      }
    }
    ctx.restore();
  }
  ctx.fillStyle = '#0a252e';
  ctx.fillRect(0, 0, W, header);
  rule(header - 0.5);
  var tabs = [
    { key: 'work', label: 'Work', x: pad, w: 58 * scale },
    { key: 'experiments', label: 'Experiments', x: pad + 64 * scale, w: 108 * scale },
  ];
  tabs.forEach(function (tab) {
    var active = tab.key === collection;
    text(
      tab.label,
      tab.x + tab.w / 2,
      header / 2 + 4.5 * scale,
      13 * scale,
      active ? ink : muted,
      'sans',
      tab.w,
      'center',
    );
    if (active) {
      ctx.fillStyle = mint;
      ctx.fillRect(tab.x, header - 2 * scale, tab.w, 2 * scale);
    }
  });
  if (selected) {
    var navEnd = pad + 172 * scale,
      available = W - pad - navEnd;
    var back = available >= 66 * scale ? '← Back' : '←';
    text(
      back,
      W - pad,
      header / 2 + 4.5 * scale,
      13 * scale,
      mint,
      'sans',
      Math.max(20 * scale, available - 8 * scale),
      'right',
    );
  }
  if (selected) {
    preview(0, header, W, Math.max(1, bottom - header), true);
  } else if (project) {
    var x = pad,
      y = header + pad,
      w = W - pad * 2,
      h = Math.max(1, bottom - header - pad * 2);
    preview(x, y, w, h);
    var shade = ctx.createLinearGradient(0, y, 0, y + h);
    shade.addColorStop(0, 'rgba(3,22,29,0)');
    shade.addColorStop(0.2, 'rgba(3,22,29,0)');
    shade.addColorStop(0.52, 'rgba(3,22,29,.6)');
    shade.addColorStop(1, 'rgba(3,22,29,.98)');
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, w, h);
    var inner = 12 * scale,
      titleY = y + h - 25 * scale,
      action = collection === 'experiments' ? 'Launch →' : 'Open preview →';
    if (h < 58 * scale) {
      var baseline = y + h / 2 + 5 * scale;
      text(project.title, x + inner, baseline, 20 * scale, ink, 'display', w * 0.46);
      text(action, x + w - inner, baseline, 10 * scale, mint, 'sans', w * 0.48, 'right');
    } else {
      text(project.title, x + inner, titleY, 26 * scale, ink, 'display', w - inner * 2);
      text(action, x + inner, y + h - 10 * scale, 11 * scale, mint, 'sans', w - inner * 2);
    }
    ctx.strokeStyle = '#345d65';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, Math.max(0, h - 1));
  }
  ctx.fillStyle = '#0a252e';
  ctx.fillRect(0, bottom, W, footer);
  rule(bottom + 0.5);
  var context = selected
    ? state.title || selected.title
    : String(listed.length) +
      ' ' +
      (collection === 'experiments'
        ? listed.length === 1
          ? 'experiment'
          : 'experiments'
        : listed.length === 1
          ? 'project'
          : 'projects');
  var status =
    state.status ||
    (selected
      ? id === 'careiq'
        ? 'Sample data'
        : id === 'neon-drift'
          ? 'Drag to draw'
          : 'Preview'
      : 'Opens on this screen');
  var baseline = bottom + footer / 2 + 3.4 * scale;
  text(context, pad, baseline, 12 * scale, ink, 'mono', W * 0.4 - pad);
  text(status, W - pad, baseline, 12 * scale, muted, 'mono', W * 0.58 - pad, 'right');
  ctx.restore();
}

export function paintKristianVoyageMap(ctx, width, height, state) {
  state = state || {};
  if (!ctx || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    return null;
  var W = 900,
    H = 560;
  var night = Math.max(0, Math.min(1, Number.isFinite(state.theme) ? state.theme : 1));
  var controls = Math.max(60, Math.min(225, Number(state.controlsHeight) || 90));
  var mapTop = 83,
    mapBottom = H - controls;
  var typeScale = Math.min(1.6, Math.max(1, Math.sqrt(controls / 78)));
  var compact = controls > 135;
  var d3 = { geoMercator, geoPath };
  var land = state.land || voyageCoast;
  var start = [-118.46103, 33.96175];
  var finish = [-118.325, 33.345];
  // These two drawing controls bend the illustration around the mainland and
  // approach Avalon from the sea. They are artwork, not navigation waypoints.
  var controlA = [-118.7, 33.7],
    controlB = [-118.15, 33.52];
  var time = Number.isFinite(state.time) ? state.time : 0;
  var direction = state.direction === -1 ? -1 : 1;
  var progress;
  if (Number.isFinite(state.progress)) progress = Math.max(0, Math.min(1, state.progress));
  else {
    var phase = (((time / 26) % 2) + 2) % 2;
    progress = phase <= 1 ? phase : 2 - phase;
    direction = phase <= 1 ? 1 : -1;
    if (state.direction === -1) {
      progress = 1 - progress;
      direction *= -1;
    }
  }

  function mix(a, b, t) {
    var aa = parseInt(a.slice(1), 16),
      bb = parseInt(b.slice(1), 16);
    var result = '#';
    [16, 8, 0].forEach(function (shift) {
      result += Math.round(((aa >> shift) & 255) * (1 - t) + ((bb >> shift) & 255) * t)
        .toString(16)
        .padStart(2, '0');
    });
    return result;
  }
  var colors = {
    frame: mix('#122b38', '#071923', night),
    sea: mix('#103844', '#08232f', night),
    land: mix('#245c60', '#183f4b', night),
    coast: mix('#8de8db', '#77d8d4', night),
    ink: mix('#e5fff3', '#d6fff2', night),
    muted: mix('#a9d0cd', '#87b5bb', night),
    grid: mix('#2e5b68', '#173e4b', night),
    accent: mix('#a3f1d9', '#72f1cf', night),
    warm: mix('#ffc58b', '#ffca96', night),
  };
  function roundPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function label(value, x, y, size, color, weight, align) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = (weight || '400') + ' ' + size + 'px Arial, Helvetica, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
    ctx.restore();
  }
  function routeCoordinate(t) {
    var n = 1 - t;
    return [
      n * n * n * start[0] +
        3 * n * n * t * controlA[0] +
        3 * n * t * t * controlB[0] +
        t * t * t * finish[0],
      n * n * n * start[1] +
        3 * n * n * t * controlA[1] +
        3 * n * t * t * controlB[1] +
        t * t * t * finish[1],
    ];
  }

  ctx.save();
  ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);
  ctx.fillStyle = colors.frame;
  ctx.fillRect(0, 0, W, H);
  roundPath(8, 8, W - 16, H - 16, 17);
  ctx.strokeStyle = colors.coast;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  label('MARINA DEL REY ↔ CATALINA', 30, 39, 25 * typeScale, colors.ink, '700');
  if (!compact) label('LIFE / THE CATALINA CROSSING', 31, 65, 15 * typeScale, colors.muted);
  ctx.fillStyle = colors.coast;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(28, 79, W - 56, 1);
  ctx.globalAlpha = 1;
  if (!d3 || typeof d3.geoMercator !== 'function' || typeof d3.geoPath !== 'function' || !land) {
    label('Map loading…', W / 2, 260, 25, colors.muted, '400', 'center');
    ctx.restore();
    return null;
  }

  var focus = {
    type: 'MultiPoint',
    coordinates: [
      [-119.75, 33.0],
      [-117.75, 34.25],
    ],
  };
  var projection = d3
    .geoMercator()
    .fitExtent(
      [
        [35, mapTop + 8],
        [W - 35, mapBottom - 10],
      ],
      focus,
    )
    .clipExtent([
      [25, mapTop],
      [W - 25, mapBottom],
    ]);
  var geoPath = d3.geoPath(projection).context(ctx);
  // Fill polygons, but stroke open coastline lines: closing a clipped polygon
  // would incorrectly outline the rectangular geographic/data boundary.
  var bounds = land.bbox || [-120.65, 32.5, -115.5, 34.7];
  var shore = { type: 'MultiLineString', coordinates: [] };
  function isClipEdge(a, b) {
    return (
      (Math.abs(a[0] - bounds[0]) < 0.00001 && Math.abs(b[0] - bounds[0]) < 0.00001) ||
      (Math.abs(a[0] - bounds[2]) < 0.00001 && Math.abs(b[0] - bounds[2]) < 0.00001) ||
      (Math.abs(a[1] - bounds[1]) < 0.00001 && Math.abs(b[1] - bounds[1]) < 0.00001) ||
      (Math.abs(a[1] - bounds[3]) < 0.00001 && Math.abs(b[1] - bounds[3]) < 0.00001)
    );
  }
  land.features.forEach(function (feature) {
    var polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;
    polygons.forEach(function (rings) {
      rings.forEach(function (ring) {
        var line = [];
        for (var i = 1; i < ring.length; i++) {
          if (isClipEdge(ring[i - 1], ring[i])) {
            if (line.length > 1) shore.coordinates.push(line);
            line = [];
          } else {
            if (!line.length) line.push(ring[i - 1]);
            line.push(ring[i]);
          }
        }
        if (line.length > 1) shore.coordinates.push(line);
      });
    });
  });
  var pStart = projection(start),
    pFinish = projection(finish);
  ctx.save();
  ctx.beginPath();
  ctx.rect(25, mapTop, W - 50, mapBottom - mapTop);
  ctx.clip();
  var ocean = ctx.createLinearGradient(0, mapTop, W, mapBottom);
  ocean.addColorStop(0, mix('#194d55', '#103843', night));
  ocean.addColorStop(1, colors.sea);
  ctx.fillStyle = ocean;
  ctx.fillRect(25, mapTop, W - 50, mapBottom - mapTop);
  var graticule = { type: 'MultiLineString', coordinates: [] };
  for (var lon = -121; lon <= -117; lon += 0.5)
    graticule.coordinates.push([
      [lon, 32],
      [lon, 35.5],
    ]);
  for (var lat = 32.5; lat <= 35; lat += 0.5)
    graticule.coordinates.push([
      [-121, lat],
      [-116.5, lat],
    ]);
  ctx.beginPath();
  geoPath(graticule);
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  geoPath(land);
  ctx.fillStyle = colors.land;
  ctx.fill();
  ctx.beginPath();
  geoPath(shore);
  ctx.strokeStyle = colors.coast;
  ctx.lineWidth = 1.8;
  ctx.shadowColor = colors.coast;
  ctx.shadowBlur = 7 * night;
  ctx.stroke();
  ctx.shadowBlur = 0;
  label('PACIFIC OCEAN', 83, (mapTop + mapBottom) / 2 + 38, 19 * typeScale, colors.muted, '400');

  function strokeRoute(a, b, color, lineWidth, dashed) {
    ctx.beginPath();
    for (var i = 0; i <= 80; i++) {
      var p = projection(routeCoordinate(a + ((b - a) * i) / 80));
      if (i) ctx.lineTo(p[0], p[1]);
      else ctx.moveTo(p[0], p[1]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashed ? [3, 8] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = 0.58;
  strokeRoute(0, 1, colors.accent, 1.8, true);
  ctx.globalAlpha = 1;
  var behind = direction > 0 ? Math.max(0, progress - 0.23) : Math.min(1, progress + 0.23);
  ctx.shadowColor = colors.accent;
  ctx.shadowBlur = 12 * night;
  strokeRoute(behind, progress, colors.accent, 3.3, false);
  ctx.shadowBlur = 0;

  function endpoint(point, left, primary, secondary) {
    var x = point[0],
      y = point[1];
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = colors.frame;
    ctx.fill();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = colors.accent;
    ctx.fill();
    var endX = x + (left ? -69 : 60),
      endY = y + (left ? -23 : 30);
    var primarySize = (compact ? 23 : 21) * typeScale;
    var secondarySize = (compact ? 23 : 15) * typeScale;
    ctx.save();
    ctx.font = '700 ' + primarySize + 'px Arial, Helvetica, sans-serif';
    var textWidth = ctx.measureText(primary).width;
    ctx.restore();
    var textX = endX + (left ? -8 : 8),
      align = left ? 'right' : 'left';
    textX = left ? Math.max(42 + textWidth, textX) : Math.min(W - 42 - textWidth, textX);
    endX = textX + (left ? 8 : -8);
    ctx.beginPath();
    ctx.moveTo(x + (left ? -8 : 8), y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    label(primary, textX, endY - 5, primarySize, colors.ink, '700', align);
    label(
      secondary,
      textX,
      endY + (compact ? 26 : 17) * typeScale,
      secondarySize,
      colors.muted,
      '400',
      align,
    );
  }
  endpoint(pStart, true, 'MARINA DEL REY', 'LOS ANGELES');
  endpoint(pFinish, false, 'SANTA CATALINA', 'AVALON');

  // Mercator is north-up; the small compass stays in the physical map frame.
  var compassX = W - 56,
    compassY = mapTop + 35;
  label('N', compassX, compassY - 6, 18, colors.ink, '700', 'center');
  ctx.beginPath();
  ctx.moveTo(compassX, compassY + 4);
  ctx.lineTo(compassX - 5, compassY + 21);
  ctx.lineTo(compassX + 5, compassY + 21);
  ctx.closePath();
  ctx.fillStyle = colors.accent;
  ctx.fill();

  var boat = projection(routeCoordinate(progress));
  var prev = projection(routeCoordinate(Math.max(0, progress - 0.002)));
  var next = projection(routeCoordinate(Math.min(1, progress + 0.002)));
  var heading =
    Math.atan2((next[1] - prev[1]) * direction, (next[0] - prev[0]) * direction) + Math.PI / 2;
  ctx.save();
  ctx.translate(boat[0], boat[1]);
  ctx.rotate(heading);
  ctx.shadowColor = colors.accent;
  ctx.shadowBlur = 16 * night;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(13, -2, 8, 13);
  ctx.lineTo(-8, 13);
  ctx.quadraticCurveTo(-13, -2, 0, -18);
  ctx.closePath();
  ctx.fillStyle = mix('#fff8e7', '#effff5', night);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = colors.sea;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(0, 11);
  ctx.strokeStyle = '#254b50';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-1, -10);
  ctx.lineTo(-10, 7);
  ctx.lineTo(-1, 5);
  ctx.closePath();
  ctx.fillStyle = colors.warm;
  ctx.fill();
  ctx.restore();
  ctx.restore();
  // Root projects native Play / Reverse / status controls into this reserved band.
  ctx.fillStyle = colors.frame;
  ctx.fillRect(25, mapBottom, W - 50, controls - 14);
  ctx.fillStyle = colors.coast;
  ctx.globalAlpha = 0.28;
  ctx.fillRect(28, mapBottom, W - 56, 1);
  ctx.globalAlpha = 1;
  ctx.restore();
  return {
    progress: progress,
    direction: direction,
    boat: boat,
    marina: pStart,
    avalon: pFinish,
    controlsTop: mapBottom,
  };
}

export function paintKristianAboutWallPage(ctx, width, height, state) {
  state = state || {};
  var section = state.section || {},
    index = Math.max(0, Math.trunc(Number(state.index) || 0));
  var page = state.page || (section.pages || [])[index] || {};
  var key = state.key === 'background' ? 'story' : state.key || 'story';
  var W = 1100,
    H = 850,
    left = 62,
    contentWidth = 976;
  var colors = {
    paper: '#10232f',
    header: '#081b25',
    ink: '#e4f3ed',
    muted: '#9bbfbd',
    accent: '#85e7df',
    line: '#3a6269',
    selected: '#1b4148',
  };
  ctx.save();
  ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, W, H);
  function font(size, weight) {
    ctx.font = (weight || 400) + ' ' + size + 'px "Rajdhani",Arial,sans-serif';
  }
  function text(value, x, y, size, color, weight) {
    font(size, weight);
    ctx.fillStyle = color || colors.ink;
    ctx.fillText(String(value == null ? '' : value), x, y);
  }
  function lines(value, size, maxWidth, weight) {
    font(size, weight);
    var output = [],
      current = '';
    String(value || '')
      .trim()
      .split(/\s+/)
      .forEach(function (word) {
        var next = current ? current + ' ' + word : word;
        if (current && ctx.measureText(next).width > maxWidth) {
          output.push(current);
          current = word;
        } else current = next;
      });
    if (current) output.push(current);
    return output;
  }
  function rule(y) {
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(W - left, y);
    ctx.stroke();
  }
  ctx.fillStyle = colors.header;
  ctx.fillRect(0, 0, W, 74);
  text('ABOUT / KRISTIAN SALMERON', left, 49, 25, colors.muted, 500);
  [
    ['story', 'Background'],
    ['experience', 'Experience'],
    ['approach', 'Approach'],
  ].forEach(function (tab, i) {
    var x = left + i * 325;
    if (tab[0] === key) {
      ctx.fillStyle = colors.selected;
      ctx.fillRect(x - 16, 89, 290, 66);
      ctx.fillStyle = colors.accent;
      ctx.fillRect(x - 16, 153, 290, 3);
    }
    text(tab[1], x, 132, 32, tab[0] === key ? colors.accent : colors.muted, 500);
  });
  rule(174);
  text(page.eyebrow || section.eyebrow || '', left, 218, 25, colors.accent, 500);
  var titleSize = 66,
    titleLines = lines(page.title || section.title || '', titleSize, contentWidth, 500);
  while (titleLines.length > 2 && titleSize > 48) {
    titleSize -= 2;
    titleLines = lines(page.title || section.title || '', titleSize, contentWidth, 500);
  }
  var titleY = 294,
    titleStep = titleSize * 1.1;
  titleLines.forEach(function (line, i) {
    text(line, left, titleY + i * titleStep, titleSize, colors.ink, 500);
  });
  var bodyY = titleY + Math.max(0, titleLines.length - 1) * titleStep + 69;
  var bodySize = 42,
    bodyLines = lines(page.body, bodySize, contentWidth),
    bodyStep = bodySize * 1.3;
  while (bodyY + Math.max(0, bodyLines.length - 1) * bodyStep > 635 && bodySize > 30) {
    bodySize -= 2;
    bodyStep = bodySize * 1.3;
    bodyLines = lines(page.body, bodySize, contentWidth);
  }
  bodyLines.forEach(function (line, i) {
    text(line, left, bodyY + i * bodyStep, bodySize, colors.ink);
  });
  ctx.fillStyle = '#102e3b';
  ctx.fillRect(left, 663, contentWidth, 143);
  ctx.fillStyle = colors.accent;
  ctx.fillRect(left, 663, 4, 143);
  var proofSize = 64;
  font(proofSize, 500);
  while (ctx.measureText(String(page.proof || '')).width > contentWidth - 52 && proofSize > 32) {
    proofSize -= 2;
    font(proofSize, 500);
  }
  text(page.proof || '', left + 26, 733, proofSize, colors.accent, 500);
  text(page.proofLabel || '', left + 26, 779, 27, colors.muted);
  text(index + 1 + ' / ' + Math.max(1, (section.pages || []).length), left, 834, 23, colors.muted);
  ctx.restore();
}
