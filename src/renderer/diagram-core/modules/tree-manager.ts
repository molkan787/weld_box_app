import { BBox } from "rbush";
import { Node } from "../components/node";
import { EVENTS, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { DiagramModule } from "../module";

/**
 * Handles the process of changing node's parent
 */
export class TreeManager extends DiagramModule{

  private dropTarget: Node | null = null;

  constructor(readonly store: DiagramStore){
    super(store, MODULES.TREE_MANAGER);
    store.on(EVENTS.NODE_DRAGGED, e => this.onNodeDragged(e));
    store.on(EVENTS.NODE_DROPPED, e => this.onNodeDropped(e));
    store.on(EVENTS.NODE_DRAGGED_OUT_OF_PARENT, e => this.onNodeDraggedOutOfParent(e));
  }

  /**
   * When the drag event ends, checks if there was a target (new parent candidate)
   * @param event
   */
  private onNodeDropped(event: DiagramEvent){
    const target = this.dropTarget;
    const node = <Node>event.node;
    this.setDropTarget(null);
    setTimeout(() => this.setDropTarget(null), 50);
    if(target && target !== node.getParent()){
      target.highlighted = false;
      this.changeNodeParent(node, target);
    }
  }

  /**
   * When ever the the node is dragged (moved), search for a potential new parent
   * @param event
   */
  private onNodeDragged(event: DiagramEvent){
    if(this.store.activeModule?.name != MODULES.NODE_DRAGGING) return;
    const node = <Node>event.node;
    // if(node?.parent) return;
    const { size } = node;
    const pos = node.getAbsolutePosition();
    const padd = 25;
    const bbox: BBox = {
      minX: pos.x + padd,
      minY: pos.y + padd,
      maxX: pos.x + size.width - padd,
      maxY: pos.y + size.height - padd,
    }
    let overlapingNodes = this.store.getNodesFromBBox(bbox);
    overlapingNodes = overlapingNodes.filter(n => (
      n !== node && n.showContent && !this.isNodeHidden(n) && !n.isBasic
    ));
    const excludes = [...node.children];
    const candidates = this.sortNodesByDistance(bbox, overlapingNodes, excludes);
    for(let candidate of candidates){
      if(this.isInChildsBranches(node, candidate)) continue;
      this.setDropTarget(candidate);
      return;
    }
    this.setDropTarget(null);
  }

  /**
   * Checks logicaly if a node is visibile on the canvas or not
   * @param node Node to check if it is visible
   */
  private isNodeHidden(node: Node){
    let n: Node | null = node;
    while(n = n.parent){
      if(n.showContent == false){
        return true;
      }
    }
    return false;
  }

  /**
   * Sort a list of nodes by distance to bounding box (rectangle)
   * @param bbox The bouding box to which the distance should be relative to
   * @param nodes List of nodes to be sorted
   * @param excludes List of nodes to exclude from the result
   */
  private sortNodesByDistance(bbox: BBox, nodes: Node[], excludes: Node[]): Node[]{
    const len = nodes.length;
    const items = [];
    for(let i = 0; i < len; i++){
      const node = nodes[i];
      if(excludes.includes(node)) continue;
      const { size } = node;
      const pos = node.getAbsolutePosition();
      const distanceSum = Math.abs(pos.x - bbox.minX)
                    + Math.abs(pos.y - bbox.minY)
                    + Math.abs(pos.x + size.width - bbox.maxX)
                    + Math.abs(pos.y + size.height - bbox.maxY);
      items.push({
        dist: distanceSum,
        node
      })
    }
    return items.sort((a, b) => a.dist - b.dist).map(item => item.node);
  }

  /**
   * Checks if a node belongs to other node's hierarchy (its childs or sub-childs recursivly)
   * @param root The root node of the hierarchy
   * @param target The node to check for
   */
  private isInChildsBranches(root: Node, target: Node){
    const childs = root.children;
    const len = childs.length;
    for(let i = 0; i < len; i++){
      const c = childs[i];
      if(c === target) return true;
      if(c.children.length && this.isInChildsBranches(c, target)) return true;
    }
    return false;
  }

  /**
   * Sets a node as a new parent candidate, ultimately highlighting it and cache its reference for later use (once the drag ends)
   * @param node
   */
  private setDropTarget(node: Node | null){
    if(this.dropTarget === node) return;
    if(this.dropTarget){
      this.dropTarget.highlighted = false;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: this.dropTarget });
    }
    this.dropTarget = node;
    if(node){
      node.highlighted = true;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node });
    }
  }

  /**
   * Changes node's parent (removes it from the old one and add it to the new one), also updates child's position to be relative to the new parent
   * @param node The child node
   * @param newParent The new parent node
   */
  private changeNodeParent(node: Node, newParent: Node){
    if(node.parent === newParent) return;
    if(node.containsNode(newParent)) return;
    const { top, left } = this.store.nodePadding;
    const pp = newParent.getAbsolutePosition();
    const cp = node.getAbsolutePosition();
    node.position = {
      x: cp.x - pp.x - left,
      y: cp.y - pp.y - top,
    }
    const oldParent = node.parent;
    node.parent?.removeChild(node);
    newParent.addChild(node);
    this.store.emit(EVENTS.NODE_PARENT_CHANGED, { node, data: oldParent });
  }

  /**
   * Removes the dragged node from its original parent, and makes it a top level parent, this is need to make possible dragging the node everywhere in the canvas
   * @param e
   */
  private onNodeDraggedOutOfParent(e: DiagramEvent): void {
    const node = <Node>e.node;
    node.position = node.getAbsolutePosition();
    const oldParent = node.parent;
    node.parent?.removeChild(node);
    this.store.emit(EVENTS.NODE_PARENT_CHANGED, { node, data: oldParent });
  }

}
