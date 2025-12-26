import { AppEvent, EventHandler } from '../events/app-event';

export interface IEventPublisher {
  publish<T>(event: AppEvent<T>): Promise<void>;
}

export interface IEventSubscriber {
  subscribe(topic: string, handler: EventHandler): Promise<void>;
}

export interface IEventBus extends IEventPublisher, IEventSubscriber {}


