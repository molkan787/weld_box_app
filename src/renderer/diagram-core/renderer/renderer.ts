import { Component, ComponentType } from "../components/component";
import { Edge } from "../components/edge";
import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { D3Node } from "../types/aliases";
import { EdgeRenderer } from "./edge-renderer";
import { NodeRenderer } from "./node-renderer";

export class Renderer{

  readonly nodeRenderer: NodeRenderer;
  readonly edgeRenderer: EdgeRenderer;

  constructor(readonly store: DiagramStore){
    this.nodeRenderer = new NodeRenderer(this.store);
    this.edgeRenderer = new EdgeRenderer(this.store);

    store.on(EVENTS.NODE_BBOX_CHANGED, e => this.onNodeBBoxChanged(e));
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

  onNodeBBoxChanged(event: DiagramEvent){
    const { node } = event;
    this.nodeRenderer.update(node);

    // Casting from (Edge | undefined)[] to Edge[] because undefined cases are already filtered out
    const edges = <Edge[]>(node.edges.map(ec => ec.edge).filter(e => !!e));

    // Updating positions of all edges that are connected to the Node currently being moved
    for(let edge of edges){
      this.edgeRenderer.update(edge);
    }
  }

}
