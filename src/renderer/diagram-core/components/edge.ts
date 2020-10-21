import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Component, ComponentType } from "./component";
import { EdgeConnection } from "./edge-connection";

export class Edge extends Component{

  public store?: DiagramStore;

  private _highlighted: boolean = false;

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

  public select(){
    this.highlighted = true;
  }

}
