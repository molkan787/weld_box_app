import { Diagram, EdgeConnection, MultipartEdgeType, Node } from "../diagram-core";
import { Component } from "../diagram-core/components/component";
import { cloneArray } from "../diagram-core/utils";
import { MyObject } from "../interfaces/MyObject";
import { ObjectExportData, ThreadExportData, StateExportData, StatementBlockExportData, EdgeExportData, MessageExportData, EventExportData, JunctionExportData } from "../interfaces/ObjectExportData";
import { ObjectProps } from "../interfaces/ObjectProps";
import { ObjectType } from "../interfaces/ObjectType";
import { ProjectExportData } from "../interfaces/ProjectExportData";
import { ProjectSetting } from "../interfaces/ProjectSetting";
import { EventNode } from "../my-diagram/EventNode";
import { Junction } from "../my-diagram/junction";
import { MessageNode } from "../my-diagram/MessageNode";
import { EdgeType, MyEdge } from "../my-diagram/my-edge";
import { State } from "../my-diagram/state";
import { StatementBlock } from "../my-diagram/statement-block";
import { DiagramProject } from "./diagram-project";

export class DataExporter{

  public exportData(diagram: Diagram, setting: ProjectSetting): ProjectExportData{
    const objects = DiagramProject.getTopLevelObjects(diagram);
    const threadsData = objects.map(ob => this.getFullHierarchyObjectsData(ob));
    const { name, architecture, build_priority, headers } = setting;
    return {
      attributes: {
        name,
        architecture,
        build_priority,
        headers
      },
      body: <ThreadExportData[]>threadsData
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
      // ignore comment nodes
      if((<ObjectProps><any>node).what == ObjectType.Comment) continue;

      const parentId = node.getParent()?.id;
      const data = this.getObjectData(<any>node);
      const edgesData = this.getNodeEdgesData(node);
      if(parentId){
        let family = families.get(parentId);
        if(!family){
          family = [];
          families.set(parentId, family);
        }
        family.push(data);
        family.push(...edgesData.filter(exd => exd.properties.type == EdgeType.REGULAR));
      }
      const startEdges = edgesData.filter(exd => exd.properties.type == EdgeType.START);
      if(startEdges.length > 0){
        let itsFamily = families.get(node.id);
        if(!itsFamily){
          itsFamily = [];
          families.set(node.id, itsFamily);
        }
        itsFamily.push(...startEdges);
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

  private getNodeEdgesData(node: Node): EdgeExportData[]{
    const edges = node.edges
                      .filter(ec => (
                        ec.isSource() &&
                        (
                          !ec.edge?.isMultipart ||
                          (ec.edge?.isMultipart && ec.edge?.multipartType == MultipartEdgeType.Starting)
                        )
                      ))
                      .map(ec => <MyEdge>ec.edge);
    const data = edges.map(e => this.getEdgeData(e));
    return data;
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
      case ObjectType.Junction:
        return this.getJunctionData(<Junction>object);
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
        execution: properties.execution,
      },
      body: statementBlocks.map((sb, i) => this.getStatementBlockData(sb, i + 1))
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
      body: statementBlocks.map((sb, i) => this.getStatementBlockData(sb, i + 1))
    }
  }

  private getJunctionData(junction: Junction): JunctionExportData{
    return {
      attributes: {
        id: junction.id,
        what: ObjectType.Junction
      }
    }
  }

  private getStatementBlockData(statementBlock: StatementBlock, priority: number): StatementBlockExportData{
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
        priority
      },
      body: statements.split('\n').map(ln => ln.trim()).filter(ln => ln.length)
    }
  }

  private getEdgeData(edge: MyEdge): EdgeExportData{
    const { id, name, properties, source, target } = edge;
    const isStart = properties.type == EdgeType.START;
    const src = source.getInstance();
    let trg = target;
    if(target.bridgeFrom){
      trg = <EdgeConnection>target.bridgeFrom.edge?.target;
    }
    return {
      attributes: {
        id,
        name,
        what: ObjectType.Edge,
      },
      properties: {
        origin: (isStart ? 0 : src.node?.id) || 0,
        destination: trg.node?.id || 0,
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
