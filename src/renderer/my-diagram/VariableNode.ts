import { NodeOptions } from "../diagram-core";
import { Position } from "../diagram-core/interfaces/Position";
import { PropsChangeArchiver } from "../diagram-core/props-change-archiver";
import { ObjectType } from "../interfaces/ObjectType";
import { BasicNode } from "./basic-node";

export class VariableNode extends BasicNode{

  // internal props
  protected propsArchiver: PropsChangeArchiver;

  // Business props
  public readonly what: ObjectType = ObjectType.Variable;
  public properties = {
    scope: VariableScope.LOCAL,
    type: 'i8'
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

export enum VariableScope{
  LOCAL = 'local',
  GLOBAL = 'global'
}
