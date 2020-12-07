import { Edge } from "../components/edge";
import { AttachType, EdgeConnection } from "../components/edge-connection";
import { EVENTS, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";
import { DiagramModule } from "../module";
import { cloneObject } from "../utils";

export class InitialEdgeDragging extends DiagramModule{

  private subject: Edge | null = null;

  constructor(readonly store: DiagramStore){
    super(store, MODULES.INITIAL_EDGE_DRAGGING);
    store.on(EVENTS.DIAGRAM_START_EDGE_DRAGGING, e => this.onStartEdgeDragging(e));
    store.on(EVENTS.CANVAS_MOUSEMOVE, (e: DiagramEvent) => this.onMouseMove(e.sourceEvent));
    store.on(EVENTS.CANVAS_MOUSEUP, (e: DiagramEvent) => this.onMouseUp(e.sourceEvent));
  }

  private onStartEdgeDragging(event: DiagramEvent){
    const edge = <Edge>event.edge;
    const clientPoint = <Position>event.data;
    this.subject = edge;
    this.setEdgePosition(edge, clientPoint)
    this.activate();
  }

  private onMouseMove(sourceEvent: MouseEvent) {
    if(this.isInactive || !this.subject) return;
    const { clientX: x, clientY: y } = sourceEvent;
    this.setEdgePosition(this.subject, { x, y });
  }

  private onMouseUp(sourceEvent: MouseEvent) {
    if(this.isActive){
      if(this.subject){
        this.attachEdgeSourceToCurrentNode(this.subject);
        this.pushSpawnedAction(this.subject);
      }
      this.subject = null;
      this.deactivate();
    }
  }

  private attachEdgeSourceToCurrentNode(edge: Edge){
    const node = this.store.currentlyOpenNode;
    if(node){
      const source = edge.source;
      const newSource = new EdgeConnection(AttachType.Node);
      const nodePos = node.position;
      const offset = cloneObject(source.position) || { x: 0, y: 0 };
      offset.x -= nodePos.x;
      offset.y -= nodePos.y;
      newSource.offset = offset;
      node.addEdgeConnection(newSource);
      edge.setSource(newSource);
      this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge });
      console.log('Attached edge source to node', edge);
    }
  }

  private setEdgePosition(edge: Edge, clientPoint: Position){
    const sourcePoint = this.store.transformClientPoint(clientPoint);
    const targetPoint = cloneObject(sourcePoint);
    targetPoint.x += 50;
    const { source, target } = edge;
    source.position = sourcePoint;
    target.position = targetPoint;
    this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, { edge });
  }

  private pushSpawnedAction(edge: Edge){
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

}
