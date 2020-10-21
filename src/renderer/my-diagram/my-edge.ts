import { Edge } from "../diagram-core";
import { ObjectProps } from "./interfaces/object-props";
import { ObjectType } from "./interfaces/object-type";

export class MyEdge extends Edge implements ObjectProps{

  public readonly what: ObjectType = ObjectType.Edge;
  public name: string = '';
  public readonly properties = {
    priority: 0,
    condition: '',
    type: EdgeType.REGULAR
  };

}

export enum EdgeType{
  REGULAR = 'regular',
  START = 'start'
}
