import { Edge } from "../../components/edge";
import { EdgeConnection } from "../../components/edge-connection";
import { Node } from "../../components/node";
import { EdgeConnectionSnap, EdgeSnap, NodeSnap, NodeSnapState } from "../../interfaces/Snap";
import { cloneArray, cloneObject } from "../../utils";

export class StateSnaper{

  // ----------------------- Node ------------------------

  /**
   * Snapshots Node and return function which upon call will restore that snapshot
   * @param node Node to snap
   */
  public snapNodeAsRestorer(node: Node): Function{
    const snap = this.snapNode(node);
    return () => this.restoreNode(snap);
  }

  /**
   * Snapshots Node's state (properties, ex: size, position...)
   * @param node Node to snap
   */
  public snapNode(node: Node): NodeSnap{
    const snap: NodeSnap = [];
    const nodes = node.showContent ? node.getAllDescendentsNodes(true) : [node];
    for(let i = 0; i < nodes.length; i++){
      const n = nodes[i];
      const state: NodeSnapState = {
        node: n,
        parent: n.getParent(),
        size: cloneObject(n.size),
        position: cloneObject(n.position),
        // edges: this.snapEdges(node.edges.map(ec => <Edge>ec.edge))
      };
      snap.push(state)
    }
    return snap;
  }

  /**
   * Restore Node's state (properties, ex: size, position...) from a previously taken snapshot
   * @param snap Snapshot to restore from
   */
  public restoreNode(snap: NodeSnap){
    for(let i = 0; i < snap.length; i++){
      const { node, parent, size, position } = snap[i];
      const currentParent = node.getParent();
      if(currentParent !== parent){
        if(currentParent) currentParent.removeChild(node);
        if(parent) parent.addChild(node);
      }
      node.size = cloneObject(size);
      node.position = cloneObject(position);
      // this.restoreEdges(edges);
    }
  }


  // ----------------------- Edge ------------------------

  /**
   * Snapshots Edge and return function which upon call will restore that snapshot
   * @param edge Edge to snap
   */
  public snapEdgeAsRestorer(edge: Edge): Function{
    const snap = this.snapEdge(edge);
    console.log('snap', snap);
    return () => this.restoreEdge(snap);
  }

  /**
   * Snapshots multiple Edges
   * @param snaps
   */
  public snapEdges(edges: Edge[]): EdgeSnap[]{
    const snaps: EdgeSnap[] = [];
    for(let i = 0; i < edges.length; i++){
      snaps.push(
        this.snapEdge(edges[i])
      );
    }
    return snaps;
  }


  /**
   * Restores multiple Edge Snapshots
   * @param snaps
   */
  public restoreEdges(snaps: EdgeSnap[]){
    for(let i = 0; i < snaps.length; i++){
      this.restoreEdge(snaps[i]);
    }
    return snaps;
  }

  /**
   * Snapshots Edge's state (properties, ex: source, target...)
   * @param edge Edge to snap
   */
  public snapEdge(edge: Edge): EdgeSnap{
    const { source, target, isMultipart, multipartLocation, multipartType } = edge;
    return {
      edge,
      shapePoints: cloneArray(edge.shapePoints),
      source: this.snapEdgeConnection(source),
      target: this.snapEdgeConnection(target),
      isMultipart,
      multipartLocation,
      multipartType
    }
  }
  /**
   * Restore Edge's state (properties, ex: source, target...) from a previously taken snapshot
   * @param snap Snapshot to restore from
   */
  public restoreEdge(snap: EdgeSnap){
    const { edge, shapePoints, source, target, isMultipart, multipartLocation, multipartType } = snap;
    edge.shapePoints = cloneArray(shapePoints);
    edge.setSource(this.restoreEdgeConnection(source));
    edge.setTarget(this.restoreEdgeConnection(target));
    this.restoreEdgeConnection(target);
    if(isMultipart){
      edge.convertToMultipart(multipartLocation, multipartType);
    }else{
      edge.convertToNormal();
    }
  }


  // ------------------ Edge Connection ------------------

  /**
   * Snapshots EdgeConnection's state (properties, ex: attachType, position...)
   * @param ec EdgeConnection to snap
   */
  public snapEdgeConnection(ec: EdgeConnection): EdgeConnectionSnap{
    const state: EdgeConnectionSnap = {
      edgeConnection: ec,
      position: cloneObject(ec.position),
      offset: cloneObject(ec.offset),
      attachType: ec.attachType,
      nodeWall: ec.nodeWall,
      node: ec.node,
      bridgeTo: ec.bridgeTo,
      bridgeFrom: ec.bridgeFrom
    }
    return state;
  }

  /**
   * Restore EdgeConnection's state (properties, ex: attachType, position...) from a previously taken snapshot
   * @param snap Snapshot to restore from
   */
  public restoreEdgeConnection(state: EdgeConnectionSnap){
    const {
      edgeConnection: ec, position,
      offset, attachType, nodeWall,
      node,
      bridgeFrom,
      bridgeTo
    } = state;
    ec.position = cloneObject(position);
    ec.offset = cloneObject(offset);
    ec.attachType = attachType;
    ec.nodeWall = nodeWall;
    ec.bridgeTo = bridgeTo;
    ec.bridgeFrom = bridgeFrom;
    if(node && ec.isAttachedToNode()){
      node.addEdgeConnection(ec);
    }else{
      ec.node = null;
    }
    return ec;
  }

}
