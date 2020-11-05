<template>
  <div id="app">
    <MainPage />
    <ProjectSettingModal ref="ProjectSettingModal" />
    <DialogComponent />
  </div>
</template>

<script type="ts">
import Vue from "vue";
import MainPage from "@/components/MainPage.vue";
import ProjectSettingModal from "@/components/ProjectSettingModal.vue";
import DialogComponent from './Dialog';
import { Menu } from "../modules/menu";
import { promptFile } from "../helpers/fs";
import { projectsManager } from "../modules/projects-manager";
import { Dialog } from "../dialog";

export default Vue.extend({
  components: {
    MainPage,
    ProjectSettingModal,
    DialogComponent
  },
  methods: {
    async openProject(){
      const canLeave = await projectsManager.canLeaveCurrentProject();
      if(!canLeave) return;
      const filename = await promptFile();
      if(filename){
        try {
          projectsManager.load(filename);
        } catch (error) {
          console.error(error);
          Dialog.error('An error occured when loading the project.');
        }
      }
    },
    async saveProject(){
      try {
        projectsManager.save();
      } catch (error) {
        console.error(error);
        Dialog.error('An error occured when saving the project.');
      }
    },
    async newProject(){
      if(await projectsManager.canLeaveCurrentProject()){
        this.$refs.ProjectSettingModal.open();
      }
    },
    async closeProject(){
      if(await projectsManager.canLeaveCurrentProject()){
        projectsManager.close();
      }
    }
  },
  created(){
    Menu
    .on('new', () => this.newProject())
    .on('setting', () => this.$refs.ProjectSettingModal.open(true)) // passing `true` to set editing mode rather than new project mdoe
    .on('open', () => this.openProject())
    .on('save', () => this.saveProject())
    .on('close', () => this.closeProject())
  }
});
</script>

<style lang="less">
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
