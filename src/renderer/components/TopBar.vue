<template>
  <div class="top-bar pane">
    <div class="logo">
      <LogoIcon />
    </div>
    <div @click="clicked('new')" class="icon">
      <NewProjectIcon />
    </div>
    <div @click="clicked('open')" class="icon">
      <OpenProjectIcon />
    </div>
    <div @click="clicked('save')" class="icon">
      <SaveIcon />
    </div>
  </div>
</template>

<script>
import { Menu } from '../modules/menu';
import LogoIcon from './icons/Logo';
import NewProjectIcon from './icons/NewProject.vue';
import OpenProjectIcon from './icons/OpenProject.vue';
import SaveIcon from './icons/Save.vue';
export default {
  components: {
    LogoIcon,
    NewProjectIcon,
    OpenProjectIcon,
    SaveIcon
  },
  methods: {
    clicked(name){
      Menu.emit(name);
    }
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
