import { Node, NodeOptions } from "../diagram-core";
import { D3Node } from "../diagram-core/types/aliases";
import BasicNodeComponent from '../components/diagram/BasicNode.vue';
import Vue from 'vue';
import { Position } from "../diagram-core/interfaces/Position";

export class BasicNode extends Node{

  // Internal props
  private vm?: Vue;

  constructor(position: Position, options?: NodeOptions){
    super(position, { width: 40, height: 40, radius: 0 }, {
      ...options,
      basic: true
    });

  }

  DOMElementBuilt(node: D3Node){
    const content = node.append('div');

    this.vm = new Vue({
      data: { object: this },
      components: { BasicNodeComponent },
      template: '<BasicNodeComponent :object="object"/>'
    });

    this.vm.$mount(<HTMLElement>content.node());
  }

}
