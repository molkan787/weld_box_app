<template>
  <g class="edge-component">
    <template v-if="!isBridge && edgeProps.priority > 0">
      <circle
        :cx="priorityPos.x" :cy="priorityPos.y" r="7"
        stroke-width="0"
        :fill="edge.highlighted ? '#06FF87' : '#919294'">
      </circle>
      <text :data-component-id="edge.id" class="priority-text"
        :x="priorityPos.x" :y="priorityPos.y"  text-anchor="middle">
        {{ edgeProps.priority }}
      </text>
    </template>
    <g :transform="`translate(${centerPoint.x}, ${centerPoint.y})`">
      <transition name="fade">
        <text ref="conditionText" v-if="showConditionText" :class="{ hidden: !!inputElement }"
          :data-component-id="edge.id" data-emit-data="condition-text" class="condition">
          {{ conditionOrDefault }}
        </text>
      </transition>
    </g>
    <circle v-if="isStartEdge"
      :cx="startPoint.x" :cy="startPoint.y" r="4" stroke-width="0"
      :fill="edge.highlighted ? '#06FF87' : '#919294'"
    ></circle>
  </g>
</template>

<script>
import Vue from 'vue';
import { Edge } from '../../diagram-core'
import { EdgeType } from '../../my-diagram/my-edge';
const conditionPlaceHolder = '@()if(){}{}';
export default {
  props: {
    edge: {
      type: Edge,
      required: true
    }
  },
  data: () => ({
    inputElement: null,
  }),
  computed: {
    isBridge(){
      const source = this.edge.source;
      return source.isBridge;
    },
    isStartEdge(){
      return this.edgeProps.type == EdgeType.START;
    },
    showConditionText(){
      return this.edgeProps.type == EdgeType.REGULAR && (this.condition || this.edge.showCondition || this.inputElement);
    },
    edgeProps(){
      return this.edge.properties;
    },
    condition(){
      const edge = this.edge.getInstance();
      const props = edge.properties;
      return props.condition;
    },
    conditionOrDefault(){
      return this.condition || conditionPlaceHolder;
    },
    priorityPos(){
      return this.edge.offsettedStartPoint;
    },
    centerPoint(){
      return this.edge.centerPoint;
    },
    startPoint(){
      return this.edge.source.coordinates;
    }
  },
  watch: {
    'edge.store.zoomTransform'(){
      if(this.inputElement){
        this.positionInput();
      }
    }
  },
  methods: {
    positionInput(){
      const { top, left, width, height } = this.$refs.conditionText.getClientRects()[0];
      const horizontalCenter = left + width / 2;
      const verticalCenter = top + height / 2;
      const zt = this.edge.store.zoomTransform;
      const scale = (zt && zt.k) || 1;
      this.inputElement.setAttribute('style', `transform:translate(-50%, -50%) scale(${scale});top:${verticalCenter}px;left:${horizontalCenter}px;height:${height}px`);
    },
    showConditionInput(sourceEvent){
      this.destroyConditionInput();
      const condition = this.conditionOrDefault;
      const { clientX } = sourceEvent;
      const { left, width } = this.$refs.conditionText.getClientRects()[0];
      const input = document.createElement('div');
      input.classList.add('condition-input');
      input.setAttribute('auto-focus', true);
      input.setAttribute('contenteditable', true);
      input.innerText = condition;
      document.body.appendChild(input);
      this.inputElement = input;
      this.positionInput();
      input.onblur = () => this.hideConditionInput();
      const cursorPos = Math.round(((clientX - left) / width) * condition.length);
      setTimeout(() => {
        input.focus();
        this.setCaretPosition(input, cursorPos)
      }, 1);
    },
    setCaretPosition(el, pos) {
      const range = document.createRange()
      const sel = window.getSelection()
      range.setStart(el.childNodes[0], pos)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    },
    hideConditionInput(){
      const edge = this.edge.getInstance();
      const props = edge.properties;
      const value = this.inputElement.innerText;
      props.condition = value == conditionPlaceHolder ? '' : value;
      this.destroyConditionInput();
    },
    destroyConditionInput(){
      if(this.inputElement){
        try {
          this.inputElement.remove();
        } catch (error) {
        }
        this.inputElement = null;
      }
    },
    repairReactivity(prop){
      delete this.edge[prop].__ob__;
      Vue.util.defineReactive(this.edge.__ob__.value, prop, this.edge[prop]);
      this.edge.__ob__.dep.notify();
    }
  },
  created(){
    // Fix reactivity issue caused by conflict of PropsChangeArchiver & Vue
    this.repairReactivity('properties');
    this.repairReactivity('showCondition');
  },
  beforeDestroy(){
    this.destroyConditionInput();
  }
}
</script>

<style lang="less" scoped>
.edge-component{
  .priority-text{
    transform: translateY(4px);
    font-size: 11px;
    font-weight: bold;
    stroke-width: 0;
    fill: #24252A;
  }
  .condition{
    font-family: 'Jost';
    text-anchor: middle;
    stroke-width: 0;
    fill: white;
    font-size: 14px;
    &.hidden{
      opacity: 0;
    }
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to{
  opacity: 0;
}
</style>

<style lang="less">
.condition-input{
  position: fixed;
  z-index: 100;
  border: none;
  background: none;
  outline: none;
  text-align: center;
  font-size: 14px;
  font-family: 'Jost';
  color: white;
  width: fit-content;
  transform-origin: 50% 0;
}
</style>
