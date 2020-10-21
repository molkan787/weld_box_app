<template>
  <div class="side-bar pane" @mousemove="onMouseMove">
    <div title="State" class="icon" @mousedown="onMouseDown($event, 'state')">
      <StateIcon />
    </div>
    <div title="Transition (Toggle)" class="icon" :class="{active: activeTool == 'transition'}" @click="iconClick('transition')">
      <TransitionIcon />
    </div>
    <div title="State" class="icon" @mousedown="onMouseDown($event, 'message')">
      <MessageIcon />
    </div>
    <div title="State" class="icon" @mousedown="onMouseDown($event, 'event')">
      <EventIcon />
    </div>
  </div>
</template>

<script>
import { BasicNode } from '../my-diagram/basic-node';
import { ObjectType } from '../my-diagram/interfaces/object-type';
import { State } from '../my-diagram/state';
import StateIcon from './icons/State';
import TransitionIcon from './icons/Transition';
import MessageIcon from './icons/Message';
import EventIcon from './icons/Event';
import { MessageNode } from '../my-diagram/MessageNode';
import { EventNode } from '../my-diagram/EventNode';
export default {
  components: {
    StateIcon,
    TransitionIcon,
    MessageIcon,
    EventIcon
  },
  props: {
    diagram: {
      type: Object,
    }
  },
  data: () => ({
    activeTool: ''
  }),
  methods: {
    onMouseMove(event){
      this.diagram.simulateCanvasMouseMove(event);
    },
    onMouseDown(event, objectType){
      const { clientX: x, clientY: y } = event;
      this.diagram.spawnNodeAt({ x, y }, this.createObjectInstance(objectType))
    },
    iconClick(name){
      if(this.activeTool == name){
        this.$emit('deactivate-tool', name);
        this.activeTool = '';
      }else{
        this.$emit('activate-tool', name);
        this.activeTool = name;
      }
    },
    deactivateTool(name){
      if(this.activeTool == name){
        this.activeTool = '';
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
  background-color: #27282d;
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);

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
}
</style>
