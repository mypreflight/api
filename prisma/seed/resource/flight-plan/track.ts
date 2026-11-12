export type PathPoint = {
  latitude: number;
  longitude: number;
  altitude: number;
  elapsedSeconds: number;
};

export type PositionReport = {
  callsign: string;
  date: string;
  latitude: number;
  longitude: number;
  altitude: number;
  verticalRate: number;
  groundSpeed: number;
  track: number;
  isOnGround: boolean;
  squawk: string;
  alert: boolean;
  emergency: boolean;
  spi: boolean;
};

export type TrackSpec = {
  callsign: string;
  path: PathPoint[];
  offBlock: Date;
  takeoff: Date | null;
  arrival: Date | null;
  onBlock: Date | null;
  until: Date | null;
  levelHold: LevelHold | null;
};

export type LevelHold = {
  below: number;
  untilFraction: number;
};

type Position = [number, number];

const RADIANS = Math.PI / 180;
const EARTH_RADIUS_NM = 3440.065;
const STEP_SECONDS = 240;
const TAXI_INTERVAL_SECONDS = 60;
const TAXI_SPEED_KT = 14;
const WOBBLE_DEGREES = 0.018;
const WOBBLE_PERIOD_SECONDS = 2400;
const WOBBLE_TAPER_SECONDS = 1200;
const MS = 1000;

function toVector([latitude, longitude]: Position): [number, number, number] {
  const phi = latitude * RADIANS;
  const lambda = longitude * RADIANS;

  return [
    Math.cos(phi) * Math.cos(lambda),
    Math.cos(phi) * Math.sin(lambda),
    Math.sin(phi),
  ];
}

function fromVector([x, y, z]: [number, number, number]): Position {
  return [
    Math.atan2(z, Math.hypot(x, y)) / RADIANS,
    Math.atan2(y, x) / RADIANS,
  ];
}

function centralAngle(from: Position, to: Position): number {
  const [ax, ay, az] = toVector(from);
  const [bx, by, bz] = toVector(to);

  return Math.acos(Math.min(1, Math.max(-1, ax * bx + ay * by + az * bz)));
}

function slerp(from: Position, to: Position, fraction: number): Position {
  const angle = centralAngle(from, to);

  if (angle < 1e-9) {
    return from;
  }

  const a = Math.sin((1 - fraction) * angle) / Math.sin(angle);
  const b = Math.sin(fraction * angle) / Math.sin(angle);
  const [ax, ay, az] = toVector(from);
  const [bx, by, bz] = toVector(to);

  return fromVector([a * ax + b * bx, a * ay + b * by, a * az + b * bz]);
}

export function distanceNm(from: Position, to: Position): number {
  return centralAngle(from, to) * EARTH_RADIUS_NM;
}

function bearing(
  [fromLatitude, fromLongitude]: Position,
  [toLatitude, toLongitude]: Position,
): number {
  const deltaLongitude = (toLongitude - fromLongitude) * RADIANS;
  const y = Math.sin(deltaLongitude) * Math.cos(toLatitude * RADIANS);
  const x =
    Math.cos(fromLatitude * RADIANS) * Math.sin(toLatitude * RADIANS) -
    Math.sin(fromLatitude * RADIANS) *
      Math.cos(toLatitude * RADIANS) *
      Math.cos(deltaLongitude);

  return (((Math.atan2(y, x) / RADIANS) % 360) + 360) % 360;
}

function squawkFor(callsign: string): string {
  const hash = [...callsign].reduce(
    (sum, character) => (sum * 31 + character.charCodeAt(0)) % 4096,
    7,
  );

  return hash.toString(8).padStart(4, '0').slice(-4);
}

function isLevelChange(from: PathPoint, to: PathPoint): boolean {
  return (
    from.altitude >= 18000 &&
    to.altitude >= 18000 &&
    from.altitude !== to.altitude
  );
}

function stateAt(
  path: PathPoint[],
  elapsedSeconds: number,
): { position: Position; altitude: number } {
  const lastIndex = path.length - 1;
  const clamped = Math.min(
    Math.max(elapsedSeconds, 0),
    path[lastIndex].elapsedSeconds,
  );
  const index = Math.max(
    0,
    path.findIndex((point) => point.elapsedSeconds >= clamped) - 1,
  );
  const from = path[index];
  const to = path[Math.min(index + 1, lastIndex)];
  const span = to.elapsedSeconds - from.elapsedSeconds;
  const fraction = span <= 0 ? 1 : (clamped - from.elapsedSeconds) / span;
  const sinceFix = clamped - from.elapsedSeconds;
  const levelFraction = isLevelChange(from, to)
    ? Math.min(1, sinceFix / 300)
    : fraction;

  return {
    position: slerp(
      [from.latitude, from.longitude],
      [to.latitude, to.longitude],
      fraction,
    ),
    altitude: from.altitude + (to.altitude - from.altitude) * levelFraction,
  };
}

function wobble(
  [latitude, longitude]: Position,
  seconds: number,
  strength: number,
): Position {
  const phase = (2 * Math.PI * seconds) / WOBBLE_PERIOD_SECONDS;
  const amplitude = WOBBLE_DEGREES * strength;

  return [
    latitude + amplitude * Math.sin(phase),
    longitude + amplitude * Math.cos(phase * 0.7),
  ];
}

function airborneSamples(
  spec: TrackSpec,
  takeoff: Date,
  arrival: Date,
): { at: Date; position: Position; altitude: number }[] {
  const plannedSeconds = spec.path[spec.path.length - 1].elapsedSeconds;
  const airborneSeconds = (arrival.getTime() - takeoff.getTime()) / MS;
  const scale = plannedSeconds > 0 ? plannedSeconds / airborneSeconds : 1;
  const step = airborneSeconds <= 2 * 3600 ? STEP_SECONDS / 4 : STEP_SECONDS;
  const samples: { at: Date; position: Position; altitude: number }[] = [];

  const plannedCeiling = Math.max(...spec.path.map((point) => point.altitude));
  const hold = spec.levelHold;

  for (let seconds = 0; seconds < airborneSeconds; seconds += step) {
    const { position, altitude } = stateAt(spec.path, seconds * scale);
    const strength = Math.min(
      1,
      seconds / WOBBLE_TAPER_SECONDS,
      (airborneSeconds - seconds) / WOBBLE_TAPER_SECONDS,
    );
    const held =
      hold !== null && seconds < airborneSeconds * hold.untilFraction
        ? Math.min(altitude, plannedCeiling - hold.below)
        : altitude;

    samples.push({
      at: new Date(takeoff.getTime() + seconds * MS),
      position: wobble(position, seconds, Math.max(0, strength)),
      altitude: Math.max(0, Math.round(held / 100) * 100),
    });
  }

  const end = spec.path[spec.path.length - 1];
  samples.push({
    at: arrival,
    position: [end.latitude, end.longitude],
    altitude: 0,
  });

  return samples;
}

function taxiSamples(
  position: Position,
  from: Date,
  to: Date,
): { at: Date; position: Position; altitude: number }[] {
  const samples: { at: Date; position: Position; altitude: number }[] = [];

  for (
    let time = from.getTime();
    time < to.getTime();
    time += TAXI_INTERVAL_SECONDS * MS
  ) {
    samples.push({ at: new Date(time), position, altitude: 0 });
  }

  return samples;
}

export function recordedTrack(spec: TrackSpec): PositionReport[] {
  const start = spec.path[0];
  const end = spec.path[spec.path.length - 1];
  const origin: Position = [start.latitude, start.longitude];
  const destination: Position = [end.latitude, end.longitude];
  const plannedArrival =
    spec.takeoff === null
      ? null
      : new Date(spec.takeoff.getTime() + end.elapsedSeconds * MS);
  const arrival = spec.arrival ?? plannedArrival;

  const samples = [
    ...taxiSamples(
      origin,
      spec.offBlock,
      spec.takeoff ?? spec.until ?? spec.offBlock,
    ),
    ...(spec.takeoff === null || arrival === null
      ? []
      : airborneSamples(spec, spec.takeoff, arrival)),
    ...(spec.arrival === null
      ? []
      : taxiSamples(
          destination,
          new Date(spec.arrival.getTime() + MS),
          spec.onBlock ?? spec.until ?? spec.arrival,
        )),
  ].filter(
    ({ at }) => spec.until === null || at.getTime() <= spec.until.getTime(),
  );

  const squawk = squawkFor(spec.callsign);

  return samples.map((sample, index) => {
    const previous = samples[index - 1];
    const next = samples[index + 1];
    const onGround = sample.altitude === 0;
    const neighbour = next ?? previous;
    const seconds =
      neighbour === undefined
        ? 0
        : Math.abs(neighbour.at.getTime() - sample.at.getTime()) / MS;
    const travelled =
      neighbour === undefined
        ? 0
        : distanceNm(sample.position, neighbour.position);
    const climb =
      next === undefined || seconds === 0
        ? 0
        : ((next.altitude - sample.altitude) / seconds) * 60;
    const heading =
      next !== undefined && distanceNm(sample.position, next.position) > 0.01
        ? bearing(sample.position, next.position)
        : previous !== undefined &&
            distanceNm(previous.position, sample.position) > 0.01
          ? bearing(previous.position, sample.position)
          : 0;

    return {
      callsign: spec.callsign,
      date: sample.at.toISOString(),
      latitude: Number(sample.position[0].toFixed(5)),
      longitude: Number(sample.position[1].toFixed(5)),
      altitude: sample.altitude,
      verticalRate: Math.round(climb / 100) * 100,
      groundSpeed: onGround
        ? TAXI_SPEED_KT
        : Math.round(seconds === 0 ? 0 : (travelled / seconds) * 3600),
      track: Math.round(heading),
      isOnGround: onGround,
      squawk,
      alert: false,
      emergency: false,
      spi: false,
    };
  });
}

export function greatCirclePath(
  from: Position,
  to: Position,
  cruiseAltitude: number,
  cruiseSpeedKt: number,
  elevations: [number, number] = [0, 0],
): PathPoint[] {
  const total = distanceNm(from, to);
  const climbNm = Math.min(total * 0.3, 110);
  const descentNm = Math.min(total * 0.35, 120);
  const legs: [number, number][] = [
    [0, elevations[0]],
    [climbNm, cruiseAltitude],
    [total - descentNm, cruiseAltitude],
    [total, elevations[1]],
  ];
  const speeds = [cruiseSpeedKt * 0.7, cruiseSpeedKt, cruiseSpeedKt * 0.75];
  let elapsed = 0;

  return legs.map(([alongNm, altitude], index) => {
    if (index > 0) {
      elapsed += ((alongNm - legs[index - 1][0]) / speeds[index - 1]) * 3600;
    }
    const [latitude, longitude] = slerp(
      from,
      to,
      total === 0 ? 0 : alongNm / total,
    );

    return {
      latitude,
      longitude,
      altitude,
      elapsedSeconds: Math.round(elapsed),
    };
  });
}

export function divertedPath(
  path: PathPoint[],
  afterSeconds: number,
  to: Position,
  elevation: number,
  speedKt: number,
): PathPoint[] {
  const flown = path.filter((point) => point.elapsedSeconds < afterSeconds);
  const { position, altitude } = stateAt(path, afterSeconds);
  const legSeconds = (distanceNm(position, to) / speedKt) * 3600;
  const descentStart = Math.max(afterSeconds, afterSeconds + legSeconds - 1800);
  const descentPosition = slerp(
    position,
    to,
    (descentStart - afterSeconds) / legSeconds,
  );

  return [
    ...flown,
    {
      latitude: position[0],
      longitude: position[1],
      altitude,
      elapsedSeconds: Math.round(afterSeconds),
    },
    {
      latitude: descentPosition[0],
      longitude: descentPosition[1],
      altitude,
      elapsedSeconds: Math.round(descentStart),
    },
    {
      latitude: to[0],
      longitude: to[1],
      altitude: elevation,
      elapsedSeconds: Math.round(afterSeconds + legSeconds),
    },
  ];
}
