<template>
  <div class="top-bar pane">
    <div class="icon">
      <NewProjectIcon />
    </div>
    <div class="icon">
      <NewProjectIcon />
    </div>
  </div>
</template>

<script>
import NewProjectIcon from './icons/NewProject.vue';
export default {
  components: {
    NewProjectIcon,
  }
}
</script>

<style lang="less" scoped>
@h: 40px;
.top-bar{
  width: 100%;
  height: @h;
  box-sizing: border-box;
  padding: 2px;

  .icon{
    display: inline-block;
    @ih: @h - 4px;
    width: @ih;
    height: @ih;
    box-sizing: border-box;
    padding: 9px;
    border-radius: 4px;
    cursor: pointer;

    &:hover{
      background-color: #fff3;
    }

    svg{
      transform: scale(1.5);
    }
  }
}
</style>
