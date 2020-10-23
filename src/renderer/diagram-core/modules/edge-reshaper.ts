import { Edge } from "../components/edge";
import { EVENTS, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";
import { DiagramModule } from "../module";

export class EdgeReshaper extends DiagramModule{

  private subject: Edge | null = null;
  private basePoint: Position = { x: 0, y: 0 };

  constructor(store: DiagramStore){
    super(store, MODULES.EDGE_RESHAPER);
    store.on(EVENTS.EDGE_SELECTED, e => this.onEdgeSelected(e));
    store.on(EVENTS.CANVAS_MOUSEUP, e => this.onCanvasMouseUp(e));
    store.on(EVENTS.CANVAS_MOUSEMOVE, e => this.onCanvasMouseMove(e));
  }
  private onEdgeSelected(e: DiagramEvent): void {
    const edge = <Edge | null>e.edge;
    if(!edge) return;
    this.activate();
    this.subject = edge;
    this.basePoint = edge.source.getCoordinates();
  }


  private onCanvasMouseMove(e: DiagramEvent): void {
    if(this.isInactive || !this.subject) return;
    const edge = <Edge>this.subject;
    const sourceEvent = <MouseEvent>e.sourceEvent;
    const { clientX, clientY } = sourceEvent;
    const { x: cx, y: cy } = this.store.transformClientPoint({ x: clientX, y: clientY });
    const { x, y } = this.basePoint;
    edge.shapePoints[0] = {
      x: cx - x,
      y: cy - y
    }
    this.store.emit(EVENTS.EDGE_RESHAPED, { edge, sourceEvent: e });
  }


  private onCanvasMouseUp(e: any): void {
    this.deactivate();
  }

}
