import { Component, ComponentType } from "../components/component";
import { Edge } from "../components/edge";
import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";

export class ComponentDeleter{

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.DIAGRAM_DELETE_COMPONENT, e => this.onDeleteComponent(e));
  }

  onDeleteComponent(e: DiagramEvent): void {
    const component = <Component>e.data;
    if(component.type == ComponentType.Node){
      this.deleteNode(<Node>component, e);
    }else if(component.type == ComponentType.Edge){
      this.deleteEdge(<Edge>component, e);
    }
  }

  deleteNode(node: Node, sourceEvent: any): void {
    if(node.props.isOpen) return;

    const nodes = node.getAllDescendentsNodes();
    const edges: Edge[] = [];
    for(let i = 0; i < nodes.length; i++){
      const n = nodes[i];
      this.store.removeNode(n);
      this.store.emit(EVENTS.NODE_DELETED, { node, sourceEvent });
      const localEdges = n.edges.map(ec => <Edge>ec.edge);
      edges.push(...localEdges);
    }
    if(node.parent){
      node.parent.removeChild(node);
    }

    // Delete all edges associated with deleted nodes
    for(let i = 0; i < edges.length; i++){
      this.store.emit(EVENTS.DIAGRAM_DELETE_COMPONENT, { data: edges[i], sourceEvent });
    }

  }

  deleteEdge(edge: Edge, sourceEvent: any): void {
    const { source, target } = edge;
    if(source.isAttachedToNode()){
      source.node?.removeEdgeConnection(source);
    }
    if(target.isAttachedToNode()){
      target.node?.removeEdgeConnection(target);
    }
    this.store.emit(EVENTS.EDGE_DELETED, { edge, sourceEvent });
  }

}
