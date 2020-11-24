import { Edge, MultipartEdgeLocation, MultipartEdgeType } from "../components/edge";
import { EdgeConnection } from "../components/edge-connection";
import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { RepositionRequest } from "../interfaces/RepositionRequest";

/**
 * This modules Split or merge inter-chart edges when a node is converted to sub-chart or back to normal node
 */
export class EdgesMutator{

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.NODE_CONTENT_GOT_HIDDEN, e => this.onNodeContentGotHidden(e));
    store.on(EVENTS.NODE_CONTENT_GOT_SHOWN, e => this.onNodeContentGotShown(e));
  }

  private onNodeContentGotHidden(event: DiagramEvent){
    const node = <Node>event.node;
    if(node.props.isOpen || event.skipMutation) return;
    const foreignEdgesConnections = this.getForeignEdges(node);
    for(let ec of foreignEdgesConnections){
      this.splitEdge(node, ec);
    }
  }

  private onNodeContentGotShown(event: DiagramEvent){
    const node = <Node>event.node;
    if(node.props.isOpen || event.skipMutation) return;
    const bridgedEdges = node.edges.filter(ec => ec.isBridge);
    for(let ec of bridgedEdges){
      this.mergeBridgedEdge(ec);
    }
  }

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
    const innerEdge = foreignECisSource ? EF(innerEdgeSecondEC, localEC) : EF(localEC, innerEdgeSecondEC);
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

  private getSecondSideEdgeConnection(ec: EdgeConnection): EdgeConnection | null{
    const edge = ec.edge;
    if(!edge) return null;
    return ec.isSource() ? edge.target : edge.source;
  }

}
