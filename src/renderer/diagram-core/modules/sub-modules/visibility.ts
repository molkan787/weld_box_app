import { Edge, MultipartEdgeLocation, MultipartEdgeType } from "../../components/edge";
import { AttachType, EdgeConnection } from "../../components/edge-connection";
import { Node } from "../../components/node";

export class Visibility{

  /**
   * Logicaly checks if an Edge should be visible
   * @param edge Edge to check
   */
  public static isEdgeVisible(edge: Edge, relativeEC: EdgeConnection | null){
    const { isMultipart, multipartLocation, multipartType, source, target } = edge;

    if(edge.isStart && source.node){
      // Start Edges can be visible only when their source node is Open
      return source.node.isOpen;
    }

    const h1 = relativeEC && relativeEC.attachType == AttachType.NodeWall && relativeEC.node?.isOpen;
    if(h1) return false;

    if(isMultipart){
      const intermediaryNode = multipartType == MultipartEdgeType.Starting ? target.node : source.node;
      const isHidden = intermediaryNode?.isSubChart && (
        (multipartLocation == MultipartEdgeLocation.Inner && !intermediaryNode?.isOpen) ||
        (multipartLocation == MultipartEdgeLocation.Outer && intermediaryNode?.isOpen)
      )
      return !isHidden;
    }else{
      return (
        (source.isAttachedToNode(true) ? source.node && this.isNodeVisible(source.node) : true) &&
        (target.isAttachedToNode(true) ? target.node && this.isNodeVisible(target.node) : true)
      );
    }
  }

  public static isNodeVisible(node: Node){
    const path = node.getHierarchyPath();
    const len = path.length;
    for(let i = len - 2; i >= 0; i--){
      const n = path[i];
      if(n.isSubChart){
        return n.isOpen;
      }
    }
    return true;
  }

}
