import { ATTR, CLASSES, EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";

export class EdgeSelector{

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.CANVAS_MOUSEDOWN, e => this.onMouseDown(e));
  }

  onMouseDown(e: DiagramEvent): void {
    const event = <MouseEvent>e.sourceEvent;
    this.store.rootElement.classed(CLASSES.SVG_CLICKABLE, true);
    const { clientX, clientY } = event;
    const el = document.elementFromPoint(clientX, clientY);
    this.store.rootElement.classed(CLASSES.SVG_CLICKABLE, false);
    if(el){
      const raw_id = el?.getAttribute(ATTR.COMPONENT_ID);
      if(!raw_id) return;
      const id = parseInt(raw_id);
      const edge = this.store.getEdgeById(id);
      if(edge){
        this.store.emit(EVENTS.EDGE_SELECTED, { edge });
      }
    }
  }

}
