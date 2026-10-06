import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { Flies, INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, LightWash, Stage, camLerp } from "../../engine/Stage";
import { energyAt, isTalking, mouthAt } from "../../engine/timeline";
import { Pt, blob, easeInOut, onN, rnd } from "../../engine/util";
import { Gerald, GeraldProps, GERALD_HEAD } from "./cast/Gerald";
import { Lyle, LyleProps, LYLE_HEAD } from "./cast/Lyle";
import { Mo, MoProps, MO_HEAD } from "./cast/Mo";
import { Vern, VernProps, VERN_HEAD } from "./cast/Vern";
import { Carafe, DECAF_ORANGE, FONT, HAND, MUSTARD, MUSTARD_DK, PURPLE, PURPLE_DK, PaperCup, SkullBean } from "./props";

/* EPISODE 005 set: DREGS, a grimy late-night coffee bar, two minutes to close. One world, many cameras. */

export const LYLE_POS = { x: 690, y: 850 };
export const VERN_POS = { x: 1110, y: 905 };
export const MO_POS = { x: 1740, y: 1012 };
export const GERALD_POS = { x: -40, y: 1000 };
/** the decaf pot on its warmer (base centre) */
export const DECAF_POT: Pt = [1336, 612];
export const REG_POT: Pt = [1436, 612];

/** world head positions (cameras + 9:16 speaker follow). Vern and Mo are flipped (face left). */
export const HEADS = {
  lyle: { x: LYLE_POS.x + LYLE_HEAD[0], y: LYLE_POS.y + LYLE_HEAD[1] },
  vern: { x: VERN_POS.x - VERN_HEAD[0], y: VERN_POS.y + VERN_HEAD[1] },
  mo: { x: MO_POS.x - MO_HEAD[0], y: MO_POS.y + MO_HEAD[1] },
  gerald: { x: GERALD_POS.x + GERALD_HEAD.sit[0], y: GERALD_POS.y + GERALD_HEAD.sit[1] },
};

export const CAM5 = {
  wide: { x: 820, y: 520, zoom: 0.84 },
  wideIn: { x: 860, y: 540, zoom: 0.98 },
  two: { x: 890, y: 520, zoom: 1.45 },
  twoTight: { x: 885, y: 500, zoom: 1.8 },
  cuLyle: { x: HEADS.lyle.x + 40, y: HEADS.lyle.y + 30, zoom: 2.5 },
  ecuLyle: { x: HEADS.lyle.x + 44, y: HEADS.lyle.y + 4, zoom: 4.0 },
  msLyle: { x: HEADS.lyle.x + 50, y: HEADS.lyle.y + 90, zoom: 1.8 },
  cuVern: { x: HEADS.vern.x - 50, y: HEADS.vern.y + 40, zoom: 2.4 },
  ecuVern: { x: HEADS.vern.x - 66, y: HEADS.vern.y + 14, zoom: 4.0 },
  msVern: { x: HEADS.vern.x - 30, y: HEADS.vern.y + 120, zoom: 1.6 },
  cuMo: { x: HEADS.mo.x - 34, y: HEADS.mo.y + 40, zoom: 2.4 },
  msMo: { x: HEADS.mo.x - 40, y: HEADS.mo.y + 150, zoom: 1.45 },
  cuGerald: { x: HEADS.gerald.x + 46, y: HEADS.gerald.y + 40, zoom: 2.4 },
  msGerald: { x: HEADS.gerald.x + 90, y: HEADS.gerald.y + 170, zoom: 1.45 },
  station: { x: 1400, y: 480, zoom: 2.1 },
  decafPot: { x: 1350, y: 540, zoom: 4.0 },
  clock: { x: 1440, y: 186, zoom: 4.2 },
  menu: { x: 890, y: 205, zoom: 2.4 },
} satisfies Record<string, Cam>;

export function useSpeech(name: string) {
  const { timeline, shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return { mouth: mouthAt(timeline, name, tq), talking: isTalking(timeline, name, shot.t), energy: energyAt(timeline, shot.t) };
}

/* ------------------------------------------------------------------ */
/* Set pieces                                                          */
/* ------------------------------------------------------------------ */

const WALL = "#b9a774";
const WALL_DK = "#8e7c50";
const WOOD = "#4b3036";
const WOOD_DK = "#33202a";

const Wall: React.FC = () => {
  const stains = useMemo(
    () =>
      [
        [140, 440, 120, 60],
        [1520, 120, 140, 80],
        [980, 420, 90, 40],
        [2040, 380, 110, 140],
        [-300, 60, 90, 120],
      ].map(([x, y, rx, ry], i) => <path key={i} d={blob(x, y, rx, ry, 11, 0.3, `wst${i}`)} fill="#6a5a2a" opacity={0.2} />),
    [],
  );
  return (
    <g>
      <defs>
        <linearGradient id="wallGrime5" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor="#3a2a1a" stopOpacity={0} />
          <stop offset="1" stopColor="#3a2a1a" stopOpacity={0.45} />
        </linearGradient>
      </defs>
      <rect x={-900} y={-500} width={3900} height={1300} fill={WALL} />
      {/* faded vertical wallpaper stripes */}
      {Array.from({ length: 40 }).map((_, i) => (
        <rect key={i} x={-900 + i * 100} y={60} width={34} height={700} fill={WALL_DK} opacity={0.22} />
      ))}
      <rect x={-900} y={-500} width={3900} height={1300} fill="url(#wallGrime5)" />
      {stains}
      {/* purple trim rail + wainscot */}
      <rect x={-900} y={520} width={3900} height={240} fill={WOOD} />
      {Array.from({ length: 30 }).map((_, i) => (
        <rect key={i} x={-880 + i * 130} y={545} width={100} height={190} rx={6} fill="none" stroke={WOOD_DK} strokeWidth={5} />
      ))}
      <rect x={-900} y={506} width={3900} height={20} fill={PURPLE} stroke={INK} strokeWidth={4} />
      {/* ceiling */}
      <rect x={-900} y={-500} width={3900} height={560} fill="#2a2024" />
      {Array.from({ length: 26 }).map((_, i) => (
        <path key={i} d={`M${-900 + i * 150},-500 L${-900 + i * 150},60`} stroke="#1c1418" strokeWidth={4} />
      ))}
      <rect x={-900} y={52} width={3900} height={14} fill={MUSTARD_DK} stroke={INK} strokeWidth={3} />
    </g>
  );
};

const Pendant: React.FC<{ x: number; on: number }> = ({ x, on }) => (
  <g>
    <path d={`M${x},60 L${x},130`} stroke={INK} strokeWidth={4} />
    <path d={`M${x - 56},186 L${x + 56},186 L${x + 26},128 L${x - 26},128 Z`} fill={PURPLE_DK} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <ellipse cx={x} cy={188} rx={30} ry={10} fill={on > 0.5 ? "#fff1c0" : "#6a6050"} stroke={INK} strokeWidth={3} />
    {on > 0.5 ? <path d={`M${x - 50},190 L${x + 50},190 L${x + 230},760 L${x - 230},760 Z`} fill="#ffe7a8" opacity={0.09} /> : null}
  </g>
);

/** Shop window with the night outside and the neon sign (seen from inside, so the text is mirrored). */
const ShopWindow: React.FC<{ t: number; closed: boolean; flick: number }> = ({ t, closed, flick }) => {
  const drops = useMemo(() => Array.from({ length: 22 }).map((_, i) => [-460 + rnd(`rd${i}`) * 400, rnd(`rdy${i}`) * 600] as const), []);
  return (
    <g>
      <rect x={-500} y={130} width={470} height={640} fill="#11162a" stroke={INK} strokeWidth={10} />
      {/* the street: lamp glow, a parked car, the dark */}
      <circle cx={-170} cy={260} r={150} fill="#e8c27a" opacity={0.12} />
      <path d="M-180,200 L-180,770" stroke="#2a2e40" strokeWidth={10} />
      <path d="M-200,200 L-150,200 L-160,180 L-190,180 Z" fill="#2a2e40" />
      <circle cx={-175} cy={206} r={10} fill="#ffe2a0" opacity={0.9} />
      <path d="M-500,640 L-30,640 L-30,770 L-500,770 Z" fill="#1a1d2c" />
      <path d="M-470,690 C-460,640 -330,630 -300,660 L-250,664 L-246,700 L-470,700 Z" fill="#232838" />
      {drops.map(([dx, dy], i) => {
        const yy = 140 + ((dy + t * 160 + i * 23) % 620);
        return <path key={i} d={`M${dx},${yy} l-3,18`} stroke="#8aa0c8" strokeWidth={2} opacity={0.5} />;
      })}
      <path d="M-500,450 L-30,450" stroke={INK} strokeWidth={8} />
      <path d="M-265,130 L-265,770" stroke={INK} strokeWidth={8} />
      {/* neon, mirrored (we're inside) */}
      <g transform="translate(-265 330)">
        <rect x={-140} y={-56} width={280} height={112} rx={20} fill="#1b1520" stroke="#3a3040" strokeWidth={5} opacity={0.85} />
        <g transform="scale(-1 1)" opacity={0.35 + 0.65 * flick}>
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={closed ? 52 : 64} fill="none" stroke={closed ? "#ff4a3a" : "#ff5fa0"} strokeWidth={closed ? 9 : 12} opacity={0.3}>
            {closed ? "CLOSED" : "OPEN"}
          </text>
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={closed ? 52 : 64} fill="none" stroke={closed ? "#ff7a6a" : "#ff9ac4"} strokeWidth={3.5}>
            {closed ? "CLOSED" : "OPEN"}
          </text>
        </g>
      </g>
      <circle cx={-265} cy={330} r={170} fill={closed ? "#ff4a3a" : "#ff5fa0"} opacity={0.08 * flick} />
      {/* a hand-written hours sign taped to the glass */}
      <g transform="translate(-130 520) rotate(4)">
        <rect x={-62} y={-44} width={124} height={88} fill="#efe7d0" stroke={INK} strokeWidth={3} />
        <text x={0} y={-16} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={16} fill={INK}>
          HOURS
        </text>
        <text x={0} y={6} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={14} fill={INK}>
          6AM - 10PM
        </text>
        <text x={0} y={30} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={13} fill="#a3262a">
          10 MEANS 9:30
        </text>
      </g>
    </g>
  );
};

const MenuBoard: React.FC = () => (
  <g transform="translate(560 88)">
    <rect x={-14} y={-14} width={688} height={268} rx={10} fill={WOOD_DK} stroke={INK} strokeWidth={7} />
    <rect x={0} y={0} width={660} height={240} rx={4} fill="#1f2a24" />
    <path d={blob(470, 170, 120, 40, 10, 0.3, "chalkdust")} fill="#e8e4d8" opacity={0.06} />
    <SkullBean x={58} y={52} s={62} />
    <text x={150} y={72} fontFamily={FONT} fontWeight={900} fontSize={56} fill={MUSTARD} letterSpacing={6}>
      DREGS
    </text>
    <text x={150} y={98} fontFamily={HAND} fontWeight={700} fontSize={20} fill="#d8d4c4">
      coffee til the bitter end
    </text>
    {[
      ["DRIP", "3"],
      ["RED EYE", "5"],
      ["DECAF", "why?"],
      ["BURNT", "PREMIUM"],
    ].map(([a, b], i) => (
      <g key={i} transform={`translate(${i < 2 ? 40 : 360} ${150 + (i % 2) * 44})`}>
        <text x={0} y={0} fontFamily={HAND} fontWeight={700} fontSize={30} fill="#efeadb">
          {a}
        </text>
        <path d="M120,-6 L200,-6" stroke="#efeadb" strokeWidth={3} strokeDasharray="3 7" opacity={0.7} />
        <text x={270} y={0} textAnchor="end" fontFamily={HAND} fontWeight={700} fontSize={30} fill={b === "why?" ? DECAF_ORANGE : "#efeadb"}>
          {b}
        </text>
      </g>
    ))}
    <text x={330} y={228} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={18} fill="#c8c4b4" opacity={0.85}>
      no refunds. no regrets. we close at 10.
    </text>
  </g>
);

/** Closing-time clock: `min` = minutes past 9 PM (58 = two minutes to close). */
const Clock: React.FC<{ min: number }> = ({ min }) => {
  const mA = (min / 60) * 360;
  const hA = ((9 + min / 60) / 12) * 360;
  return (
    <g transform="translate(1440 186)">
      <circle r={58} fill="#efe7d4" stroke={INK} strokeWidth={7} />
      <circle r={50} fill="none" stroke={PURPLE} strokeWidth={4} />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d="M0,-44 L0,-36" stroke={INK} strokeWidth={i % 3 === 0 ? 5 : 3} transform={`rotate(${i * 30})`} />
      ))}
      <SkullBean x={0} y={22} s={20} rot={0} />
      <path d="M0,0 L0,-24" stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${hA})`} />
      <path d="M0,0 L0,-40" stroke={INK} strokeWidth={4.5} strokeLinecap="round" transform={`rotate(${mA})`} />
      <circle r={6} fill={DECAF_ORANGE} stroke={INK} strokeWidth={2} />
      {/* a crack across the glass */}
      <path d="M-30,-40 l12,18 l-6,10 l14,16" stroke="#9a9488" strokeWidth={2} fill="none" />
    </g>
  );
};

/** The shelf above the station: a pot burnt to tar, proudly labelled PREMIUM. */
const PremiumShelf: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={1240} y={352} width={270} height={16} fill={WOOD} stroke={INK} strokeWidth={5} />
    <path d="M1260,368 l0,20 M1490,368 l0,20" stroke={INK} strokeWidth={6} />
    <g transform="translate(1300 352) scale(0.62)">
      <Carafe kind="regular" fill={0.32} burnt t={t} />
    </g>
    {[0, 1, 2].map((i) => {
      const ph = (t * 0.4 + i * 0.33) % 1;
      return <path key={i} d={`M${1290 + i * 10 + noise2D(`bs${i}`, t * 0.3, 0) * 8},${262 - ph * 90} q-12,-14 0,-28 q12,-14 0,-28`} stroke="#4a4440" strokeWidth={9} fill="none" opacity={0.55 * (1 - ph)} strokeLinecap="round" />;
    })}
    <g transform="translate(1300 312) rotate(-6)">
      <rect x={-48} y={-14} width={96} height={28} fill="#f4ecd4" stroke={INK} strokeWidth={3} />
      <text x={0} y={7} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={16} fill={PURPLE_DK}>
        PREMIUM
      </text>
    </g>
    {/* bags of beans */}
    {[0, 1].map((i) => (
      <g key={i} transform={`translate(${1400 + i * 62} 352)`}>
        <path d="M-26,0 L-24,-74 L24,-74 L26,0 Z" fill={i ? "#6a4a32" : "#5a3a28"} stroke={INK} strokeWidth={4} />
        <path d="M-24,-74 L-18,-84 L18,-84 L24,-74" fill="none" stroke={INK} strokeWidth={3} />
        <SkullBean x={0} y={-40} s={22} rot={0} color="#d8c89a" />
        <text x={0} y={-12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={9} fill="#e8dcc0">
          {i ? "IT'S FINE" : "DARK"}
        </text>
      </g>
    ))}
  </g>
);

const MascotPoster: React.FC = () => (
  <g transform="translate(70 150) rotate(-4)">
    <rect width={170} height={230} fill="#efe1b8" stroke={INK} strokeWidth={5} />
    <rect x={10} y={10} width={150} height={150} fill={PURPLE} />
    <SkullBean x={85} y={86} s={110} rot={-8} />
    {/* tiny arms holding a cup up */}
    <path d="M126,90 l18,-26" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <g transform="translate(148 66) scale(0.32)">
      <PaperCup lid="redeye" />
    </g>
    <text x={85} y={186} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill={PURPLE_DK}>
      SLEEP IS FOR
    </text>
    <text x={85} y={208} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={18} fill="#a3262a">
      QUITTERS
    </text>
    <path d="M150,6 l14,18" stroke="#c9b98a" strokeWidth={6} />
  </g>
);

const RestroomCorner: React.FC = () => (
  <g>
    {/* restroom door */}
    <rect x={1640} y={250} width={200} height={512} fill="#6a5468" stroke={INK} strokeWidth={7} />
    <rect x={1662} y={272} width={156} height={200} rx={6} fill="none" stroke="#4e3c4c" strokeWidth={5} />
    <circle cx={1812} cy={520} r={10} fill="#c9b07a" stroke={INK} strokeWidth={3} />
    <rect x={1690} y={300} width={100} height={44} rx={6} fill="#e8e0cc" stroke={INK} strokeWidth={3} />
    <text x={1740} y={329} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={17} fill={INK}>
      RESTROOM
    </text>
    <g transform="translate(1740 400) rotate(-5)">
      <rect x={-64} y={-34} width={128} height={68} fill="#fff6a6" stroke={INK} strokeWidth={3} />
      <text x={0} y={-8} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={18} fill="#a3262a">
        OUT OF ORDER
      </text>
      <text x={0} y={20} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={20} fill={INK}>
        DON'T.
      </text>
    </g>
    {/* employee of the month */}
    <g transform="translate(1900 230) rotate(2)">
      <rect width={210} height={250} fill={WOOD} stroke={INK} strokeWidth={6} />
      <rect x={12} y={12} width={186} height={226} fill="#efe6cc" />
      <text x={105} y={40} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={14} fill={PURPLE_DK}>
        EMPLOYEE OF
      </text>
      <text x={105} y={58} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={14} fill={PURPLE_DK}>
        THE MONTH
      </text>
      <rect x={45} y={70} width={120} height={110} fill="#9a8a70" stroke={INK} strokeWidth={3} />
      {/* Mo, asleep standing up, in the photo */}
      <path d={blob(105, 150, 40, 34, 10, 0.12, "eotmBody")} fill="#86795f" stroke={INK} strokeWidth={3} />
      <circle cx={105} cy={110} r={24} fill="#86795f" stroke={INK} strokeWidth={3} />
      <ellipse cx={109} cy={113} rx={17} ry={13} fill="#d8ccae" />
      <path d="M98,110 q4,3 8,0 M112,110 q4,3 8,0" stroke={INK} strokeWidth={2.5} fill="none" />
      <text x={140} y={92} fontFamily={HAND} fontWeight={700} fontSize={16} fill="#2a2a5a">
        z
      </text>
      <text x={150} y={80} fontFamily={HAND} fontWeight={700} fontSize={20} fill="#2a2a5a">
        Z
      </text>
      <text x={105} y={204} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={18} fill={INK}>
        MO
      </text>
      <text x={105} y={226} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={13} fill="#5a5a5a">
        (nobody else applied)
      </text>
    </g>
  </g>
);

const Floor: React.FC = () => {
  const tiles = useMemo(() => {
    const out: React.ReactNode[] = [];
    const vx = 900;
    const vy = 120;
    const rows: number[] = [];
    let yy = 760;
    let h = 28;
    while (yy < 1700) {
      rows.push(yy);
      yy += h;
      h *= 1.18;
    }
    for (let r = 0; r < rows.length - 1; r++) {
      const y0 = rows[r];
      const y1 = rows[r + 1];
      for (let c = -18; c < 30; c++) {
        if ((r + c) % 2 !== 0) continue;
        const xa = (x: number, y: number) => vx + (x - vx) * ((y - vy) / (760 - vy));
        const x0 = -600 + c * 110;
        const x1 = x0 + 110;
        out.push(<path key={`${r}-${c}`} d={`M${xa(x0, y0)},${y0} L${xa(x1, y0)},${y0} L${xa(x1, y1)},${y1} L${xa(x0, y1)},${y1} Z`} fill="#4a3848" opacity={0.85} />);
      }
    }
    return out;
  }, []);
  return (
    <g>
      <rect x={-900} y={756} width={3900} height={1000} fill="#a8986e" />
      {tiles}
      <path d={blob(560, 1060, 180, 30, 10, 0.3, "spill1")} fill="#3a2414" opacity={0.35} />
      <path d={blob(1260, 1140, 140, 24, 10, 0.3, "spill2")} fill="#3a2414" opacity={0.3} />
      <rect x={-900} y={752} width={3900} height={10} fill={WOOD_DK} />
    </g>
  );
};

/** The station: the brewer with its two warmers, cleaned to a shine. */
const Station: React.FC<{ t: number; sparkle: number; decafFill: number; decafGone?: boolean; regFill: number }> = ({ t, sparkle, decafFill, decafGone = false, regFill }) => (
  <g>
    {/* brewer body */}
    <rect x={1276} y={410} width={226} height={70} rx={8} fill="#2c2a2e" stroke={INK} strokeWidth={6} />
    <rect x={1466} y={410} width={36} height={210} rx={6} fill="#2c2a2e" stroke={INK} strokeWidth={6} />
    <rect x={1296} y={480} width={180} height={22} fill="#3e3c42" stroke={INK} strokeWidth={4} />
    <rect x={1290} y={430} width={60} height={22} rx={4} fill="#1a1a1c" />
    <circle cx={1370} cy={441} r={7} fill={sparkle > 0.5 ? "#7aff8a" : "#c0392b"} stroke={INK} strokeWidth={2} />
    <text x={1430} y={448} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill="#8a8a92">
      BREW-O
    </text>
    {/* warmer plates + labels */}
    {[DECAF_POT, REG_POT].map(([px], i) => (
      <g key={i}>
        <rect x={px - 50} y={612} width={100} height={12} rx={4} fill="#1e1c20" stroke={INK} strokeWidth={4} />
        <rect x={px - 30} y={483} width={60} height={20} rx={4} fill={i ? "#1e1b1d" : DECAF_ORANGE} stroke={INK} strokeWidth={3} />
        <text x={px} y={498} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={13} fill="#f2ead6">
          {i ? "REG" : "DECAF"}
        </text>
      </g>
    ))}
    {!decafGone ? (
      <g transform={`translate(${DECAF_POT[0]} ${DECAF_POT[1]}) scale(0.62)`}>
        <Carafe kind="decaf" fill={decafFill} cobweb t={t} />
      </g>
    ) : null}
    <g transform={`translate(${REG_POT[0]} ${REG_POT[1]}) scale(0.62)`}>
      <Carafe kind="regular" fill={regFill} t={t} steam={regFill > 0.3} />
    </g>
    {/* JUST CLEANED */}
    <g transform="translate(1556 584) rotate(5)">
      <path d="M-46,30 L-36,-30 L36,-30 L46,30 Z" fill="#f2ecd8" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <text x={0} y={-8} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={14} fill="#2a6a3a">
        JUST CLEANED
      </text>
      <text x={0} y={10} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={12} fill="#a3262a">
        DO NOT TOUCH
      </text>
      <text x={0} y={25} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={11} fill={INK}>
        - LYLE
      </text>
    </g>
    {sparkle > 0
      ? [
          [1302, 470],
          [1492, 430],
          [1470, 556],
          [1380, 506],
          [1600, 540],
        ].map(([sx, sy], i) => {
          const tw = 0.5 + 0.5 * Math.sin(t * 6 + i * 1.7);
          const r = (10 + i * 2) * tw * sparkle;
          return <path key={i} d={`M${sx},${sy - r} L${sx + r * 0.25},${sy - r * 0.25} L${sx + r},${sy} L${sx + r * 0.25},${sy + r * 0.25} L${sx},${sy + r} L${sx - r * 0.25},${sy + r * 0.25} L${sx - r},${sy} L${sx - r * 0.25},${sy - r * 0.25} Z`} fill="#fffbe0" stroke={INK} strokeWidth={1.5} opacity={0.9} />;
        })
      : null}
  </g>
);

const BackCounter: React.FC<{ t: number; sparkle: number; decafFill: number; decafGone?: boolean; regFill: number }> = ({ t, sparkle, decafFill, decafGone, regFill }) => {
  return (
    <g>
      {/* cabinet + counter top */}
      <rect x={300} y={624} width={1330} height={140} fill={WOOD} stroke={INK} strokeWidth={6} />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={318 + i * 158} y={640} width={140} height={110} rx={5} fill="none" stroke={WOOD_DK} strokeWidth={5} />
      ))}
      <rect x={290} y={610} width={1350} height={20} rx={4} fill="#8c8478" stroke={INK} strokeWidth={5} />
      {/* espresso machine */}
      <g>
        <path d="M360,612 L360,470 Q360,430 400,430 L540,430 Q580,430 580,470 L580,612 Z" fill="#a7adb2" stroke={INK} strokeWidth={6} />
        <path d="M372,470 L568,470" stroke="#7d8388" strokeWidth={4} />
        <circle cx={420} cy={452} r={14} fill="#f2efe6" stroke={INK} strokeWidth={3} />
        <path d="M420,452 l8,-6" stroke="#c0392b" strokeWidth={3} />
        <circle cx={520} cy={452} r={14} fill="#f2efe6" stroke={INK} strokeWidth={3} />
        <path d="M520,452 l-2,-10" stroke="#c0392b" strokeWidth={3} />
        {[420, 520].map((gx, i) => (
          <g key={i}>
            <rect x={gx - 26} y={500} width={52} height={20} rx={4} fill="#5a5e62" stroke={INK} strokeWidth={4} />
            <path d={`M${gx - 20},${520} L${gx + 20},${520} L${gx + 14},${536} L${gx - 14},${536} Z`} fill="#3a3c40" stroke={INK} strokeWidth={3} />
            <path d={`M${gx + 20},${528} L${gx + 70},${524}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
          </g>
        ))}
        <path d="M566,500 C590,520 586,560 570,580" stroke={INK} strokeWidth={7} fill="none" />
        {/* drip */}
        <circle cx={570} cy={590 + ((t * 40) % 20)} r={3} fill="#6a4a2a" />
        <rect x={372} y={580} width={196} height={18} rx={4} fill="#3a3632" stroke={INK} strokeWidth={3} />
        <path d={blob(470, 586, 60, 6, 8, 0.3, "gunk")} fill="#4a2a14" opacity={0.8} />
        {/* dents + sticker */}
        <path d="M480,560 q8,6 2,14 M380,540 q10,2 6,10" stroke="#7d8388" strokeWidth={3} fill="none" />
        <g transform="translate(470 560) rotate(-8)">
          <rect x={-40} y={-11} width={80} height={22} fill="#f2d24a" stroke={INK} strokeWidth={2.5} />
          <text x={0} y={5} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={11} fill={INK}>
            DO NOT KICK
          </text>
        </g>
      </g>
      {/* grinder */}
      <g>
        <path d="M612,612 L612,520 L660,520 L660,612 Z" fill="#3a3632" stroke={INK} strokeWidth={5} />
        <path d="M604,520 L668,520 L656,446 L616,446 Z" fill="#cfd8d6" fillOpacity={0.5} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M612,500 L660,500 L656,470 L616,470 Z" fill="#3b2116" opacity={0.85} />
      </g>
      {/* cup tower + lids + syrups between the two of them */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${860 + i * 40} 612)`}>
          <rect x={-16} y={-40 - i * 14} width={32} height={40 + i * 14} rx={4} fill={["#7a2a3a", "#c99a2e", "#3a5a8a", "#5a3a6e"][i]} stroke={INK} strokeWidth={3} />
          <rect x={-8} y={-54 - i * 14} width={16} height={16} fill="#2a2628" stroke={INK} strokeWidth={2} />
        </g>
      ))}
      <g transform="translate(1050 612)">
        {Array.from({ length: 6 }).map((_, i) => (
          <path key={i} d={`M-26,${-i * 18} L26,${-i * 18} L22,${-18 - i * 18} L-22,${-18 - i * 18} Z`} fill="#f1ece0" stroke={INK} strokeWidth={3} />
        ))}
      </g>
      <Station t={t} sparkle={sparkle} decafFill={decafFill} decafGone={decafGone} regFill={regFill} />
      <Flies cx={1300} cy={250} count={2} t={t} r={50} seed="burntfly" size={0.9} />
    </g>
  );
};

/** Front counter (between the staff and the customers). */
const FrontCounter: React.FC<{ t: number; closedCard: boolean }> = ({ t, closedCard }) => (
  <g>
    <rect x={300} y={744} width={1160} height={164} fill={PURPLE_DK} stroke={INK} strokeWidth={7} />
    {Array.from({ length: 9 }).map((_, i) => (
      <rect key={i} x={318 + i * 126} y={766} width={108} height={120} rx={6} fill={PURPLE} stroke={INK} strokeWidth={4} />
    ))}
    <rect x={300} y={830} width={1160} height={12} fill={MUSTARD} stroke={INK} strokeWidth={3} />
    <SkullBean x={880} y={800} s={50} rot={-6} />
    <rect x={292} y={728} width={1176} height={22} rx={5} fill="#6e5a48" stroke={INK} strokeWidth={6} />
    <rect x={300} y={904} width={1160} height={14} fill={WOOD_DK} />
    {/* kick scuffs */}
    <path d="M520,890 l30,-6 M700,894 l24,-4 M1210,892 l30,-8" stroke="#2a1a2a" strokeWidth={5} strokeLinecap="round" />
    {/* pastry case */}
    <g>
      <rect x={312} y={600} width={230} height={130} fill="#cfdde0" fillOpacity={0.35} stroke={INK} strokeWidth={6} />
      <path d="M312,664 L542,664" stroke={INK} strokeWidth={4} />
      {/* a croissant with a fly, a muffin with a bite out of it, a donut with company */}
      <path d="M340,658 C352,630 396,626 410,656 Z" fill="#c9923a" stroke={INK} strokeWidth={3.5} />
      <path d="M352,654 l8,-14 M372,652 l4,-18 M392,654 l-2,-14" stroke="#9a6a24" strokeWidth={2.5} />
      <Flies cx={378} cy={622} count={1} t={t} r={20} seed="croissantfly" size={0.8} />
      <path d="M440,662 L448,640 L486,640 L494,662 Z" fill="#7a4a2a" stroke={INK} strokeWidth={3.5} />
      <path d="M444,640 C442,616 494,614 492,640 L480,636 Q476,628 468,634 Z" fill="#5a3418" stroke={INK} strokeWidth={3.5} />
      <ellipse cx={380} cy={712} rx={30} ry={12} fill="#e0a85a" stroke={INK} strokeWidth={3.5} />
      <ellipse cx={380} cy={709} rx={10} ry={4} fill="#3a2a20" />
      <path d="M396,702 l10,-4 l6,4 M404,700 l2,-6" stroke={INK} strokeWidth={2.5} fill="none" />
      <ellipse cx={402} cy={703} rx={6} ry={3.5} fill="#3a1e10" />
      <g transform="translate(476 700) rotate(-4)">
        <rect x={-40} y={-14} width={80} height={28} fill="#f2ead6" stroke={INK} strokeWidth={2.5} />
        <text x={0} y={6} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={14} fill={INK}>
          DAY-OLD(ISH)
        </text>
      </g>
    </g>
    {/* register */}
    <g>
      <path d="M1060,730 L1070,650 L1200,650 L1210,730 Z" fill="#c9bfa4" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={1086} y={616} width={98} height={40} rx={4} fill="#2a3a2a" stroke={INK} strokeWidth={4} />
      <text x={1135} y={644} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={20} fill="#9fe08a">
        {closedCard ? "CLOSED" : "$3.00"}
      </text>
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={1082 + (i % 4) * 28} y={668 + Math.floor(i / 4) * 22} width={20} height={14} rx={3} fill="#efe8d8" stroke={INK} strokeWidth={2} />
      ))}
    </g>
    {/* tip jar */}
    <g transform="translate(1410 730)">
      <path d="M-30,0 L-34,-70 L34,-70 L30,0 Z" fill="#cfdde0" fillOpacity={0.45} stroke={INK} strokeWidth={4} />
      <rect x={-36} y={-80} width={72} height={12} rx={4} fill="#8a8478" stroke={INK} strokeWidth={3} />
      <rect x={-26} y={-52} width={52} height={22} fill="#f2ead6" stroke={INK} strokeWidth={2.5} />
      <text x={0} y={-36} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={15} fill={INK}>
        TIPS?
      </text>
      <circle cx={-8} cy={-10} r={6} fill="#c9a24a" stroke={INK} strokeWidth={2} />
      <ellipse cx={12} cy={-8} rx={6} ry={3.5} fill="#1a1414" />
      <path d="M8,-10 l-4,-4 M16,-10 l4,-4" stroke="#1a1414" strokeWidth={1.5} />
    </g>
    {/* bell */}
    <g transform="translate(1130 730)">
      <path d="M-22,0 L22,0 L18,-6 L-18,-6 Z" fill="#3a3632" stroke={INK} strokeWidth={3} />
      <path d="M-18,-6 C-18,-34 18,-34 18,-6 Z" fill="#d9b44a" stroke={INK} strokeWidth={3} />
      <circle cx={0} cy={-34} r={4} fill="#d9b44a" stroke={INK} strokeWidth={2} />
    </g>
  </g>
);

/** Gerald's chair (behind him) and table (in front of his knees). */
const CafeChair: React.FC = () => (
  <g>
    <path d="M-120,1004 L-110,820 M-30,1004 L-36,840" stroke="#2a2024" strokeWidth={12} strokeLinecap="round" />
    <path d="M-130,846 L-20,846" stroke="#2a2024" strokeWidth={16} strokeLinecap="round" />
    <path d="M-128,846 L-140,640" stroke="#2a2024" strokeWidth={12} strokeLinecap="round" />
    <path d="M-150,650 Q-140,630 -126,650 L-124,760" stroke="#2a2024" strokeWidth={10} fill="none" />
  </g>
);

const CafeTable: React.FC<{ cup: boolean; t: number }> = ({ cup, t }) => (
  <g>
    <path d="M200,826 L200,990" stroke="#2a2024" strokeWidth={14} />
    <ellipse cx={200} cy={996} rx={60} ry={10} fill="#2a2024" />
    <ellipse cx={200} cy={812} rx={120} ry={18} fill="#6e5a48" stroke={INK} strokeWidth={6} />
    <path d={blob(250, 808, 22, 5, 7, 0.3, "tablering")} fill="none" stroke="#4a3424" strokeWidth={3} />
    {cup ? (
      <g transform="translate(244 812)">
        <PaperCup lid="decaf" name="GERALD" steam t={t} scale={0.5} />
      </g>
    ) : null}
    <path d="M136,806 l14,-14 l10,10 l-6,6 Z" fill="#efe8d8" stroke={INK} strokeWidth={2} />
  </g>
);

const WetFloorSign: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-50,0 L-20,-170 L20,-170 L50,0" fill="#f2c92a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-36,-40 L36,-40" stroke={INK} strokeWidth={4} />
    <text x={0} y={-140} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={17} fill={INK}>
      CAUTION
    </text>
    {/* the little guy, mid-slip, X eyes */}
    <circle cx={6} cy={-108} r={8} fill={INK} />
    <path d="M2,-110 l3,3 M5,-110 l-3,3 M8,-110 l3,3 M11,-110 l-3,3" stroke="#f2c92a" strokeWidth={1.5} />
    <path d="M4,-100 L-6,-76 M-6,-76 L-22,-64 M-6,-76 L12,-62 M2,-96 L-16,-104 M2,-96 L20,-90" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <path d="M-30,-56 Q0,-48 30,-56" stroke={INK} strokeWidth={3} fill="none" />
  </g>
);

const MopBucket: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={4} rx={90} ry={14} fill="#000" opacity={0.3} />
    <path d="M-74,0 L74,0 L64,-110 L-64,-110 Z" fill="#e2b92a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <ellipse cx={0} cy={-110} rx={64} ry={14} fill="#5a5a3a" stroke={INK} strokeWidth={4} />
    <path d="M-40,-114 q20,-6 40,0 q20,6 36,-2" stroke="#7a7a50" strokeWidth={3} fill="none" />
    <path d="M-60,-40 L60,-40" stroke="#b08f14" strokeWidth={4} />
    <circle cx={-56} cy={-6} r={10} fill="#2a2a2a" />
    <circle cx={56} cy={-6} r={10} fill="#2a2a2a" />
  </g>
);

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export interface SetState {
  /** minutes past 9 PM on the clock */
  clockMin: number;
  /** neon in the window reads CLOSED */
  closed: boolean;
  decafFill: number;
  /** the decaf pot has left the warmer (Lyle has it) */
  decafGone: boolean;
  regFill: number;
  /** 0..1 the station gleams */
  sparkle: number;
  /** Gerald's cup is on his table */
  geraldCup: boolean;
  /** 0..1 room goes dark (spotlight moments) */
  dark: number;
  /** pendant flicker 0..1 */
  flicker: number;
}

export const DEFAULT_SET: SetState = { clockMin: 58, closed: false, decafFill: 0.86, decafGone: false, regFill: 0, sparkle: 0.6, geraldCup: false, dark: 0, flicker: 0.15 };

export interface DregsSceneProps {
  from: Cam;
  to?: Cam;
  ease?: (x: number) => number;
  cam?: Cam;
  lyle?: Partial<LyleProps> | false;
  vern?: Partial<VernProps> | false;
  mo?: Partial<MoProps> | false;
  gerald?: Partial<GeraldProps> | false;
  set?: Partial<SetState>;
  shakeAmp?: number;
  /** drawn behind the staff (on the back counter) */
  back?: React.ReactNode;
  /** drawn in front of everything */
  front?: React.ReactNode;
  overlay?: React.ReactNode;
  /** warm light wash override */
  wash?: number;
}

export const DregsScene: React.FC<DregsSceneProps> = ({ from, to, ease = easeInOut, cam, lyle = {}, vern = {}, mo = {}, gerald = {}, set = {}, shakeAmp = 0, back, front, overlay, wash = 0.16 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const camNow = cam ?? (to ? camLerp(from, to, ease(shot.p)) : from);
  const st = { ...DEFAULT_SET, ...set };
  const sl = useSpeech("lyle");
  const sv = useSpeech("vern");
  const sm = useSpeech("mo");
  const f3 = onN(frame, 3);
  const flick = (k: string) => (rnd(`${k}${Math.floor(f3 / 3)}`) < st.flicker * 0.4 ? 0 : 1);
  return (
    <Stage cam={camNow} frame={frame} shakeAmp={shakeAmp} overlay={overlay ?? <LightWash id="dregsLamp" color="#ffd9a0" cx={960} cy={160} r={1100} opacity={wash} />}>
      <Wall />
      <ShopWindow t={t} closed={st.closed} flick={flick("neon")} />
      <MascotPoster />
      <MenuBoard />
      <Clock min={st.clockMin} />
      <PremiumShelf t={t} />
      <RestroomCorner />
      <Pendant x={380} on={flick("p1")} />
      <Pendant x={1570} on={1} />
      <Floor />
      <BackCounter t={t} sparkle={st.sparkle} decafFill={st.decafFill} decafGone={st.decafGone} regFill={st.regFill} />
      {back}
      {vern ? <Vern id="vern" x={VERN_POS.x} y={VERN_POS.y} flip t={t} frame={frame} {...sv} {...vern} /> : null}
      {lyle ? <Lyle id="lyle" x={LYLE_POS.x} y={LYLE_POS.y} t={t} frame={frame} {...sl} {...lyle} /> : null}
      <FrontCounter t={t} closedCard={st.closed} />
      <CafeChair />
      {gerald ? <Gerald id="gerald" x={GERALD_POS.x} y={GERALD_POS.y} pose="sit" t={t} frame={frame} holdB={null} {...gerald} /> : null}
      <CafeTable cup={st.geraldCup} t={t} />
      <WetFloorSign x={1520} y={1010} />
      <MopBucket x={1990} y={1016} />
      {mo ? <Mo id="mo" x={MO_POS.x} y={MO_POS.y} flip t={t} frame={frame} mopPhase={t * 0.55} {...sm} {...mo} /> : null}
      {st.dark > 0 ? <rect x={-1000} y={-600} width={4200} height={2400} fill="#06040a" opacity={st.dark * 0.75} /> : null}
      {front}
    </Stage>
  );
};
