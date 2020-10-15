<template>
  <div class="side-bar pane">
    <div title="State (Drag & Drop)" class="icon" :class="{active: activeTool == 'state'}" draggable @dragstart="dragStart">
      <StateIcon />
    </div>
    <div title="Transition (Toggle)" class="icon" :class="{active: activeTool == 'transition'}" @click="iconClick('transition')">
      <TransitionIcon />
    </div>
  </div>
</template>

<script>
import StateIcon from './icons/State';
import TransitionIcon from './icons/Transition';
export default {
  components: {
    StateIcon,
    TransitionIcon
  },
  data: () => ({
    activeTool: ''
  }),
  methods: {
    dragStart(e){
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('item', 'state');
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
