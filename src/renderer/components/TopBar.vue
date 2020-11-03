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
    <div @click="clicked('save')" class="icon" :disabled="!diagram">
      <SaveIcon />
    </div>
    <div class="separator"></div>
    <div @click="clicked('undo')" class="icon" :disabled="!diagram">
      <UndoIcon />
    </div>
    <div @click="clicked('redo')" class="icon" :disabled="!diagram">
      <RedoIcon />
    </div>
    <div class="separator"></div>
    <div @click="clicked('setting')" class="icon" :disabled="!diagram">
      <SettingIcon />
    </div>
    <div class="separator"></div>
    <div @click="clicked('generate_code')" class="icon" :disabled="!diagram">
      <PlayIcon />
    </div>
  </div>
</template>

<script>
import { Menu } from '../modules/menu';
import LogoIcon from './icons/Logo';
import NewProjectIcon from './icons/NewProject.vue';
import OpenProjectIcon from './icons/OpenProject.vue';
import SaveIcon from './icons/Save.vue';
import UndoIcon from './icons/Undo.vue';
import RedoIcon from './icons/Redo.vue';
import SettingIcon from './icons/Setting.vue';
import PlayIcon from './icons/Play.vue';
import { mapState } from 'vuex';
export default {
  components: {
    LogoIcon,
    NewProjectIcon,
    OpenProjectIcon,
    SaveIcon,
    UndoIcon,
    RedoIcon,
    SettingIcon,
    PlayIcon
  },
  computed: mapState(['diagram']),
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

  & > div{
    float: left;
  }

  .separator{
    @mar: 5px;
    margin: @mar;
    height: calc(100% - (@mar * 2));
    width: 2px;
    display: inline-block;
    background-color: #2C2D31;
    border-radius: 4px;
  }

  .logo{
    position: relative;
    top: 4px;
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

    &[disabled]{
      pointer-events: none;
      opacity: 0.4;
    }

    &:hover{
      background-color: #fff2;
    }

    svg{
      transform: scale(1.5);
    }
  }
}
</style>
