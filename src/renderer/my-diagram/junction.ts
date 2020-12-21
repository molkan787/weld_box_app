import { NodeOptions } from "../diagram-core";
import { Position } from "../diagram-core/interfaces/Position";
import { PropsChangeArchiver } from "../diagram-core/props-change-archiver";
import { ObjectProps } from "../interfaces/ObjectProps";
import { ObjectType } from "../interfaces/ObjectType";
import { BasicNode } from "./basic-node";

/**
 * Junction node
 */
export class Junction extends BasicNode implements ObjectProps{

  // Internal props
  protected propsArchiver = new PropsChangeArchiver(null);

  // Business props
  public readonly what: ObjectType = ObjectType.Junction;
  public readonly properties = {};

  constructor(position: Position, options?: NodeOptions){
    super(position, {
      ...options,
      circle: true
    });
  }


}
