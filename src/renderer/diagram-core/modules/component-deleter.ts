import { Component, ComponentType } from "../components/component";
import { Edge } from "../components/edge";
import { Node } from "../components/node";
import { EVENTS, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { DiagramModule } from "../module";

export class ComponentDeleter extends DiagramModule{

  constructor(readonly store: DiagramStore){
    super(store, MODULES.COMPONENT_DELETER);
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

  deleteNode(node: Node, sourceEvent: DiagramEvent): void {
    if(node.props.isOpen) return;

    let snapRestorer: Function | null = null;
    if(!sourceEvent.isRestore){
      snapRestorer = this.stateSnaper.snapNodeAsRestorer(node);
    }

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

    if(!sourceEvent.isRestore && snapRestorer){
      this.pushAction({
        undo: [
          {
            events: [EVENTS.DIAGRAM_RESTORE_COMPONENT],
            eventsPayload: { data: node },
            do: snapRestorer
          }
        ],
        redo: [
          {
            events: [EVENTS.DIAGRAM_DELETE_COMPONENT],
            eventsPayload: { data: node },
            do: () => 0
          }
        ]
      })
    }

    this.enableActionGrouping();

    // Delete all edges associated with deleted nodes
    for(let i = 0; i < edges.length; i++){
      this.store.emit(EVENTS.DIAGRAM_DELETE_COMPONENT, { data: edges[i], sourceEvent });
    }
    this.disableActionGrouping();

  }

  deleteEdge(edge: Edge, sourceEvent: DiagramEvent): void {
    let snapRestorer: Function | null = null;
    if(!sourceEvent.isRestore){
      snapRestorer = this.stateSnaper.snapEdgeAsRestorer(edge);
    }

    const { source, target } = edge;
    if(source.isAttachedToNode()){
      source.node?.removeEdgeConnection(source);
    }
    if(target.isAttachedToNode()){
      target.node?.removeEdgeConnection(target);
    }
    this.store.emit(EVENTS.EDGE_DELETED, { edge, sourceEvent });

    if(!sourceEvent.isRestore && snapRestorer){
      this.pushAction({
        undo: [
          {
            events: [EVENTS.DIAGRAM_RESTORE_COMPONENT],
            eventsPayload: { data: edge },
            do: snapRestorer
          }
        ],
        redo: [
          {
            events: [EVENTS.DIAGRAM_DELETE_COMPONENT],
            eventsPayload: { data: edge },
            do: () => 0
          }
        ]
      })
    }
  }

}
