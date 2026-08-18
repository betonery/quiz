export type PlayerNavigationSnapshot = {
  stepIndex: number;
  variables: Record<string, unknown>;
  answers: Record<string, string>;
};

export function createPlayerSnapshot(params: {
  stepIndex: number;
  variables: Record<string, unknown>;
  answers: Record<string, string>;
}): PlayerNavigationSnapshot {
  return clonePlayerSnapshot(params);
}

export function clonePlayerSnapshot(
  snapshot: PlayerNavigationSnapshot,
): PlayerNavigationSnapshot {
  return {
    stepIndex: snapshot.stepIndex,
    variables: structuredClone(snapshot.variables),
    answers: structuredClone(snapshot.answers),
  };
}

export function pushPlayerSnapshot(
  history: PlayerNavigationSnapshot[],
  snapshot: PlayerNavigationSnapshot,
): PlayerNavigationSnapshot[] {
  return [...history, clonePlayerSnapshot(snapshot)];
}

export function popPlayerSnapshot(history: PlayerNavigationSnapshot[]): {
  history: PlayerNavigationSnapshot[];
  snapshot: PlayerNavigationSnapshot | null;
} {
  if (history.length === 0) {
    return { history, snapshot: null };
  }

  const snapshot = history[history.length - 1];
  return {
    history: history.slice(0, -1),
    snapshot: clonePlayerSnapshot(snapshot),
  };
}
