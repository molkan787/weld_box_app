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
  private nodesLayer?: D3Node;
  private edgesLayer?: D3Node;

  constructor(readonly store: DiagramStore){
    this.nodeRenderer = new NodeRenderer(this.store);
    this.edgeRenderer = new EdgeRenderer(this.store);

    store.on(EVENTS.NODE_BBOX_CHANGED, e => this.onNodeBBoxChanged(e));
    store.on(EVENTS.NODE_ADDED, e => this.onNodeAdded(e));

    store.on(EVENTS.EDGE_CONNECTIONS_CHANGED, e => this.onEdgeConnectionsChanged(e))
  }

  /**
   * Sets canvas layers that will be used as parents of nodes & edges separatly
   * @param nodesLayer D3 selection of DOM/SVG elements that should be used as nodes parent (container)
   * @param edgesLayer D3 selection of DOM/SVG elements that should be used as edges parent (container)
   */
  setLayers(nodesLayer: D3Node, edgesLayer: D3Node){
    this.nodesLayer = nodesLayer;
    this.edgesLayer = edgesLayer;
  }

  /**
   * Build a DOM element repesenting the diagram component
   * @param container DOM element to which add childs elements
   * @param component Diagram component, either `Node` or `Edge` instance
   */
  build(container: D3Node, component: Component){
    if(component.type === ComponentType.Node){
      this.nodeRenderer.build(container || this.nodesLayer, <Node>component);
    }else if(component.type === ComponentType.Edge){
      this.edgeRenderer.build(container || this.edgesLayer, <Edge>component);
    }
  }

  /**
   * Updates visual representation of a component (Postion & Size on the canvas)
   * @param component The component instance to be updated
   */
  update(component: Component){
    if(component.type === ComponentType.Node){
      this.nodeRenderer.update(<Node>component);
    }else if(component.type === ComponentType.Edge){
      this.edgeRenderer.update(<Edge>component);
    }
  }

  onNodeAdded(event: DiagramEvent){
    const node = <Node>event.node;
    const domParent = node.parent && this.store.getD3Node(node.parent.id);
    const container = <D3Node>domParent;
    this.build(container, node);
  }

  /**
   * Handles change of Node's bounding box, Usually triggered by `NodeDragging` module
   */
  onNodeBBoxChanged(event: DiagramEvent){
    const node = <Node>event.node;
    this.nodeRenderer.update(node);

    // Casting from (Edge | undefined)[] to Edge[] because undefined cases are already filtered out
    const edges = <Edge[]>(node.edges.map(ec => ec.edge).filter(e => !!e));

    // Updating positions of all edges that are connected to the Node currently being moved
    for(let edge of edges){
      this.edgeRenderer.update(edge);
    }

  }

  onEdgeConnectionsChanged(event: DiagramEvent){
    const edge = <Edge>event.edge;
    this.edgeRenderer.update(edge);
  }

}
