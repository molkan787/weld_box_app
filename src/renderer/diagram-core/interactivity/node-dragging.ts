import { drag } from 'd3';
import { Edge } from '../components/edge';
import { Node } from '../components/node';
import { MAIN_ELEMENT } from '../constants';
import { Renderer } from '../renderer/renderer';
import { D3Node, D3NodesMap } from '../types/aliases';

export class NodeDragging{

  constructor(
    readonly d3NodesMap: D3NodesMap,
    readonly renderer: Renderer
  ){}

  apply(node: Node){
    const d3Node = this.d3NodesMap.get(node.id);
    if(typeof d3Node === 'undefined'){
      throw new Error(`Node #${node.id} was not found in D3NodesMap`);
    }

    const _drag = drag()
    .subject(() => node.position)
    .on('start', () => this.dragstarted(d3Node))
    .on('drag', (event: any, data: any) => this.dragged(d3Node, event, data))
    .on('end', () => this.dragended(d3Node))

    d3Node && d3Node.call(<any>_drag);
  }

  dragstarted(d3Node: D3Node) {
    d3Node.raise().attr('cursor', 'move');
  }

  dragged(d3Node: D3Node, event: any, node: Node) {
    const pos = node.position;
    pos.x = event.x;
    pos.y = event.y;
    this.renderer.update(node);
    this.updateNodeRelations(node);
  }

  dragended(d3Node: D3Node) {
    d3Node.attr('cursor', 'default');
  }

  updateNodeRelations(node: Node){
    // Casting from (Edge | undefined)[] to Edge[] because undefined cases are already filtered out
    const edges = <Edge[]>(node.edges.map(ec => ec.edge).filter(e => !!e));
    for(let edge of edges){
      this.renderer.update(edge);
    }
  }

}
