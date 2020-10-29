import { EdgesBucket } from "../classes/edges-bucket";
import { cloneArray, cloneObject } from "../diagram-core/utils";
import { EventNode } from "../my-diagram/EventNode";
import { MyObject } from "../interfaces/MyObject";
import { EdgeCloneData, ObjectCloneData, StateCloneData, EventCloneData, MessageCloneData, EdgeConnectionCloneData, ObjectCopyResult } from "../interfaces/ObjectCopyResult";
import { ObjectType } from "../interfaces/ObjectType";
import { MessageNode } from "../my-diagram/MessageNode";
import { MyEdge } from "../my-diagram/my-edge";
import { State } from "../my-diagram/state";
import { EdgeConnection, Node } from "../diagram-core";
import { Component } from "../diagram-core/components/component";

/**
 * Helper class that convert Diagram's object to json data (export like)
 */
export class ObjectCopier{

  public copy(object: MyObject): ObjectCopyResult{
    const node = <Node><Component>object;
    const objects = <MyObject[]><any[]>node.getAllDescendentsNodes();
    const edgesBucket = new EdgesBucket();
    const objectsClones: ObjectCloneData[] = [];
    for(let o of objects){
      objectsClones.push(this.copyObject(o, edgesBucket));
    }
    const edges = edgesBucket.getAll().map(edge => this.copyEdge(edge));
    return {
      objects: objectsClones,
      edges: edges
    }
  }

  public copyObject(object: MyObject, edgesBucket: EdgesBucket): ObjectCloneData{
    if(object.what === ObjectType.State){
      return {
        what: ObjectType.State,
        data: this.copyState(<State>object, edgesBucket),
      };
    }else if(object.what === ObjectType.Event){
      return {
        what: ObjectType.Event,
        data: this.copyEventNode(<EventNode>object)
      };
    }else if(object.what === ObjectType.Message){
      return {
        what: ObjectType.Message,
        data: this.copyMessageNode(<MessageNode>object)
      };
    }else{
      throw new Error(`Object '${object.what}' isn't supported`);
    }
  }

  public copyState(state: State, edgesBucket: EdgesBucket): StateCloneData{
    const { id, parent, name, properties, statementBlocks, position, size, showContent, edges } = state;

    // const children = <ObjectCloneData[]>state.children
    //                     .map( child => this.copy(<MyObject><unknown>child, edgesBucket) )
    //                     .filter( cd => !!cd );

    const data: StateCloneData = {
      ref: id,
      parentRef: parent?.id,
      name: name,
      properties: cloneObject(properties),
      statementBlocks: cloneArray(statementBlocks),
      position: cloneObject(position),
      size: cloneObject(size),
      // children: children,
      showContent: showContent
    }
    edgesBucket.add(edges.map(ec => <MyEdge>ec.edge))
    return data;
  }

  public copyEventNode(event: EventNode): EventCloneData{
    const { id, parent, name, properties, position, size } = event;
    const data: EventCloneData = {
      ref: id,
      parentRef: parent?.id,
      name: name,
      properties: cloneObject(properties),
      position: cloneObject(position),
      size: cloneObject(size)
    };
    return data;
  }

  public copyMessageNode(event: MessageNode): MessageCloneData{
    const { id, parent, name, properties, body, position, size } = event;
    const data: MessageCloneData = {
      ref: id,
      parentRef: parent?.id,
      name: name,
      properties: cloneObject(properties),
      body: cloneArray(body),
      position: cloneObject(position),
      size: cloneObject(size)
    };
    return data;
  }

  public copyEdge(edge: MyEdge): EdgeCloneData{
    const { id, shapePoints, name, properties, source, target } = edge;
    const data: EdgeCloneData = {
      originId: id,
      name,
      shapePoints: cloneArray(shapePoints),
      properties: cloneObject(properties),
      source: this.copyEdgeConnection(source),
      target: this.copyEdgeConnection(target),
    }
    return data;
  }

  private copyEdgeConnection(ec: EdgeConnection): EdgeConnectionCloneData{
    const node = <Node>ec.node;
    const { position, offset, attachType, nodeWall } = ec;
    return {
      nodeRef: node.id,
      position: cloneObject(position),
      offset: cloneObject(offset),
      attachType,
      nodeWall
    }
  }

}
