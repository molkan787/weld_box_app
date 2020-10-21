import { Size } from "electron/main";
import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";

export class InitialNodeDragging{

  private subject: Node | null = null;

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.CANVAS_MOUSEMOVE, (e: DiagramEvent) => this.onMouseMove(e.sourceEvent));
    store.on(EVENTS.CANVAS_MOUSEUP, (e: DiagramEvent) => this.onMouseUp(e.sourceEvent));
    store.on(EVENTS.DIAGRAM_START_NODE_DRAGGING, (e: DiagramEvent) => this.onStartNodeDragging(e));
  }

  onStartNodeDragging(e: DiagramEvent): void {
    const node = <Node>e.node;
    const clientPoint = <Position>e.data;
    node.position = this.getNodePositionFromClientPoint(node.size, clientPoint);
    this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node, sourceEvent: e.sourceEvent });
    this.subject = node;
    this.store.emit(EVENTS.NODE_DRAGSTART, { node, sourceEvent: e.sourceEvent});
  }

  onMouseUp(sourceEvent: MouseEvent): void {
    if(this.subject){
      const node = this.subject;
      this.subject = null;
      this.store.emit(EVENTS.NODE_DROPPED, { node, sourceEvent, simulated: true });
      this.store.emit(EVENTS.NODE_INITIAL_DROP, { node, sourceEvent, simulated: true });
    }
  }

  onMouseMove(sourceEvent: MouseEvent): void {
    if(this.subject == null) return;
    const node = this.subject;
    const { clientX: x, clientY: y } = sourceEvent;
    const position = this.getNodePositionFromClientPoint(node.size, { x, y });
    node.position = position;
    this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node, sourceEvent });
    this.store.emit(EVENTS.NODE_DRAGGED, { node, sourceEvent, simulated: true });
  }

  getNodePositionFromClientPoint(nodeSize: Size, clientPoint: Position): Position{
    const point = this.store.transformClientPoint(clientPoint, true);
    const { width, height } = nodeSize;
    point.x -= width / 2;
    point.y -= height / 2;
    return point;
  }

}
