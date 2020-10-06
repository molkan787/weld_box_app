import { Node } from "../diagram-core";
import { D3Node } from "../diagram-core/types/aliases";
import StateCodeBlock from '../components/diagram/StateCodeBlock.vue';
import Vue from 'vue';

export class State extends Node{

  private codeBlockVM?: StateCodeBlock;

  DOMElementBuilt(node: D3Node){
    const content = node.append('div')
                          .style('top', '29px');

    const codeBlockEl = content.append('div');

    this.codeBlockVM = new Vue({
      components: { StateCodeBlock },
      template: '<StateCodeBlock/>'
    });

    this.codeBlockVM.$mount(<HTMLElement>codeBlockEl.node());
  }

}
