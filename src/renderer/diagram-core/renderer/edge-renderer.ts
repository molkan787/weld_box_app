import { select } from "d3";
import { Edge } from "../components/edge";
import { AttachType } from "../components/edge-connection";
import { CLASSES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { D3Node } from "../types/aliases";
import { cs } from "./utils";

export class EdgeRenderer{

  constructor(readonly store: DiagramStore){}

  rebuild(container: D3Node, edge: Edge){
    this.destroyElement(edge);
    this.build(container, edge);
  }

  build(container: D3Node, edge: Edge){
    const g = container.append('g');
    g.classed('edge', true)
      .attr('id', 'edge-' + edge.id);

    const { source, target } = edge;
    if(source.getInstance().attachType === AttachType.NodeBody){
      g.append('rect')
        .classed(CLASSES.ATTACH_BOX, true)
        .classed(CLASSES.SOURCE_ATTACH_BOX, true);
    }

    if(target.getInstance().attachType === AttachType.NodeBody){
      g.append('rect')
        .classed(CLASSES.ATTACH_BOX, true)
        .classed(CLASSES.TARGET_ATTACH_BOX, true);
    }

    g.append('line')
      .attr("stroke-width", 2);

    this.store.setD3Node(edge.id, g);
    this.update(edge);
  }

  update(edge: Edge){
    const d3Node = this.store.getD3Node(edge.id);
    if(typeof d3Node === 'undefined') return;

    let { source, target } = edge;
    source = source.getInstance();
    target = target.getInstance();

    const { x: x1, y: y1 } = source.getCoordinates();
    const { x: x2, y: y2 } = target.getCoordinates();

    d3Node.select('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)

    if(source.attachType === AttachType.NodeBody){
      d3Node.select(cs(CLASSES.SOURCE_ATTACH_BOX))
              .attr('x', x1)
              .attr('y', y1)
    }

    if(target.attachType === AttachType.NodeBody){
      d3Node.select(cs(CLASSES.TARGET_ATTACH_BOX))
              .attr('x', x2)
              .attr('y', y2)
    }

  }

  destroyElement(edge: Edge){
    select(`#edge-${edge.id}`).remove();
  }

}
