import { Side, GetRectWallCenterPoint, polarToCartesian } from "../helpers/geometry";
import { capNumber } from "../helpers/math";
import { Position } from "../interfaces/Position";
import { Component, ComponentType } from "./component";
import { Edge } from "./edge";
import { Node } from "./node";

export class EdgeConnection extends Component{

  public edge: Edge | null = null;
  public position?: Position;
  public offset?: Position;
  public bridgeTo: EdgeConnection | null = null;
  public bridgeFrom: EdgeConnection | null = null;
  private _node: Node | null = null;
  public toSecondEndOffset: Position = { x: 0, y: 0 };

  public get node(): Node | null{
    return this._node;
  }

  public set node(node: Node | null){
    this._node = node;
  }

  /** Cached result of getCoordinates() method */
  private _coordinates: Position = { x: 0, y: 0 };
  public lastSpacingOffset: number = 0;

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

  /**
   * Returns `true` if this instance is bridge (Points to another EdgeConnection instance).
   * @returns {boolean}
   */
  public get isBridge(){
    return this.bridgeTo !== null;
  }

  /**
   * Sets an EdgeConnection instance as the bridge target of this instance (also making this one a bridge).
   * Used to merge two EdgeConnection instances when one of them is on the inner side of the sub-chart and the second on the outer side of the sub-chart
   * @param bridge `EdgeConnection` instance to set as Bridge To
   */
  public setBridge(bridge: EdgeConnection){
    this.bridgeTo = bridge;
    bridge.bridgeFrom = this;
  }

  /**
   * Returns `true` if this EdgeConnection is attached to or relative to a Node, otherwise `false`
   */
  public isAttachedToNode(ignoreRelativeToNode?: boolean){
    return this.attachType === AttachType.NodeBody ||
           this.attachType === AttachType.NodeWall ||
           (this.attachType === AttachType.Node && !ignoreRelativeToNode)
  }

  /**
   * Returns the attached Node if any
   */
  public getAttachedNode(){
    return this.isAttachedToNode() && this.node;
  }

  /**
   * Returns the type of relative to the parent Edge, it can be either Source or Target
   * @returns {EdgeConnectionType}
   */
  public getType(){
    return this.edge?.source === this ? EdgeConnectionType.Source : EdgeConnectionType.Target;
  }

  /**
   * Returns `true` if this EdgeConnection is a Source relatively to its parent Edge
   */
  public isSource(){
    return this.edge?.source === this
  }

  public getCoordinates(skipOffset: boolean = false): Position{
    if(this.bridgeTo){
      return this.bridgeTo.getCoordinates();
    }
    if(skipOffset || this.attachType == AttachType.Position){
      return this.getOrigin();
    }else{
      return this._coordinates;
    }
  }

  public get coordinates(){
    return this.getCoordinates();
  }

  /**
   * Calculates & returns the absolute position
   * @param skipOffset if `true` the offset won't be added to the position
   */
  public calculateCoordinates(): Position{
    if(this.bridgeTo){
      const coords = this.bridgeTo.calculateCoordinates();
      this._coordinates = coords;
      return coords;
    }
    const node = this.node;
    let result = this.getOrigin();

    if(this.attachType == AttachType.NodeBody && node && node.isCircle){

      const offset = this.calcCircleOffset(result);
      result.x += offset.x;
      result.y += offset.y;

      this._coordinates = result;
      return result;

    }else if(this.offset){
      const {x: x1, y: y1} = result;
      let {x: x2, y: y2} = this.offset;

      const axis = this.getVariableAxis();
      if(this.isAttachedToNode(true)){
        if(axis == 'x'){
          x2 *= (node?.size.width || 100) / 100;
        }else{
          y2 *= (node?.size.height || 100) / 100;
        }
      }

      if(node?.isOpen && this.attachType === AttachType.NodeBody){
        // if the attach type is NodeBody and its node is open,
        // we need to invert the secondary axis's offset
        // because the attachement box of the edge should be outside node's rectangle if it the node is open (open as a sub-chart)
        const isVertical = this.nodeWall === Side.Top || this.nodeWall === Side.Bottom;
        isVertical ? y2 *= -1 : x2 *= -1;
      }
      const needCapping = this.isAttachedToNode() && this.attachType != AttachType.Node && node != null;
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
      result[axis] += this.lastSpacingOffset;

      const spacing = this.needSpacingOffset(result);
      if(needCapping && node != null && spacing){
        const value = result[axis];
        const isX = axis == 'x';
        let dir = spacing < 0 ? -1 : 1;
        const radius = isX ? hw : hh;
        let change = 0;
        if(radius - Math.abs(value) < 6){
          change = 12 * dir * -1;
        }else{
          change = 6 * dir;
        }
        this.lastSpacingOffset = change;
        result[axis] += change;
      }

    }


    this._coordinates = result;
    return result;
  }

  private calcCircleOffset(center: Position): Position{
    const otherPoint = this.getOtherEcPosition();
    if(otherPoint){
      const angle = Math.atan2(otherPoint.y - center.y, otherPoint.x - center.x);
      return polarToCartesian(7.5, angle);
    }else{
      return { x: 0, y: 0 };
    }
  }

  private getOtherEcPosition(){
    const otherEc = this.isSource() ? this.edge?.target : this.edge?.source;
    return otherEc?.coordinates;
  }

  /**
   * Calculates & returns the absolute position without adding the offset
   */
  private getOrigin(): Position{
    const node = this.node;
    if(this.attachType == AttachType.Position && this.position){
      return this.position;
    }else if(this.attachType == AttachType.NodeBody && node && node.isCircle){
      const position = node.getAbsolutePosition();
      const { width, height } = node.size;
      return {
        x: position.x + width / 2,
        y: position.y + height / 2
      }
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

  /**
   * Returns one axis offset that this EdgeConnection needs to distance its self from other EdgeConnections if any is needed
   * @param position the position before distancing
   */
  private needSpacingOffset(position: Position){
    const at = this.attachType;
    if(!(at == AttachType.NodeBody || AttachType.NodeWall)) return 0;
    const others = this.getSameSideSources();
    if(others.length == 0){
      this.lastSpacingOffset = 0;
      return 0;
    }
    const axis = this.getVariableAxis();
    const mypos = position[axis];
    for(let i = 0; i < others.length; i++){
      const pos = others[i]._coordinates[axis];
      const diff = mypos - pos;
      if(Math.abs(diff) < 8) return diff;
    }
    return 0;
  }

  /**
   * Returns all EdgeConnections that are attached to the same wall of the same Node as this one
   */
  private getSameSideSources(): EdgeConnection[]{
    const node = <Node>this.node
    return node.edges.filter(ec => (
      ec.isAttachedToNode(true) &&
      ec.nodeWall == this.nodeWall && ec !== this && !ec.isBridge
    ));
  }

  /**
   * Returns the axis name that this EdgeConnection is currently moving on it
   */
  private getVariableAxis(){
    return this.nodeWall == Side.Top || this.nodeWall == Side.Bottom ? 'x' : 'y';
  }

}

export enum AttachType{
  /** Indicate that it is attached to a fixed position in the canvas */
  Position = 'position',
  /** Indicate that it is attached to Node's body */
  NodeBody = 'node-body',
  /** Indicate that it is attached to one of Node's wall */
  NodeWall = 'node-wall',
  /** Indicate that it is relative to Node's position (top left corder) */
  Node = 'node',
}

export enum EdgeConnectionType{
  Source = 'source',
  Target = 'target',
}
