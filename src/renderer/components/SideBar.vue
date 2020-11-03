<template>
  <div class="side-bar blured-bg" @mousemove="onMouseMove">
    <div title="State" class="icon" @mousedown="onMouseDown($event, 'state')">
      <StateIcon />
    </div>
    <div title="Transition (Toggle)" class="icon" :class="{active: isEdgeDrawerActive }" @click="transitionClick('transition')">
      <TransitionIcon />
    </div>
    <div title="State" class="icon" @mousedown="onMouseDown($event, 'message')">
      <MessageIcon />
    </div>
    <div title="State" class="icon" @mousedown="onMouseDown($event, 'event')">
      <EventIcon />
    </div>
    <div class="separator"></div>
    <div title="Junction" class="icon" @mousedown="onMouseDown($event, 'junction')">
      <JunctionIcon />
    </div>
  </div>
</template>

<script>
import { BasicNode } from '../my-diagram/basic-node';
import { State } from '../my-diagram/state';
import StateIcon from './icons/State';
import TransitionIcon from './icons/Transition';
import MessageIcon from './icons/Message';
import EventIcon from './icons/Event';
import JunctionIcon from './icons/Junction';
import { MessageNode } from '../my-diagram/MessageNode';
import { EventNode } from '../my-diagram/EventNode';
import { MODULES } from '../diagram-core';
import { ObjectType } from '../interfaces/ObjectType';
export default {
  components: {
    StateIcon,
    TransitionIcon,
    MessageIcon,
    EventIcon,
    JunctionIcon
  },
  props: {
    diagram: {
      type: Object,
    }
  },
  computed: {
    isEdgeDrawerActive(){
      return this.activeTool == MODULES.EDGE_DRAWER;
    },
    activeTool(){
      const s = this.diagram && this.diagram.store;
      return s && s.activeModule && s.activeModule.name;
    }
  },
  methods: {
    onMouseMove(event){
      this.diagram.simulateCanvasMouseMove(event);
    },
    onMouseDown(event, objectType){
      if(this.activeTool == MODULES.EDGE_DRAWER){
        this.diagram.deactivateEdgeDrawer();
      }
      const { clientX: x, clientY: y } = event;
      this.diagram.spawnNodeAt({ x, y }, this.createObjectInstance(objectType))
    },
    transitionClick(name){
      if(this.activeTool == MODULES.EDGE_DRAWER){
        this.diagram.deactivateEdgeDrawer();
      }else{
        this.diagram.activateEdgeDrawer();
      }
    },
    createObjectInstance(_objectType){
      switch (_objectType) {
        case ObjectType.State:
          return new State();
        case ObjectType.Message:
          return new MessageNode({ x: 0, y: 0 });
        case ObjectType.Event:
          return new EventNode({ x: 0, y: 0 });
      }
    }
  }
}
</script>

<style lang="less" scoped>
@w: 44px;
.side-bar{
  position: fixed;
  z-index: 1;
  top: 60px;
  left: 10px;
  width: @w;
  height: auto;
  box-sizing: border-box;
  padding: 4px;
  border-radius: 10px;
  line-height: 0;

  .icon{
    @iw: @w - 8px;
    width: @iw;
    height: @iw;
    box-sizing: border-box;
    padding: 8px;
    border-radius: 10px;
    cursor: pointer;

    &:hover{
      background-color: #fff3;
    }

    &.active{
      background-color: #23BB72;
    }

    svg{
      transform: scale(1.5);
    }

  }
  .separator{
    display: inline-block;
    background-color: #18191d7d;
    width: calc(100% + 8px);
    height: 1px;
    margin: 4px -4px;
  }
}
</style>
