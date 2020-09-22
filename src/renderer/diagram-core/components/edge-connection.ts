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
    public nodeWall: NodeWall = NodeWall.Top
  ){}

  public getCoordinates(): Position{
    const origin = this.getOrigin();
    if(this.offset){
      const {x: x1, y: y1} = origin;
      const {x: x2, y: y2} = this.offset;
      return {
        x: x1 + x2,
        y: y1 + y2
      }
    }else{
      return origin;
    }
  }

  private getOrigin(): Position{
    if(this.attachType == AttachType.Position && this.position){
      return this.position;
    }else if(this.attachType == AttachType.Node && this.node){
      // Calculte center point of the rectangle
      const { x, y} = this.node.position;
      const { width, height } = this.node.size;
      const center = {
        x: x + width / 2,
        y: y + height / 2
      }
      if(this.node.parent){
        const pp = this.node.parent.position;
        center.x += pp.x;
        center.y += pp.y;
      }
      return center;
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

export enum NodeWall{
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
  Left = 'left'
}
