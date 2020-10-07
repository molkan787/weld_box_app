import { Edge } from "../components/edge";
import { AttachType, EdgeConnection } from "../components/edge-connection";
import { Node } from "../components/node";
import { ATTR, EVENTS, CLASSES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Side, TouchesWall } from "../helpers/geometry";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";

export class EdgeDrawer{

  private currentEdge: Edge | null = null;

  /** Can be the Source node or target candidate */
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
    const isLine = srcElement.classList.contains(CLASSES.HIGHLIGHT_LINE);
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
      this.spawnNewEdge(<Node>event.node, wall, event);
    }
  }

  spawnNewEdge(node: Node, wall: Side, event: DiagramEvent){
    const srcEvent = event.sourceEvent;
    const { x, y } = srcEvent.sourceEvent;
    const targetPoint = this.store.transformClientPoint({ x, y });
    const sourceOffset = this.getEdgeConnectionOffset(node, wall, srcEvent);
    const source = node.createEdgeConnection(wall);
    const target = new EdgeConnection(AttachType.Position);
    source.offset = sourceOffset;
    target.position = targetPoint;
    const edge = new Edge(source, target);
    this.currentEdge = edge;
    this.store.emit(EVENTS.EDGE_CREATED, { edge });
  }

  onNodeDragged(event: DiagramEvent){
    if(this.currentEdge === null) return;
    const edge: Edge = this.currentEdge;
    const { x, y } = event.sourceEvent.sourceEvent;
    const point = this.store.transformClientPoint({ x, y });
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
    const point = this.store.transformClientPoint({ x: clientX, y: clientY }, true);
    const pos = node.getAbsolutePosition();
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
    const nodes = this.store.getNodesFromPoint(transformedPoint, 6);

    let subject: Node | null = null;
    let touchedWall: Side | null = null;

    // Find a node that one of his walls was touched (overlapped) with mouse pointer
    for(let node of nodes){
      const { size } = node;
      const position = node.getAbsolutePosition();
      const bbox = new DOMRect(position.x, position.y, size.width, size.height);
      const wall = TouchesWall(bbox, transformedPoint, 10);
      if(wall != null){
        subject = node;
        touchedWall = wall;
        break;
      }
    }

    const prevSubject = this.nodeInSubject;

    // if that was previously a subject node and was is not the new found one
    // un-highlight the wall of that previous subject
    if(subject !== prevSubject && prevSubject !== null){
      if(prevSubject.highlightedWall){
        prevSubject.highlightedWall = null;
        this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: prevSubject, sourceEvent: event });
      }
    }

    if(subject && touchedWall && subject.highlightedWall !== touchedWall){
      subject.highlightedWall = touchedWall;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: subject, sourceEvent: event });
    }
    this.nodeInSubject = subject;

  }

//#endregion

}
