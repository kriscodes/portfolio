// Scoped to the preview ShadowRoot; never affects the portfolio chrome.
export const neonDriftStyles = `
      :host{display:block;width:100%;height:100%;color-scheme:dark;contain:layout style;}
      *{box-sizing:border-box}.drift{position:relative;width:100%;height:100%;overflow:hidden;background:#080d1c;color:#e1f9fa;font-family:Arial,Helvetica,sans-serif;isolation:isolate}
      canvas{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
      .probe{position:absolute;width:0;height:0;pointer-events:none;opacity:0}.p0{left:0;top:0}.p1{left:100%;top:0}.p2{left:100%;top:100%}.p3{left:0;top:100%}
      .identity{position:absolute;left:13px;top:12px;pointer-events:none;z-index:1;text-shadow:0 1px 10px #080d1c}.identity strong{font-size:10px;font-weight:600;letter-spacing:2px}.identity span{display:block;margin-top:5px;font-size:10px;color:#b8cad9;letter-spacing:.2px}
      .controls{position:absolute;z-index:2;bottom:7px;left:50%;transform:translateX(-50%);display:flex;gap:3px;padding:3px;border-radius:12px;background:#101828ed;border:1px solid #b9f8f52e;box-shadow:0 8px 24px #0006;backdrop-filter:blur(12px)}
      button{appearance:none;position:relative;flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:5px;min-width:44px;min-height:44px;padding:0 10px;border:0;border-radius:8px;color:#d8f3f2;background:transparent;font-family:inherit;font-size:12px;font-weight:500;line-height:1;cursor:pointer;touch-action:manipulation}
      button:hover{background:#b7f9e815}button:focus-visible{outline:2px solid #b8fff0;outline-offset:-2px}button[data-drift="mode"]{min-width:63px;background:#a8f5dc13}button[data-drift="motion"]{font-size:18px}.swatches{display:flex;transform:rotate(-20deg);align-items:center}.swatches i{display:block;width:7px;height:17px;border-radius:5px;background:var(--color);margin-left:1px}.clear{font-size:23px;line-height:1}.status{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
      .drift[data-compact="true"] .identity{top:7px;left:10px}.drift[data-compact="true"] .identity span{display:none}.drift[data-compact="true"] .controls{bottom:4px}
      @media(prefers-reduced-motion:reduce){button{transition:none}}
    `;
