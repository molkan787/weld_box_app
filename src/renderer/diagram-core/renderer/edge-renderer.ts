import { curveBasis, Line, line, select } from "d3";
import { Edge } from "../components/edge";
import { AttachType } from "../components/edge-connection";
import { ATTR, CLASSES, EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { movePoint, Side } from "../helpers/geometry";
import { D3Node } from "../types/aliases";
import { DiagramEvent } from '../interfaces/DiagramEvent';
import { cs } from "./utils";
import { Position } from "../interfaces/Position";

export class EdgeRenderer{

  /** Currently selected edge */
  private selectedEdge: Edge | null = null;

  /** D3 Module that generate edge curve path */
  private readonly lineGenerator: Line<[number, number]>;

  constructor(readonly store: DiagramStore){
    this.lineGenerator = line().curve(curveBasis);
    store.on(EVENTS.EDGE_DECORATION_CHANGED, ({ edge }: DiagramEvent) => this.updateDecoration(<Edge>edge));
    store.on(EVENTS.EDGE_SELECTED, e => this.onEdgeSelected(e));
    store.on(EVENTS.EDGE_DELETED, ({ edge }: DiagramEvent) => this.destroyElement(<Edge>edge));
  }

  onEdgeSelected(e: DiagramEvent): void {
    const previous = this.selectedEdge;
    this.selectedEdge = e.edge || null;
    if(previous){
      previous.highlighted = false;
    }
    if(e.edge){
      e.edge.highlighted = true;
    }
  }

  prepareLayer(layer: D3Node){
    const container = layer.append('defs');
    this.buildEdgeMarker(container, false);
    this.buildEdgeMarker(container, true);
  }

  buildEdgeMarker(container: D3Node, highlighted: boolean){
    const markerBoxWidth = 12, markerBoxHeight = 12;
    container
      .append('marker')
      .attr('id', highlighted ? 'arrow-highlighted' : 'arrow')
      .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight].join(' '))
      .attr('refX', 10)
      .attr('refY', markerBoxHeight / 2)
      .attr('markerWidth', markerBoxWidth)
      .attr('markerHeight', markerBoxHeight)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M5.97046 1.89949L10.2131 6.14213L5.97046 10.3848')
      .attr('fill', 'none')
      .attr('stroke', highlighted ? '#06ff87' : '#919294')
      .attr('stroke-width', '1')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
  }

  rebuild(container: D3Node, edge: Edge){
    this.destroyElement(edge);
    this.build(container, edge);
  }

  build(container: D3Node, edge: Edge){
    const htmlId = 'edge-' + edge.id;
    const g = container.append('g');
    g.classed('edge', true)
      .attr('id', htmlId);

    const { source, target } = edge;
    if(source.getInstance().attachType === AttachType.NodeBody && !source.node?.isCircle){
      g.append('rect')
        .classed(CLASSES.ATTACH_BOX, true)
        .classed(CLASSES.SOURCE_ATTACH_BOX, true);
    }

    if(target.getInstance().attachType === AttachType.NodeBody && !target.node?.isCircle){
      g.append('rect')
        .classed(CLASSES.ATTACH_BOX, true)
        .classed(CLASSES.TARGET_ATTACH_BOX, true);
    }

    g.append('path')
      .attr('id', htmlId + '-path')
      .attr('marker-end', 'url(#arrow)')
      .attr('marker-start', `url(#edge-${edge.id}-priority)`);

    g.append('use')
    .attr('xlink:href', `#${htmlId}-path`)
    .attr('stroke-width', '12px')
    .attr(ATTR.COMPONENT_ID, edge.id);

    this.store.setD3Node(edge.id, g);
    this.update(edge);

    edge.DOMElementBuilt(g);
  }

  update(edge: Edge){
    const d3Node = this.store.getD3Node(edge.id);
    if(typeof d3Node === 'undefined') return;

    let { source, target } = edge;
    source = source.getInstance();
    target = target.getInstance();

    const sourceANB = source.attachType === AttachType.NodeBody;
    const targetANB = target.attachType === AttachType.NodeBody;

    const sourceOffset = sourceANB && source.node?.props.isOpen ? -20 : 20;
    const targetOffset = targetANB && target.node?.props.isOpen ? -20 : 20;

    const { x: x1, y: y1 } = source.getCoordinates();
    const { x: x2, y: y2 } = target.getCoordinates();

    const targetNodeWall = target.isAttachedToNode() ? target.nodeWall : null;

    const pathData = this.generatorCurvePath(
      source.nodeWall || Side.Top, x1, y1, sourceOffset,
      targetNodeWall, x2, y2, targetOffset,
      edge.shapePoints
    );

    const pathEl = d3Node.select('path');
    pathEl.attr('d', pathData);

    const el = <SVGPathElement>pathEl.node();
    const length = el.getTotalLength();
    const startPoint = el.getPointAtLength(20);
    const centerPoint = el.getPointAtLength(length / 2);
    edge.offsettedStartPoint = startPoint;
    edge.centerPoint = centerPoint;

    if(sourceANB){
      d3Node.select(cs(CLASSES.SOURCE_ATTACH_BOX))
              .attr('x', x1)
              .attr('y', y1)
    }

    if(targetANB){
      d3Node.select(cs(CLASSES.TARGET_ATTACH_BOX))
              .attr('x', x2)
              .attr('y', y2)
    }

  }

  generatorCurvePath(
    side1: Side, x1: number, y1: number, offset1: number,
    side2: Side | null, x2: number, y2: number, offset2: number,
    shapePoints: Position[]
  ): string{
    const points: [number, number][] = [];
    points.push([x1, y1]);
    points.push(movePoint(x1, y1, side1, offset1));

    for(let p of shapePoints){
      points.push([ p.x + x1, p.y + y1 ]);
    }

    if(side2){
      points.push(movePoint(x2, y2, side2, offset2));
    }
    points.push([x2, y2]);

    const pathData = <string>this.lineGenerator(points);

    return pathData;
  }

  updateDecoration(edge: Edge){
    const d3Node = this.store.getD3Node(edge.id);
    if(typeof d3Node === 'undefined') return;
    d3Node.classed(CLASSES.HIGHLIGHTED, edge.highlighted);
    d3Node.select('path')
          .attr('marker-end', edge.highlighted ? 'url(#arrow-highlighted)' : 'url(#arrow)')
  }

  destroyElement(edge: Edge){
    const d3Node = select(`#edge-${edge.id}`);
    edge.BeforeDOMElementDestroy(d3Node);
    d3Node.remove();
  }

}
