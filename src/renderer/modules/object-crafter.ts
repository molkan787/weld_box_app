import { EdgeConnection, Node } from "../diagram-core";
import { cloneArray, cloneObject } from "../diagram-core/utils";
import { EventNode } from "../my-diagram/EventNode";
import { EdgeCloneData, EdgeConnectionCloneData, EventCloneData, MessageCloneData, NodeCloneData, ObjectCloneData, ObjectCopyResult, StateCloneData } from "../interfaces/ObjectCopyResult";
import { ObjectType } from "../interfaces/ObjectType";
import { MessageNode } from "../my-diagram/MessageNode";
import { MyEdge } from "../my-diagram/my-edge";
import { State } from "../my-diagram/state";
import { NodeCraftResult, ObjectCraftResult } from "../interfaces/ObjectCraftResult";

declare type NodesRef = Map<number, Node>;

export class ObjectCrafter{

  public craft(copyResult: ObjectCopyResult): ObjectCraftResult{
    const { objects, edges } = copyResult;
    const refs: NodesRef = new Map();
    const nodes: Node[] = [];
    for(let object of objects){
      const data = <NodeCloneData>object.data;
      const { node, ref } = this.craftNode(object);
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
      edges: this.craftEdges(edges, refs)
    }
  }

  public craftNode(cloneData: ObjectCloneData): NodeCraftResult{
    const { what, data } = cloneData;
    let node: Node;
    if(what == ObjectType.State || what == ObjectType.Thread){
      node = this.craftState(<StateCloneData>data, what);
    }else if(cloneData.what == ObjectType.Event){
      node = this.craftEventNode(<EventCloneData>data);
    }else if(cloneData.what == ObjectType.Message){
      node = this.craftMessageNode(<MessageCloneData>data);
    }else{
      throw new Error('Unsupported object type, (to craft an edge, call craftEdge() directly)');
    }
    return {
      node,
      ref: (<NodeCloneData>data).ref,
    };
  }

  public craftState(data: StateCloneData, what: ObjectType): State{
    const { name, properties, statementBlocks, position, size, showContent } = data;
    const state = new State(cloneObject(position), cloneObject(size));
    state.properties = cloneObject(properties);
    state.statementBlocks = cloneArray(statementBlocks);
    state.setShowContent(showContent, true);
    if(what == ObjectType.Thread){
      state.convertToThread();
    }
    state.name = name;
    return state;
  }

  public craftEventNode(data: EventCloneData): EventNode{
    const { name, properties, position, size } = data;
    const node = new EventNode(cloneObject(position));
    node.size = cloneObject(size);
    node.name = name;
    node.properties = cloneObject(properties);
    return node;
  }

  public craftMessageNode(data: MessageCloneData): MessageNode{
    const { name, properties, body, position, size } = data;
    const node = new MessageNode(cloneObject(position));
    node.size = cloneObject(size);
    node.name = name;
    node.properties = cloneObject(properties);
    node.body = cloneArray(body);
    return node;
  }

  public craftEdges(edges: EdgeCloneData[], nodesRef: NodesRef): MyEdge[]{
    return <MyEdge[]>edges.map(e => this.craftEdge(e, nodesRef)).filter(e => !!e);
  }

  public craftEdge(data: EdgeCloneData, nodesRef: NodesRef): MyEdge | null{
    const { name, properties, shapePoints, source, target } = data;
    const sourceEC = this.craftEdgeConnection(source);
    const targetEC = this.craftEdgeConnection(target);
    const sourceNode = nodesRef.get(source.nodeRef);
    const targetNode = nodesRef.get(target.nodeRef);
    if((source.nodeRef && !sourceNode) || target.nodeRef && !targetNode) return null;
    sourceNode?.addEdgeConnection(sourceEC);
    targetNode?.addEdgeConnection(targetEC);
    const edge =  new MyEdge(sourceEC, targetEC);
    edge.propsArchiver.lock();
    edge.name = name;
    edge.properties = cloneObject(properties);
    edge.shapePoints = cloneArray(shapePoints);
    edge.propsArchiver.unlock();
    return edge;
  }

  private craftEdgeConnection(data: EdgeConnectionCloneData): EdgeConnection{
    const { position, offset, attachType, nodeWall } = data;
    const ec = new EdgeConnection(attachType, nodeWall);
    ec.position = cloneObject(position);
    ec.offset = cloneObject(offset);
    return ec;
  }

}
