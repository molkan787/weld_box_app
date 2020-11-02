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

export class DiagramProject{

  private objectCopier = new ObjectCopier();
  private objectCrafter = new ObjectCrafter();

//#region export

  /**
   * Exports Diagram's data to a portable json object
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
    this.putZoomTransforms(diagram, zoomTransforms);
    Component.idPointer = idPointer;
    if(currentNode){
      diagram.store.emit(EVENTS.DIAGRAM_JUMP_TO_NODE, { node: currentNode });
    }
  }

  private putCraftResult(diagram: Diagram, objectCraftResult: ObjectCraftResult){
    const { nodes, edges } = objectCraftResult;
    diagram.addNode(nodes[0]);

    const eLen = edges.length;
    for(let i = 0; i < eLen; i++){
      diagram.addEdge(edges[i]);
    }

    const store = diagram.store;
    for(let i = nodes.length - 1; i >= 0; i--){
      const node = nodes[i];
      if(!node.showContent){
        store.emit(EVENTS.NODE_CONTENT_GOT_HIDDEN, { node });
      }
    }
  }

  private putZoomTransforms(diagram: Diagram, items: ZoomTransformData[]){
    const subChart = <SubChart>diagram.getModule('subChart');
    const map = subChart.zoomTransforms;
    for(let i = 0; i < items.length; i++){
      const [ ref, transformData ] = items[i];
      const { x, y, k } = transformData;
      const transform = zoomIdentity.translate(x, y).scale(k);
      map.set(ref, transform);
    }
  }

//#endregion

}
