<template>
  <div class="top-bar pane">
    <div class="logo">
      <LogoIcon />
    </div>
    <div class="icon">
      <NewProjectIcon />
    </div>
    <div class="icon">
      <OpenProjectIcon />
    </div>
    <button v-if="showBackButton" @click="$emit('back-click')">Back</button>
  </div>
</template>

<script>
import LogoIcon from './icons/Logo';
import NewProjectIcon from './icons/NewProject.vue';
import OpenProjectIcon from './icons/OpenProject.vue';
export default {
  components: {
    LogoIcon,
    NewProjectIcon,
    OpenProjectIcon,
  },
  props: {
    showBackButton: false
  }
}
</script>

<style lang="less" scoped>
@h: 50px;
.top-bar{
  width: 100%;
  height: @h;
  box-sizing: border-box;
  padding: 2px;

  .logo{
    position: relative;
    top: -5px;
    left: 14px;
    margin-right: 14px;
    display: inline-block;
    @ih: @h - 4px;
    width: @ih;
    height: @ih;
    box-sizing: border-box;
    svg{
      transform: scale(1.6);
      transform-origin: 0 0;
    }
  }

  .icon{
    display: inline-block;
    @ih: @h - 4px;
    width: @ih;
    height: @ih;
    box-sizing: border-box;
    padding: 13px;
    border-radius: 50%;
    cursor: pointer;

    &:hover{
      background-color: #fff2;
    }

    svg{
      transform: scale(1.5);
    }
  }
}
</style>
