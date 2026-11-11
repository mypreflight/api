import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AggregateRoot } from '@nestjs/cqrs';
import { DomainEvent } from './dto/event';

@Injectable()
export class DomainEventEmitter {
  constructor(private readonly emitter: EventEmitter2) {}

  emit(event: DomainEvent): void {
    this.emitter.emit((event.constructor as typeof DomainEvent).name, event);
  }

  async emitAsync(event: DomainEvent): Promise<void> {
    await this.emitter.emitAsync(
      (event.constructor as typeof DomainEvent).name,
      event,
    );
  }

  emitRecorded(aggregate: AggregateRoot<DomainEvent>): void {
    for (const event of this.takeRecorded(aggregate)) {
      this.emit(event);
    }
  }

  async emitRecordedAsync(
    aggregate: AggregateRoot<DomainEvent>,
  ): Promise<void> {
    for (const event of this.takeRecorded(aggregate)) {
      await this.emitAsync(event);
    }
  }

  private takeRecorded(aggregate: AggregateRoot<DomainEvent>): DomainEvent[] {
    const events = [...aggregate.getUncommittedEvents()];
    aggregate.uncommit();

    return events;
  }
}
