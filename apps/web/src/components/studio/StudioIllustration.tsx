import { useId } from 'react';

type StudioIllustrationProps = {
  theme: 'day' | 'night';
  className?: string;
};

/** A lightweight companion to the 3D studio, drawn entirely with SVG. */
export default function StudioIllustration({ theme, className }: StudioIllustrationProps) {
  const id = `studio-${useId().replace(/:/g, '')}`;
  const night = theme === 'night';
  const c = night
    ? {
        wall: '#233340',
        wallSide: '#1b2a37',
        wallEdge: '#425762',
        floor: '#34434a',
        floorEdge: '#1c2a36',
        ground: '#182734',
        lot: '#1d303b',
        line: '#59717a',
        desk: '#a57960',
        deskEdge: '#674d49',
        metal: '#101e2b',
        metalLight: '#3c5260',
        paper: '#e7ede4',
        muted: '#9eb7b8',
        teal: '#77f5da',
        pink: '#f69bcf',
        amber: '#efbc7f',
        glass: '#152d3a',
        leaf: '#608e72',
        leafLight: '#80b18b',
        soil: '#302e30',
        pot: '#677f7b',
        building: '#273745',
        buildingSide: '#1b2b38',
      }
    : {
        wall: '#e6dfce',
        wallSide: '#d7d6c5',
        wallEdge: '#b6b9a6',
        floor: '#cbc9b2',
        floorEdge: '#9da48d',
        ground: '#d9dccb',
        lot: '#b3beb4',
        line: '#ebede0',
        desk: '#bd8d67',
        deskEdge: '#85674e',
        metal: '#405047',
        metalLight: '#718272',
        paper: '#f8f5e9',
        muted: '#687e72',
        teal: '#416f5f',
        pink: '#bc6c6a',
        amber: '#cb9253',
        glass: '#9bb6a9',
        leaf: '#557956',
        leafLight: '#7b9d69',
        soil: '#73604d',
        pot: '#a68b72',
        building: '#c7cdbb',
        buildingSide: '#afbba9',
      };
  const u = (name: string) => `url(#${id}-${name})`;

  return (
    <svg
      className={className}
      viewBox="0 0 1100 670"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-window`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={night ? '#68dec6' : '#dce9cf'} stopOpacity={night ? '.34' : '.85'} />
          <stop offset="1" stopColor={night ? '#ef8cce' : '#83a58d'} stopOpacity=".1" />
        </linearGradient>
        <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={night ? '#213f4a' : '#e2eadb'} />
          <stop offset="1" stopColor={night ? '#13262f' : '#bdcebd'} />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={night ? '#478e96' : '#77a9a2'} />
          <stop offset="1" stopColor={night ? '#274b64' : '#acc7b4'} />
        </linearGradient>
        <linearGradient id={`${id}-road-glow`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#83ffe2" stopOpacity=".2" />
          <stop offset=".5" stopColor="#eab0df" stopOpacity=".03" />
          <stop offset="1" stopColor="#e896c9" stopOpacity=".18" />
        </linearGradient>
        <linearGradient id={`${id}-headlight`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f7edd0" stopOpacity=".26" />
          <stop offset="1" stopColor="#f7edd0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop stopColor={night ? '#6aafab' : '#a8c09c'} stopOpacity=".16" />
          <stop offset="1" stopColor={night ? '#6aafab' : '#a8c09c'} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <pattern
          id={`${id}-grid`}
          width="34"
          height="20"
          patternUnits="userSpaceOnUse"
          patternTransform="matrix(1 .45 -1 .45 0 0)"
        >
          <path d="M34 0H0V20" stroke={c.wallEdge} strokeWidth=".7" opacity=".3" />
        </pattern>
      </defs>
      <style>{`
        .studio-drawn-water { animation: studio-drawn-tide 8s ease-in-out infinite alternate; }
        .studio-drawn-light { animation: studio-drawn-light 7s ease-in-out infinite; }
        @keyframes studio-drawn-tide { from { opacity: .45; transform: translateX(-2px); } to { opacity: .85; transform: translateX(2px); } }
        @keyframes studio-drawn-light { 0%, 89%, 94%, 100% { opacity: 1; } 91% { opacity: .65; } }
        @media (prefers-reduced-motion: reduce) { .studio-drawn-water, .studio-drawn-light { animation: none; } }
      `}</style>

      {/* A distant, quiet neighborhood gives the open studio somewhere to belong. */}
      <ellipse cx="585" cy="363" rx="516" ry="287" fill={u('halo')} />
      <g opacity={night ? '.72' : '.66'}>
        <path d="M776 194 871 150 871 306 776 350Z" fill={c.buildingSide} />
        <path d="m871 150 127 58v156l-127-58Z" fill={c.building} />
        <path d="m776 194 96-45 128 59-96 44Z" fill={c.wallEdge} />
        <path d="m888 218 43 20v65l-43-20Z" fill={u('window')} />
        <path d="m944 244 36 16v65l-36-16Z" fill={u('window')} />
        <path d="m888 288 92 43v5l-92-43Z" fill={c.pink} opacity=".7" />
        <g transform="matrix(1 .46 0 1 893 191)">
          <rect width="81" height="23" rx="2" fill={c.metal} />
          <text
            x="40.5"
            y="15.5"
            fill={c.pink}
            textAnchor="middle"
            fontFamily="'Rajdhani', sans-serif"
            fontSize="12"
            fontWeight="600"
            letterSpacing="2"
          >
            OPEN LATE
          </text>
        </g>
        <path d="m1005 253 46 22v112l-46-22Z" fill={c.buildingSide} />
        <path d="m1015 282 26 12v48l-26-12Z" fill={u('window')} />
        <path d="m791 227 19-9v56l-19 9Zm31-15 19-9v56l-19 9Z" fill={c.glass} />
        <path d="m791 302 50-23v4l-50 23Z" fill={c.teal} opacity=".6" />
      </g>
      <path d="M79 420 466 237 1066 508 678 665Z" fill={c.ground} />
      <path d="m710 348 356 160-193 79-342-155Z" fill={c.lot} />
      <path
        d="m782 402 213 96m-269-71 212 96m-270-70 213 96"
        stroke={c.line}
        strokeWidth="2"
        opacity=".55"
      />
      <path
        d="m724 481 54-24m46 70 54-24m-319-15 54-24"
        stroke={c.line}
        strokeWidth="2"
        opacity=".5"
      />
      {night && <path d="m800 381 245 111-161 60-182-83Z" fill={u('road-glow')} />}
      <path d="m96 413 322-153 360 164-321 155Z" fill={c.floor} />
      <path d="m96 413 322-153 360 164-321 155Z" fill={u('grid')} />
      <path d="m96 413 361 166v13L96 426Zm361 166 321-155v13L457 592Z" fill={c.floorEdge} />
      <path d="m95 414 363 165 320-155" stroke={c.wallEdge} strokeWidth="3" />

      {/* Two substantial walls frame an open corner, rather than an enclosed dollhouse. */}
      <path d="M105 193 419 46v215L105 411Z" fill={c.wall} />
      <path d="m419 46 355 162v216L419 261Z" fill={c.wallSide} />
      <path
        d="m105 193 314-147 355 162"
        stroke={c.wallEdge}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M419 51v208M111 405l307-146 349 160" stroke={c.wallEdge} strokeWidth="3" />
      <path d="M129 214 393 90M129 229 393 105" stroke={c.wallEdge} strokeWidth="1" opacity=".35" />
      <path d="m436 80 318 146" stroke={c.wallEdge} strokeWidth="1" opacity=".35" />
      <path d="M118 397 415 255" stroke={c.teal} strokeWidth="2" opacity={night ? '.65' : '.2'} />
      <path d="m426 258 338 155" stroke={c.pink} strokeWidth="2" opacity={night ? '.4' : '.13'} />

      {/* The single About terminal sits on the clear, left wall. */}
      <g transform="matrix(1 -.47 0 1 164 225)">
        <rect x="-4" y="-5" width="185" height="111" rx="5" fill={c.metalLight} />
        <rect width="177" height="101" rx="3" fill={c.metal} />
        <rect x="7" y="7" width="163" height="87" rx="1" fill={u('screen')} />
        <circle cx="17" cy="18" r="2" fill={c.teal} />
        <text
          x="26"
          y="21"
          fontFamily="'IBM Plex Mono', monospace"
          fill={c.teal}
          fontSize="6"
          letterSpacing="1.1"
        >
          ABOUT / KRISTIAN
        </text>
        <path
          d="M17 32h68M17 45h139M17 51h126M17 57h135M17 71h58"
          stroke={night ? c.paper : c.metal}
          strokeWidth="2"
          opacity=".58"
        />
        <rect x="17" y="80" width="37" height="4" rx="1" fill={c.teal} opacity=".6" />
        <rect x="62" y="80" width="37" height="4" rx="1" fill={c.paper} opacity=".2" />
        <rect x="107" y="80" width="37" height="4" rx="1" fill={c.paper} opacity=".2" />
      </g>
      <path d="m182 346 74-35 46 21-74 36Z" fill={c.desk} />
      <path d="m182 346 46 22v7l-46-22Zm46 22 74-36v7l-74 36Z" fill={c.deskEdge} />

      {/* Oversized wall lettering and a small, useful camera shelf. */}
      <g transform="matrix(1 .46 0 1 474 120)">
        {night && (
          <text
            x="0"
            y="0"
            fill={c.pink}
            fontFamily="'Rajdhani', sans-serif"
            fontWeight="500"
            fontSize="53"
            letterSpacing="5"
            filter={u('glow')}
            opacity=".6"
          >
            STUDIO
          </text>
        )}
        <text
          x="0"
          y="0"
          fill={night ? '#f9c4e3' : c.teal}
          fontFamily="'Rajdhani', sans-serif"
          fontWeight="500"
          fontSize="53"
          letterSpacing="5"
        >
          STUDIO
        </text>
        <path d="M2 10h195" stroke={c.pink} strokeWidth="1" opacity=".45" />
      </g>
      <path d="m462 211 169 77 39-18-168-77Z" fill={c.desk} />
      <path d="m462 211 169 77v6l-169-77Zm169 77 39-18v6l-39 18Z" fill={c.deskEdge} />
      <path d="m482 208 21-10 26 12-20 10Z" fill={c.metalLight} />
      <path d="m482 208 27 12v-19l-27-12Z" fill={c.metal} />
      <path d="m509 201 20-9v18l-20 10Z" fill={c.metalLight} />
      <path d="m489 189 9-4 10 4-9 5Z" fill={c.metal} />
      <ellipse
        cx="496"
        cy="205"
        rx="8"
        ry="10"
        transform="rotate(-20 496 205)"
        fill={c.metalLight}
      />
      <ellipse
        cx="496"
        cy="205"
        rx="5"
        ry="7"
        transform="rotate(-20 496 205)"
        fill={c.glass}
        stroke={c.teal}
        strokeWidth="1"
      />
      <g stroke={c.metalLight} strokeWidth="2">
        <path d="m548 216 1 31m0-31-9 26m9-26 11 34" />
      </g>
      <path d="m538 210 13-6 14 6-13 6Z" fill={c.metal} />
      <path d="m538 210 14 6v-12l-14-6Zm14-6 13-6v12l-13 6Z" fill={c.metalLight} />
      <path d="m585 237 12-5 12 5v16l-12 5-12-5Z" fill={c.metal} />
      <path d="m585 237 12 6 12-6m-12 6v15" stroke={c.metalLight} />

      {/* A large sailboat display lives inside the studio, with water underneath. */}
      <path d="m609 344 85-40 87 40-85 41Z" fill={c.metalLight} />
      <path d="m609 344 87 41v17l-87-40Zm87 41 85-41v17l-85 41Z" fill={c.metal} />
      <path d="m617 343 78-35 77 35-77 36Z" fill={u('water')} />
      <g
        className="studio-drawn-water"
        stroke={night ? '#96ece0' : '#e1f2dd'}
        strokeWidth="1.2"
        opacity=".6"
      >
        <path d="m629 341 11-5 9 4 12-6m-9 21 12-5 13 6 13-6m18 12 13-6 11 4 11-5m-44-26 10-5 10 5 12-6" />
      </g>
      <g>
        <path d="m641 334 54-7 44 16-34 15-41-7Z" fill={c.paper} />
        <path d="m641 334 23 17 41 7 34-15-26 25-45-8Z" fill={night ? '#b2c6c7' : '#c8cfbf'} />
        <path d="m649 339 21 13 35 4 24-11" stroke={c.metalLight} strokeWidth="1.5" />
        <path d="M689 326V209" stroke={c.paper} strokeWidth="2.3" />
        <path d="m684 218-49 90 49 15Z" fill={night ? '#d5dfd2' : '#f3f0df'} />
        <path d="m694 228 44 103-44-9Z" fill={night ? '#97bdb8' : '#c1d1b8'} />
        <path
          d="m684 222-44 83 44 13m10-85 39 94-39-8"
          stroke={c.metalLight}
          strokeWidth=".8"
          opacity=".45"
        />
        <path
          d="m689 211-54 120m54-120 49 129m-49-15 1 18"
          stroke={c.paper}
          strokeWidth=".7"
          opacity=".65"
        />
        <path d="m682 208 7-5v10Z" fill={c.pink} />
        <path d="m671 331 15-4 22 8-14 5Z" fill={c.desk} />
        <circle cx="644" cy="335" r="1.8" fill={night ? '#ff6b79' : '#b65050'} />
        <circle cx="658" cy="330" r="1.8" fill={night ? '#92f0a9' : '#547d52'} />
        <circle cx="689" cy="209" r="2" fill={night ? '#fff4ce' : c.paper} />
        <circle cx="691" cy="273" r="1.5" fill={night ? '#fff4ce' : c.paper} />
      </g>
      <g transform="matrix(1 .46 0 1 630 376)">
        <rect width="51" height="10" rx="1" fill={c.metalLight} />
        <text
          x="25.5"
          y="7"
          textAnchor="middle"
          fontSize="4.5"
          fontFamily="'IBM Plex Mono', monospace"
          letterSpacing=".6"
          fill={c.teal}
        >
          PACIFIC / 33°N
        </text>
      </g>

      {/* Decorative indoor trees: a palm, a sculptural bonsai, and a small conifer. */}
      <ellipse cx="445" cy="281" rx="25" ry="12" fill={c.metal} opacity=".15" />
      <path d="m427 257 5 27q13 10 27-1l5-26Z" fill={c.pot} />
      <ellipse cx="446" cy="257" rx="19" ry="8" fill={c.soil} />
      <path d="M445 256q-12-52 1-126" stroke={c.deskEdge} strokeWidth="6" />
      <path
        d="M446 132q-36-24-60 5 34-13 60-5Zm0 0q-45 3-50 37 22-26 50-37Zm0 0q-13-39-40-35 28 12 40 35Zm0 0q9-46 34-41-21 14-34 41Zm0 0q30-36 60-10-32-7-60 10Zm0 0q40-4 49 29-22-21-49-29Zm0 0q9 10 11 42-16-23-11-42Z"
        fill={c.leaf}
      />
      <path d="m446 132-47 28m47-28 46-5m-46 5 25-33" stroke={c.leafLight} strokeWidth="1.2" />
      <ellipse cx="191" cy="421" rx="29" ry="12" fill={c.metal} opacity=".15" />
      <path d="m169 397 5 24q17 11 34-1l5-23Z" fill={c.pot} />
      <ellipse cx="191" cy="397" rx="22" ry="8" fill={c.soil} />
      <path
        d="m190 398 4-28-10-18m10 21 15-14m-20 4-16-10"
        stroke={c.deskEdge}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M153 352q-2-13 17-15 10-15 24-3 23-7 24 9 21 6 5 18-15 6-30-2-19 11-28-1-16 3-12-6Z"
        fill={c.leaf}
      />
      <path
        d="M158 346q14-10 24-3m15-3q13-2 19 5"
        stroke={c.leafLight}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="m237 407 3 19q12 7 23 0l4-19Z" fill={c.pot} />
      <ellipse cx="252" cy="406" rx="15" ry="6" fill={c.soil} />
      <path d="M252 405v-63" stroke={c.deskEdge} strokeWidth="3" />
      <path d="m252 322-14 31h8l-15 26h10l-16 23q26 9 53 0l-17-23h10l-15-26h8Z" fill={c.leaf} />
      <path
        d="m252 337-7 15m7 10-11 16m11 8-14 15"
        stroke={c.leafLight}
        strokeWidth="2"
        opacity=".65"
      />

      {/* The workspace is the visual center, with a generous monitor and desk. */}
      <path d="m287 412 171-81 184 84-171 83Z" fill={c.desk} />
      <path d="m287 412 184 86v10l-184-86Zm184 86 171-83v10l-171 83Z" fill={c.deskEdge} />
      <path d="M309 432v83m308-76v73m-147 3v64" stroke={c.metal} strokeWidth="11" />
      <path d="m309 509 27 12m281-14-27 13m-120 55 27-12" stroke={c.metalLight} strokeWidth="4" />
      <path d="m451 421 28-13 32 15-28 14Z" fill={c.metalLight} />
      <path d="m470 410 10 5v-37l-10-5Z" fill={c.metal} />
      <g transform="matrix(1 .46 0 1 357 263)">
        <rect x="-4" y="-4" width="235" height="142" rx="6" fill={c.metalLight} />
        <rect width="227" height="134" rx="4" fill={c.metal} />
        <rect x="8" y="8" width="211" height="116" rx="1" fill={u('screen')} />
        <path d="M8 29h211" stroke={c.teal} strokeOpacity=".2" />
        <circle cx="17" cy="18" r="2" fill={c.teal} />
        <circle cx="25" cy="18" r="2" fill={c.pink} opacity=".7" />
        <circle cx="33" cy="18" r="2" fill={c.amber} opacity=".7" />
        <text
          x="206"
          y="20.5"
          fill={c.muted}
          textAnchor="end"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="5.5"
          letterSpacing=".8"
        >
          WORK AVE.
        </text>
        <text
          x="19"
          y="49"
          fill={night ? c.paper : c.metal}
          fontFamily="'Rajdhani', sans-serif"
          fontSize="13"
          fontWeight="600"
          letterSpacing=".7"
        >
          GOOD WORK. REAL PEOPLE.
        </text>
        <path d="M19 59h106" stroke={c.muted} strokeWidth="2" opacity=".55" />
        <rect x="19" y="70" width="111" height="42" rx="2" fill={c.teal} opacity=".12" />
        <rect x="138" y="70" width="69" height="42" rx="2" fill={c.pink} opacity=".12" />
        <path d="m27 92 8-10 8 15 7-9h17" stroke={c.teal} strokeWidth="1.5" />
        <text x="27" y="106" fill={c.teal} fontFamily="'IBM Plex Mono', monospace" fontSize="6">
          CareIQ
        </text>
        <circle cx="172" cy="88" r="10" stroke={c.pink} strokeWidth="1" />
        <ellipse
          cx="172"
          cy="88"
          rx="17"
          ry="5"
          stroke={c.pink}
          strokeWidth="1"
          transform="rotate(-25 172 88)"
        />
        <text x="148" y="106" fill={c.pink} fontFamily="'IBM Plex Mono', monospace" fontSize="5">
          EXPERIMENTS
        </text>
        <circle cx="114" cy="129" r="1" fill={c.teal} />
      </g>
      <path d="m380 427 61-29 66 30-61 30Z" fill={c.metalLight} />
      <path d="m388 427 53-25 56 26-52 25Z" fill={c.metal} />
      <path
        d="m397 426 46-21m-36 27 46-22m-36 27 45-21m-36 26 45-21"
        stroke={c.metalLight}
        strokeWidth="2"
      />
      <path d="m524 446 11-5 10 5-11 6Z" fill={c.paper} />
      <path d="m332 402 13-6 14 6-13 6Z" fill={c.paper} />
      <path d="m332 402 3 16q10 8 20 0l4-16" fill={c.paper} />
      <path d="m357 407 6 1q5 11-7 11" stroke={c.paper} strokeWidth="3" />
      <ellipse cx="345" cy="402" rx="11" ry="4" fill={c.deskEdge} />
      <path d="m409 503-40 20v42l40 19 40-20v-43Z" fill={c.metal} />
      <path d="m369 523 40 19 40-21m-40 21v42" stroke={c.metalLight} strokeWidth="2" />
      <path d="m380 515-2-35q30-9 57 7l-3 36" fill={c.metalLight} />
      <path
        d="m409 584 1 18m-23 11 23-11 22 10m-22-10 1 15"
        stroke={c.metal}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Street placards are part of the scene, rendered as a single sculptural marker. */}
      <g transform="translate(65 20)">
        <ellipse cx="575" cy="530" rx="31" ry="13" fill={c.metal} opacity=".2" />
        <path d="m561 523 15-7 15 7-15 8Z" fill={c.metalLight} />
        <path d="M576 524V327" stroke={c.metalLight} strokeWidth="7" />
        <path d="M574 524V327" stroke={c.paper} strokeWidth="1" opacity=".3" />
        <circle cx="576" cy="325" r="5" fill={c.metalLight} />
        <g transform="matrix(1 .36 0 1 515 337)">
          <path
            d="M0 0h119l14 15-14 15H0Z"
            fill={night ? c.metal : c.paper}
            stroke={c.teal}
            strokeWidth="1.5"
          />
          <text
            x="59"
            y="20"
            textAnchor="middle"
            fill={c.teal}
            fontFamily="'Rajdhani', sans-serif"
            fontSize="17"
            fontWeight="600"
            letterSpacing="2"
          >
            WORK AVE.
          </text>
          <circle cx="9" cy="15" r="1.5" fill={c.paper} />
        </g>
        <g transform="matrix(1 -.42 0 1 508 392)">
          <path
            d="m0 14 15-14h111v29H15Z"
            fill={night ? c.metal : c.paper}
            stroke={c.pink}
            strokeWidth="1.5"
          />
          <text
            x="71"
            y="20"
            textAnchor="middle"
            fill={c.pink}
            fontFamily="'Rajdhani', sans-serif"
            fontSize="17"
            fontWeight="600"
            letterSpacing="2"
          >
            LIFE LN.
          </text>
        </g>
        <g transform="matrix(1 .36 0 1 533 405)">
          <path
            d="M0 0h101l14 14-14 14H0Z"
            fill={night ? c.metal : c.paper}
            stroke={c.amber}
            strokeWidth="1.5"
          />
          <text
            x="54"
            y="19"
            textAnchor="middle"
            fill={c.amber}
            fontFamily="'Rajdhani', sans-serif"
            fontSize="16"
            fontWeight="600"
            letterSpacing="1.5"
          >
            ABOUT WAY
          </text>
        </g>
      </g>

      {/* The truck stays in the side lot; its headlights only come on after hours. */}
      <g transform="translate(0 -3)">
        <ellipse cx="905" cy="481" rx="91" ry="36" fill={c.metal} opacity=".25" />
        {night && (
          <path d="m832 469-55 64 61 26 36-77Zm104 38-14 65 59-24-6-41Z" fill={u('headlight')} />
        )}
        <path d="m827 393 68-31 87 40-70 33Z" fill={night ? '#becbd0' : '#f3f2e9'} />
        <path d="m827 393 85 42v60l-85-41Z" fill={night ? '#d9e2e0' : '#fffdf3'} />
        <path d="m912 435 70-33v59l-70 34Z" fill={night ? '#aabcc1' : '#d6ded0'} />
        <path d="m835 392 59-27 77 35-59 28Z" fill={c.metalLight} />
        <path d="m843 391 50-22 67 31-48 22Z" fill={c.metal} />
        <path d="m823 425 27-61 59 27 25 65Z" fill={night ? '#e1e7e2' : '#fffef7'} />
        <path d="m850 364 46-21 58 26-45 22Z" fill={night ? '#cedad8' : '#f6f4e9'} />
        <path d="m909 391 45-22 20 62-40 25Z" fill={night ? '#b5c7ca' : '#d9e1d4'} />
        <path d="m851 373-20 49 85 39-15-65Z" fill={c.glass} />
        <path d="m917 396 31-15 15 46-31 17Z" fill={c.glass} />
        <path d="m831 422 85 39 18-5-85-39Z" fill={night ? '#e9eddf' : '#fffef7'} />
        <path d="m813 436 85 40 36-20-85-39Z" fill={night ? '#edf0e7' : '#fffef7'} />
        <path d="m813 436 85 40v37l-85-39Z" fill={night ? '#d8e2df' : '#f4f5ec'} />
        <path d="m898 476 36-20v37l-36 20Z" fill={night ? '#adbdbe' : '#c7d1c2'} />
        <path d="m828 455 53 24v19l-53-24Z" fill={c.metal} />
        <path d="m832 460 45 21m-45-14 45 21" stroke={c.metalLight} strokeWidth="2" />
        <path d="m849 472 5 2v-3l7 3v3l5 2v4l-5-2v3l-7-3v-3l-5-2Z" fill={c.amber} />
        <path
          d="m816 449 12 5v14l-12-5Zm65 29 13 6v14l-13-6Z"
          fill={night ? '#fff2bb' : '#dbe6dc'}
        />
        {night && (
          <g className="studio-drawn-light" fill="#fff2bb" filter={u('glow')}>
            <path d="m816 449 12 5v14l-12-5Zm65 29 13 6v14l-13-6Z" />
          </g>
        )}
        <path d="m813 477 85 39 36-19v7l-36 19-85-39Z" fill={c.metalLight} />
        <ellipse cx="839" cy="485" rx="12" ry="19" transform="rotate(-15 839 485)" fill={c.metal} />
        <ellipse
          cx="839"
          cy="485"
          rx="6"
          ry="11"
          transform="rotate(-15 839 485)"
          fill={c.metalLight}
        />
        <ellipse cx="959" cy="460" rx="11" ry="18" transform="rotate(15 959 460)" fill={c.metal} />
        <ellipse
          cx="959"
          cy="460"
          rx="5"
          ry="10"
          transform="rotate(15 959 460)"
          fill={c.metalLight}
        />
        <path d="m818 419-9-3v12l9 4m151-8 10-5v12l-9 4" fill={c.metalLight} />
        <path d="m940 442 15-7" stroke={c.metal} strokeWidth="2" />
      </g>
      <g opacity=".35" stroke={c.line} strokeWidth="1">
        <path d="m731 574 41 19m-25-26 41 19m-25-26 41 19M142 454l34 16m-18-24 34 16" />
      </g>
    </svg>
  );
}
