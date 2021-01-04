import { Edge } from "../components/edge";
import { ATTR, EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { distSqrd } from "../helpers/geometry";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";

/**
 * A system to simulate mouse event on Edges, and handle selecting edge by clicking on them
 */
export class EdgeSelector{

  private hoveredEdge: Edge | null = null;

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.CANVAS_MOUSEDOWN, e => this.onMouseDown(e));
    store.on(EVENTS.CANVAS_MOUSEMOVE, e => this.onMouseMove(e));
  }

  /** Handles mouse down event to check if at event location (x, y) there is an Edge Element and selects it if found */
  onMouseDown(e: DiagramEvent): void {
    const sourceEvent = <MouseEvent>e.sourceEvent;
    const { clientX, clientY } = sourceEvent;
    const data = this.getDataFromClientPoint(clientX, clientY);
    if(data){
      sourceEvent.stopImmediatePropagation();
      sourceEvent.preventDefault();
      const edge = this.store.getEdgeById(data.id);
      if(edge && this.isPointOnEdgeEnds(edge, { x: clientX, y: clientY })){
        this.store.emit(EVENTS.EDGE_MOUSEDOWN_ON_ENDS, { edge, sourceEvent });
      }else{
        this.store.emit(EVENTS.EDGE_SELECTED, { edge, sourceEvent });
      }
      edge?.onDOMInteraction('mousedown', data.emitData, sourceEvent);
    }
  }

  /**
   * Handles mouse move event to check if at event location (x, y) there is an Edge Element emits mouse enter & mouse leave events on that edge,
   * In other works it recreate the native mouse enter & leave functionality/events, because the actuall Edge's DOM Element does not handle any mouse event because of css `pointer-events: none`
   * @param e
   */
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

  /**
   * Return Edge instance from the given client coordinates (x, y), Similar to document.elementFromPoint() but returns the associated `Edge` instance instead of the DOM element
   * @param x Point's X (relative to window's left)
   * @param y Point's Y (relative to window's top)
   */
  getEdgeFromClientPoint(x: number, y: number): Edge | null{
    let data = this.getDataFromClientPoint(x, y)
    if(data){
      return this.store.getEdgeById(data.id);
    }else{
      return null
    }
  }

  /**
   * Return data associated with DOM element at the given client coordinates (x, y), Similar to document.elementFromPoint() but returns the associated data instead of the DOM element.
   * The associated data lease in element's properties, assigned at the time the element was rendered
   * @param x Point's X (relative to window's left)
   * @param y Point's Y (relative to window's top)
   */
  getDataFromClientPoint(x: number, y: number){
    const el = document.elementFromPoint(x, y);
    return this.extractData(el);
  }

  /** Extract data from Edge's DOM element (from its properties) */
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

  /** Check if a point is on edge's target (or close too it) */
  isPointOnEdgeEnds(edge: Edge, point: Position){
    const { x: x1, y: y1 } = this.store.transformClientPoint(point);
    const { x: x2, y: y2} = edge.target.coordinates;
    const distance = distSqrd(x1, y1, x2, y2);
    return distance <= 225;
  }

}
