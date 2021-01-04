import { NodeOptions } from "../diagram-core";
import { Position } from "../diagram-core/interfaces/Position";
import { PropsChangeArchiver } from "../diagram-core/props-change-archiver";
import { BasicNode } from "./basic-node";
import { MessageDataItem } from "../interfaces/MessageDataItem";
import { ObjectProps } from "../interfaces/ObjectProps";
import { ObjectType } from "../interfaces/ObjectType";

/**
 * Message Node
 */
export class MessageNode extends BasicNode implements ObjectProps{

  // internal props
  protected propsArchiver: PropsChangeArchiver;

  // Business props
  public readonly what: ObjectType = ObjectType.Message;

  public properties = {
    queue_length: 1,
    type: MessageType.SINGLE_THREAD
  };

  public body: MessageDataItem[] = [];

  constructor(position: Position, options?: NodeOptions){
    super(position, options);
    this.propsArchiver = new PropsChangeArchiver({
      instance: this,
      props: ['name', 'properties', 'body'],
      debounce: {
        name: 1000,
        body: 500
      },
      filter: path => !(path.includes('__ob__') || path.includes('__proto__'))
    });
    this.addDataItem();
  }

  /**
   * Adds a message's data item
   */
  public addDataItem(){
    this.body.push({
      data_name: 'Data',
      data_type: 'i8',
      data_length: 1
    });
  }

  /**
   * Removes message's data item
   * @param index Index if the item to removed
   */
  public removeDataItem(index: number){
    // const idx = this.body.indexOf(item);
    index >= 0 && this.body.splice(index, 1);
  }

}

export enum MessageType{
  SINGLE_THREAD = 'single_thread',
  MULTI_THREAD = 'multi_thread',
}
