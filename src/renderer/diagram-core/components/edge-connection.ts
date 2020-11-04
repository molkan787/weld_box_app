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
  public bridgeFrom: EdgeConnection | null = null;

  /** Cached result of getCoordinates() method */
  public coordinates: Position = { x: 0, y: 0 };
  private lastSpacingOffset: number = 0;

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

  public getType(){
    return this.edge?.source === this ? EdgeConnectionType.Source : EdgeConnectionType.Target;
  }

  public isSource(){
    return this.edge?.source === this
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
      const needCapping = this.isAttachedToNode() && node != null;
      const hw = (node?.size.width || 1) / 2;
      const hh = (node?.size.height || 1) / 2;
      if(needCapping){
        x2 = capNumber(x2, -hw, hw);
        y2 = capNumber(y2, -hh, hh);
      }

      result = {
        x: x1 + x2,
        y: y1 + y2
      }

      // applying previous spacing or calculating a new one,
      // this is needed to avoid edges overlapping
      const axis = this.getVariableAxis();
      result[axis] += this.lastSpacingOffset;

      const spacing = this.needSpacingOffset(result);
      if(needCapping && node != null && spacing){
        const value = result[axis];
        const isX = axis == 'x';
        let dir = spacing < 0 ? -1 : 1;
        const radius = isX ? hw : hh;
        let change = 0;
        if(radius - Math.abs(value) < 6){
          change = 11 * dir * -1;
        }else{
          change = 6 * dir;
        }
        this.lastSpacingOffset = change;
        result[axis] += change;
      }

    }


    this.coordinates = result;
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

  private needSpacingOffset(position: Position){
    const others = this.getSameSideSources();
    if(others.length == 0){
      this.lastSpacingOffset = 0;
      return 0;
    }
    const axis = this.getVariableAxis();
    const mypos = position[axis];
    for(let i = 0; i < others.length; i++){
      const pos = others[i].coordinates[axis];
      const diff = mypos - pos;
      if(Math.abs(diff) < 5) return diff;
    }
    return 0;
  }

  private getSameSideSources(): EdgeConnection[]{
    const node = <Node>this.node
    return node.edges.filter(ec => (
      ec.nodeWall == this.nodeWall && ec !== this
    ));
  }

  private getVariableAxis(){
    return this.nodeWall == Side.Top || this.nodeWall == Side.Bottom ? 'x' : 'y';
  }

}

export enum AttachType{
  Position = 'position',
  NodeBody = 'node-body',
  NodeWall = 'node-wall',
  Node = 'node',
}

export enum EdgeConnectionType{
  Source,
  Target
}
