import { EventBus } from "./event-bus";

export const EventCore = new EventBus();

export const EventCoreV2 = new EventBus();

export const EventSocket = new EventBus();

export * from './webhook';
