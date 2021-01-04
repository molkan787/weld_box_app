import { Node } from "../diagram-core";
import { Position } from "../diagram-core/interfaces/Position";
import { PropsChangeArchiver } from "../diagram-core/props-change-archiver";
import { D3Node } from "../diagram-core/types/aliases";
import { ObjectProps } from "../interfaces/ObjectProps";
import { ObjectType } from "../interfaces/ObjectType";
import Vue from 'vue';
import CommentComponent from '../components/diagram/Comment.vue';

/**
 * Diagram's component for comments
 */
export class CommentNode extends Node implements ObjectProps{

  // Internal props
  private vm?: Vue;
  public readonly propsArchiver: PropsChangeArchiver;

  // Business props
  public readonly what = ObjectType.Comment;
  public readonly properties = {};
  public text: string = '';

  constructor(position: Position){
    super(position, { width: 200, height: 40, radius: 0 }, {
      basic: true,
      classes: ['comment']
    });
    this.propsArchiver = new PropsChangeArchiver({
      instance: this,
      props: ['text'],
      debounce: {
        properties: 1000,
      },
      filter: path => !(path.includes('__ob__') || path.includes('__proto__'))
    });
  }

  /**
   * Focus the comment input box
   */
  focusInput(){
    (<any>this.vm)?.focusInput();
  }

  DOMElementBuilt(node: D3Node){
    const content = node.append('div');
    this.vm?.$destroy();

    this.vm = new Vue({
      data: { node: this },
      components: { CommentComponent },
      methods: {
        focusInput(){
          this.$refs.textbox.$el.focus();
        }
      },
      template: '<CommentComponent ref="textbox" :node="node"/>'
    });

    this.vm.$mount(<HTMLElement>content.node());
    this.propsArchiver.unlock();
  }

  BeforeDOMElementDestroy(){
    this.vm?.$destroy();
    this.vm = undefined;
  }

}
