<template>
  <div class="top-bar pane">
    <div class="logo">
      <LogoIcon />
    </div>
    <div @click="clicked('new')" class="icon" title="Create new project">
      <NewProjectIcon />
    </div>
    <div @click="clicked('open')" class="icon" title="Open a project">
      <OpenProjectIcon />
    </div>
    <div @click="clicked('save')" class="icon" :disabled="projectState.saved" title="Save">
      <SaveIcon />
    </div>
    <div class="separator"></div>
    <div @click="clicked('undo')" class="icon" :disabled="!canUndo" title="Undo">
      <UndoIcon />
    </div>
    <div @click="clicked('redo')" class="icon" :disabled="!canRedo" title="Redo">
      <RedoIcon />
    </div>
    <div class="separator"></div>
    <div @click="clicked('setting')" class="icon" :disabled="!diagram" title="Open project settings">
      <SettingIcon />
    </div>
    <div class="separator"></div>
    <div @click="clicked('generate_code')" class="icon" :disabled="!diagram" title="Generate Code">
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
import { EVENTS } from '../diagram-core';
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
  computed: {
    ...mapState(['diagram', 'projectState']),
    actionsArchiver(){
      return this.diagram && this.diagram.actionsArchiver;
    },
    canUndo(){
      return this.actionsArchiver && this.actionsArchiver.pointer >= 0;
    },
    canRedo(){
      const aa = this.actionsArchiver
      return aa && aa.pointer < aa.stack.length - 1;
    }
  },
  watch: {
    diagram: {
      deep: false,
      handler(){
        this.projectState.saved = true;
        this.diagram && this.diagram.on(EVENTS.DIAGRAM_ZOOM_CHANGED, () => this.projectState.saved = false);
      }
    },
    'actionsArchiver.pointer'(){
      this.diagram && (this.projectState.saved = false);
    },
    canUndo: {
      immediate: true,
      handler(val){
        Menu.setItemEnable('undo', val);
      }
    },
    canRedo: {
      immediate: true,
      handler(val){
        Menu.setItemEnable('redo', val);
      }
    },
    'projectState.saved': {
      immediate: true,
      handler(val){
        Menu.setItemEnable('save', !val);
      }
    }
  },
  methods: {
    clicked(name){
      Menu.emit(name);
    },
  },
  mounted(){
    Menu.on('save', () => this.projectState.saved = true);
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
