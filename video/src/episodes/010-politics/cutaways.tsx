import React, { useMemo } from "react";
import { INK, Shadow } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, LightWash, Stage, camLerp } from "../../engine/Stage";
import { blob, clamp, cloudPath, easeInOut, easeOut, lerp, onN, rnd } from "../../engine/util";
import { Frog, FrogProps } from "./cast/Frog";
import { Brayer, Tusker } from "./cast/Mascots";
import { useSpeech } from "./tl";

/* EPISODE 010 "THEN" cutaways: the government on a leash, the war on drugs, foreign military involvement,
   the foul binary system (a mascot mud pit) and the ascension. All sunny, all smug. */

const FONT = "Arial Black, Arial, Helvetica, sans-serif";

const Sky: React.FC<{ id: string; top?: string; bottom?: string }> = ({ id, top = "#5cb6ee", bottom = "#d6f2ff" }) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} />
        <stop offset="1" stopColor={bottom} />
      </linearGradient>
    </defs>
    <rect x={-1200} y={-1400} width={4400} height={2600} fill={`url(#${id})`} />
  </>
);

const Sun: React.FC<{ x: number; y: number; t: number; r?: number }> = ({ x, y, t, r = 70 }) => (
  <g>
    <g transform={`translate(${x} ${y}) rotate(${t * 14})`}>
      {Array.from({ length: 14 }).map((_, i) => (
        <path key={i} d={`M0,${-r - 14} L${r * 0.18},${-r * 1.6} L${-r * 0.18},${-r * 1.6} Z`} fill="#ffd84a" stroke={INK} strokeWidth={3} transform={`rotate(${i * (360 / 14)})`} strokeLinejoin="round" />
      ))}
    </g>
    <circle cx={x} cy={y} r={r} fill="#ffe25a" stroke={INK} strokeWidth={5} />
    <path d={`M${x - 22},${y + 12} q22,20 44,0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
    <circle cx={x - 20} cy={y - 10} r={5} fill={INK} />
    <circle cx={x + 20} cy={y - 10} r={5} fill={INK} />
  </g>
);

const Tree: React.FC<{ x: number; y: number; s?: number; seed: string }> = ({ x, y, s = 1, seed }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-16,0 L-10,-150 L10,-150 L16,0 Z" fill="#8a5a30" stroke={INK} strokeWidth={5} />
    <path d={cloudPath(0, -230, 110, 100, 10, seed, 0.7)} fill="#4e9a34" stroke={INK} strokeWidth={5} />
    <path d={cloudPath(-20, -250, 60, 50, 7, seed + "h", 0.6)} fill="#6ab848" />
  </g>
);

/* ------------------------------------------------------------------ */
/* The government, on a leash                                          */
/* ------------------------------------------------------------------ */

/** A slobbering marble beast with a domed head, column legs, filing-cabinet teeth and a red-tape tongue. */
const GovBeast: React.FC<{ x: number; y: number; t: number; frame: number; lunge: number; lick: number; yank: number }> = ({ x, y, t, frame, lunge, lick, yank }) => {
  const f2 = onN(frame, 2);
  const pant = Math.sin((f2 / 24) * 14) * 4;
  const rear = lunge * 14 - yank * 10;
  const tongueLen = 70 + lick * 160 + Math.sin(t * 7) * 6;
  const tipY = 150 + lick * 110;
  const wag = Math.sin(t * 9) * 16;
  return (
    <g transform={`translate(${x} ${y})`}>
      <Shadow cx={0} cy={4} rx={260} o={0.35} />
      {/* scroll tail of paperwork, wagging */}
      <path d={`M-200,-190 C-280,-230 ${-330 + wag},-300 ${-300 + wag},-360`} stroke={INK} strokeWidth={38} fill="none" strokeLinecap="round" />
      <path d={`M-200,-190 C-280,-230 ${-330 + wag},-300 ${-300 + wag},-360`} stroke="#f2ecd8" strokeWidth={28} fill="none" strokeLinecap="round" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${-250 - i * 20 + wag * (i / 3)},${-226 - i * 40} l20,-6`} stroke="#8a8478" strokeWidth={3} />
      ))}
      <g transform={`rotate(${-rear} 180 -40)`}>
        {/* column legs */}
        {[-170, -90, 90, 170].map((lx, i) => (
          <g key={i} transform={`translate(${lx} 0)`}>
            <rect x={-26} y={-150} width={52} height={150} fill={i % 2 ? "#e6e2d6" : "#cfcabb"} stroke={INK} strokeWidth={5} />
            {[-14, 0, 14].map((cx) => (
              <path key={cx} d={`M${cx},-140 L${cx},-12`} stroke="#b0aa98" strokeWidth={3} />
            ))}
            <rect x={-34} y={-160} width={68} height={16} fill="#f2eee2" stroke={INK} strokeWidth={4} />
            <rect x={-34} y={-12} width={68} height={14} fill="#f2eee2" stroke={INK} strokeWidth={4} />
          </g>
        ))}
        {/* marble body with a pediment back */}
        <path d={blob(0, -230, 250, 110, 12, 0.05, "govbody")} fill="#ece8dc" stroke={INK} strokeWidth={6} />
        <path d="M-180,-300 q60,30 120,6 M-40,-270 q50,40 110,10 M-150,-200 q40,16 90,0" stroke="#c8c2b0" strokeWidth={4} fill="none" />
        {/* the facade frieze on its flank */}
        <g transform="rotate(-2 -20 -250)">
          <rect x={-200} y={-286} width={330} height={62} fill="#f6f2e6" stroke={INK} strokeWidth={5} />
          <path d="M-210,-286 L-35,-330 L140,-286 Z" fill="#f2eee2" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <text x={-35} y={-243} textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight={700} fontSize={40} fill="#3a3428" letterSpacing={3}>
            GOVERNMENT
          </text>
        </g>
        {/* collar + tag */}
        <path d="M150,-300 Q200,-180 250,-290" stroke="#cc3329" strokeWidth={24} fill="none" />
        <g transform="translate(206 -214)">
          <circle r={26} fill="#e2c45a" stroke={INK} strokeWidth={4} />
          <text y={7} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill={INK}>
            GOV'T
          </text>
        </g>
        {/* the domed head */}
        <g transform={`translate(250 -350) rotate(${lunge * 10 + pant * 0.3})`}>
          <rect x={-120} y={-10} width={240} height={110} fill="#e6e2d6" stroke={INK} strokeWidth={6} />
          <path d="M-110,-10 C-110,-170 110,-170 110,-10 Z" fill="#f2eee2" stroke={INK} strokeWidth={6} />
          <path d="M-60,-10 C-60,-120 60,-120 60,-10" stroke="#c8c2b0" strokeWidth={4} fill="none" />
          <path d="M0,-130 L0,-10" stroke="#c8c2b0" strokeWidth={4} />
          <rect x={-22} y={-170} width={44} height={44} fill="#f2eee2" stroke={INK} strokeWidth={5} />
          <path d="M-22,-170 C-22,-200 22,-200 22,-170 Z" fill="#e6e2d6" stroke={INK} strokeWidth={5} />
          <path d="M0,-196 L0,-250" stroke={INK} strokeWidth={5} />
          <path d={`M0,-250 L40,${-240 + Math.sin(t * 8) * 4} L0,-228 Z`} fill="#cc3329" stroke={INK} strokeWidth={3} />
          {/* window eyes, beady and greedy */}
          {[-56, 46].map((ex, i) => (
            <g key={i}>
              <path d={`M${ex - 22},-60 L${ex - 22},-90 C${ex - 22},-116 ${ex + 22},-116 ${ex + 22},-90 L${ex + 22},-60 Z`} fill="#fff8d0" stroke={INK} strokeWidth={5} />
              <circle cx={ex + 8 + lunge * 6} cy={-80} r={10} fill={INK} />
              <path d={`M${ex - 26},-118 L${ex + 26},${-104 - i * 6}`} stroke={INK} strokeWidth={7} strokeLinecap="round" />
            </g>
          ))}
          {/* mouth: filing-cabinet teeth */}
          <path d={`M-100,20 L120,20 L120,${70 + lunge * 20} L-100,${70 + lunge * 20} Z`} fill="#2a0e0e" stroke={INK} strokeWidth={5} />
          {[-90, -40, 10, 60].map((tx) => (
            <g key={tx}>
              <rect x={tx} y={18} width={44} height={22} fill="#9aa0a6" stroke={INK} strokeWidth={3} />
              <rect x={tx + 16} y={26} width={12} height={5} fill="#d8dce0" />
            </g>
          ))}
          {/* red tape tongue */}
          <path d={`M60,${50 + lunge * 10} C${100 + tongueLen * 0.4},${80 + lunge * 10} ${90 + tongueLen},${110 + lick * 40} ${120 + tongueLen},${tipY}`} stroke={INK} strokeWidth={36} fill="none" strokeLinecap="round" />
          <path d={`M60,${50 + lunge * 10} C${100 + tongueLen * 0.4},${80 + lunge * 10} ${90 + tongueLen},${110 + lick * 40} ${120 + tongueLen},${tipY}`} stroke="#d8443a" strokeWidth={26} fill="none" strokeLinecap="round" />
          <path d={`M60,${50 + lunge * 10} C${100 + tongueLen * 0.4},${80 + lunge * 10} ${90 + tongueLen},${110 + lick * 40} ${120 + tongueLen},${tipY}`} stroke="#f6c8c0" strokeWidth={3} fill="none" strokeDasharray="10 14" />
          {/* drool */}
          {[0, 1].map((i) => {
            const ph = (t * 1.2 + i * 0.5) % 1;
            return <path key={i} d={`M${-60 + i * 50},${70 + lunge * 20} q-4,${20 + ph * 50} 2,${30 + ph * 70}`} stroke="#d8eef2" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.85} />;
          })}
        </g>
      </g>
      {/* paperwork flying off when it strains */}
      {lunge > 0.3
        ? [0, 1, 2, 3].map((i) => {
            const ph = (t * 1.6 + i * 0.25) % 1;
            return (
              <g key={i} transform={`translate(${-100 + i * 70 - ph * 200} ${-320 - ph * 200}) rotate(${ph * 300 + i * 40})`} opacity={1 - ph}>
                <rect x={-18} y={-24} width={36} height={48} fill="#fbfaf2" stroke={INK} strokeWidth={3} />
                <path d="M-10,-12 l20,0 M-10,-2 l20,0 M-10,8 l14,0" stroke="#8a8478" strokeWidth={2.5} />
              </g>
            );
          })
        : null}
    </g>
  );
};

/** A tiny, trembling scroll: OUR LIBERTIES. */
const LibertyScroll: React.FC<{ x: number; y: number; t: number; frame: number; fear: number; slimed: number; s?: number }> = ({ x, y, t, frame, fear, slimed, s = 1 }) => {
  const f2 = onN(frame, 2);
  const sh = (rnd(`ls${f2}`) - 0.5) * 6 * fear;
  return (
    <g transform={`translate(${x + sh} ${y}) scale(${s})`}>
      <Shadow cx={0} cy={2} rx={60} o={0.3} />
      <path d="M-14,0 L-10,-36 M14,0 L10,-36" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <rect x={-46} y={-150} width={92} height={120} rx={8} fill="#f6ecc8" stroke={INK} strokeWidth={5} />
      <rect x={-56} y={-162} width={112} height={22} rx={11} fill="#e8dcb0" stroke={INK} strokeWidth={5} />
      <rect x={-56} y={-42} width={112} height={22} rx={11} fill="#e8dcb0" stroke={INK} strokeWidth={5} />
      <text x={0} y={-58} textAnchor="middle" fontFamily="PatrickHand" fontSize={19} fill="#7a2a1e">
        LIBERTIES
      </text>
      {/* scared face */}
      <circle cx={-16} cy={-106} r={13} fill="#fff" stroke={INK} strokeWidth={3} />
      <circle cx={16} cy={-106} r={13} fill="#fff" stroke={INK} strokeWidth={3} />
      <circle cx={-14 - fear * 4} cy={-104} r={4} fill={INK} />
      <circle cx={18 - fear * 4} cy={-104} r={4} fill={INK} />
      <ellipse cx={0} cy={-80} rx={8} ry={6 + fear * 5} fill="#3a0e0e" stroke={INK} strokeWidth={2.5} />
      <path d="M-30,-126 l14,6 M30,-126 l-14,6" stroke={INK} strokeWidth={3} />
      {fear > 0.4 ? <path d="M54,-130 q-6,10 0,16 q6,-6 0,-16" fill="#bfe3f2" stroke={INK} strokeWidth={2} /> : null}
      {slimed > 0 ? <path d={blob(0, -100, 60 * slimed, 50 * slimed, 9, 0.35, "slime")} fill="#cfe8b0" opacity={0.75} /> : null}
      <path d={`M-46,-90 l-24,${-10 + Math.sin(t * 20) * 6 * fear} M46,-90 l24,${-10 + Math.cos(t * 20) * 6 * fear}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

export const FROG_X = 420;
export const FROG_Y = 1000;

export const LeashPark: React.FC<{ from: Cam; to?: Cam; lunge: number; lick: number; yank: number; frog?: Partial<FrogProps> }> = ({ from, to, lunge, lick, yank, frog = {} }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const sp = useSpeech();
  const cam = to ? camLerp(from, to, easeInOut(shot.p)) : from;
  const beastX = 1150 + lunge * 50 - yank * 60;
  // collar tag in world coords (beast-local 206,-214), then relative to the frog (body coords, scale 1)
  const leashTo: [number, number] = [beastX + 206 - FROG_X, 980 - 214 - FROG_Y];
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="parkSun" color="#fff2b8" cx={1500} cy={100} r={1200} opacity={0.2} />}>
      <Sky id="parkSky" />
      <Sun x={1600} y={140} t={t} />
      <path d={cloudPath(300 + t * 10, 160, 140, 46, 9, "pc1", 0.8)} fill="#fff" stroke={INK} strokeWidth={5} />
      <path d={cloudPath(1000 + t * 6, 90, 110, 36, 8, "pc2", 0.8)} fill="#fff" stroke={INK} strokeWidth={5} />
      {/* hills, trees, path */}
      <path d="M-1200,640 Q-200,520 700,600 Q1500,520 3200,620 L3200,2000 L-1200,2000 Z" fill="#8fd06a" stroke={INK} strokeWidth={5} />
      <Tree x={-60} y={640} s={1.0} seed="tr1" />
      <Tree x={260} y={610} s={0.7} seed="tr2" />
      <Tree x={1960} y={630} s={0.9} seed="tr3" />
      <rect x={-1200} y={760} width={4400} height={1300} fill="#7cc35a" />
      <path d="M-1200,1010 Q400,940 960,980 Q1600,1020 3200,960 L3200,1100 Q1600,1150 960,1100 Q400,1060 -1200,1130 Z" fill="#e8d6a0" stroke={INK} strokeWidth={5} />
      {/* bench + lamp post */}
      <g transform="translate(140 900)">
        <rect x={-120} y={-60} width={240} height={20} fill="#a8723e" stroke={INK} strokeWidth={4} />
        <rect x={-120} y={-110} width={240} height={18} fill="#a8723e" stroke={INK} strokeWidth={4} />
        <path d="M-100,-40 L-100,0 M100,-40 L100,0" stroke={INK} strokeWidth={8} />
      </g>
      <g transform="translate(1720 900)">
        <rect x={-8} y={-360} width={16} height={360} fill="#3a3e48" stroke={INK} strokeWidth={4} />
        <path d="M-30,-360 L30,-360 L20,-410 L-20,-410 Z" fill="#fff6c8" stroke={INK} strokeWidth={4} />
      </g>
      {Array.from({ length: 14 }).map((_, i) => (
        <g key={i} transform={`translate(${-400 + i * 210 + rnd(`fl${i}`) * 80} ${800 + rnd(`fly${i}`) * 140})`}>
          <path d="M0,0 L0,-24" stroke="#3e8a2a" strokeWidth={4} />
          {Array.from({ length: 5 }).map((_, k) => (
            <circle key={k} cx={Math.cos((k / 5) * Math.PI * 2) * 8} cy={-30 + Math.sin((k / 5) * Math.PI * 2) * 8} r={6} fill={["#fff", "#ffd84a", "#ff8ab0"][i % 3]} stroke={INK} strokeWidth={2} />
          ))}
          <circle cx={0} cy={-30} r={5} fill="#f2b230" />
        </g>
      ))}
      {/* the liberties, cowering behind a daisy */}
      <LibertyScroll x={1752} y={1046} s={1.3} t={t} frame={frame} fear={0.5 + lunge * 0.5} slimed={lick} />
      <g transform="translate(1610 1056)">
        <path d="M0,0 Q-6,-80 4,-150" stroke="#3e8a2a" strokeWidth={8} fill="none" />
        {Array.from({ length: 10 }).map((_, k) => (
          <ellipse key={k} cx={4 + Math.cos((k / 10) * Math.PI * 2) * 30} cy={-160 + Math.sin((k / 10) * Math.PI * 2) * 30} rx={18} ry={10} transform={`rotate(${(k / 10) * 360} ${4 + Math.cos((k / 10) * Math.PI * 2) * 30} ${-160 + Math.sin((k / 10) * Math.PI * 2) * 30})`} fill="#fff" stroke={INK} strokeWidth={3} />
        ))}
        <circle cx={4} cy={-160} r={18} fill="#f2b230" stroke={INK} strokeWidth={3} />
      </g>
      <GovBeast x={beastX} y={980} t={t} frame={frame} lunge={lunge} lick={lick} yank={yank} />
      <Frog
        id="wendellPark"
        x={FROG_X}
        y={FROG_Y}
        t={t}
        frame={frame}
        {...sp}
        pose="stand"
        lean={-8 - lunge * 14 - yank * 8}
        handF={[200, -250]}
        leashTo={leashTo}
        expr={lunge > 0.5 ? "shock" : "lecture"}
        look={[1, -0.1]}
        sweat={lunge}
        {...frog}
      />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* The war on drugs: a tank vs one tiny pill                           */
/* ------------------------------------------------------------------ */

export const WarOnDrugs: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const cam = camLerp({ x: 1040, y: 740, zoom: 1.32 }, { x: 1110, y: 760, zoom: 1.44 }, easeInOut(shot.p));
  const barrel = 300 + easeOut(clamp(local / 0.7)) * 220;
  const bang = local > 0.75;
  const f2 = onN(frame, 2);
  const shake = (rnd(`pill${f2}`) - 0.5) * 6;
  return (
    <Stage cam={cam} frame={frame} shakeAmp={bang && local < 0.95 ? 6 : 0} overlay={<LightWash id="drugSun" color="#fff2b8" cx={300} cy={100} r={1200} opacity={0.18} />}>
      <Sky id="drugSky" top="#6cc0f0" />
      <Sun x={260} y={150} t={t} r={60} />
      <path d="M-1200,700 Q0,600 960,680 Q1800,600 3200,700 L3200,2000 L-1200,2000 Z" fill="#9ad66a" stroke={INK} strokeWidth={5} />
      <rect x={-1200} y={820} width={4400} height={1300} fill="#86c85a" />
      {/* the tank */}
      <g transform="translate(560 900)">
        <rect x={-300} y={-60} width={600} height={90} rx={45} fill="#3a3e2a" stroke={INK} strokeWidth={6} />
        {[-240, -150, -60, 30, 120, 210].map((wx) => (
          <circle key={wx} cx={wx} cy={-15} r={30} fill="#5a5e44" stroke={INK} strokeWidth={5} />
        ))}
        <path d="M-280,-60 L280,-60 L240,-170 L-240,-170 Z" fill="#6a7a3e" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-140,-170 C-140,-280 140,-280 140,-170 Z" fill="#7a8a48" stroke={INK} strokeWidth={6} />
        <rect x={100} y={-236} width={barrel} height={34} rx={8} fill="#6a7a3e" stroke={INK} strokeWidth={6} />
        <rect x={100 + barrel - 30} y={-244} width={40} height={50} rx={6} fill="#5a6a34" stroke={INK} strokeWidth={5} />
        {/* the BANG flag */}
        {bang ? (
          <g transform={`translate(${100 + barrel + 10} -219)`}>
            <path d="M0,0 L40,-60" stroke={INK} strokeWidth={4} />
            <path d="M40,-60 L150,-70 L140,-20 L36,-12 Z" fill="#fbfaf2" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <text x={92} y={-30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill="#cc3329">
              BANG
            </text>
          </g>
        ) : null}
        {/* helmet + binoculars out of the hatch */}
        <path d="M-60,-276 C-60,-330 40,-330 40,-276 Z" fill="#4a5a2a" stroke={INK} strokeWidth={5} />
        <rect x={-30} y={-296} width={60} height={22} rx={8} fill="#1a1a1a" stroke={INK} strokeWidth={4} />
        <path d="M-66,-276 L46,-276" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        {/* stars stencilled on the side */}
        <path d="M-60,-130 l10,-26 l10,26 l-26,-16 l32,0 Z" fill="#f2ecd8" />
      </g>
      {/* the target: one tiny pill, waving a white flag */}
      <g transform={`translate(${1500 + shake} 900) scale(1.5)`}>
        <Shadow cx={0} cy={4} rx={50} o={0.3} />
        <g transform="rotate(-10)">
          <rect x={-26} y={-110} width={52} height={100} rx={26} fill="#f6f2e8" stroke={INK} strokeWidth={5} />
          <path d="M-26,-60 L26,-60 L26,-36 Q26,-10 0,-10 Q-26,-10 -26,-36 Z" fill="#cc3329" stroke={INK} strokeWidth={5} />
          <circle cx={-10} cy={-80} r={7} fill="#fff" stroke={INK} strokeWidth={2.5} />
          <circle cx={10} cy={-80} r={7} fill="#fff" stroke={INK} strokeWidth={2.5} />
          <circle cx={-10} cy={-79} r={3} fill={INK} />
          <circle cx={10} cy={-79} r={3} fill={INK} />
          <ellipse cx={0} cy={-66} rx={4} ry={5} fill="#3a0e0e" />
        </g>
        <path d="M24,-80 L60,-150" stroke={INK} strokeWidth={4} />
        <path d={`M60,-150 L${110 + Math.sin(t * 12) * 6},-140 L60,-120 Z`} fill="#fff" stroke={INK} strokeWidth={3} />
        <path d="M-20,-10 L-26,10 M20,-10 L26,10" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <path d="M60,-60 q-6,10 0,16 q6,-6 0,-16" fill="#bfe3f2" stroke={INK} strokeWidth={2} />
      </g>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Foreign military involvement: a giant boot meets a little globe     */
/* ------------------------------------------------------------------ */

export const ForeignBoot: React.FC = () => {
  const { shot } = useEpisode();
  const { frame, local } = shot;
  const cam = camLerp({ x: 960, y: 540, zoom: 1.0 }, { x: 960, y: 560, zoom: 1.08 }, easeInOut(shot.p));
  // the boot hovers into view, winds up, then stomps
  const hit = 0.42;
  const wind = 0.24;
  const bootY = local < wind ? lerp(-260, -120, easeOut(local / wind)) - Math.sin((local / wind) * Math.PI) * 40 : lerp(-120, 236, clamp((local - wind) / (hit - wind)) ** 2);
  const after = Math.max(0, local - hit);
  return (
    <Stage cam={cam} frame={frame} shakeAmp={after > 0 && after < 0.35 ? 12 * (1 - after / 0.35) : 0}>
      <rect x={-1200} y={-1400} width={4400} height={2600} fill="#2a3a5a" />
      {Array.from({ length: 60 }).map((_, i) => (
        <circle key={i} cx={rnd(`bst${i}`) * 2400 - 240} cy={rnd(`bsty${i}`) * 1100 - 100} r={1 + rnd(`bsr${i}`) * 2.5} fill="#e8e4d0" opacity={0.7} />
      ))}
      {/* the globe on its stand */}
      <g transform="translate(960 600)">
        <path d="M-280,330 L280,330 L200,380 L-200,380 Z" fill="#8a5a30" stroke={INK} strokeWidth={6} />
        <path d="M0,330 L0,280" stroke={INK} strokeWidth={16} />
        <path d="M-330,0 A330,330 0 0 1 330,0" stroke="#c8a24a" strokeWidth={14} fill="none" transform="rotate(20)" />
        <circle r={300} fill="#3a8ad8" stroke={INK} strokeWidth={7} />
        <path d={blob(-90, -60, 140, 110, 11, 0.3, "cont1")} fill="#5aa83a" stroke={INK} strokeWidth={5} />
        <path d={blob(140, 80, 100, 80, 10, 0.3, "cont2")} fill="#5aa83a" stroke={INK} strokeWidth={5} />
        <path d={blob(-60, 180, 80, 50, 9, 0.3, "cont3")} fill="#5aa83a" stroke={INK} strokeWidth={5} />
        {/* tiny houses on the top continent (the stomped ones fly off) */}
        {[
          [-150, -150],
          [-80, -170],
          [-10, -140],
          [-120, -60],
          [140, 40],
          [180, 100],
        ].map(([hx, hy], i) => {
          const flying = after > 0 && i < 3;
          const fx = flying ? hx + (i - 1) * after * 600 : hx;
          const fy = flying ? hy - after * 500 + after * after * 1400 : hy;
          return (
            <g key={i} transform={`translate(${fx} ${fy}) rotate(${flying ? after * 600 * (i - 1) : 0})`}>
              <rect x={-16} y={-18} width={32} height={22} fill="#f2e6c8" stroke={INK} strokeWidth={3} />
              <path d="M-20,-18 L0,-36 L20,-18 Z" fill="#cc3329" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            </g>
          );
        })}
        {/* tiny people fleeing, fists raised */}
        {after > 0
          ? [0, 1, 2, 3].map((i) => {
              const dir = i % 2 ? 1 : -1;
              const px = -60 + dir * (60 + after * 260) + i * 10;
              const py = -110 + Math.abs(Math.sin(after * 20 + i)) * -10;
              return (
                <g key={i} transform={`translate(${px} ${py})`}>
                  <circle cx={0} cy={-26} r={7} fill="#f2d8b0" stroke={INK} strokeWidth={2.5} />
                  <path d="M0,-18 L0,0 M0,0 l-6,10 M0,0 l6,10 M0,-14 l-10,-10 M0,-14 l10,-10" stroke={INK} strokeWidth={3} strokeLinecap="round" />
                </g>
              );
            })
          : null}
      </g>
      {/* the boot */}
      <g transform={`translate(860 ${bootY})`}>
        <path d="M-120,-800 L80,-800 L90,-170 C160,-160 300,-120 320,-40 L320,40 L-130,40 L-130,-170 Z" fill="#3a3a2a" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <rect x={-150} y={20} width={490} height={44} rx={10} fill="#1e1e16" stroke={INK} strokeWidth={6} />
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={i} d={`M-120,${-760 + i * 70} L80,${-760 + i * 70}`} stroke="#5a5a44" strokeWidth={5} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <path key={i} d={`M-40,${-700 + i * 80} l60,30 M20,${-700 + i * 80} l-60,30`} stroke="#c8b88a" strokeWidth={5} />
        ))}
        <path d="M-130,-400 L-130,-800" stroke="#6a8a3e" strokeWidth={60} />
      </g>
      {after > 0 && after < 0.6 ? (
        <g opacity={1 - after / 0.6}>
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <path key={i} d={`M${960 + Math.cos(a) * 260},${330 + Math.sin(a) * 60} l${Math.cos(a) * 80},${Math.sin(a) * 30}`} stroke="#f2ecd8" strokeWidth={8} strokeLinecap="round" />;
          })}
        </g>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* The foul binary system: a mascot mud pit; he rises above it          */
/* ------------------------------------------------------------------ */

export const BinaryPit: React.FC<{ from: Cam; to?: Cam; rise: number; grab: number }> = ({ from, to, rise, grab }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const sp = useSpeech();
  const cam = to ? camLerp(from, to, easeInOut(shot.p)) : from;
  const frogY = lerp(650, 440, rise);
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="pitBeam" color="#fff6c0" cx={960} cy={-200} r={900} opacity={0.3} />}>
      <Sky id="pitSky" top="#8ab8d8" bottom="#d8c8a0" />
      {/* golden beam from above */}
      <path d={`M760,-1400 L1160,-1400 L1260,${frogY + 200} L660,${frogY + 200} Z`} fill="#fff2a0" opacity={0.35} />
      {/* the pit */}
      <path d="M-1200,820 Q960,700 3200,820 L3200,2000 L-1200,2000 Z" fill="#7a6040" stroke={INK} strokeWidth={6} />
      <path d={blob(960, 930, 760, 120, 16, 0.08, "pit")} fill="#4a3220" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 7 }).map((_, i) => {
        const ph = (t * 0.8 + i / 7) % 1;
        return <circle key={i} cx={400 + i * 170} cy={930 + Math.sin(i) * 40} r={6 + ph * 18} fill="none" stroke="#7a5a3a" strokeWidth={4} opacity={1 - ph} />;
      })}
      <Tusker id="tuskPit" x={640} y={1000} t={t} frame={frame} open={0.4 + 0.3 * Math.abs(Math.sin(t * 3))} reach={grab} mud={0.8} look={[0.5, -0.8 * grab]} />
      <Brayer id="brayPit" x={1300} y={1000} flip t={t + 0.4} frame={frame} open={0.4 + 0.3 * Math.abs(Math.sin(t * 3 + 1))} reach={grab} mud={0.8} look={[0.5, -0.8 * grab]} />
      {/* mud splashes */}
      {Array.from({ length: 6 }).map((_, i) => {
        const ph = (t * 1.4 + i / 6) % 1;
        const sx = 960 + (i - 2.5) * 120;
        return <circle key={i} cx={sx + ph * (i - 2.5) * 40} cy={880 - Math.sin(ph * Math.PI) * 160} r={10} fill="#5a4128" stroke={INK} strokeWidth={3} opacity={1 - ph} />;
      })}
      <Frog id="wendellRise" x={960} y={frogY} t={t} frame={frame} {...sp} pose="float" expr="serene" halo={0.5 + rise * 0.5} look={[0, 1]} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Ascension: and know peace                                           */
/* ------------------------------------------------------------------ */

export const Heaven: React.FC<{ from: Cam; to?: Cam; frog?: Partial<FrogProps>; dove?: number }> = ({ from, to, frog = {}, dove = 0 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const sp = useSpeech();
  const cam = to ? camLerp(from, to, easeInOut(shot.p)) : from;
  const clouds = useMemo(() => Array.from({ length: 12 }).map((_, i) => [rnd(`hc${i}`) * 2600 - 340, 700 + rnd(`hcy${i}`) * 500, 140 + rnd(`hcs${i}`) * 140] as const), []);
  const bob = Math.sin(t * 1.6) * 14;
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="heavenGlow" color="#fff8d0" cx={960} cy={300} r={1000} opacity={0.45} />}>
      <Sky id="heavenSky" top="#ffe8a8" bottom="#bfe6ff" />
      {/* rotating rays */}
      <g transform={`translate(960 380) rotate(${t * 8})`}>
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={i} d="M0,0 L-90,-1600 L90,-1600 Z" fill="#fff6c8" opacity={0.35} transform={`rotate(${i * 22.5})`} />
        ))}
      </g>
      {clouds.map(([cx, cy, s], i) => (
        <path key={i} d={cloudPath(cx + Math.sin(t * 0.4 + i) * 20, cy, s, s * 0.4, 9, `hcl${i}`, 0.8)} fill="#fffaf0" stroke={INK} strokeWidth={5} />
      ))}
      {/* doves circling */}
      {Array.from({ length: 4 }).map((_, i) => {
        const a = t * 1.4 + (i / 4) * Math.PI * 2;
        const dx = 960 + Math.cos(a) * 360;
        const dy = 340 + Math.sin(a) * 110;
        const flap = Math.floor(t * 10 + i) % 2;
        return (
          <g key={i} transform={`translate(${dx} ${dy}) scale(${Math.cos(a) > 0 ? 1 : -1} 1)`}>
            <ellipse cx={0} cy={0} rx={30} ry={16} fill="#fff" stroke={INK} strokeWidth={4} />
            <circle cx={26} cy={-10} r={11} fill="#fff" stroke={INK} strokeWidth={4} />
            <path d="M36,-10 l12,4 l-12,3" fill="#f2b230" stroke={INK} strokeWidth={2} />
            <path d={flap ? "M-6,-6 Q-20,-50 10,-46 Q4,-20 6,-6" : "M-6,-6 Q-30,10 6,14"} fill="#fff" stroke={INK} strokeWidth={4} />
            <circle cx={29} cy={-12} r={2.5} fill={INK} />
          </g>
        );
      })}
      <Frog id="wendellHeaven" x={960} y={760 + bob} t={t} frame={frame} {...sp} pose="float" expr="serene" halo={1} look={[0, -1]} {...frog} />
      {/* a dove settles on his head */}
      {dove > 0 ? (
        <g transform={`translate(${lerp(1300, 990, easeOut(dove))} ${lerp(200, 760 + bob - 470, easeOut(dove))})`}>
          <ellipse cx={0} cy={0} rx={30} ry={16} fill="#fff" stroke={INK} strokeWidth={4} />
          <circle cx={-26} cy={-10} r={11} fill="#fff" stroke={INK} strokeWidth={4} />
          <path d="M-36,-10 l-12,4 l12,3" fill="#f2b230" stroke={INK} strokeWidth={2} />
          <circle cx={-29} cy={-12} r={2.5} fill={INK} />
          <path d={dove < 1 ? "M6,-6 Q20,-50 -10,-46 Q-4,-20 -6,-6" : "M6,-4 Q24,4 -6,10"} fill="#fff" stroke={INK} strokeWidth={4} />
        </g>
      ) : null}
    </Stage>
  );
};
