import { EdgesBucket } from "../classes/edges-bucket";
import { cloneArray, cloneNestedObject, cloneObject } from "../diagram-core/utils";
import { EventNode } from "../my-diagram/EventNode";
import { MyObject } from "../interfaces/MyObject";
import { EdgeCloneData, ObjectCloneData, StateCloneData, JunctionCloneData, EventCloneData, MessageCloneData, EdgeConnectionCloneData, ObjectCopyResult } from "../interfaces/ObjectCopyResult";
import { ObjectType } from "../interfaces/ObjectType";
import { MessageNode } from "../my-diagram/MessageNode";
import { MyEdge } from "../my-diagram/my-edge";
import { State } from "../my-diagram/state";
import { EdgeConnection, Node } from "../diagram-core";
import { Component } from "../diagram-core/components/component";
import { Junction } from "../my-diagram/junction";

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
    if(object.what === ObjectType.State || object.what === ObjectType.Thread){
      return {
        what: object.what,
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
    }else if(object.what === ObjectType.Junction){
      return {
        what: ObjectType.Junction,
        data: this.copyJunction(<Junction>object, edgesBucket)
      };
    }else{
      throw new Error(`Object '${object.what}' isn't supported`);
    }
  }

  public copyState(state: State, edgesBucket: EdgesBucket): StateCloneData{
    const { id, name, properties, statementBlocks, showContent, edges } = state;

    const parent = state.getParent();
    const { props, position, size } = this.getStatePropsAndBBox(state);
    const _showContent = state.props.isOpen ? false : showContent;
    const data: StateCloneData = {
      ref: id,
      parentRef: parent?.id,
      props: props,
      name: name,
      properties: cloneObject(properties),
      statementBlocks: cloneArray(statementBlocks),
      position: position,
      size: size,
      showContent: _showContent
    }
    edgesBucket.add(edges.map(ec => <MyEdge>ec.edge))
    return data;
  }

  private getStatePropsAndBBox(state: State){
    const { props, position, size } = state;
    const _props = cloneNestedObject(props);
    let _position = cloneObject(position);
    let _size= cloneObject(size);
    // If the State is open during coping,
    // we need to switch from OpenState Size & Position to NormalState Size & Position
    if(_props.isOpen){
      _props.openState = {
        position: _position,
        size: _size
      }
      const { position: ns_position, size: ns_size } = _props.normalState;
      if(ns_position && ns_size){
        _position = ns_position;
        _size = ns_size;
      }
      _props.isOpen = false;
    }
    return {
      props: _props,
      position: _position,
      size: _size
    }
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

  public copyJunction(junction: Junction, edgesBucket: EdgesBucket): JunctionCloneData{
    const { id, parent, position, size, edges } = junction;
    edgesBucket.add(edges.map(ec => <MyEdge>ec.edge));
    return {
      ref: id,
      parentRef: parent?.id,
      position: cloneObject(position),
      size: cloneObject(size),
      name: '',
      properties: undefined
    }
  }

  public copyEdge(edge: MyEdge): EdgeCloneData{
    const { id, shapePoints, name, properties, source, target } = edge;
    const data: EdgeCloneData = {
      ref: id,
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
    const { id, position, offset, attachType, nodeWall, bridgeTo, bridgeFrom } = ec;
    return {
      ref: id,
      nodeRef: node?.id,
      bridgeToRef: bridgeTo?.id,
      bridgeFromRef: bridgeFrom?.id,
      position: cloneObject(position),
      offset: cloneObject(offset),
      attachType,
      nodeWall
    }
  }

}
