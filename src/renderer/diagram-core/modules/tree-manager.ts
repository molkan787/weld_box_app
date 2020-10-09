import { BBox } from "rbush";
import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";

export class TreeManager{

  private dropTarget: Node | null = null;

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.NODE_DRAGGED, e => this.onNodeDragged(e));
    store.on(EVENTS.NODE_DROPPED, e => this.onNodeDropped(e));
  }

  private onNodeDropped(event: DiagramEvent){
    const target = this.dropTarget;
    this.setDropTarget(null);
    if(target){
      target.highlighted = false;
      this.changeNodeParent(<Node>event.node, target);
    }
  }

  private onNodeDragged(event: DiagramEvent){
    if(!this.store.nodeDraggingTool) return;
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
    overlapingNodes = overlapingNodes.filter(n => n !== node)
    const excludes = [...node.children];
    const candidates = this.sortNodesByDistance(bbox, overlapingNodes, excludes);
    for(let candidate of candidates){
      if(this.isInChildsBranches(node, candidate)) continue;
      this.setDropTarget(candidate);
      return;
    }
    this.setDropTarget(null);
  }

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

  private findNearestNode(bbox: BBox, nodes: Node[], excludes: Node[]){
    const len = nodes.length;
    let nearest: Node | null = null;
    let record = Infinity;
    for(let i = 0; i < len; i++){
      const node = nodes[i];
      if(excludes.includes(node)) continue;
      const { size } = node;
      const pos = node.getAbsolutePosition();
      const diffSum = Math.abs(pos.x - bbox.minX)
                    + Math.abs(pos.y - bbox.minY)
                    + Math.abs(pos.x + size.width - bbox.maxX)
                    + Math.abs(pos.y + size.height - bbox.maxY);
      if(diffSum < record){
        record = diffSum;
        nearest = node;
      }
    }
    return nearest;
  }

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

  private changeNodeParent(node: Node, newParent: Node){
    if(node.parent === newParent) return;
    const { top, left } = this.store.nodePadding;
    const pp = newParent.getAbsolutePosition();
    const cp = node.getAbsolutePosition();
    node.position = {
      x: cp.x - pp.x - left,
      y: cp.y - pp.y - top,
    }
    newParent.addChild(node);
    this.store.emit(EVENTS.NODE_PARENT_CHANGED, { node });
  }

}
