import { Node, NodeOptions } from "../diagram-core";
import { D3Node } from "../diagram-core/types/aliases";
import StateComponent from '../components/diagram/State.vue';
import Vue from 'vue';
import { StatementBlock } from "./statement-block";
import { ObjectType } from "./interfaces/object-type";
import { ObjectProps } from "./interfaces/object-props";
import { Position } from "../diagram-core/interfaces/Position";
import { Size } from "../diagram-core/interfaces/Size";
import { PropsChangeArchiver } from "../diagram-core/props-change-archiver";

export class State extends Node implements ObjectProps{

  // Internal props
  private vm?: Vue;
  private propsArchiver: PropsChangeArchiver;

  // Business props
  public what: ObjectType = ObjectType.State;
  public properties = {
    historic: false,
    priority: 0,
    decomposition: StateDecomposition.Serial
  };

  constructor(
    position: Position = { x: 0, y: 0 },
    size: Size = { width: 200, height: 100, radius: 0 },
    options: NodeOptions = {}
  ){
    super(position, size, options);
    this.name = 'State ' + this.id;
    this.propsArchiver = new PropsChangeArchiver({
      instance: this,
      props: ['name', 'properties', 'statementBlocks'],
      debounce: {
        name: 1000,
        statementBlocks: 500
      }
    });
  }

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
    this.propsArchiver.unlock();
  }

}

export enum StateDecomposition{
  Serial = 'serial',
  Parallel = 'parallel'
}
