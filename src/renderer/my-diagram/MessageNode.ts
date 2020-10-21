import { NodeOptions } from "../diagram-core";
import { Position } from "../diagram-core/interfaces/Position";
import { BasicNode } from "./basic-node";
import { MessageDataItem } from "./interfaces/MessageDataItem";
import { ObjectProps } from "./interfaces/object-props";
import { ObjectType } from "./interfaces/object-type";

export class MessageNode extends BasicNode implements ObjectProps{

  // Business props
  public readonly what: ObjectType = ObjectType.Message;

  public readonly properties = {
    queue_length: 1,
    type: MessageType.SINGLE_THREAD
  };

  public readonly body: MessageDataItem[] = [];

  constructor(position: Position, options?: NodeOptions){
    super(position, options);
    this.addDataItem();
  }

  public addDataItem(){
    this.body.push({
      data_name: 'Data',
      data_type: 'i8',
      data_length: 1
    });
  }

  public removeDataItem(item: MessageDataItem){
    const idx = this.body.indexOf(item);
    idx >= 0 && this.body.splice(idx, 1);
  }

}

export enum MessageType{
  SINGLE_THREAD = 'single_thread',
  MULTI_THREAD = 'multi_thread',
}
