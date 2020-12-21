import { EdgeConnection, Node } from "../diagram-core";
import { cloneArray, cloneNestedObject, cloneObject } from "../diagram-core/utils";
import { EventNode } from "../my-diagram/EventNode";
import { CommentCloneData, EdgeCloneData, EdgeConnectionCloneData, EventCloneData, JunctionCloneData, MessageCloneData, NodeCloneData, ObjectCloneData, ObjectCopyResult, StateCloneData } from "../interfaces/ObjectCopyResult";
import { ObjectType } from "../interfaces/ObjectType";
import { MessageNode } from "../my-diagram/MessageNode";
import { EdgeType, MyEdge } from "../my-diagram/my-edge";
import { State } from "../my-diagram/state";
import { NodeCraftResult, NodesRefs, ObjectCraftResult } from "../interfaces/ObjectCraftResult";
import { Junction } from "../my-diagram/junction";
import { CommentNode } from "../my-diagram/comment-node";

/**
 * Helper class that convert json data to Diagram's objects  (import like)
 */
export class ObjectCrafter{

  /**
   * Create an actual components instance from data objects (recursivly)
   * @param copyResult The data objects previously return by the ObjectCopier module
   * @param useRefsAsIds if `true` the "ref" included in the data objects will be used as the id of the component
   */
  public craft(copyResult: ObjectCopyResult, useRefsAsIds?: boolean): ObjectCraftResult{
    const { objects, edges } = copyResult;
    const refs: NodesRefs = new Map();
    const nodes: Node[] = [];
    for(let object of objects){
      const data = <NodeCloneData>object.data;
      const { node, ref } = this.craftNode(object, useRefsAsIds);
      nodes.push(node);
      if(typeof ref == 'number'){
        refs.set(ref, node);
      }
      if(data.parentRef){
        const parent = refs.get(data.parentRef);
        if(parent){
          parent.addChild(node);
        }
      }
    }
    return {
      nodes,
      nodesRefs: refs,
      edges: this.craftEdges(edges, refs, useRefsAsIds)
    }
  }

  /**
   * Create an actual component instance from data object
   * @param cloneData Data object
   * @param useRefsAsIds if `true` the "ref" included in the data object will be used as the id of the component
   */
  public craftNode(cloneData: ObjectCloneData, useRefsAsIds?: boolean): NodeCraftResult{
    const { what, data } = cloneData;
    let node: Node;
    if(what == ObjectType.State || what == ObjectType.Thread){
      node = this.craftState(<StateCloneData>data, what);
    }else if(cloneData.what == ObjectType.Event){
      node = this.craftEventNode(<EventCloneData>data);
    }else if(cloneData.what == ObjectType.Message){
      node = this.craftMessageNode(<MessageCloneData>data);
    }else if(cloneData.what == ObjectType.Junction){
      node = this.craftJunction(<JunctionCloneData>data);
    }else if(cloneData.what == ObjectType.Comment){
      node = this.craftComment(<CommentCloneData>data);
    }else{
      throw new Error(`Unsupported object type '${what}'`);
    }
    if(useRefsAsIds){
      node._setId(data.ref);
    }
    return {
      node,
      ref: (<NodeCloneData>data).ref,
    };
  }

  /**
   * Create an actual State instance from data object
   * @param data
   * @param what A State and Thread share the same class, so a component type should be specified
   */
  public craftState(data: StateCloneData, what: ObjectType): State{
    const { props, name, properties, statementBlocks, position, size, showContent, isSubChart, codeblocksExpanded } = data;
    const state = new State(cloneObject(position), cloneObject(size));
    state.props = cloneNestedObject(props);
    state.properties = cloneObject(properties);
    state.properties.execution = state.properties.execution || 0;
    state.statementBlocks = cloneArray(statementBlocks);
    state.codeblocksExpanded = typeof codeblocksExpanded == 'boolean' ? codeblocksExpanded : true;
    if(isSubChart){
      state.convertToSubChart(true);
    }
    state.setShowContent(showContent, true);

    if(what == ObjectType.Thread){
      state.convertToThread();
    }
    state.name = name;
    return state;
  }

  /**
   * Create an actual Event node instance from data object
   * @param data
   */
  public craftEventNode(data: EventCloneData): EventNode{
    const { name, properties, position, size } = data;
    const node = new EventNode(cloneObject(position));
    node.size = cloneObject(size);
    node.name = name;
    node.properties = cloneObject(properties);
    return node;
  }

  /**
   * Create an actual Message node instance from data object
   * @param data
   */
  public craftMessageNode(data: MessageCloneData): MessageNode{
    const { name, properties, body, position, size } = data;
    const node = new MessageNode(cloneObject(position));
    node.size = cloneObject(size);
    node.name = name;
    node.properties = cloneObject(properties);
    node.body = cloneArray(body);
    return node;
  }

  /**
   * Create an actual Junction instance from data object
   * @param data
   */
  public craftJunction(data: JunctionCloneData): Junction{
    const { position, size } = data;
    const node = new Junction(cloneObject(position));
    node.size = cloneObject(size);
    return node;
  }

  /**
   * Create an actual Comment instance from data object
   * @param data
   */
  public craftComment(data: CommentCloneData): CommentNode{
    const { position, size, text } = data;
    const node = new CommentNode(cloneObject(position));
    node.size = cloneObject(size);
    node.text = text;
    return node;
  }

  /**
   * Create an actual Edges instances from data objects
   * @param edgesData Edges data objects
   * @param nodesRef Because the edges data object keeps reference to the connected Node, a map need to be specified (map of Nodes instance mapped by their references)
   * @param useRefsAsIds if `true` the "ref" included in the data object will be used as the id of the component
   */
  public craftEdges(edgesData: EdgeCloneData[], nodesRef: NodesRefs, useRefsAsIds?: boolean): MyEdge[]{
    const edges: MyEdge[] = [];
    const ecRefs = new Map<number, EdgeConnection>();
    const ecsData: EdgeConnectionCloneData[] = [];
    for(let i = 0; i < edgesData.length; i++){
      const edgeData = edgesData[i];
      const edge = this.craftEdge(edgeData, nodesRef, useRefsAsIds);
      if(edge){
        edges.push(edge);
        if(useRefsAsIds){
          const { source: sourceData, target: targetData } = edgeData;
          const { source, target } = edge;
          ecsData.push(sourceData, targetData);
          ecRefs.set(source.id, source);
          ecRefs.set(target.id, target);
        }
      }
    }
    if(useRefsAsIds){
      for(let i = 0; i < ecsData.length; i++){
        const ecData = ecsData[i];
        const { ref, bridgeToRef, bridgeFromRef } = ecData;
        const ec = ecRefs.get(ref);
        if(ec){
          if(bridgeToRef) ec.bridgeTo = ecRefs.get(bridgeToRef) || null;
          if(bridgeFromRef) ec.bridgeFrom = ecRefs.get(bridgeFromRef) || null;
        }
      }
    }
    return edges;
  }

  /**
   * Create an actual Edge instance from data object
   * @param data Edge data object
   * @param nodesRef Because the edges data object keeps reference to the connected Node, a map need to be specified (map of Nodes instance mapped by their references)
   * @param useRefsAsIds if `true` the "ref" included in the data object will be used as the id of the component
   */
  public craftEdge(data: EdgeCloneData, nodesRef: NodesRefs, useRefsAsIds?: boolean): MyEdge | null{
    const {
      ref, name, properties, shapePoints, source, target,
      isMultipart, multipartLocation, multipartType
    } = data;
    const sourceEC = this.craftEdgeConnection(source, useRefsAsIds);
    const targetEC = this.craftEdgeConnection(target, useRefsAsIds);
    const sourceNode = nodesRef.get(source.nodeRef);
    const targetNode = nodesRef.get(target.nodeRef);
    if((source.nodeRef && !sourceNode) || target.nodeRef && !targetNode) return null;
    sourceNode?.addEdgeConnection(sourceEC);
    targetNode?.addEdgeConnection(targetEC);
    const edge =  new MyEdge(sourceEC, targetEC, isMultipart, multipartLocation, multipartType);
    if(useRefsAsIds){
      edge._setId(ref);
    }
    edge.propsArchiver.lock();
    edge.name = name;
    edge.properties = cloneObject(properties);
    edge.shapePoints = cloneArray(shapePoints);
    edge.isStart = properties.type == EdgeType.START;
    edge.propsArchiver.unlock();
    return edge;
  }

  /**
   * Create an actual EdgeConnection instance from data object
   * @param data EdgeConnection data object
   * @param useRefsAsIds if `true` the "ref" included in the data object will be used as the id of the component
   */
  private craftEdgeConnection(data: EdgeConnectionCloneData, useRefsAsIds?: boolean): EdgeConnection{
    const { ref, position, offset, attachType, nodeWall } = data;
    const ec = new EdgeConnection(attachType, nodeWall);
    ec.position = cloneObject(position);
    ec.offset = cloneObject(offset);
    if(useRefsAsIds){
      ec._setId(ref);
    }
    return ec;
  }

}
