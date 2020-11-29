import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Position } from "../interfaces/Position";
import { D3Node } from "../types/aliases";
import { Component, ComponentType } from "./component";
import { EdgeConnection } from "./edge-connection";

export class Edge extends Component{

  public store?: DiagramStore;

  private _highlighted: boolean = false;

  public shapePoints: Position[] = [];
  public offsettedStartPoint: Position = { x: 0, y: 0 };
  public centerPoint: Position = { x: 0, y: 0 };

  private _isMultipart: boolean;
  /**
   * Indicates whether the edge is a multipart edge.
   * (ex: inter-chart edge is combined of two separate edge the outer and the inner edges)
   * @readonly
   */
  public get isMultipart(): boolean{
    return this._isMultipart;
  }

  private _multipartLocation: MultipartEdgeLocation;
  /**
   * Indicates the part location of a multipart edge, can be either Outer or Inner.
   * (ex: the `Inner` part is inside the sub-chart's body, and the `Outer` part is on the sub-chart's parent body)
   * @readonly
   */
  public get multipartLocation(): MultipartEdgeLocation{
    return this._multipartLocation;
  }

  private _multipartType: MultipartEdgeType;
  /**
   * Indicates the part type of a multipart edge.
   * (ex: a multipart-edge with a `MultipartEdgeType.Starting` type, is an edge part that was drawn from a Node to sub-chart body (or attach box, or bridge) )
   */
  public get multipartType(): MultipartEdgeType{
    return this._multipartType;
  }

  public isStart: boolean = false

  constructor(
    private _source: EdgeConnection,
    private _target: EdgeConnection,
    isMultipart: boolean = false,
    multipartLocation: MultipartEdgeLocation = MultipartEdgeLocation.Outer,
    multipartType: MultipartEdgeType = MultipartEdgeType.Starting
  ){
    super(ComponentType.Edge);
    _source.edge = this;
    _target.edge = this;
    this._isMultipart = isMultipart;
    this._multipartLocation = multipartLocation;
    this._multipartType = multipartType;
  }

  public convertToMultipart(location: MultipartEdgeLocation, type: MultipartEdgeType){
    this._isMultipart = true;
    this._multipartLocation = location;
    this._multipartType = type;
  }

  public convertToNormal(){
    this._isMultipart = false;
  }

  public get source(): EdgeConnection{
    return this._source;
  }

  public get target(): EdgeConnection{
    return this._target;
  }

  public setSource(source: EdgeConnection){
    this._source = source;
    source.edge = this;
  }

  public setTarget(target: EdgeConnection){
    this._target = target;
    target.edge = this;
  }

  public get highlighted(){
    return this._highlighted;
  }

  public set highlighted(value: boolean){
    const previous = this._highlighted;
    this._highlighted = value;
    if(previous !== value){
      this.store?.emit(EVENTS.EDGE_DECORATION_CHANGED, { edge: this });
    }
  }

  /**
   * Gets the actual edge instance,
   * if this edge is a continuation of another edge returns that another edge,
   * otherwise returns itself
   * @returns {Edge}
   */
  public getInstance(){
    if(this.source.isBridge){
      const bt = this.source.bridgeTo;
      return (bt && bt.edge) || this;
    }else{
      return this;
    }
  }

  public select(){
    this.highlighted = true;
  }

  /**
   * A life cycle hook, called after initial build of DOM element of the edge.
   * Can be used to add custom content
   * @param d3node D3's selection of edge's DOM element
   */
  public DOMElementBuilt(d3node: D3Node){}

  /**
   * A life cycle hook, called before destroying DOM element of the edge.
   * Can be used to clean up custom content
   * @param d3node D3's selection of edge's DOM element
   */
  public BeforeDOMElementDestroy(d3node: D3Node){}

  /**
   * An event handler for user interation with DOM elements,
   * called only for the corresponding Edge instance and its DOM elements
   * @param eventType {String} event type
   * @param data {String} content of `emit-data` attribute of the source element (element that trigger the event () )
   * @param sourceElement
   */
  public onDOMInteraction(eventType: string, data: any, sourceEvent: Event | null){}

}

/**
 * Types of multipart-edge parts, each part can have its own type
 */
export enum MultipartEdgeLocation{
  /**
   * Indicates that the part of the multipart edge is on the outer side, meaning on the sub-chart's parent body
   */
  Outer = 'outer',
  /**
   * Indicates that the part of the multipart edge is on the outer side, meaning on the sub-chart's body
   */
  Inner = 'inner',
}

export enum MultipartEdgeType{
  Starting = 'starting-edge-part',
  Ending = 'ending-edge-part'
}
