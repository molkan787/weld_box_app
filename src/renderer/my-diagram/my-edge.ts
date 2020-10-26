import Vue from "vue";
import { Edge, EdgeConnection } from "../diagram-core";
import { PropsChangeArchiver } from "../diagram-core/props-change-archiver";
import { ObjectProps } from "./interfaces/object-props";
import { ObjectType } from "./interfaces/object-type";

export class MyEdge extends Edge implements ObjectProps{

  // Internal props
  private vm?: Vue;
  private propsArchiver: PropsChangeArchiver;

  // Business props
  public readonly what: ObjectType = ObjectType.Edge;
  public name: string = '';
  public readonly properties = {
    priority: 0,
    condition: '',
    type: EdgeType.REGULAR
  };

  constructor(s: EdgeConnection, t: EdgeConnection){
    super(s, t);
    this.propsArchiver = new PropsChangeArchiver({
      instance: this,
      props: ['name', 'properties'],
      debounce: {
        name: 1000,
        properties: 500
      }
    });
    this.propsArchiver.unlock();
  }

}

export enum EdgeType{
  REGULAR = 'regular',
  START = 'start'
}
