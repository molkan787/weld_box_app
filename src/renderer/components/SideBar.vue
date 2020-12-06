<template>
  <div class="side-bar blured-bg" @mousemove="onMouseMove" @mouseleave="onMouseLeave" @mouseup="onMouseUp">
    <div :title="onlyThreadsAllowed ? 'Thread' : 'State'" class="icon" @mousedown="onMouseDown($event, 'state')">
      <StateIcon />
    </div>
    <div :disabled="onlyThreadsAllowed" title="Edge (Toggle)" class="icon" :class="{active: isEdgeDrawerActive }" @click="edgeClick()">
      <TransitionIcon />
    </div>
    <div :disabled="onlyThreadsAllowed" title="Start edge" class="icon" @mousedown="onMouseDown($event, 'start-edge')">
      <StartTransitionIcon />
    </div>
    <div class="separator"></div>
    <div :disabled="onlyThreadsAllowed" title="Message" class="icon" @mousedown="onMouseDown($event, 'message')">
      <MessageIcon />
    </div>
    <div :disabled="onlyThreadsAllowed" title="Event" class="icon" @mousedown="onMouseDown($event, 'event')">
      <EventIcon />
    </div>
    <div :disabled="onlyThreadsAllowed" title="Junction" class="icon ma" @mousedown="onMouseDown($event, 'junction')">
      <JunctionIcon :size="40" />
    </div>
  </div>
</template>

<script>
import { BasicNode } from '../my-diagram/basic-node';
import { State } from '../my-diagram/state';
import StateIcon from './icons/State';
import TransitionIcon from './icons/Transition';
import StartTransitionIcon from './icons/StartTransition';
import MessageIcon from './icons/Message';
import EventIcon from './icons/Event';
import JunctionIcon from './icons/Junction';
import { MessageNode } from '../my-diagram/MessageNode';
import { Junction } from '../my-diagram/junction';
import { EventNode } from '../my-diagram/EventNode';
import { AttachType, EdgeConnection, MODULES } from '../diagram-core';
import { ObjectType } from '../interfaces/ObjectType';
import { EdgeType, MyEdge } from '../my-diagram/my-edge';
export default {
  components: {
    StateIcon,
    TransitionIcon,
    MessageIcon,
    EventIcon,
    JunctionIcon,
    StartTransitionIcon
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
    },
    onlyThreadsAllowed(){
      const s = this.diagram && this.diagram.store;
      return s && !s.currentlyOpenNode;
    }
  },
  data: () => ({
    spawnObjectType: '',
  }),
  methods: {
    onMouseMove(event){
      this.diagram.simulateCanvasMouseMove(event);
    },
    onMouseDown(event, objectType){
      if(this.activeTool == MODULES.EDGE_DRAWER){
        this.diagram.deactivateEdgeDrawer();
      }
      this.spawnObjectType = objectType;
    },
    onMouseUp(){
      this.spawnObjectType = '';
    },
    onMouseLeave(event){
      const objectType = this.spawnObjectType;
      if(!objectType) return;
      this.spawnObjectType = '';
      const { clientX: x, clientY: y } = event;
      if(objectType == 'start-edge'){
        this.diagram.spawnEdgeAt({ x, y }, this.createStartEdge());
      }else{
        this.diagram.spawnNodeAt({ x, y }, this.createObjectInstance(objectType));
      }
    },
    edgeClick(){
      if(this.activeTool == MODULES.EDGE_DRAWER){
        this.diagram.deactivateEdgeDrawer();
      }else{
        this.diagram.activateEdgeDrawer();
      }
    },
    createObjectInstance(_objectType){
      switch (_objectType) {
        case ObjectType.State:
          return this.createState();
        case ObjectType.Message:
          return new MessageNode({ x: 0, y: 0 });
        case ObjectType.Event:
          return new EventNode({ x: 0, y: 0 });
        case ObjectType.Junction:
          return new Junction({ x: 0, y: 0 });
        default:
          throw new Error(`Unsupported object type '${_objectType}'`);
      }
    },
    createState(){
      const state = new State();
      if(this.onlyThreadsAllowed){
        state.size = { width: 400, height: 300, radius: 0 };
        state.convertToThread();
        state.propsArchiver.lock();
      }
      return state;
    },
    createStartEdge(){
      const source = new EdgeConnection(AttachType.Position);
      const target = new EdgeConnection(AttachType.Position);
      source.position = { x: 0, y: 0 };
      target.position = { x: 50, y: 0 };
      const edge = new MyEdge(source, target);
      edge.properties.type = EdgeType.START;
      edge.isStart = true;
      return edge;
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

    &[disabled]{
      opacity: 0.3;
      pointer-events: none;
    }

    &.ma{
       svg{
        margin: -10px;
      }
    }

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
