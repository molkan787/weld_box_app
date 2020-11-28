import { Edge, MultipartEdgeLocation, MultipartEdgeType } from "../../components/edge";
import { AttachType, EdgeConnection } from "../../components/edge-connection";

export class Visibility{

  /**
   * Logicaly checks if an Edge should be visible, This method assume that the Connected Nodes are visible
   * @param edge Edge to check
   */
  public static isEdgeVisible(edge: Edge, relativeEC: EdgeConnection | null){
    const { isMultipart, multipartLocation, multipartType, source, target } = edge;

    const h1 = relativeEC && relativeEC.attachType == AttachType.NodeWall && relativeEC.node?.isOpen;
    if(h1) return false;

    if(isMultipart){
      const owningNode = multipartType == MultipartEdgeType.Starting ? target.node : source.node;
      const isHidden = owningNode?.isSubChart && (
        (multipartLocation == MultipartEdgeLocation.Inner && !owningNode?.isOpen) ||
        (multipartLocation == MultipartEdgeLocation.Outer && owningNode?.isOpen)
      )
      return !isHidden;
    }else{
      return true;
    }
  }

}
