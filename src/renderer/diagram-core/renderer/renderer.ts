import { Component, ComponentType } from "../components/component";
import { Edge } from "../components/edge";
import { Node } from "../components/node";
import { D3Node, D3NodesMap } from "../types/aliases";
import { EdgeRenderer } from "./edge-renderer";
import { NodeRenderer } from "./node-renderer";

export class Renderer{

  readonly nodeRenderer: NodeRenderer;
  readonly edgeRenderer: EdgeRenderer;

  constructor(readonly d3NodesMap: D3NodesMap){
    this.nodeRenderer = new NodeRenderer(this.d3NodesMap);
    this.edgeRenderer = new EdgeRenderer(this.d3NodesMap);
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
