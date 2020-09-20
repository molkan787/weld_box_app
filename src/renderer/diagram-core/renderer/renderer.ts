import { Component, ComponentType } from "../components/component";
import { Edge } from "../components/edge";
import { Node } from "../components/node";
import { DiagramState } from "../diagram-state";
import { D3Node } from "../types/aliases";
import { EdgeRenderer } from "./edge-renderer";
import { NodeRenderer } from "./node-renderer";

export class Renderer{

  readonly nodeRenderer: NodeRenderer;
  readonly edgeRenderer: EdgeRenderer;

  constructor(readonly state: DiagramState){
    this.nodeRenderer = new NodeRenderer(this.state);
    this.edgeRenderer = new EdgeRenderer(this.state);
  }

  build(container: D3Node, component: Component){
    if(component.type === ComponentType.Node){
      this.nodeRenderer.build(container, <Node>component);
    }else if(component.type === ComponentType.Edge){
      this.edgeRenderer.build(container, <Edge>component);
    }
  }

  update(component: Component){
    if(component.type === ComponentType.Node){
      this.nodeRenderer.update(<Node>component);
    }else if(component.type === ComponentType.Edge){
      this.edgeRenderer.update(<Edge>component);
    }
  }

}
