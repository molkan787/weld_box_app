import { Node, NodeOptions } from "../diagram-core";
import { D3Node } from "../diagram-core/types/aliases";
import StateComponent from '../components/diagram/State.vue';
import Vue from 'vue';
import { StatementBlock } from "./statement-block";
import { ObjectType } from "../interfaces/ObjectType";
import { ObjectProps } from "../interfaces/ObjectProps";
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
  public statementBlocks: StatementBlock[] = [];
  private _isThread: boolean = false;

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
      },
      filter: path => !(path.includes('__ob__') || path.includes('__proto__'))
    });
  }

  public get isSubTask(){
    return this.isSubChart;
  }

  public get isThread(){
    return this._isThread;
  }

  /**
   * Converts this State instance to a Thread.
   * Basicly it hide State's content and sets `isThread` flag to `true`
   */
  public convertToThread(){
    this._isThread = true;
    this.convertToSubChart(true);
    this.what = ObjectType.Thread;
    this.propsArchiver.lock();
    this.name = 'Thread ' + this.id;
    this.propsArchiver.unlock();
  }

  DOMElementBuilt(node: D3Node){
    const content = node.append('div');
    this.vm?.$destroy();

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
