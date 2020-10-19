import { Node } from "../diagram-core";
import { D3Node } from "../diagram-core/types/aliases";
import StateComponent from '../components/diagram/State.vue';
import Vue from 'vue';
import { StatementBlock } from "./statement-block";
import { ObjectType } from "./interfaces/object-type";
import { ObjectProps } from "./interfaces/object-props";

export class State extends Node implements ObjectProps{

  // Internal props
  private vm?: Vue;

  // Business props
  public isHistoric: boolean = false;
  public priority: number = 0;
  public decomposition: StateDecomposition = StateDecomposition.Serial;
  public what: ObjectType = ObjectType.State;

  public get isSubTask(){
    return !this.showContent || this.props.isOpen;
  }

  public set isSubTask(value: boolean){
    if(this.props.isOpen) return;
    this.showContent = !value;
  }

  public readonly statementBlocks: StatementBlock[] = [];

  DOMElementBuilt(node: D3Node){
    const content = node.append('div');

    this.vm = new Vue({
      data: { state: this },
      components: { StateComponent },
      template: '<StateComponent :state="state"/>'
    });

    this.vm.$mount(<HTMLElement>content.node());
  }

}

export enum StateDecomposition{
  Serial = 'serial',
  Parallel = 'parallel'
}
