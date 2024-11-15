import { Edge, MultipartEdgeLocation, MultipartEdgeType } from "../components/edge";
import { AttachType, EdgeConnection } from "../components/edge-connection";
import { Node } from "../components/node";
import { EVENTS, MODULES, MUTATION_ERRORS, MUTATION_ERROR_REASONS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { MutationError } from "../interfaces/MutationError";
import { RepositionRequest } from "../interfaces/RepositionRequest";
import { DiagramModule } from "../module";

/**
 * This modules Split or merge inter-chart edges when a node is converted to sub-chart or back to normal node
 */
export class EdgesMutator extends DiagramModule{

  constructor(readonly store: DiagramStore){
    super(store, MODULES.EDGE_MUTATOR);
    store.on(EVENTS.NODE_CONVERTED_TO_SUBCHART, e => this.onNodeConvertedToSubChart(e));
    store.on(EVENTS.NODE_CONVERTING_TO_SUBCHART, e => this.onNodeConvertingToSubChart(e));
    store.on(EVENTS.NODE_CONVERTED_TO_NORMAL, e => this.onNodeConvertedToNormal(e));
  }

  /**
   * Handles pre-convertion event to check whether the convertion is possible or not
   * @param event
   */
  private onNodeConvertingToSubChart(event: DiagramEvent){
    const node = <Node>event.node;
    if(node.isOpen || event.skipMutation) return;
    const foreignEdgesConnections = this.getForeignEdges(node);
    const len = foreignEdgesConnections.length;

    for(let i = 0; i < len; i++){
      const ec = foreignEdgesConnections[i];
      if(ec.edge?.isMultipart){
        this.nodeToSubChartError(event);
        return;
      }
    }
  }

  /**
   * Splits edges that pass thru the node that was converted to a sub-chart
   * @param event
   */
  private onNodeConvertedToSubChart(event: DiagramEvent){
    const node = <Node>event.node;
    if(node.isOpen || event.skipMutation) return;
    const foreignEdgesConnections = this.getForeignEdges(node);
    const len = foreignEdgesConnections.length;

    for(let i = 0; i < len; i++){
      this.splitEdge(node, foreignEdgesConnections[i]);
    }
  }

  /**
   * Merges multipart (splitted) edges that pass thru sub-chart node that was converted to normal node
   * @param event
   */
  private onNodeConvertedToNormal(event: DiagramEvent){
    const node = <Node>event.node;
    if(node.props.isOpen || event.skipMutation) return;
    const bridgedEdges = node.edges.filter(ec => ec.isBridge);
    const singles = this.getMultipartSigleEdges(node.edges);
    for(let ec of bridgedEdges){
      this.mergeBridgedEdge(ec);
    }
    this.enableActionGrouping();
    singles.forEach(se => this.store.emit(EVENTS.DIAGRAM_DELETE_COMPONENT, { data: se }));
    this.disableActionGrouping();
  }

  /**
   * Emits mutation error (the error that blocked the convertion of normal node to a sub-chart node)
   * @param sourceEvent
   */
  private nodeToSubChartError(sourceEvent: DiagramEvent){
    sourceEvent.prevented = true;
    this.store.emit(EVENTS.MUTATION_ERROR, {
      sourceEvent: sourceEvent,
      data: <MutationError>{
        type: MUTATION_ERRORS.CANNOT_CONVERT_NODE_TO_SUBCHART,
        reason: MUTATION_ERROR_REASONS.UNRELATED_MUTIPART_EDGE_PASSES_THRU_NODE_WALL,
        component: sourceEvent.node
      }
    })
  }

  /**
   * Filters out edges that are multipart but does not have any continuation (the second part of the edge)
   * @param edgeConnections The Edges to filter out
   */
  private getMultipartSigleEdges(edgeConnections: EdgeConnection[]){
    const edges: Edge[] = [];
    const len = edgeConnections.length;
    for(let i = 0; i < len; i++){
      const ec = edgeConnections[i];
      const edge = ec.edge;
      const rm = ec.attachType == AttachType.NodeBody && edge && edge.isMultipart
                  && edge.multipartType == MultipartEdgeType.Starting
                  && ec.bridgeFrom === null;
      if(rm && edge){
        edges.push(edge);
      }
    }
    return edges;
  }

  /**
   * Replace a single reglar edge by two multipart edges and link them
   * @param nodeInContext The Sub-chart node that thus edges will connect thru
   * @param foreignEC The EdgeConnection instance that is outside of the nodeInContext or its childs
   */
  private splitEdge(nodeInContext: Node, foreignEC: EdgeConnection){
    const EF = this.store.edgeFactory;
    const edge = <Edge>foreignEC.edge;
    const localEC = this.getSecondSideEdgeConnection(foreignEC);
    const localNode = <Node>localEC?.node;
    if(!edge || !localEC || !localNode) return;
    const foreignECisSource = foreignEC.isSource();
    const outerEdgeLocalEC = nodeInContext.createEdgeConnection();
    const innerEdgeSecondEC = nodeInContext.createEdgeConnection();
    if(foreignECisSource){
      innerEdgeSecondEC.setBridge(outerEdgeLocalEC);
    }else{
      outerEdgeLocalEC.setBridge(innerEdgeSecondEC);
    }
    edge.convertToMultipart(MultipartEdgeLocation.Outer, foreignECisSource ? MultipartEdgeType.Starting : MultipartEdgeType.Ending);
    const innerEdge = foreignECisSource
                        ? EF(innerEdgeSecondEC, localEC, undefined, undefined, undefined, foreignEC.edge)
                        : EF(localEC, innerEdgeSecondEC, undefined, undefined, undefined, foreignEC.edge);
    innerEdge.convertToMultipart(MultipartEdgeLocation.Inner, foreignECisSource ? MultipartEdgeType.Ending : MultipartEdgeType.Starting);
    outerEdgeLocalEC.edge = edge;
    foreignECisSource ? (edge.setTarget(outerEdgeLocalEC)) : (edge.setSource(outerEdgeLocalEC));
    if(!foreignECisSource){
      this.store.emit(EVENTS.REPOSITION_EDGECONNECTION, {
        data: <RepositionRequest>{
          subject: innerEdgeSecondEC,
          pointTo: foreignEC
        }
      });
    }
    this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge: edge });
    this.store.emit(EVENTS.EDGE_CREATED, { edge: innerEdge });
  }

  /**
   * Replace two multipart edges by one regular edge
   * @param localEC
   */
  private mergeBridgedEdge(localEC: EdgeConnection){
    const localEdge = <Edge>localEC.edge;
    const localSecondEC = this.getSecondSideEdgeConnection(localEC);
    const outerLocalEC = localEC.bridgeTo;
    console.log('outerLocalEC', outerLocalEC)
    const outerEdge = outerLocalEC?.edge;
    const outerSecondEC = outerLocalEC && this.getSecondSideEdgeConnection(outerLocalEC);
    if(!localSecondEC || !outerEdge || !outerSecondEC) return;
    outerSecondEC.isSource() ? outerEdge.setTarget(localSecondEC) : outerEdge.setSource(localSecondEC);
    localSecondEC.edge = outerEdge;
    localSecondEC.isSource() ? localEdge.setSource(new EdgeConnection()) : localEdge.setTarget(new EdgeConnection())
    outerLocalEC?.node?.removeEdgeConnection(outerLocalEC);
    outerEdge.convertToNormal();
    this.store.emit(EVENTS.EDGE_CONNECTIONS_CHANGED, { edge: outerEdge });
    this.store.emit(EVENTS.DIAGRAM_DELETE_COMPONENT, { data: localEdge, isRestore: true }); // isRestore = true will prevent adding this action to Undo/Redo system
    console.log('removed localEdge', localEdge)
  }

  /**
   * Returns all edge connections that goes or come from outside of the specifed node,
   * in other works, the edges its source or target aren't connect to that node or to one of its childs
   * @param node
   */
  private getForeignEdges(node: Node){
    const foreignEdges: EdgeConnection[] = [];
    const nodes = node.getAllDescendentsNodes();
    nodes.shift(); // removes the top level parent
    const refs = new Map<number, boolean>();
    nodes.forEach(n => refs.set(n.id, true));
    for(let i = 0; i < nodes.length; i++){
      const n = nodes[i];
      for(let ec of n.edges){
        const secondEC = this.getSecondSideEdgeConnection(ec);
        const isForeign = secondEC?.isAttachedToNode() && !refs.get(secondEC?.node?.id || 0);
        if(isForeign && secondEC && ec.edge){
          foreignEdges.push(secondEC);
        }
      }
    }
    return foreignEdges;
  }

  /**
   * Returns the seconds edge end, (ex: of the passed edge connection is the target of the edge, it will returns the source of the edge)
   * @param ec Edge Connection
   */
  private getSecondSideEdgeConnection(ec: EdgeConnection): EdgeConnection | null{
    const edge = ec.edge;
    if(!edge) return null;
    return ec.isSource() ? edge.target : edge.source;
  }

}
