import { BBox } from "rbush";
import { Node } from "../components/node";
import { EVENTS, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { DiagramModule } from "../module";

export class TreeManager extends DiagramModule{

  private dropTarget: Node | null = null;

  constructor(readonly store: DiagramStore){
    super(store, MODULES.TREE_MANAGER);
    store.on(EVENTS.NODE_DRAGGED, e => this.onNodeDragged(e));
    store.on(EVENTS.NODE_DROPPED, e => this.onNodeDropped(e));
    store.on(EVENTS.NODE_DRAGGED_OUT_OF_PARENT, e => this.onNodeDraggedOutOfParent(e));
  }

  private onNodeDropped(event: DiagramEvent){
    const target = this.dropTarget;
    const node = <Node>event.node;
    this.setDropTarget(null);
    if(target && target !== node.getParent()){
      target.highlighted = false;
      // const prevSnapRestorer = this.stateSnaper.snapNodeAsRestorer(node);
      this.changeNodeParent(node, target);
      // const currSnapRestorer = this.stateSnaper.snapNodeAsRestorer(node);

      // this.enableActionGrouping();
      // this.pushAction({
      //   undo: [
      //     {
      //       events: [EVENTS.NODE_PARENT_CHANGED],
      //       eventsPayload: { node },
      //       do: prevSnapRestorer
      //     }
      //   ],
      //   redo: [
      //     {
      //       events: [EVENTS.NODE_PARENT_CHANGED],
      //       eventsPayload: { node },
      //       do: currSnapRestorer
      //     }
      //   ]
      // })
      // this.disableActionGrouping();
    }
  }

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
    overlapingNodes = overlapingNodes.filter(n => n !== node && n.showContent && !n.isBasic)
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
    node.parent?.removeChild(node);
    newParent.addChild(node);
    this.store.emit(EVENTS.NODE_PARENT_CHANGED, { node });
  }

  private onNodeDraggedOutOfParent(e: DiagramEvent): void {
    const node = <Node>e.node;
    node.position = node.getAbsolutePosition();
    node.parent?.removeChild(node);
    this.store.emit(EVENTS.NODE_PARENT_CHANGED, { node });
  }

}
