import { drag, select } from 'd3';
import { Node } from '../components/node';
import { ATTR, EVENTS, RESIZE_HANDLE } from '../constants';
import { DiagramStore } from '../diagram-store';
import { Corner, Side } from '../helpers/geometry';
import { D3Node } from '../types/aliases';

/**
 * Module thats handles Node Dragging (Moving) and Resizing
 */
export class NodeDragging{

  // Indicate if the current dragging is used to resize the Node
  private resizing: boolean = false;

  // Indicate which corner the user used to resize the Node
  private resizeCorner: Corner = Corner.TopLeft;

  constructor(
    readonly store: DiagramStore
  ){}

  /**
   * Add interactivity capability to the specified Node
   * @param node Node to add interactivity to
   * @description interactivity capability: Dragging/Moving and Resizing
   */
  apply(node: Node){
    const d3Node = this.store.getD3Node(node.id);
    if(typeof d3Node === 'undefined'){
      throw new Error(`Node #${node.id} was not found in D3NodesMap`);
    }
    // TODO: refactor it, reuse the same functions
    const _drag = drag()
    .on('start', (event: any) => this.dragstarted(d3Node, event))
    .on('drag', (event: any) => this.dragged(d3Node, event, node))
    .on('end', (event: any) => this.dragended(d3Node, event, node))

    d3Node.call(<any>_drag);
  }

  /** Handler for on drag start event */
  dragstarted(d3Node: D3Node, event: any) {

    // if the event comes from resize handle than activate resizing mode otherwise deactivate it
    this.resizing = this.isResizeHandleEvent(event);

    if(this.resizing){
      this.resizeCorner = this.getResizeHandleCorner(event);
    }

    // bring the dragged node to the front and change his cursor
    d3Node.raise().attr('cursor', this.resizing ? 'default' : 'move');
  }

  /** handler for dragged event */
  dragged(d3Node: D3Node, event: any, node: Node) {
    const { position: pos, size } = node;

    // If we resizing a node, adjust his size and position
    if(this.resizing){
      if(this.resizeCorner & Side.Left){ // Checks if the corner is on the left side
        pos.x += event.dx
        size.width -= event.dx;
      }else{ // corner is on the right side
        size.width += event.dx;
      }
      if(this.resizeCorner & Side.Top){ // Checks if the corner is on the top side
        pos.y += event.dy
        size.height -= event.dy;
      }else{ // corner is on the bottom side
        size.height += event.dy;
      }

      // Cap size to the minimum 1x1
      if(size.width < 1) size.width = 1;
      if(size.height < 1) size.height = 1;
    }else{
      pos.x += event.dx;
      pos.y += event.dy;
    }

    this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node, sourceEvent: event });
  }

  /** handler for drag end event */
  dragended(d3Node: D3Node, event: any, node: Node) {
    d3Node.attr('cursor', 'default');

    // Updates Node's index in the Spatial Map
    this.store.refreshNode(node);

    this.store.emit(EVENTS.NODE_DROPPED, { node, sourceEvent: event });
  }

  /** Returns the Corner of the Node at which the event started.
   * This method works and should be used only when the drag event was initiated by a resize handle `<circle/>`
   */
  private getResizeHandleCorner(event: any): Corner{
    const srcElement = this.getSrcElement(event);
    const d3n = select(srcElement);
    const corner = d3n.attr(ATTR.CORNER);
    return parseInt(corner);
  }

  /** Checks if the event was triggered by the resize handle `<circle/>` */
  private isResizeHandleEvent(event: any){
    return this.getSrcElement(event)?.classList.contains(RESIZE_HANDLE);
  }

  /** Grabs and return srcElement from the source event */
  private getSrcElement(event: any){
    return event?.sourceEvent?.srcElement;
  }

}
