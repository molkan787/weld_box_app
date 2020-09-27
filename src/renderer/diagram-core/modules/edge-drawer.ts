import { Edge } from "../components/edge";
import { AttachType, EdgeConnection } from "../components/edge-connection";
import { Node } from "../components/node";
import { ATTR, EVENTS, HIGHLIGHT_LINE } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Side, TouchesWall } from "../helpers/geometry";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";

export class EdgeDrawer{

  private currentEdge: Edge | null = null;

  /** Could be the Source node or target candidate */
  private nodeInSubject: Node | null = null;

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.NODE_ADDED, ({node}: DiagramEvent) => this.onNodeAdded(<Node>node));
    store.on(EVENTS.NODE_DRAGSTART, (e) => this.onNodeDragStart(e));
    store.on(EVENTS.NODE_DRAGGED, (e) => this.onNodeDragged(e));
    store.on(EVENTS.NODE_DROPPED, (e) => this.onNodeDropped(e));
  }

  onNodeAdded(node: Node){
    const d3node = this.store.getD3Node(node.id);
    d3node?.on('mousemove', (e: any) => this.onMouseMove(e, node));
    d3node?.on('mouseleave', (e: any) => this.onMouseLeave(e, node));
  }

//#region Edge drawing logic

  onNodeDragStart(event: DiagramEvent){
    const srcElement: HTMLElement = event.sourceEvent?.sourceEvent?.srcElement;
    const isLine = srcElement.tagName === 'line' && srcElement.classList.contains(HIGHLIGHT_LINE);
    const wall: Side = parseInt(srcElement.getAttribute(ATTR.WALL_SIDE) || '0');
    if(isLine && wall){
      this.spawnNewEdge(<Node>event.node, wall, event.sourceEvent);
    }
  }

  spawnNewEdge(node: Node, wall: Side, sourceEvent: any){
    const { x, y } = sourceEvent;
    const sourceOffset = this.getEdgeConnectionOffset(node, wall, sourceEvent);
    const source = node.createEdgeConnection(wall);
    const target = new EdgeConnection(AttachType.Position);
    source.offset = sourceOffset;
    target.position = { x, y };
    const edge = new Edge(source, target);
    this.currentEdge = edge;
    this.store.emit(EVENTS.EDGE_CREATED, { edge });
  }

  onNodeDragged(event: DiagramEvent){
    if(this.currentEdge === null) return;
    const edge: Edge = this.currentEdge;
    const { x, y } = event.sourceEvent;
    const point = { x, y };
    const targetConnection = new EdgeConnection(AttachType.Position);
    targetConnection.position = point;
    edge.setTarget(targetConnection);
    this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge });

    const targetCandidateNode = this.store.getNodesFromPoint(point)[0];
    if(targetCandidateNode && targetCandidateNode !== event.node){
      const mouseevent = event.sourceEvent.sourceEvent;
      this.onMouseMove(mouseevent, targetCandidateNode);
    }
  }

  getEdgeConnectionOffset(node: Node, wall: Side, sourceEvent: any): Position{
    // TODO: scale the offset depending on canvas/diagram zoom level
    const { sourceEvent: mouseevent } = sourceEvent;
    const { clientX, clientY, srcElement } = mouseevent;
    const bbox = (<HTMLElement>srcElement).getBoundingClientRect();
    const offset = { x: 0, y: 0}
    if(wall == Side.Top || wall == Side.Bottom){
      offset.x = clientX - bbox.x - node.size.width / 2;
      console.log(clientX, bbox.x, node.size.width)
    }else if(wall == Side.Left || wall == Side.Right){
      offset.y = clientY - bbox.y - node.size.height / 2;
    }
    return offset;
  }

  onNodeDropped(event: DiagramEvent){
    const node = this.nodeInSubject;
    if(node && node.highlightedWall){
      // const offset = this.getEdgeConnectionOffset(node, node.highlightedWall, event.sourceEvent);
      const targetConnection = node.createEdgeConnection(node.highlightedWall);
      // targetConnection.offset = offset;
      const edge = <Edge>this.currentEdge;
      edge.setTarget(targetConnection);
      node.highlightedWall = null;
      this.currentEdge = null;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node });
      this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge });
    }
    this.currentEdge = null;

    // TODO: move logic below to the store itself ( store.activateNodeDragging(); )
    this.store.nodeDraggingTool = true;
    this.store.emit(EVENTS.DIAGRAM_NODE_DRAGGING_ENABLED, {});
  }
//#endregion

//#region Node's walls detecting logic

  onMouseMove(event: MouseEvent, node: Node){
    if(this.store.nodeDraggingTool) return;

    const d3node = this.store.getD3Node(node.id);
    const bbox = (<HTMLElement>d3node?.node()).getBoundingClientRect();
    const touchWall = TouchesWall(bbox, {
      x: event.clientX,
      y: event.clientY
    })
    if(node.highlightedWall !== touchWall){
      node.highlightedWall = touchWall;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node, sourceEvent: event });
    }
    this.nodeInSubject = touchWall ? node : null;
  }

  onMouseLeave(event: MouseEvent, node: Node){
    if(this.store.nodeDraggingTool) return;

    if(node.highlightedWall){
      node.highlightedWall = null;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node, sourceEvent: event });
    }
  }

//#endregion

}
