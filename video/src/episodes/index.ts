import type { EpisodeDef } from "../engine/episode";
import { episode as ep001 } from "./001-oats";
import { episode as ep002 } from "./002-troubled";
import { episode as ep003 } from "./003-wouldnt";
import { episode as ep004 } from "./004-leave-early";
import { episode as ep005 } from "./005-last-orders";
import { episode as ep006 } from "./006-his-package";
import { episode as ep007 } from "./007-whats-the-move";
import { episode as ep010 } from "./010-politics";

/** Every episode gets two compositions: ep<id> (1920x1080) and ep<id>-vertical (1080x1920). */
export const EPISODES: EpisodeDef[] = [ep001, ep002, ep003, ep004, ep005, ep006, ep007, ep010];
