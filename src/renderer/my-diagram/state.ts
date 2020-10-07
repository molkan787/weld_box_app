import { Node } from "../diagram-core";
import { D3Node } from "../diagram-core/types/aliases";
import StateComponent from '../components/diagram/State.vue';
import Vue from 'vue';
import { StatementBlock } from "./statement-block";

export class State extends Node{

  // Internal props
  private codeBlockVM?: Vue;

  // Business props
  public isSubTask: boolean = false;
  public isHistoric: boolean = false;
  public priority: number = 0;
  public decomposition: StateDecomposition = StateDecomposition.Serial;

  public readonly statementBlocks: StatementBlock[] = [];

  DOMElementBuilt(node: D3Node){
    const content = node.append('div');

    this.codeBlockVM = new Vue({
      data: { state: this },
      components: { StateComponent },
      template: '<StateComponent :state="state"/>'
    });

    this.codeBlockVM.$mount(<HTMLElement>content.node());
  }

}

export enum StateDecomposition{
  Serial = 'serial',
  Parallel = ' parallel'
}
