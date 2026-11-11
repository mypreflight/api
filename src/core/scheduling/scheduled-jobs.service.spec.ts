import { EVERY_MINUTE_SECONDS, ScheduledJobs } from './scheduled-jobs.service';

describe('ScheduledJobs', () => {
  let leases: { claim: jest.Mock };
  let jobs: ScheduledJobs;

  beforeEach(() => {
    leases = { claim: jest.fn() };
    jobs = new ScheduledJobs(leases as never);
  });

  it('runs the job when this instance claims the tick', async () => {
    leases.claim.mockResolvedValue(true);
    const run = jest.fn().mockResolvedValue(undefined);

    await jobs.runExclusively('weather-refresh', EVERY_MINUTE_SECONDS, run);

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('skips the job when another instance already holds the tick', async () => {
    leases.claim.mockResolvedValue(false);
    const run = jest.fn();

    await jobs.runExclusively('weather-refresh', EVERY_MINUTE_SECONDS, run);

    expect(run).not.toHaveBeenCalled();
  });

  it('holds the tick until just before the next one is due', async () => {
    leases.claim.mockResolvedValue(true);

    await jobs.runExclusively('weather-refresh', EVERY_MINUTE_SECONDS, () =>
      Promise.resolve(),
    );

    expect(leases.claim).toHaveBeenCalledWith('weather-refresh', 55);
  });
});
