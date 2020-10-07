import { Side, GetRectWallCenterPoint } from "../helpers/geometry";
import { capNumber } from "../helpers/math";
import { Position } from "../interfaces/Position";
import { Edge } from "./edge";
import { Node } from "./node";

export class EdgeConnection{

  public edge: Edge | null = null;
  public node: Node | null = null;
  public position?: Position;
  public offset?: Position;

  constructor(
    public attachType: AttachType = AttachType.Position,
    public nodeWall: Side = Side.Top
  ){}

  public getCoordinates(): Position{
    let result = this.getOrigin();
    if(this.offset){
      const {x: x1, y: y1} = result;
      let {x: x2, y: y2} = this.offset;

      const node = this.node;
      if(this.attachType == AttachType.NodeWall && node != null){
        const hw = node.size.width / 2;
        const hh = node.size.height / 2;
        x2 = capNumber(x2, -hw, hw);
        y2 = capNumber(y2, -hh, hh);
      }

      result = {
        x: x1 + x2,
        y: y1 + y2
      }
    }



    return result;
  }

  private getOrigin(): Position{
    const node = this.node;
    if(this.attachType == AttachType.Position && this.position){
      return this.position;
    }else if(this.attachType == AttachType.Node && node){
      // Calculte center point of the rectangle
      const { x, y} = node.getAbsolutePosition();
      const { width, height } = node.size;
      const center = {
        x: x + width / 2,
        y: y + height / 2
      }
      return center;
    }else if(this.attachType == AttachType.NodeWall && node){
      const offset = GetRectWallCenterPoint(node.size, this.nodeWall);
      const position = node.getAbsolutePosition();
      return {
        x: position.x + offset.x,
        y: position.y + offset.y
      }
    }

    return {x: 0, y: 0};
  }

}

export enum AttachType{
  Position = 'position',
  Node = 'node',
  NodeWall = 'node-wall',
  EdgeSource = 'edge-source'
}
