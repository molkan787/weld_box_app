import { zoomIdentity } from "d3";
import { Diagram, EVENTS, Node } from "../diagram-core";
import { Component } from "../diagram-core/components/component";
import { SubChart } from "../diagram-core/modules/sub-chart";
import { DiagramExportData, ZoomTransformData } from "../interfaces/DiagramExportData";
import { MyObject } from "../interfaces/MyObject";
import { ObjectCraftResult } from "../interfaces/ObjectCraftResult";
import { ObjectType } from "../interfaces/ObjectType";
import { ObjectCopier } from "./object-copier";
import { ObjectCrafter } from "./object-crafter";

/**
 * This module handles the process of importing and export Diagram and its components to serializable format
 */
export class DiagramProject{

  private objectCopier = new ObjectCopier();
  private objectCrafter = new ObjectCrafter();

//#region export

  /**
   * Exports Diagram's data to a serializable json object
   * @param diagram `Diagram` instance to export from
   */
  public export(diagram: Diagram): DiagramExportData{
    const topLevelobjects = DiagramProject.getTopLevelObjects(diagram);
    const objects = topLevelobjects.map(o => this.objectCopier.copy(o));
    return {
      idPointer: Component.idPointer,
      objects,
      currentNodeRef: diagram.currentNode?.id,
      zoomTransforms: this.getSubChartsZoomTransforms(diagram)
    }
  }


  /**
   * Returns top level Node of a Diagram
   * @param diagram
   */
  public static getTopLevelObjects(diagram: Diagram){
    const result: MyObject[] = [];
    const objects = <MyObject[]><Component[]>diagram.store.nodes;
    const len = objects.length;
    for(let i = 0; i < len; i++){
      const object = objects[i];
      if(object.what == ObjectType.Thread){
        result.push(object);
      }
    }
    return result;
  }

  /**
   * Returns zoom transforms for each of the Subchart Node
   * @param diagram
   */
  private getSubChartsZoomTransforms(diagram: Diagram){
    const subChart = <SubChart>diagram.getModule('subChart');
    const map = subChart.zoomTransforms;
    const items: [number, any][] = Array.from(map.entries());
    items.forEach(item => {
      const { x, y, k } = item[1];
      item[1] = { x, y, k };
    });
    return <ZoomTransformData[]>items;
  }

//#endregion

//#region import

  /**
   * Import a previously export data (components) into the specified diagram
   * @param diagram
   * @param data
   */
  public import(diagram: Diagram, data: DiagramExportData){
    const { objects, currentNodeRef, zoomTransforms, idPointer } = data;
    const len = objects.length;
    let currentNode: Node | null = null;
    for(let i = 0; i < len; i++){
      const objData = objects[i];
      const objCraftResult = this.objectCrafter.craft(objData, true);
      this.putCraftResult(diagram, objCraftResult);

      if(currentNodeRef){
        const node = objCraftResult.nodesRefs.get(currentNodeRef);
        if(node){
          currentNode = node;
        }
      }

    }
    const zooms = this.putZoomTransforms(diagram, zoomTransforms);
    Component.idPointer = idPointer;
    if(currentNode){
      diagram.store.emit(EVENTS.DIAGRAM_JUMP_TO_NODE, { node: currentNode });
    }else{
      const zoom = zooms.get(0);
      zoom && diagram.store.emit(EVENTS.DIAGRAM_SET_ZOOM, { data: zoom });
    }
  }

  /**
   * Adds the created components to the Diagram
   * @param diagram
   * @param objectCraftResult The result of object crafting returned by the ObjectCrafter module
   */
  private putCraftResult(diagram: Diagram, objectCraftResult: ObjectCraftResult){
    const { nodes, edges } = objectCraftResult;
    diagram.addNode(nodes[0]);

    const eLen = edges.length;
    for(let i = 0; i < eLen; i++){
      const edge = edges[i];
      diagram.addEdge(edge);
    }
  }

  /**
   * Sets zoom transform for each sub-chart
   * @param diagram
   * @param items
   */
  private putZoomTransforms(diagram: Diagram, items: ZoomTransformData[]){
    const subChart = <SubChart>diagram.getModule('subChart');
    const map = subChart.zoomTransforms;
    for(let i = 0; i < items.length; i++){
      const [ ref, transformData ] = items[i];
      const { x, y, k } = transformData;
      const transform = zoomIdentity.translate(x, y).scale(k);
      map.set(ref, transform);
    }
    return map;
  }

//#endregion

}
