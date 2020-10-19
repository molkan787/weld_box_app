import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";

export class DomEventsAttacher{

  private contextMenuLocked: boolean = false;
  private readonly handlers = {
    contextmenu: (e: any, node: any) => this.onContextMenu(e, node),
    dblclick: (e: any, node: any) => this.onDoubleClick(e, node),
  };

  constructor(private readonly store: DiagramStore){
    store.on(EVENTS.NODE_ADDED, e => this.onNodeAdded(e));
    store.on(EVENTS.INIT_CANVAS_CREATED, (e: DiagramEvent) => this.onCanvasCreated(e));
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
  }

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

}
