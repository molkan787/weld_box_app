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
    discard: EventDiscard.MANUAL,
    mode: EventMode.FLAG,
    type: EventType.SINGLE_THREAD,
  };

  constructor(position: Position, options?: NodeOptions){
    super(position, options);
    this.propsArchiver = new PropsChangeArchiver({
      instance: this,
      props: ['name', 'properties'],
      debounce: {
        name: 1000
      },
      filter: path => !(path.includes('__ob__') || path.includes('__proto__'))
    });
  }

}

export enum EventDiscard{
  MANUAL = 'manual',
  THREAD = 'thread',
  READ = 'read'
}

export enum EventMode{
  FLAG = 'flag',
  COUNTER = 'counter'
}

export enum EventType{
  SINGLE_THREAD = 'single_thread',
  MULTI_THREAD = 'multi_thread',
}
