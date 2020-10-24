import { Edge } from "../components/edge";
import { ATTR, CLASSES, EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";

export class EdgeSelector{

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.CANVAS_MOUSEDOWN, e => this.onMouseDown(e));
  }

  onMouseDown(e: DiagramEvent): void {
    const sourceEvent = <MouseEvent>e.sourceEvent;
    const { clientX, clientY } = sourceEvent;

    let edge = this.pickFromMainLayer(clientX, clientY)
    if(edge){
      this.store.emit(EVENTS.EDGE_SELECTED, { edge, sourceEvent });
      return;
    }

    edge = this.pickFromSubLayers(clientX, clientY);
    if(edge){
      this.store.emit(EVENTS.EDGE_SELECTED, { edge, sourceEvent });
    }

  }

  pickFromMainLayer(x: number, y: number){
    this.store.rootElement.classed(CLASSES.EDGES_LAYER_CLICKABLE, true);
    const el = document.elementFromPoint(x, y);
    this.store.rootElement.classed(CLASSES.EDGES_LAYER_CLICKABLE, false);
    return this.getEdgeInstanceFromElement(el);
  }

  pickFromSubLayers(x: number, y: number){
    this.store.rootElement.classed(CLASSES.SVG_CLICKABLE, true);
    const el = document.elementFromPoint(x, y);
    this.store.rootElement.classed(CLASSES.SVG_CLICKABLE, false);
    return this.getEdgeInstanceFromElement(el);
  }


  getEdgeInstanceFromElement(el: Element | null): Edge | null{
    if(el){
      const raw_id = el.getAttribute(ATTR.COMPONENT_ID);
      if(!raw_id) return null;
      const id = parseInt(raw_id);
      const edge = this.store.getEdgeById(id);
      return edge;
    }else{
      return null;
    }
  }

}
