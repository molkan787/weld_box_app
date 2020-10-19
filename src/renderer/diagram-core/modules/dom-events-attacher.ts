import { drag, DragBehavior } from "d3";
import { Node } from "../components/node";
import { CLASSES, EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";

export class DomEventsAttacher{

  private contextMenuLocked: boolean = false;
  private readonly handlers = {
    contextmenu: (e: any, node: any) => this.onContextMenu(e, node),
    dblclick: (e: any, node: any) => this.onDoubleClick(e, node),
  };

  private readonly dragController: DragBehavior<Element, unknown, unknown>;

  constructor(private readonly store: DiagramStore){
    store.on(EVENTS.NODE_ADDED, e => this.onNodeAdded(e));
    store.on(EVENTS.INIT_CANVAS_CREATED, (e: DiagramEvent) => this.onCanvasCreated(e));

    this.dragController = drag()
      .on('start', (e: any, node: any) => this.onDragStart(e, node))
      .on('drag', (e: any, node: any) => this.onDragged(e, node))
      .on('end', (e: any, node: any) => this.onDragEnd(e, node))
      .subject(() => ({ x: 0, y: 0 }))
      .filter((e: any, node: any) => {
        if(!this.store.nodeDraggingTool) return true;
        if(node.props.isOpen){
          return this.isResizeHandleEvent(e);
        }else{
          return true;
        }
      });;
  }

  onCanvasCreated(de: DiagramEvent): void {
    this.store.rootElement.on('mousemove', (e: any) => {
      this.store.emit(EVENTS.CANVAS_MOUSEMOVE, { sourceEvent: e });
    });
    this.store.rootElement.on('mouseup', (e: any) => {
      this.store.emit(EVENTS.CANVAS_MOUSEUP, { sourceEvent: e });
    });
  }

  onNodeAdded(e: DiagramEvent): void {
    const node = <Node>e.node;
    const d3node = this.store.getD3Node(node.id);
    d3node.on('contextmenu', this.handlers.contextmenu)
          .on('dblclick', this.handlers.dblclick);
    d3node.call(this.dragController);
  }

  // -----------------------------------------------------------

  onContextMenu(e: MouseEvent, node: Node){
    if(this.contextMenuLocked) return;
    this.lockContextMenu();
    this.store.emit(EVENTS.NODE_CONTEXT_MENU, { node, sourceEvent: e });
    this.store.emit(EVENTS.NODE_SELECTED, { node, sourceEvent: e });
  }

  lockContextMenu(){
    this.contextMenuLocked = true;
    setTimeout(() => this.contextMenuLocked = false, 5);
  }

  onDoubleClick(e: MouseEvent, node: Node){
    this.store.emit(EVENTS.NODE_DOUBLE_CLICK, { node, sourceEvent: e });
  }

  onDragStart(e: MouseEvent, node: Node) {
    this.store.emit(EVENTS.NODE_DRAGSTART, { node, sourceEvent: e });
  }
  onDragged(e: MouseEvent, node: Node) {
    this.store.emit(EVENTS.NODE_DRAGGED, { node, sourceEvent: e });
  }
  onDragEnd(e: MouseEvent, node: Node) {
    this.store.emit(EVENTS.NODE_DROPPED, { node, sourceEvent: e });
  }

  // ---------------- Helpers ----------------

  /** Checks if the event was triggered by the resize handle `<span/>` */
  private isResizeHandleEvent(event: any): boolean{
    return this.getSrcElement(event)?.classList.contains(CLASSES.RESIZE_HANDLE);
  }

  /** Grabs and return srcElement from the source event */
  private getSrcElement(event: any){
    return event?.srcElement || event?.sourceEvent?.srcElement;
  }

}
