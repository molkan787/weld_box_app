import { drag, DragBehavior } from "d3";
import { Node } from "../components/node";
import { CLASSES, EVENTS, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { throttle } from 'throttle-debounce';

/**
 * Handles the process of attaching DOM events of the Canvas element and of all the Diagram Components
 */
export class DomEventsAttacher{

  private readonly handlers = {
    contextmenu: (e: any, node: any) => this.onContextMenu(e, node),
    dblclick: (e: any, node: any) => this.onDoubleClick(e, node),
  };

  /** The D3 Drag Behavior instance */
  private readonly dragController: DragBehavior<Element, unknown, unknown>;

  /** Throttler for mouse move event */
  private readonly mousemoveThrottler: throttle<(e: DiagramEvent) => void>;

  /** Throttler for dragged event */
  private readonly draggedThrottler: throttle<(e: DiagramEvent) => void>;

  constructor(private readonly store: DiagramStore){
    store.on(EVENTS.NODE_BUILT, e => this.onNodeBuilt(e));
    store.on(EVENTS.INIT_CANVAS_CREATED, (e: DiagramEvent) => this.onCanvasCreated(e));

    this.dragController = drag()
      .on('start', (e: any, node: any) => this.onDragStart(e, node))
      .on('drag', (e: any, node: any) => this.onDragged(e, node))
      .on('end', (e: any, node: any) => this.onDragEnd(e, node))
      .subject(() => ({ x: 0, y: 0 }))
      .filter((e: any, node: any) => {
        this.store.emit(EVENTS.CANVAS_MOUSEDOWN, { sourceEvent: e, simulated: true });
        const tn = e.target.tagName;
        const isFocusedInput = document.activeElement == e.target && (tn == 'INPUT' || tn == 'TEXTAREA' || e.target.isContentEditable);
        if(isFocusedInput || e.target.getAttribute('preventDrag')){
          e.stopPropagation();
          return false;
        }
        if(this.store.activeModule?.name !== MODULES.NODE_DRAGGING) return true;
        if(node.props.isOpen){
          return this.isResizeHandleEvent(e);
        }else{
          return true;
        }
      });

    this.mousemoveThrottler = throttle(20, false, (e: DiagramEvent) => {
      this.store.emit(EVENTS.CANVAS_MOUSEMOVE, e);
    });
    this.draggedThrottler = throttle(20, false, (e: DiagramEvent) => {
      this.store.emit(EVENTS.NODE_DRAGGED, e);
    });
  }

  onCanvasCreated(de: DiagramEvent): void {
    this.store.rootElement.on('mousemove', (e: any) => {
      // this.store.emit(EVENTS.CANVAS_MOUSEMOVE, { sourceEvent: e });
      this.mousemoveThrottler({ sourceEvent: e });
    });
    this.store.rootElement.on('mouseup', (e: any) => {
      this.store.emit(EVENTS.CANVAS_MOUSEUP, { sourceEvent: e });
    });
    this.store.rootElement.on('mousedown', (e: any) => {
      this.store.emit(EVENTS.CANVAS_MOUSEDOWN, { sourceEvent: e });
    });
  }

  onNodeBuilt(e: DiagramEvent): void {
    const node = <Node>e.node;
    const d3node = this.store.getD3Node(node.id);
    d3node.on('contextmenu', this.handlers.contextmenu)
          .on('dblclick', this.handlers.dblclick);
    d3node.call(this.dragController);
  }

  // -----------------------------------------------------------

  onContextMenu(e: MouseEvent, node: Node){
    e.stopPropagation();
    this.store.emit(EVENTS.NODE_CONTEXT_MENU, { node, sourceEvent: e });
    this.store.emit(EVENTS.NODE_SELECTED, { node, sourceEvent: e, simulated: true });
  }

  onDoubleClick(e: MouseEvent, node: Node){
    e.stopPropagation();
    e.preventDefault();
    this.store.emit(EVENTS.NODE_DOUBLE_CLICK, { node, sourceEvent: e });
  }

  onDragStart(e: DragEvent, node: Node) {
    this.store.emit(EVENTS.NODE_DRAGSTART, { node, sourceEvent: e });
  }
  onDragged(e: any, node: Node) {
    this.draggedThrottler({ node, sourceEvent: e });
    this.mousemoveThrottler({ sourceEvent: e.sourceEvent });
  }
  onDragEnd(e: any, node: Node) {
    this.store.emit(EVENTS.NODE_DROPPED, { node, sourceEvent: e });
    this.store.emit(EVENTS.CANVAS_MOUSEUP, { sourceEvent: e.sourceEvent });
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
