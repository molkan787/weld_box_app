<template>
  <div class="side-bar pane">
    <div title="State (Drag & Drop)" class="icon" :class="{active: activeTool == 'state'}" draggable @dragstart="dragStart">
      <svg width="17" height="13" viewBox="0 0 17 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.6" y="0.6" width="15.8" height="11.8" rx="1.4" fill="#C4C4C4" stroke="#808080" stroke-width="1.2"/>
      </svg>
    </div>
    <div title="Transition (Toggle)" class="icon" :class="{active: activeTool == 'transition'}" @click="iconClick('transition')">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.40068 14.0285C3.41644 14.3595 3.69754 14.6151 4.02854 14.5993L9.42243 14.3425C9.75342 14.3267 10.009 14.0456 9.99321 13.7146C9.97745 13.3836 9.69634 13.1281 9.36535 13.1438L4.57078 13.3721L4.34247 8.57757C4.32671 8.24658 4.0456 7.99103 3.71461 8.00679C3.38361 8.02255 3.12807 8.30365 3.14383 8.63465L3.40068 14.0285ZM13.556 2.5964L3.55604 13.5964L4.44396 14.4036L14.444 3.4036L13.556 2.5964Z" fill="#808080"/>
      </svg>

    </div>
  </div>
</template>

<script>
export default {
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
@w: 40px;
.side-bar{
  width: @w;
  height: 100%;
  box-sizing: border-box;
  padding: 2px;

  .icon{
    @iw: @w - 4px;
    width: @iw;
    height: @iw;
    box-sizing: border-box;
    padding: 9px;
    border-radius: 4px;
    cursor: pointer;

    &:hover{
      background-color: #fff3;
    }

    &.active{
      background-color: aquamarine;
    }

    svg{
      transform: scale(1.5);
    }

  }
}
</style>
