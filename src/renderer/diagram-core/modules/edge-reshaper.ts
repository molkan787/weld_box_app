import { Edge } from "../components/edge";
import { EVENTS, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";
import { DiagramModule } from "../module";
import { cloneArray } from "../utils";

/**
 * Handles the process of reshapment of an edge (Dragging it path)
 */
export class EdgeReshaper extends DiagramModule{

  /** The edge that we're currently reshaping */
  private subject: Edge | null = null;
  /** The abosulte position of Edge's source recorded at time when the action (reshaping) begin */
  private basePoint: Position = { x: 0, y: 0 };
  private previousShape: Position[] = [];
  private changed: boolean = false;

  constructor(store: DiagramStore){
    super(store, MODULES.EDGE_RESHAPER);
    store.on(EVENTS.EDGE_SELECTED, e => this.onEdgeSelected(e));
    store.on(EVENTS.CANVAS_MOUSEUP, e => this.onCanvasMouseUp(e));
    store.on(EVENTS.CANVAS_MOUSEMOVE, e => this.onCanvasMouseMove(e));
  }
  /** Handles Edge Selected event to start reshaping process */
  private onEdgeSelected(e: DiagramEvent): void {
    const edge = <Edge | null>e.edge;
    if(!edge) return;
    this.activate();
    this.subject = edge;
    this.basePoint = edge.source.getInstance().getCoordinates();
    this.previousShape = cloneArray(edge.shapePoints);
    this.changed = false;
  }


  /** Handles mouse move event to canculate shape/path points */
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
    this.changed = true;
  }


  /** Handles the mouse up event to end the reshaping process and push the action to ActionsArchiver */
  private onCanvasMouseUp(e: any): void {
    const edge = this.subject;
    if(this.isActive && this.changed && edge){
      const previousShape = this.previousShape;
      const currentShape = cloneArray(edge.shapePoints);
      this.pushAction({
        undo: [
          {
            events: [EVENTS.EDGE_RESHAPED],
            eventsPayload: { edge: edge, sourceEvent: e },
            do(){
              edge.shapePoints = previousShape;
            }
          }
        ],
        redo: [
          {
            events: [EVENTS.EDGE_RESHAPED],
            eventsPayload: { edge: edge, sourceEvent: e },
            do(){
              edge.shapePoints = currentShape;
            }
          }
        ]
      })
    }
    this.changed = false;
    setTimeout(() => {
      this.deactivate();
    }, 30)
  }

}
