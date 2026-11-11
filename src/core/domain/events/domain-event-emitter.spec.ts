import { AggregateRoot } from '@nestjs/cqrs';
import { DomainEventEmitter } from './domain-event-emitter';
import { DomainEvent } from './dto/event';

class SomethingHappenedEvent extends DomainEvent {
  static readonly name = 'something.happened';
}

class SomethingElseHappenedEvent extends DomainEvent {
  static readonly name = 'something.else-happened';
}

class Thing extends AggregateRoot<DomainEvent> {
  happen(): void {
    this.apply(new SomethingHappenedEvent());
    this.apply(new SomethingElseHappenedEvent());
  }
}

describe('DomainEventEmitter', () => {
  let emitter: { emit: jest.Mock; emitAsync: jest.Mock };
  let domainEvents: DomainEventEmitter;

  beforeEach(() => {
    emitter = { emit: jest.fn(), emitAsync: jest.fn() };
    domainEvents = new DomainEventEmitter(emitter as never);
  });

  it('emits every recorded event in order under its name and forgets them', () => {
    const thing = new Thing();
    thing.happen();

    domainEvents.emitRecorded(thing);

    expect(emitter.emit.mock.calls.map(([name]) => name)).toEqual([
      'something.happened',
      'something.else-happened',
    ]);
    expect(emitter.emit.mock.calls[0][1]).toBeInstanceOf(
      SomethingHappenedEvent,
    );
    expect(thing.getUncommittedEvents()).toHaveLength(0);
  });

  it('awaits each recorded event in order and forgets them', async () => {
    const thing = new Thing();
    thing.happen();

    await domainEvents.emitRecordedAsync(thing);

    expect(emitter.emitAsync.mock.calls.map(([name]) => name)).toEqual([
      'something.happened',
      'something.else-happened',
    ]);
    expect(thing.getUncommittedEvents()).toHaveLength(0);
  });

  it('emits nothing twice', async () => {
    const thing = new Thing();
    thing.happen();

    domainEvents.emitRecorded(thing);
    await domainEvents.emitRecordedAsync(thing);

    expect(emitter.emit).toHaveBeenCalledTimes(2);
    expect(emitter.emitAsync).not.toHaveBeenCalled();
  });
});
