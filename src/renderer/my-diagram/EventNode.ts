import { BasicNode } from "./basic-node";
import { ObjectProps } from "./interfaces/object-props";
import { ObjectType } from "./interfaces/object-type";

export class EventNode extends BasicNode implements ObjectProps{

  // Business props
  public readonly what: ObjectType = ObjectType.Event;
  public readonly properties = {
    clear: EventClear.MANUAL,
    type: EventType.SINGLE_THREAD,
  };

}

export enum EventClear{
  MANUAL = 'manual',
  READ = 'read',
  END = 'end'
}

export enum EventType{
  SINGLE_THREAD = 'single_thread',
  MULTI_THREAD = 'multi_thread',
}
