import { Component, ComponentType } from "./component";
import { EdgeConnection } from "./edge-connection";

export class Edge extends Component{

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

}
