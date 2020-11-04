import { Edge } from "../components/edge";
import { AttachType, EdgeConnection } from "../components/edge-connection";
import { Node } from "../components/node";
import { ATTR, EVENTS, CLASSES, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { isPointInsideBBox, Side, TouchesWall } from "../helpers/geometry";
import { distSqrd } from "../helpers/geometry";
import { capNumber } from "../helpers/math";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { DiagramOptions } from "../interfaces/DiagramOptions";
import { EdgeInstanceCreator } from "../interfaces/EdgeInstanceCreator";
import { Position } from "../interfaces/Position";
import { DiagramModule } from "../module";

export class EdgeDrawer extends DiagramModule{

  private currentEdge: Edge | null = null;

  /** Can be the Source node or target candidate */
  private nodeInSubject: Node | null = null;

  private edgeFactory: EdgeInstanceCreator;

  constructor(store: DiagramStore, options: DiagramOptions){
    super(store, MODULES.EDGE_DRAWER);
    this.edgeFactory = options.edgeFactory
                      || ((s: EdgeConnection, t: EdgeConnection) => new Edge(s, t));

    store.on(EVENTS.NODE_DRAGSTART, (e) => this.onNodeDragStart(e));
    store.on(EVENTS.NODE_DRAGGED, (e) => this.onNodeDragged(e));
    store.on(EVENTS.NODE_DROPPED, (e) => this.onNodeDropped(e));
    store.on(EVENTS.EDGE_CONNECTIONS_UPDATED, (e) => this.onEdgeConnectionsUpdated(e));
    store.on(EVENTS.EDGE_CONNECTIONS_CHANGED, (e) => this.onEdgeConnectionsChanged(e));
    store.on(EVENTS.CANVAS_MOUSEMOVE, (e: DiagramEvent) => this.onMouseMove(e.sourceEvent))
  }


//#region Edge drawing logic

  onNodeDragStart(event: DiagramEvent){
    if(this.isInactive) return;

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

    if(this.currentEdge === null) return;
    const edge: Edge = this.currentEdge;
    const { x, y } = event.sourceEvent.sourceEvent;
    const point = this.store.transformClientPoint({ x, y });
    const targetConnection = new EdgeConnection(AttachType.Position);
    targetConnection.position = point;
    edge.setTarget(targetConnection);
    this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, { edge });

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
      const srcNode = edge.source.node;
      const srcPos = srcNode.getAbsolutePosition();
      const trgPos = <Position>edge.target.position;
      const offset: Position = {
        x: trgPos.x - srcPos.x,
        y: trgPos.y - srcPos.y
      }
      const target = new EdgeConnection(AttachType.Node);
      target.offset = offset;
      target.node = srcNode;
      edge.target = target;
      this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge, sourceEvent: event });
    }
    this.currentEdge = null;

    edge && this.pushSpawnAction(edge);

    this.deactivate();
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

  onMouseMove(event: MouseEvent){
    if(this.isInactive) return;

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
