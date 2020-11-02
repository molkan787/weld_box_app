import { Diagram, Node } from "../diagram-core";
import { Component } from "../diagram-core/components/component";
import { cloneArray } from "../diagram-core/utils";
import { MyObject } from "../interfaces/MyObject";
import { ObjectExportData, ThreadExportData, StateExportData, StatementBlockExportData, EdgeExportData, MessageExportData, EventExportData } from "../interfaces/ObjectExportData";
import { ObjectType } from "../interfaces/ObjectType";
import { EventNode } from "../my-diagram/EventNode";
import { MessageNode } from "../my-diagram/MessageNode";
import { MyEdge } from "../my-diagram/my-edge";
import { State } from "../my-diagram/state";
import { StatementBlock } from "../my-diagram/statement-block";
import { DiagramProject } from "./diagram-project";

export class DataExporter{

  public exportData(diagram: Diagram){
    const objects = DiagramProject.getTopLevelObjects(diagram);
    for(let i = 0; i < objects.length; i++){
      console.log(this.getFullHierarchyObjectsData(objects[i]));
    }
  }

  /**
   * Returns object's data including all of desendent childs data
   * @param object Object to get data of it
   */
  private getFullHierarchyObjectsData(object: MyObject){
    const rootNode = <Node><Component>object;
    const nodes = rootNode.getAllDescendentsNodes();
    const index = new Map<number, ObjectExportData>();
    const families = new Map<number, ObjectExportData[]>();
    const len = nodes.length;
    for(let i = 0; i < len; i++){
      const node = nodes[i];
      const parentId = node.getParent()?.id;
      const data = this.getObjectData(<any>node);
      if(parentId){
        let family = families.get(parentId);
        if(!family){
          family = [];
          families.set(parentId, family);
        }
        family.push(data);
      }
      index.set(node.id, data);
    }
    for(const [id, data] of index.entries()){
      const childs = families.get(id);
      if(childs){
        data.body?.push(...childs);
      }
    }
    const rootData = <ObjectExportData>index.get(rootNode.id);
    return rootData;
  }

  /**
   * Returns object's data omiting its child objects
   * @param object Object to get data of it
   */
  private getObjectData(object: MyObject): ObjectExportData{
    switch (object.what) {
      case ObjectType.State:
        return this.getStateData(<State>object);
      case ObjectType.Edge:
        return this.getEdgeData(<MyEdge>object);
      case ObjectType.Message:
        return this.getMessageData(<MessageNode>object);
      case ObjectType.Event:
        return this.getEventData(<EventNode>object);
      case ObjectType.Thread:
        return this.getThreadData(<State>object);

      default:
        throw new Error(`Unsupported object type '${object.what}'`);
    }
  }

  private getThreadData(thread: State): ThreadExportData{
    const { id, name, properties, statementBlocks } = thread;
    return {
      attributes: {
        what: ObjectType.Thread,
        id,
        name
      },
      properties: {
        decomposition: properties.decomposition,
        execution: 0
      },
      body: statementBlocks.map(sb => this.getStatementBlockData(sb))
    }
  }

  private getStateData(thread: State): StateExportData{
    const { id, name, properties, statementBlocks } = thread;
    return {
      attributes: {
        what: ObjectType.State,
        id,
        name
      },
      properties: {
        decomposition: properties.decomposition,
        priority: properties.priority,
        historic: properties.historic ? 1 : 0
      },
      body: statementBlocks.map(sb => this.getStatementBlockData(sb))
    }
  }

  private getStatementBlockData(statementBlock: StatementBlock): StatementBlockExportData{
    const { id, name, statements, execution } = statementBlock;
    const exec = [];
    execution.ex && exec.push('ex');
    execution.du && exec.push('du');
    execution.en && exec.push('en');
    return {
      attributes: {
        id,
        name,
        what: ObjectType.StatementBlock,
      },
      properties: {
        execution: exec.join(','),
      },
      body: statements.split('\n').map(ln => ln.trim()).filter(ln => ln.length)
    }
  }

  private getEdgeData(edge: MyEdge): EdgeExportData{
    const { id, name, properties, source, target } = edge;
    return {
      attributes: {
        id,
        name,
        what: ObjectType.Edge,
      },
      properties: {
        origin: source.node?.id || 0,
        destination: target.node?.id || 0,
        priority: properties.priority,
        type: properties.type,
        condition: properties.condition
      }
    }
  }

  private getMessageData(message: MessageNode): MessageExportData{
    const { id, name, properties, body } = message;
    return {
      attributes: {
        id,
        name,
        what: ObjectType.Message,
      },
      properties: {
        queue_length: properties.queue_length,
        type: properties.type
      },
      body: cloneArray(body)
    }
  }

  private getEventData(event: EventNode): EventExportData{
    const { id, name, properties } = event;
    return {
      attributes: {
        id,
        name,
        what: ObjectType.Event,
      },
      properties: {
        clear: properties.clear,
        type: properties.type
      }
    }
  }

}