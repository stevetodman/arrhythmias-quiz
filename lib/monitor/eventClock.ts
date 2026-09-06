export type RhythmMode = "svt" | "sinus-tach";

export type CardiacBeat = {
  id: number;
  atrialAt: number | null;
  ventricularAt: number;
};

export type EventClockState = {
  beats: CardiacBeat[];
  nextVentricularAt: number | null;
  nextBeatId: number;
};

const HISTORY_SECONDS = 8;
const LOOKAHEAD_SECONDS = 0.35;

export function createEventClockState(): EventClockState {
  return {
    beats: [],
    nextVentricularAt: null,
    nextBeatId: 1,
  };
}

export function resetEventClock(state: EventClockState): void {
  state.beats = [];
  state.nextVentricularAt = null;
  state.nextBeatId = 1;
}

export function advanceEventClock(
  state: EventClockState,
  nowSeconds: number,
  rateBpm: number,
  rhythm: RhythmMode,
): CardiacBeat[] {
  const safeRate = Math.max(30, Math.min(320, rateBpm));
  const rrSeconds = 60 / safeRate;

  if (state.nextVentricularAt === null) {
    state.nextVentricularAt = nowSeconds;
  }

  const horizon = nowSeconds + LOOKAHEAD_SECONDS;

  while (state.nextVentricularAt <= horizon) {
    const ventricularAt = state.nextVentricularAt;
    const atrialAt = rhythm === "sinus-tach" ? ventricularAt - 0.1 : null;

    state.beats.push({
      id: state.nextBeatId,
      atrialAt,
      ventricularAt,
    });

    state.nextBeatId += 1;
    state.nextVentricularAt += rrSeconds;
  }

  const oldestAllowed = nowSeconds - HISTORY_SECONDS;
  state.beats = state.beats.filter(
    (beat) => beat.ventricularAt >= oldestAllowed,
  );

  return state.beats;
}

export function measureHeartRate(
  beats: CardiacBeat[],
  nowSeconds: number,
  intervalCount = 5,
): number | null {
  const completed = beats
    .filter((beat) => beat.ventricularAt <= nowSeconds)
    .slice(-(intervalCount + 1));

  if (completed.length < 2) {
    return null;
  }

  let totalRr = 0;
  let rrCount = 0;

  for (let index = 1; index < completed.length; index += 1) {
    const rr = completed[index].ventricularAt - completed[index - 1].ventricularAt;
    if (rr > 0) {
      totalRr += rr;
      rrCount += 1;
    }
  }

  if (rrCount === 0) {
    return null;
  }

  return Math.round(60 / (totalRr / rrCount));
}
