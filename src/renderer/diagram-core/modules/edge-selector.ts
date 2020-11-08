import { Edge } from "../components/edge";
import { ATTR, EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";

export class EdgeSelector{

  private hoveredEdge: Edge | null = null;

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.CANVAS_MOUSEDOWN, e => this.onMouseDown(e));
    store.on(EVENTS.CANVAS_MOUSEMOVE, e => this.onMouseMove(e));
  }

  onMouseDown(e: DiagramEvent): void {
    const sourceEvent = <MouseEvent>e.sourceEvent;
    const { clientX, clientY } = sourceEvent;
    const data = this.getDataFromClientPoint(clientX, clientY);
    if(data){
      sourceEvent.stopImmediatePropagation();
      sourceEvent.preventDefault();
      const edge = this.store.getEdgeById(data.id);
      this.store.emit(EVENTS.EDGE_SELECTED, { edge, sourceEvent });
      edge?.onDOMInteraction('mousedown', data.emitData, sourceEvent);
      return;
    }
  }

  onMouseMove(e: DiagramEvent){
    const sourceEvent = <MouseEvent>e.sourceEvent;
    if(sourceEvent.buttons > 0) return;
    const { clientX, clientY } = sourceEvent;
    const edge = this.getEdgeFromClientPoint(clientX, clientY);
    if(this.hoveredEdge && this.hoveredEdge !== edge){
      this.hoveredEdge.onDOMInteraction('mouseleave', null, null);
    }
    if(edge && this.hoveredEdge !== edge){
      edge.onDOMInteraction('mouseenter', null, null);
    }
    this.hoveredEdge = edge;
  }

  getEdgeFromClientPoint(x: number, y: number): Edge | null{
    let data = this.getDataFromClientPoint(x, y)
    if(data){
      return this.store.getEdgeById(data.id);
    }else{
      return null
    }
  }

  getDataFromClientPoint(x: number, y: number){
    const el = document.elementFromPoint(x, y);
    return this.extractData(el);
  }


  extractData(el: Element | null){
    if(el){
      const raw_id = el.getAttribute(ATTR.COMPONENT_ID);
      if(raw_id){
        const id = parseInt(raw_id);
        const emitData = el.getAttribute(ATTR.EMIT_DATA);
        return {
          id,
          emitData,
          el
        }
      }
    }
    return null;
  }

}
