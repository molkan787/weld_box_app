import { Component, ComponentType } from "../components/component";
import { Edge, MultipartEdgeType } from "../components/edge";
import { Node } from "../components/node";
import { EVENTS, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { DiagramModule } from "../module";

/**
 * Handles the Component's deletion process
 */
export class ComponentDeleter extends DiagramModule{

  constructor(readonly store: DiagramStore){
    super(store, MODULES.COMPONENT_DELETER);
    store.on(EVENTS.DIAGRAM_DELETE_COMPONENT, e => this.onDeleteComponent(e));
  }

  /** Handles component delete event */
  onDeleteComponent(e: DiagramEvent): void {
    const component = <Component>e.data;
    if(component.type == ComponentType.Node){
      this.deleteNode(<Node>component, e);
    }else if(component.type == ComponentType.Edge){
      this.deleteEdge(<Edge>component, e);
    }
  }

  /** Delete node from the canvas, this method will be called recursivly for all childs of the deleted nodes */
  deleteNode(node: Node, sourceEvent: DiagramEvent): void {
    if(node.isOpen) return;

    let snapRestorer: Function | null = null;
    if(!sourceEvent.isRestore){
      snapRestorer = this.stateSnaper.snapNodeAsRestorer(node);
    }

    const parent = node.parent;
    if(parent){
      parent.removeChild(node);
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

    // if the sender is this module we can skip deleting edges because it a sub-sequent call of a recursive deleting,
    // so the remaining edges are attached between childs of the originally deleted node, hence they won't be visibile or rendered by any mean anyway
    if(sourceEvent.sender !== this){
      const edges = node.edges
                        .map(ec => <Edge>ec.edge)
                        .filter(e => !e.isMultipart || e.multipartType == MultipartEdgeType.Starting);
      // Delete all edges associated with deleted node
      for(let i = 0; i < edges.length; i++){
        this.enableActionGrouping();
        this.store.emit(EVENTS.DIAGRAM_DELETE_COMPONENT, { data: edges[i], sourceEvent });
      }
    }

    const childs = node.children;
    for(let i = childs.length - 1; i >= 0; i--){
      this.enableActionGrouping();
      this.store.emit(EVENTS.DIAGRAM_DELETE_COMPONENT, { data: childs[i], sender: this });
    }

    this.store.emit(EVENTS.NODE_DELETED, { node, sourceEvent, data: parent });
    this.store.removeNode(node);

    this.disableActionGrouping();

  }

  /** Deletes Edge from the canvas */
  deleteEdge(edge: Edge, sourceEvent: DiagramEvent): void {
    let snapRestorer: Function | null = null;
    if(!sourceEvent.isRestore){
      snapRestorer = this.stateSnaper.snapEdgeAsRestorer(edge);
    }

    const { source, target } = edge;
    const sourceNode = source.node;
    if(source.isAttachedToNode()){
      source.node?.removeEdgeConnection(source);
    }
    if(target.isAttachedToNode()){
      target.node?.removeEdgeConnection(target);
    }
    this.store.edgesMap.delete(edge.id);

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

    this.store.emit(EVENTS.EDGE_DELETED, { edge, sourceEvent, data: sourceNode, isRestore: sourceEvent.isRestore });

    if(edge.isMultipart && edge.multipartType == MultipartEdgeType.Starting && target.bridgeFrom){
      const secondEdge = target.bridgeFrom.edge;
      if(edge){
        this.enableActionGrouping();
        this.store.emit(EVENTS.DIAGRAM_DELETE_COMPONENT, { data: secondEdge });
        this.disableActionGrouping();
      }
    }
  }

}
