import { Edge } from "../components/edge";
import { AttachType, EdgeConnection, EdgeConnectionType } from "../components/edge-connection";
import { Node } from "../components/node";
import { ATTR, EVENTS, CLASSES, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { isPointInsideBBox, Side, TouchesWall } from "../helpers/geometry";
import { distSqrd } from "../helpers/geometry";
import { capNumber } from "../helpers/math";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";
import { DiagramModule } from "../module";
import { cloneObject } from "../utils";

export class EdgeDrawer extends DiagramModule{

  /** Holds reffernce to the edge that is current being drawn */
  private currentEdge: Edge | null = null;

  /** Can be the Source node or target candidate */
  private nodeInSubject: Node | null = null;

  private redrawing: boolean = false;
  private cache = {
    previousTarget: <EdgeConnection | null>null,
    previousTargetNode: <Node | null>null,
  };

  public get edgeFactory(){
    return this.store.edgeFactory;
  }

  constructor(store: DiagramStore){
    super(store, MODULES.EDGE_DRAWER);

    store.on(EVENTS.NODE_DRAGSTART, (e) => this.onNodeDragStart(e));
    store.on(EVENTS.NODE_DRAGGED, (e) => this.onNodeDragged(e));
    store.on(EVENTS.EDGE_CONNECTIONS_UPDATED, (e) => this.onEdgeConnectionsUpdated(e));
    store.on(EVENTS.EDGE_CONNECTIONS_CHANGED, (e) => this.onEdgeConnectionsChanged(e));
    store.on(EVENTS.CANVAS_MOUSEMOVE, (e) => this.onCanvasMouseMove(e.sourceEvent));
    store.on(EVENTS.CANVAS_MOUSEUP, (e) => this.onCanvasMouseUp(e.sourceEvent));
    store.on(EVENTS.EDGE_MOUSEDOWN_ON_ENDS, (e) => this.onEdgeMouseDownOnEnds(e));
  }

  private onEdgeMouseDownOnEnds(event: DiagramEvent){
    const edge = <Edge>event.edge;
    this.raiseEdgeEnd(edge, EdgeConnectionType.Target);
  }

  private raiseEdgeEnd(edge: Edge, end: EdgeConnectionType){
    this.currentEdge = edge;
    if(end == EdgeConnectionType.Target){
      const { target } = edge;
      this.cache.previousTarget = target;
      this.cache.previousTargetNode = target.node;
      target.node?.removeEdgeConnection(target);
      const newTarget = new EdgeConnection(AttachType.Position);
      newTarget.position = cloneObject(edge.target.coordinates);
      edge.setTarget(newTarget);
    }else{
      throw new Error(`Edge end '${end}' isn't supported`);
    }
    this.redrawing = true;
    this.activate();
    this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge });
  }


//#region Edge drawing logic

  onNodeDragStart(event: DiagramEvent){
    if(this.isInactive || this.redrawing) return;
                                    // the first sourceEvent is the D3.Drag event, the second is the native MouseEvent
    const srcElement: HTMLElement = event.sourceEvent?.sourceEvent?.srcElement;
    const isAB = srcElement && srcElement.classList.contains(CLASSES.ATTACH_BOX);
    // const wall: Side = parseInt(srcElement.getAttribute(ATTR.WALL_SIDE) || '0');

    if(isAB){
      const node = <Node>event.node;
      const edgeId = parseInt(srcElement.getAttribute(ATTR.COMPONENT_ID) || '0');
      const edgeConnection = this.getNodeEdgeConnection(node, edgeId)
      if(edgeConnection){
        this.spawnNewEdgeFromAttachBox(node, edgeConnection, event);
      }
    }

    const node = this.nodeInSubject;
    if(node !== null){
      this.nodeInSubject = null;
      const wall = node.highlightedWall;

      // un-highlight node
      node.highlightedWall = null;
      node.highlighted = false;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node, sourceEvent: event });

      this.spawnNewEdge(node, wall, event);
    }
  }

  spawnNewEdgeFromAttachBox(node: Node, attachBox: EdgeConnection, event: DiagramEvent){
    const srcEvent = event.sourceEvent;
    const { x, y } = srcEvent.sourceEvent;
    const targetPoint = this.store.transformClientPoint({ x, y });
    const target = new EdgeConnection(AttachType.Position);
    target.position = targetPoint;
    const source = node.createEdgeConnection();
    attachBox.bridgeFrom = source;
    source.bridgeTo = attachBox;
    const edge = this.edgeFactory(source, target);
    this.currentEdge = edge;
    this.store.emit(EVENTS.EDGE_CREATED, { edge });
  }

  spawnNewEdge(node: Node, wall: Side | null, event: DiagramEvent){
    const srcEvent = event.sourceEvent;
    const { x, y } = srcEvent.sourceEvent;
    const targetPoint = this.store.transformClientPoint({ x, y });
    const sourceOffset = this.getEdgeConnectionOffset(node, wall || Side.Top, srcEvent);
    const source = node.createEdgeConnection(wall || undefined);
    const target = new EdgeConnection(AttachType.Position);
    source.offset = sourceOffset;
    target.position = targetPoint;
    const edge = this.edgeFactory(source, target);
    this.currentEdge = edge;
    this.store.emit(EVENTS.EDGE_CREATED, { edge });
  }

  getNodeEdgeConnection(node: Node, edgeId: number): EdgeConnection | null{
    return node.edges.find(e => e.id === edgeId) || null;
  }

  onNodeDragged(event: DiagramEvent){
    if(this.isInactive) return;
    const mouseevent = event.sourceEvent.sourceEvent;
    this.onCanvasMouseMove(mouseevent);
  }

  onCanvasMouseUp(event: MouseEvent){
    this.endEdgeDrawing(event);
  }

  followCursor(event: MouseEvent){
    if(this.currentEdge === null) return;
    const edge: Edge = this.currentEdge;
    const { x, y } = event;
    const point = this.store.transformClientPoint({ x, y });
    const targetConnection = new EdgeConnection(AttachType.Position);
    targetConnection.position = point;
    edge.setTarget(targetConnection);
    this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, { edge });
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

  endEdgeDrawing(event: MouseEvent){
    if(this.isInactive) return;

    const node = this.nodeInSubject;
    const edge = this.currentEdge;
    if(node && edge){
      const targetConnection = node.createEdgeConnection(node.highlightedWall || undefined);
      edge.setTarget(targetConnection);
      node.highlightedWall = null;
      node.highlighted = false;
      this.currentEdge = null;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node });
      this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge });
    }else if(edge && edge.source.node){
      const trgPos = <Position>edge.target.position;
      const ab = this.getAttachBoxAtDropPosition(event);
      if(ab && ab.node){
        const target = ab.node.createEdgeConnection();
        target.setBridge(ab);
        target.edge = edge;
        edge.target = target;
      }else{
        const srcNode = edge.source.node;
        const srcPos = srcNode.getAbsolutePosition();
        const offset: Position = {
          x: trgPos.x - srcPos.x,
          y: trgPos.y - srcPos.y
        }
        const target = new EdgeConnection(AttachType.Node);
        target.offset = offset;
        target.node = srcNode;
        edge.target = target;
      }
      this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge, sourceEvent: event });
    }
    this.currentEdge = null;

    if(edge){
      if(this.redrawing){
        this.pushReDrawnAction(edge);
      }else{
        this.pushSpawnAction(edge);
      }
    }

    setTimeout(() => {
      this.deactivate();
      if(node){
        node.highlightedWall = null;
        node.highlighted = false;
        this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node });
      }
    }, 30)
    this.redrawing = false;
  }

  private getAttachBoxAtDropPosition(event: MouseEvent): EdgeConnection | null{
    const node = this.store.currentlyOpenNode;
    if(!node) return null;
    const { clientX, clientY } = event;
    const rootEl = this.store.rootElement;
    rootEl.classed(CLASSES.EDGES_NOT_CLICKABLE, true); // prevents picking edges elements by document.elementFromPoint()
    const el = document.elementFromPoint(clientX, clientY);
    rootEl.classed(CLASSES.EDGES_NOT_CLICKABLE, false);
    if(el && el.classList.contains(CLASSES.ATTACH_BOX)){
      const edgeId = parseInt(el.getAttribute(ATTR.COMPONENT_ID) || '0');
      const edgeConnection = this.getNodeEdgeConnection(node, edgeId);
      return edgeConnection;
    }
    return null;
  }

  pushReDrawnAction(edge: Edge){
    const oldTarget = <EdgeConnection>this.cache.previousTarget;
    const newTarget = edge.target;
    const oldNode = this.cache.previousTargetNode;
    const newNode = newTarget.node;
    this.pushAction({
      undo: [
        {
          events: [EVENTS.EDGE_CONNECTIONS_CHANGED],
          eventsPayload: { edge },
          do(){
            newNode?.removeEdgeConnection(newTarget);
            newTarget.edge = null;
            edge.setTarget(oldTarget);
            oldNode?.addEdgeConnection(oldTarget);
          }
        }
      ],
      redo: [
        {
          events: [EVENTS.EDGE_CONNECTIONS_CHANGED],
          eventsPayload: { edge },
          do(){
            oldNode?.removeEdgeConnection(oldTarget);
            oldTarget.edge = null;
            edge.setTarget(newTarget);
            newNode?.addEdgeConnection(newTarget);
          }
        }
      ]
    });
  }

  pushSpawnAction(edge: Edge){
    this.pushAction({
      undo: [
        {
          events: [EVENTS.DIAGRAM_DELETE_COMPONENT],
          eventsPayload: { data: edge },
          do: () => 0
        }
      ],
      redo: [
        {
          events: [EVENTS.DIAGRAM_RESTORE_COMPONENT],
          eventsPayload: { data: edge },
          do: this.stateSnaper.snapEdgeAsRestorer(edge)
        }
      ]
    })
  }

//#endregion

//#region Attach object finding logic

  onCanvasMouseMove(event: MouseEvent){
    if(this.isInactive) return;
    this.followCursor(event);

    const point = {
      x: event.clientX,
      y: event.clientY
    };
    const transformedPoint = this.store.transformClientPoint(point, true);
    let nodes = this.store.getNodesFromPoint(transformedPoint, 6);
    nodes = nodes.filter(n => !!n.parent && (!n.isBasic || n.isCircle));

    let subject: Node | null = null;
    let touchedWall: Side | null = null;

    // Find a node that one of his walls was touched (overlapped) with mouse pointer
    for(const node of nodes){
      if(!node.isCircle){
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
    }

    if(subject === null){
      for(const node of nodes){
        if(node.showContent === false || node.isCircle){
          const pos = node.getAbsolutePosition(true);
          const size = node.size;
          const rect = new DOMRect(pos.x, pos.y, size.width, size.height);
          const inside = isPointInsideBBox(transformedPoint, rect, 10);
          if(inside){
            subject = node;
            break;
          }
        }
      }
    }

    const prevSubject = this.nodeInSubject;

    // if that was previously a subject node and its not the newly found one
    // un-highlight the wall of that previous subject
    if(prevSubject !== null){
      if(subject !== prevSubject){
        prevSubject.highlightedWall = null;
        prevSubject.highlighted = false;
      }else if(touchedWall === null){
        prevSubject.highlightedWall = null;
      }
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: prevSubject, sourceEvent: event });
    }

    if(subject){
      if(touchedWall){
        if(subject.highlightedWall !== touchedWall){
          subject.highlightedWall = touchedWall;
          subject.highlighted = false;
          this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: subject, sourceEvent: event });
        }
      }else{
        if(subject.highlighted === false){
          subject.highlightedWall = null;
          subject.highlighted = true;
          this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: subject, sourceEvent: event });
        }
      }
    }

    this.nodeInSubject = subject;

  }

//#endregion

//#region Edge Connections dynamic positioning logic

  private onEdgeConnectionsUpdated(event: DiagramEvent){
    if(event.sender === this) return;
    this.repositionEdge(<Edge>event.edge);
  }

  private onEdgeConnectionsChanged(event: DiagramEvent){
    this.repositionEdge(<Edge>event.edge);
    this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, {
      edge: event.edge,
      sender: this,
      sourceEvent: event,
    });
  }

  private repositionEdge(edge: Edge){
    let { source, target } = edge;
    this.repositionEdgeConnection(source, target);
    this.repositionEdgeConnection(target, source);
  }

  private repositionEdgeConnection(subject: EdgeConnection, pointsTo: EdgeConnection){
    const eligibleAttach = subject.attachType == AttachType.NodeBody || subject.attachType == AttachType.NodeWall;
    if(!subject.isBridge && eligibleAttach && subject.node && !subject.node.props.isOpen){
      const _pointsTo = pointsTo.getInstance();
      const sao = subject.attachType === AttachType.NodeBody ? 15 : 0;
      const { wall, offset } = this.findBestPositionToPoint(subject.node, _pointsTo.getCoordinates(), sao);
      subject.offset = offset;
      subject.nodeWall = wall;
    }
  }

  private findBestPositionToPoint(node: Node, point: Position, secondAxisOffset: number = 0){
    const { x: tx, y: ty } = point;
    const { x, y } = node.getAbsolutePosition();
    const { width, height } = node.size;
    const topDist = distSqrd(x + width / 2, y, tx, ty);
    const bottomDist = distSqrd(x + width / 2, y + height, tx, ty);
    const leftDist = distSqrd(x, y + height / 2, tx, ty);
    const rightDist = distSqrd(x + width, y + height / 2, tx, ty);

    let minVertical = Infinity;
    let verticalSide = null;
    if(topDist <= bottomDist){
      minVertical = topDist;
      verticalSide = Side.Top;
    }else{
      minVertical = bottomDist;
      verticalSide = Side.Bottom;
    }

    let minHorizontal = Infinity;
    let horizontalSide = null;
    if(leftDist <= rightDist){
      minHorizontal = leftDist;
      horizontalSide = Side.Left;
    }else{
      minHorizontal = rightDist;
      horizontalSide = Side.Right;
    }

    const sao = secondAxisOffset;
    const padd = 0;
    const scale = 0.7;
    if(minVertical <= minHorizontal){
      return {
        wall: verticalSide,
        distance: minVertical,
        offset: {
          y: sao ? (verticalSide == Side.Top ? sao : -sao) : 0,
          x: this.calcOffset(point.x, x, width, padd, scale)
        }
      }
    }else{
      return {
        wall: horizontalSide,
        distanceSquared: minHorizontal,
        offset: {
          y: this.calcOffset(point.y, y, height, padd, scale),
          x: sao ? (horizontalSide == Side.Left ? sao : -sao) : 0
        }
      }
    }
  }

  private calcOffset(target: number, position: number, size: number, padding: number, scale: number){
    return (capNumber(target, position + padding, position + size - padding) - position - size / 2) * scale;
  }

//#endregion

}
