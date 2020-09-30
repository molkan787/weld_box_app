import { select } from "d3";
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
    store.on(EVENTS.INIT_CANVAS_CREATED, e => this.onCanvasCreated(e));
    store.on(EVENTS.NODE_DRAGSTART, (e) => this.onNodeDragStart(e));
    store.on(EVENTS.NODE_DRAGGED, (e) => this.onNodeDragged(e));
    store.on(EVENTS.NODE_DROPPED, (e) => this.onNodeDropped(e));
  }

  onCanvasCreated(e: DiagramEvent){
    const element = this.store.rootElement; // rootElement is the actual canvas root element
    element.on('mousemove', (e: any) => this.onMouseMove(e));
  }


//#region Edge drawing logic

  onNodeDragStart(event: DiagramEvent){
    const srcElement: HTMLElement = event.sourceEvent?.sourceEvent?.srcElement;
    const isLine = srcElement.tagName === 'line' && srcElement.classList.contains(HIGHLIGHT_LINE);
    const wall: Side = parseInt(srcElement.getAttribute(ATTR.WALL_SIDE) || '0');
    if(isLine && wall){
      const node = this.nodeInSubject;
      // un-highlight node's wall
      if(node !== null){
        this.nodeInSubject = null;
        if(node.highlightedWall !== null){
          node.highlightedWall = null;
          this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node, sourceEvent: event });
        }
      }
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

    const mouseevent = event.sourceEvent.sourceEvent;
    this.onMouseMove(mouseevent);
  }

  getEdgeConnectionOffset(node: Node, wall: Side, sourceEvent: any): Position{
    const { sourceEvent: mouseevent } = sourceEvent;
    const { clientX, clientY } = mouseevent;
    const point = this.store.transformClientPoint({ x: clientX, y: clientY });
    const pos = node.position;
    const offset = { x: 0, y: 0}
    if(wall == Side.Top || wall == Side.Bottom){
      offset.x = point.x - pos.x - node.size.width / 2;
    }else if(wall == Side.Left || wall == Side.Right){
      offset.y = point.y - pos.y - node.size.height / 2;
    }
    return offset;
  }

  onNodeDropped(event: DiagramEvent){
    const node = this.nodeInSubject;
    if(node && node.highlightedWall){
      const offset = this.getEdgeConnectionOffset(node, node.highlightedWall, event.sourceEvent);
      const targetConnection = node.createEdgeConnection(node.highlightedWall);
      targetConnection.offset = offset;
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

  onMouseMove(event: MouseEvent){
    if(this.store.nodeDraggingTool) return;

    const point = {
      x: event.clientX,
      y: event.clientY
    };
    const transformedPoint = this.store.transformClientPoint(point, true);
    const node = this.store.getNodesFromPoint(transformedPoint, 8)[0];

    const subject = this.nodeInSubject;
    if(node !== subject && subject !== null){
      if(subject.highlightedWall){
        subject.highlightedWall = null;
        this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: subject, sourceEvent: event });
      }
    }

    if(!node) return;

    const { size, position } = node;
    const bbox = new DOMRect(position.x, position.y, size.width, size.height);
    const touchWall = TouchesWall(bbox, transformedPoint, 10);
    if(node.highlightedWall !== touchWall){
      node.highlightedWall = touchWall;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node, sourceEvent: event });
    }
    this.nodeInSubject = touchWall ? node : null;
  }

//#endregion

}
