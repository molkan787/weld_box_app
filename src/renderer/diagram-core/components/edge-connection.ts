import { Side, GetRectWallCenterPoint } from "../helpers/geometry";
import { capNumber } from "../helpers/math";
import { Position } from "../interfaces/Position";
import { Component, ComponentType } from "./component";
import { Edge } from "./edge";
import { Node } from "./node";

export class EdgeConnection extends Component{

  public edge: Edge | null = null;
  public node: Node | null = null;
  public position?: Position;
  public offset?: Position;
  public bridgeTo: EdgeConnection | null = null;

  constructor(
    public attachType: AttachType = AttachType.Position,
    public nodeWall: Side = Side.Top
  ){
    super(ComponentType.EdgeConnection);
  }

  /**
   * If this `EdgeConnection` instance is a bridge to another instance returns the last one, otherwise returns itself
   */
  public getInstance(): EdgeConnection{
    return this.bridgeTo ? this.bridgeTo.getInstance() : this;
  }

  public get isBridge(){
    return this.bridgeTo !== null;
  }

  public isAttachedToNode(){
    return this.attachType === AttachType.NodeBody ||
           this.attachType === AttachType.NodeWall ||
           this.attachType === AttachType.Node
  }

  public getAttachedNode(){
    return this.isAttachedToNode() && this.node;
  }

  public getCoordinates(skipOffset: boolean = false): Position{
    let result = this.getOrigin();
    if(!skipOffset && this.offset){
      const {x: x1, y: y1} = result;
      let {x: x2, y: y2} = this.offset;

      const node = this.node;

      if(node?.props.isOpen && this.attachType === AttachType.NodeBody){
        // if the attach type is NodeBody and its node is open,
        // we need to invert the secondary axis's offset
        // because the attachement box of the edge should be outside node's rectangle if it the node is open (open as a sub-chart)
        const isVertical = this.nodeWall === Side.Top || this.nodeWall === Side.Bottom;
        isVertical ? y2 *= -1 : x2 *= -1;
      }

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
    }else if((this.attachType == AttachType.NodeWall || this.attachType == AttachType.NodeBody) && node){
      const offset = GetRectWallCenterPoint(node.size, this.nodeWall);
      const position = node.getAbsolutePosition();
      return {
        x: position.x + offset.x,
        y: position.y + offset.y
      }
    }else if(this.attachType === AttachType.Node && node){
      return node.getAbsolutePosition();
    }

    return {x: 0, y: 0};
  }

}

export enum AttachType{
  Position = 'position',
  NodeBody = 'node-body',
  NodeWall = 'node-wall',
  Node = 'node',
}
