import { Edge, MultipartEdgeLocation, MultipartEdgeType } from "../../components/edge";

export class Visibility{

  /**
   * Logicaly checks if an Edge should be visible, This method assume that the Connected Nodes are visible
   * @param edge Edge to check
   */
  public static isEdgeVisible(edge: Edge){
    const { isMultipart, multipartLocation, multipartType, source, target } = edge;
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
