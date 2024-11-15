import { Edge, MultipartEdgeLocation, MultipartEdgeType } from "../components/edge";
import { AttachType, EdgeConnection, EdgeConnectionType } from "../components/edge-connection";
import { Node } from "../components/node";
import { ATTR, EVENTS, CLASSES, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { isPointInsideBBox, Side, TouchesWall } from "../helpers/geometry";
import { distSqrd } from "../helpers/geometry";
import { capNumber } from "../helpers/math";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";
import { RepositionRequest } from "../interfaces/RepositionRequest";
import { DiagramModule } from "../module";
import { cloneObject } from "../utils";
import { Visibility } from "./sub-modules/visibility";

/**
 * This modules handles the process of drawing an Edge from source object to the target object,
 * Edge repositioning (adjust the distance with edge source and target so they are closer to each others)
 */
export class EdgeDrawer extends DiagramModule{

  /** Holds reffernce to the edge that is current being drawn */
  private currentEdge: Edge | null = null;

  /** Can be the Source node or target candidate */
  private nodeInSubject: Node | null = null;

  /** Indicates whether we're currently re-drawing en edge (changing an exiting edge) */
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
    store.on(EVENTS.NODE_BBOX_CHANGED, e => this.onNodeBBoxChanged(e));
    store.on(EVENTS.EDGE_CONNECTIONS_CHANGED, (e) => this.onEdgeConnectionsChanged(e));
    store.on(EVENTS.EDGE_CREATED, e => this.onEdgeCreated(e));
    store.on(EVENTS.REPOSITION_EDGECONNECTION, (e) => this.onRepositionEdgeConnection(e));
    store.on(EVENTS.CANVAS_MOUSEMOVE, (e) => this.onCanvasMouseMove(e.sourceEvent));
    store.on(EVENTS.CANVAS_MOUSEUP, (e) => this.onCanvasMouseUp(e.sourceEvent));
    store.on(EVENTS.EDGE_MOUSEDOWN_ON_ENDS, (e) => this.onEdgeMouseDownOnEnds(e));
  }

  /** Handles the event MouseDownOnEnds (emited when there was a mouse down triggered on an Edge end (arrow) ) */
  private onEdgeMouseDownOnEnds(event: DiagramEvent){
    const edge = <Edge>event.edge;
    this.raiseEdgeEnd(edge, EdgeConnectionType.Target);
  }

  /** Prepare the edge for redrawing (change it target to a position that will follow the cursor) */
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
      this.store.emit(EVENTS.EDGECONNECTION_DESTROYED, { data: target });
    }else{
      throw new Error(`Edge end '${end}' isn't supported`);
    }
    this.redrawing = true;
    this.activate();
    this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge });
  }


//#region Edge drawing logic

  // Handles the drag start of Node, to spawn an edge that node as its source
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
        return;
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

  /** Spanws a new Edge from an Attach box (the little squares rendered on sub-charts when there is edge going the its wall) */
  spawnNewEdgeFromAttachBox(node: Node, attachBox: EdgeConnection, event: DiagramEvent){
    const srcEvent = event.sourceEvent;
    const { x, y } = srcEvent.sourceEvent;
    const targetPoint = this.store.transformClientPoint({ x, y });
    const target = new EdgeConnection(AttachType.Position);
    target.position = targetPoint;
    const source = node.createEdgeConnection();
    attachBox.bridgeFrom = source;
    source.bridgeTo = attachBox;
    const multipartLocation = attachBox.node?.props.isOpen ? MultipartEdgeLocation.Inner : MultipartEdgeLocation.Outer;
    const edge = this.edgeFactory(source, target, true, multipartLocation, MultipartEdgeType.Ending);
    this.currentEdge = edge;
    this.store.emit(EVENTS.EDGE_CREATED, { edge });
  }

  /** Spawns a new Edge from Node's body or wall */
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

  /** Fetches an edge connection by id from a particular Node instance */
  getNodeEdgeConnection(node: Node, edgeId: number): EdgeConnection | null{
    return node.edges.find(e => e.id === edgeId) || null;
  }

  /** Handles NodeDragged to simulate canvas move event (needed because when a drag event started, mouse move won't be triggered) */
  onNodeDragged(event: DiagramEvent){
    if(this.isInactive) return;
    const mouseevent = event.sourceEvent.sourceEvent;
    this.onCanvasMouseMove(mouseevent);
  }

  /** Handles mouse up to end edge drawing (finalizing) */
  onCanvasMouseUp(event: MouseEvent){
    this.endEdgeDrawing(event);
  }

  /** Set the current edge's target position to the position of the cursor*/
  followCursor(event: MouseEvent){
    if(this.currentEdge === null) return;
    const edge: Edge = this.currentEdge;
    const { x, y } = event;
    const point = this.store.transformClientPoint({ x, y });
    const targetConnection = new EdgeConnection(AttachType.Position);
    targetConnection.position = point;
    edge.setTarget(targetConnection);
    this.updateEdge(edge);
    this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, { edge });
  }


  /**
   * Calculates offset between Cursor position on the Node's wall position
   * @param node
   * @param wall
   * @param sourceEvent
   */
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

  /**
   * Finalize the drawing of the edge (create final edge target EdgeConnection and disable the EdgeDrawer tool)
   * @param event
   */
  endEdgeDrawing(event: MouseEvent){
    if(this.isInactive) return;

    const subject = this.nodeInSubject;
    const edge = this.currentEdge;
    if(subject && edge){
      const targetConnection = subject.createEdgeConnection(subject.highlightedWall || undefined);
      edge.setTarget(targetConnection);
      if(!subject.highlightedWall && !subject.isCircle && !edge.isMultipart){
        // if there isn't any highlighted wall, the attach type will be NodeBody,
        // so the the drawn edge should be converted to a multipart edge
        edge.convertToMultipart(MultipartEdgeLocation.Outer, MultipartEdgeType.Starting);
      }
      subject.highlightedWall = null;
      subject.highlighted = false;
      this.currentEdge = null;

      if(edge.isStart){
        const src = edge.source;
        const trgPos = targetConnection.calculateCoordinates();
        const srcPos = src.getCoordinates();
        const offset: Position = {
          x: srcPos.x - trgPos.x,
          y: srcPos.y - trgPos.y
        }
        src.toSecondEndOffset = offset;
      }

      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: subject });
      this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge });
    }else if(edge && edge.source.node){
      const trgPos = <Position>edge.target.position;
      const srcNode = edge.source.node;
      const srcPos = srcNode.getAbsolutePosition();
      const offset: Position = {
        x: trgPos.x - srcPos.x,
        y: trgPos.y - srcPos.y
      }
      const target = new EdgeConnection(AttachType.Node);
      target.offset = offset;
      target.node = srcNode;
      edge.setTarget(target);
      this.postDraw(edge, true);
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
      if(subject){
        subject.highlightedWall = null;
        subject.highlighted = false;
        this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: subject });
      }
    }, 30)
    this.redrawing = false;
  }

  /**
   * Called after edge drawing/redrawing ended, apply modification if needed
   */
  private postDraw(edge: Edge, canBecomeMultipart: boolean){
    const { target } = edge;
    const chartNode = this.store.currentlyOpenNode;
    if(chartNode && chartNode.getParent() && canBecomeMultipart){
      const { position: pos, size } = chartNode;
      const top = pos.y,
            left = pos.x,
            bottom = top + size.height,
            right = left + size.width;

      const { x, y } = target.calculateCoordinates();
      const xOutside = (left - x) > 0 || (x - right) > 0;
      const yOutside = (top - y) > 0 || (y - bottom) > 0;
      if(xOutside || yOutside){
        console.log('wow');
        if(edge.isStart){
          // Undo the action if a start edge target was release outside of the Node boundries
          setTimeout(() => {
            this.store.actionsArchiver.undo(true);
          }, 1); // delay it because the action will be added this function ( `postDraw()` ) returns
        }else{
          this.convertEdgeToInnerMultipart(chartNode, edge);
        }
      }
    }
  }

  /**
   * Converts a normal edge to multiart edge with location Inner and attach it the specified sub-chart
   * @param chartNode The sub-chart node that the edge will pass thru
   * @param edge The edge than need to be converted
   */
  private convertEdgeToInnerMultipart(chartNode: Node, edge: Edge){
    const newTarget = chartNode.createEdgeConnection();
    edge.setTarget(newTarget);
    edge.convertToMultipart(MultipartEdgeLocation.Inner, MultipartEdgeType.Starting);
    this.repositionEdgeConnection(newTarget, edge.source, true);
    this.store.emit(EVENTS.EDGE_CONVERTED_TO_MULTIPART, { edge });
  }

  /**
   * Create an action of redrawing the specifed edge and add it to the ActionsArchiver
   * @param edge The redrawn edge
   */
  private pushReDrawnAction(edge: Edge){
    const oldTarget = <EdgeConnection>this.cache.previousTarget;
    const newTarget = edge.target;
    const oldNode = this.cache.previousTargetNode;
    const newNode = newTarget.node;
    this.pushAction({
      undo: [
        {
          events: [EVENTS.EDGE_CONNECTIONS_CHANGED],
          eventsPayload: { edge },
          do: () => {
            newNode?.removeEdgeConnection(newTarget);
            newTarget.edge = null;
            edge.setTarget(oldTarget);
            oldNode?.addEdgeConnection(oldTarget);
            this.store.emit(EVENTS.EDGECONNECTION_DESTROYED, { data: newTarget });
            this.store.emit(EVENTS.EDGECONNECTION_RESTORED, { data: oldTarget });
          }
        }
      ],
      redo: [
        {
          events: [EVENTS.EDGE_CONNECTIONS_CHANGED],
          eventsPayload: { edge },
          do: () => {
            oldNode?.removeEdgeConnection(oldTarget);
            oldTarget.edge = null;
            edge.setTarget(newTarget);
            newNode?.addEdgeConnection(newTarget);
            this.store.emit(EVENTS.EDGECONNECTION_DESTROYED, { data: oldTarget });
            this.store.emit(EVENTS.EDGECONNECTION_RESTORED, { data: newTarget });
          }
        }
      ]
    });

    const continuationEdge = oldTarget.bridgeFrom?.edge;
    if(continuationEdge){
      this.enableActionGrouping();
      this.store.emit(EVENTS.DIAGRAM_DELETE_COMPONENT, { data: continuationEdge });
      this.disableActionGrouping();
    }

  }

  /**
   * Create an action of spawning edge and add it to the ActionsArchiver
   * @param edge The spawned edge
   */
  private pushSpawnAction(edge: Edge){
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

  /**
   * Handles mouse move event, to find attachement object (The object from which to start drawing edge, or to which attach the edge target)
   * @param event
   */
  private onCanvasMouseMove(event: MouseEvent){
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

    const isMultipart = this.currentEdge?.isMultipart;
    if(subject === null){
      for(const node of nodes){
        if((this.currentEdge && node.isSubChart && !node.isOpen && !isMultipart) || node.isCircle){
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

    // if there was previously a subject node and its not the newly found one
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

  /** Handle NodeBBoxChanged event to update all edges that are connected to it */
  private onNodeBBoxChanged(event: DiagramEvent){
    const node = <Node>event.node;
    const allEdgesConnections = node.edges;
    const len = allEdgesConnections.length;
    for(let i = 0; i < len; i++){
      const ec = allEdgesConnections[i];
      const e = <Edge>ec.edge;
      if(Visibility.isEdgeVisible(e, ec)){
        this.updateEdge(e, event.simulated);
        this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, { edge: e });
      }else{
        ec.calculateCoordinates();
        this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, { edge: e, skipRendering: true });
      }
    }
  }

  /** Handles Edge Reposition Request */
  private onRepositionEdgeConnection(event: DiagramEvent){
    const request = <RepositionRequest>event.data;
    const { subject, pointTo }  = request;
    this.repositionEdgeConnection(subject, pointTo, true)
  }

  /** Handles to EdgeCreated event to update the created Edge */
  private onEdgeCreated(event: DiagramEvent){
    const edge = <Edge>event.edge;
    this.updateEdge(edge);
  }

  /** Hanldes EdgeConnectionsChanged event to update and calculate edge ends (source & target) coordinates */
  private onEdgeConnectionsChanged(event: DiagramEvent){
    const edge = <Edge>event.edge;
    const { source, target } = edge;
    source.calculateCoordinates();
    target.calculateCoordinates();
    this.updateEdge(edge);
    this.updateEdge(edge);
    this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, {
      edge: event.edge,
      sender: this,
      sourceEvent: event,
      skipRendering: event.skipRendering
    });
  }

  /** Updates Edge ends (source & target) and calculates their coordinates */
  private updateEdge(edge: Edge, skipRepositioning: boolean = false){
    const { source, target } = edge;
    const posRelatedEnds = edge.isStart && target.attachType != AttachType.Position;
    if(!skipRepositioning && !posRelatedEnds) this.repositionEdge(edge);
    if(posRelatedEnds && source.node){
      const coords = target.calculateCoordinates();
      const trgWall = target.nodeWall;
      const srcNodePos = source.node.getAbsolutePosition(true);
      const offset = {
        x: coords.x - srcNodePos.x,
        y: coords.y - srcNodePos.y
      }
      const dist = 40;
      if(trgWall == Side.Top) offset.y -= dist;
      else if(trgWall == Side.Bottom) offset.y += dist;
      else if(trgWall == Side.Left) offset.x -= dist;
      else if(trgWall == Side.Right) offset.x += dist;
      source.offset = offset;
      source.calculateCoordinates();
    }else{
      source.calculateCoordinates();
      target.calculateCoordinates();
    }
  }

  /** Adjust Edge ends position to be closer to each other (ex: moves the source from left wall to the right wall of the node because it is closer to the target) */
  private repositionEdge(edge: Edge, force: boolean = false){
    let { source, target } = edge;
    const wallChanged = this.repositionEdgeConnection(source.getInstance(), target, force);
    if(!wallChanged){
      this.repositionEdgeConnection(target.getInstance(), source, force);
    }
  }

  /**
   * Adjust EdgeConnection `subject` position to be closer to another EdgeConnection `pointsTo`
   * @param subject The EdgeConnection than need to be repositioned
   * @param pointsTo The EdgeConnection to which the subject to be closed to
   * @param force
   */
  private repositionEdgeConnection(subject: EdgeConnection, pointsTo: EdgeConnection, force: boolean = false){
    const eligibleAttach = subject.attachType == AttachType.NodeBody || subject.attachType == AttachType.NodeWall;
    if(subject.node && (force || (!subject.isBridge && eligibleAttach && !subject.node.props.isOpen))){
      const _pointsTo = pointsTo.getInstance();
      const sao = subject.attachType === AttachType.NodeBody ? 15 : 0;
      const { wall, offset } = this.findBestPositionToPoint(subject.node, _pointsTo.getCoordinates(), sao);
      const wallChanged = wall !== subject.nodeWall;
      subject.offset = offset;
      subject.nodeWall = wall;
      return wallChanged;
    }
    return false;
  }

  /**
   * Calculates the the closed position (on Node's wall) to an point (position)
   * @param node The relative node, the calculated position will be on one of the Node's walls
   * @param point The target point
   * @param secondAxisOffset Optionally add offset to the constant axis (can be the X axis or Y axis)
   */
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
          x: this.calcOffset(point.x, x, width, padd, scale) / (width / 2) * 50
        }
      }
    }else{
      return {
        wall: horizontalSide,
        distance: minHorizontal,
        offset: {
          y: this.calcOffset(point.y, y, height, padd, scale) / (height / 2) * 50,
          x: sao ? (horizontalSide == Side.Left ? sao : -sao) : 0
        }
      }
    }
  }

  /**
   * A helper function that calculates the offset relativly rectangle (top, left, width, height)
   * @param target
   * @param position
   * @param size
   * @param padding
   * @param scale
   */
  private calcOffset(target: number, position: number, size: number, padding: number, scale: number){
    return (capNumber(target, position + padding, position + size - padding) - position - size / 2) * scale;
  }

//#endregion

}
