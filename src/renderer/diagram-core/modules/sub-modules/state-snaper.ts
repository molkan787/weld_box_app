import { Edge } from "../../components/edge";
import { EdgeConnection } from "../../components/edge-connection";
import { Node } from "../../components/node";
import { EdgeConnectionSnap, EdgeSnap, NodeSnap, NodeSnapState } from "../../interfaces/Snap";
import { cloneObject } from "../../utils";

export class StateSnaper{

  // ----------------------- Node ------------------------

  public snapNodeAsRestorer(node: Node): Function{
    const snap = this.snapNode(node);
    return () => this.restoreNode(snap);
  }

  public snapNode(node: Node): NodeSnap{
    const snap: NodeSnap = [];
    const nodes = node.showContent ? node.getAllDescendentsNodes(true) : [node];
    for(let i = 0; i < nodes.length; i++){
      const n = nodes[i];
      const state: NodeSnapState = {
        node: n,
        size: cloneObject(n.size),
        position: cloneObject(n.position),
        edges: this.snapEdges(node.edges.map(ec => <Edge>ec.edge))
      };
      snap.push(state)
    }
    return snap;
  }

  public restoreNode(snap: NodeSnap){
    for(let i = 0; i < snap.length; i++){
      const { node, size, position, edges } = snap[i];
      node.size = cloneObject(size);
      node.position = cloneObject(position);
      this.restoreEdges(edges);
    }
  }


  // ----------------------- Edge ------------------------

  public snapEdges(edges: Edge[]): EdgeSnap[]{
    const snaps: EdgeSnap[] = [];
    for(let i = 0; i < edges.length; i++){
      snaps.push(
        this.snapEdge(edges[i])
      );
    }
    return snaps;
  }


  public restoreEdges(snaps: EdgeSnap[]){
    for(let i = 0; i < snaps.length; i++){
      this.restoreEdge(snaps[i]);
    }
    return snaps;
  }

  public snapEdge(edge: Edge): EdgeSnap{
    const { source, target } = edge;
    return {
      edge,
      source: this.snapEdgeConnection(source),
      target: this.snapEdgeConnection(target)
    }
  }

  public restoreEdge(snap: EdgeSnap){
    const { source, target } = snap;
    this.restoreEdgeConnection(source);
    this.restoreEdgeConnection(target);
  }


  // ------------------ Edge Connection ------------------

  public snapEdgeConnection(ec: EdgeConnection): EdgeConnectionSnap{
    const state: EdgeConnectionSnap = {
      edgeConnection: ec,
      position: cloneObject(ec.position),
      offset: cloneObject(ec.offset),
      attachType: ec.attachType,
      nodeWall: ec.nodeWall
    }
    return state;
  }

  public restoreEdgeConnection(state: EdgeConnectionSnap){
    const {
      edgeConnection: ec, position,
      offset, attachType, nodeWall
    } = state;
    ec.position = cloneObject(position);
    ec.offset = cloneObject(offset);
    ec.attachType = attachType;
    ec.nodeWall = nodeWall;
  }

}
