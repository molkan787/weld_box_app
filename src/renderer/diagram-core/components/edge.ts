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

  constructor(
    public source: EdgeConnection,
    public target: EdgeConnection
  ){
    super(ComponentType.Edge);
    source.edge = this;
    target.edge = this;
  }

  public setSource(source: EdgeConnection){
    this.source = source;
    source.edge = this;
  }

  public setTarget(target: EdgeConnection){
    this.target = target;
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
