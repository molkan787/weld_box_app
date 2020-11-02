import { Edge, EdgeConnection } from "../diagram-core";
import { PropsChangeArchiver } from "../diagram-core/props-change-archiver";
import { D3Node } from "../diagram-core/types/aliases";
import { ObjectProps } from "../interfaces/ObjectProps";
import { ObjectType } from "../interfaces/ObjectType";
import Vue from 'vue';
import EdgeComponent from '../components/diagram/Edge.vue';

export class MyEdge extends Edge implements ObjectProps{

  // Internal props
  private vm?: Vue;
  public readonly propsArchiver: PropsChangeArchiver;
  private showCondition: boolean = false;

  // Business props
  public readonly what: ObjectType = ObjectType.Edge;
  public name: string = '';
  public properties = {
    priority: 0,
    condition: '',
    type: EdgeType.REGULAR
  };

  constructor(s: EdgeConnection, t: EdgeConnection){
    super(s, t);
    this.propsArchiver = new PropsChangeArchiver({
      instance: this,
      props: ['name', 'properties'],
      debounce: {
        name: 1000,
        properties: 500
      }
    });
    this.propsArchiver.unlock();
  }

  BeforeDOMElementDestroy(){
    this.vm?.$destroy();
  }

  DOMElementBuilt(d3node: D3Node){
    const content = d3node.append('div');

    this.vm = new Vue({
      data: { edge: this },
      components: { EdgeComponent },
      template: '<EdgeComponent ref="comp" :edge="edge"/>'
    });

    this.vm.$mount(<HTMLElement>content.node());
  }

  onDOMInteraction(eventType: string, data: string, sourceEvent: Event){
    if(eventType == 'mouseenter'){
      this.showCondition = true;
    }else if(eventType == 'mouseleave'){
      this.showCondition = false;
    }else if(eventType == 'mousedown' && data == 'condition-text'){
      (<any>this.vm).$refs.comp.showConditionInput(sourceEvent);
    }
  }

}

export enum EdgeType{
  REGULAR = 'regular',
  START = 'start'
}
