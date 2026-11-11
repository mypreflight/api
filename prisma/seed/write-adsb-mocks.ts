import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../../src/core/provider/prisma/prisma.service';
import {
  flightWithContext,
  LIVE_STATUSES,
  PLANNED_FLIGHTS,
  trackOf,
} from './resource/flight-plans.seed';

const MOCK_DIRECTORY = join(__dirname, '../../docker/mock');
const ENVIRONMENT = join(MOCK_DIRECTORY, 'adsb.json');

type MockRoute = {
  uuid: string;
  endpoint: string;
  responses: { uuid: string; filePath: string }[];
};
type MockEnvironment = {
  routes: MockRoute[];
  rootChildren: { type: string; uuid: string }[];
};

function registerRoute(environment: MockEnvironment, callsign: string): void {
  const endpoint = `api/v1/position/${callsign}`;

  if (environment.routes.some((route) => route.endpoint === endpoint)) {
    return;
  }

  const template = environment.routes.find(
    (route) =>
      route.endpoint.startsWith('api/v1/position/') &&
      !route.endpoint.includes(':'),
  );

  if (template === undefined) {
    throw new Error('adsb.json has no position route to copy');
  }

  const route: MockRoute = {
    ...structuredClone(template),
    uuid: randomUUID(),
    endpoint,
    responses: template.responses.map((response) => ({
      ...structuredClone(response),
      uuid: randomUUID(),
      filePath: `adsb/${callsign}.json`,
    })),
  };

  environment.routes.push(route);
  environment.rootChildren.push({ type: 'route', uuid: route.uuid });
}

async function writeMocks(): Promise<void> {
  const prisma = new PrismaService();
  const environment = JSON.parse(
    readFileSync(ENVIRONMENT, 'utf8'),
  ) as MockEnvironment;

  for (const { flightId, navlog } of PLANNED_FLIGHTS) {
    const flight = await prisma.flight.findUniqueOrThrow({
      where: { id: flightId },
      include: flightWithContext,
    });

    if (!LIVE_STATUSES.has(flight.status)) {
      continue;
    }

    writeFileSync(
      join(MOCK_DIRECTORY, 'adsb', `${flight.callsign}.json`),
      `${JSON.stringify(trackOf(flight, navlog), null, 2)}\n`,
    );
    registerRoute(environment, flight.callsign);
    console.log(`Wrote ${flight.callsign}`);
  }

  writeFileSync(ENVIRONMENT, `${JSON.stringify(environment, null, 2)}\n`);
  await prisma.$disconnect();
}

writeMocks().catch((error) => {
  console.error(error);
  process.exit(1);
});
