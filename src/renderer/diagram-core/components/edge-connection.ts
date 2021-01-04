import { Side, GetRectWallCenterPoint, polarToCartesian, findEmptySpot } from "../helpers/geometry";
import { capNumber } from "../helpers/math";
import { Position } from "../interfaces/Position";
import { Component, ComponentType } from "./component";
import { Edge } from "./edge";
import { Node } from "./node";

export class EdgeConnection extends Component{

  /** The parent edge instance */
  public edge: Edge | null = null;
  /** The position of the EdgeConnection, when the `attachType` is `AttachType.Position` */
  public position?: Position;
  /** The offset from the origin position (position of its connected target) of the EdgeConnection */
  public offset?: Position;
  /** An EdgeConnection instance, if a value is assigned this instance will act as a shadow of the bridgeTo instance, which will use its position & offset */
  public bridgeTo: EdgeConnection | null = null;
  /** An EdgeConnection instance, that bridges to this instance, used to keep bidirectional refference */
  public bridgeFrom: EdgeConnection | null = null;
  /** Node instance to which this EdgeConnection is attached to */
  private _node: Node | null = null;
  /** An offset relative the second end EdgeConnection of the parent edge */
  public toSecondEndOffset: Position = { x: 0, y: 0 };

  /** Node instance to which this EdgeConnection is attached to */
  public get node(): Node | null{
    return this._node;
  }

  public set node(node: Node | null){
    this._node = node;
  }

  /** Cached result of calculateCoordinates() method */
  private _coordinates: Position = { x: 0, y: 0 };
  public lastSpacingOffset: number = 0;

  constructor(
    public attachType: AttachType = AttachType.Position,
    public nodeWall: Side = Side.Top
  ){
    super(ComponentType.EdgeConnection);
  }

  /**
   * If this `EdgeConnection` instance is a bridged to another instance returns the last one, otherwise returns itself
   */
  public getInstance(): EdgeConnection{
    return this.bridgeTo ? this.bridgeTo.getInstance() : this;
  }

  /**
   * Returns `true` if this instance is bridge (It is shadow of another EdgeConnection instance).
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

  /**
   * Returns the absolute position
   * @param skipOffset if `true` the returned position won't include the offset from the origin position
   */
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

  /** Returns the absolute position */
  public get coordinates(){
    return this.getCoordinates();
  }

  /**
   * Calculates & returns the absolute position, Also caches the result which can be later retived using `coordinates` getter
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
      const needCapping = this.isAttachedToNode(true) && node != null;
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

      const n = <Node>node;
      const min = n.getAbsolutePosition(true)[axis] || 1;
      const max = min + n.size[axis == 'x' ? 'width' : 'height'] || 1;

      for(let i = 0; i < 1; i++){
        const spacing = this.needSpacingOffset(result, min + 10, max - 10);
        if(needCapping && node != null && typeof spacing == 'number'){
          result[axis] += spacing;
        }
      }

    }


    this._coordinates = result;
    return result;
  }

  /**
   * Calculates the offset relative to Node with circular shape
   * @param center The center point of the Node
   */
  private calcCircleOffset(center: Position): Position{
    const otherPoint = this.getOtherEcPosition();
    if(otherPoint){
      const angle = Math.atan2(otherPoint.y - center.y, otherPoint.x - center.x);
      return polarToCartesian(7.5, angle);
    }else{
      return { x: 0, y: 0 };
    }
  }

  /**
   * Return the position of the second end (EdgeConnection) of the parent Edge
   */
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
   * Returns one axis offset that this EdgeConnection needs to distance its self from other EdgeConnections, if no offset is needed it returns `false`
   * @param position the position before distancing
   */
  private needSpacingOffset(position: Position, min: number, max: number): number | false{
    const at = this.attachType;
    if(!(at == AttachType.NodeBody || AttachType.NodeWall)) return 0;
    const others = this.getSameSideSources();
    if(others.length == 0){
      this.lastSpacingOffset = 0;
      return false;
    }
    const axis = this.getVariableAxis();
    const mypos = position[axis];
    const dir = Math.sign(this._coordinates[axis] - mypos) || 1;
    const occupied = others.map(o => o._coordinates[axis]);
    const newPos = findEmptySpot(mypos, occupied, 10, dir, min, max);
    const diff = newPos - mypos;
    if(Math.abs(diff) > 1){
      return diff;
    }
    return false;
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
  /** EdgeConnection is the Source of the Edge */
  Source = 'source',
  /** EdgeConnection is the Target of the Edge */
  Target = 'target',
}
