import { NodeOptions } from "../diagram-core";
import { Position } from "../diagram-core/interfaces/Position";
import { PropsChangeArchiver } from "../diagram-core/props-change-archiver";
import { BasicNode } from "./basic-node";
import { ObjectProps } from "../interfaces/ObjectProps";
import { ObjectType } from "../interfaces/ObjectType";

export class EventNode extends BasicNode implements ObjectProps{

  // internal props
  protected propsArchiver: PropsChangeArchiver;

  // Business props
  public readonly what: ObjectType = ObjectType.Event;
  public properties = {
    clear: EventClear.MANUAL,
    type: EventType.SINGLE_THREAD,
  };

  constructor(position: Position, options?: NodeOptions){
    super(position, options);
    this.propsArchiver = new PropsChangeArchiver({
      instance: this,
      props: ['name', 'properties'],
      debounce: {
        name: 1000
      }
    });
  }

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
