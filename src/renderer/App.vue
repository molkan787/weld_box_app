<template>
  <div id="app">
    <MainPage />
    <NewProjectModal ref="newProjectModal" />
  </div>
</template>

<script type="ts">
import Vue from "vue";
import MainPage from "@/components/MainPage.vue";
import NewProjectModal from "@/components/NewProjectModal.vue";
import { Menu } from "./modules/menu";
import { promptFile } from "./helpers/fs";
import { projectsManager } from "./modules/projects-manager";

export default Vue.extend({
  components: {
    MainPage,
    NewProjectModal,
  },
  methods: {
    async openProject(){
      const filename = await promptFile();
      if(filename){
        try {
          projectsManager.load(filename);
        } catch (error) {
          console.error(error);
          alert('An error occured when loading the project.');
        }
      }
    },
    async saveProject(){
      try {
        projectsManager.save();
      } catch (error) {
        console.error(error);
        alert('An error occured when saving the project.');
      }
    },
    closeProject(){
      projectsManager.close();
    }
  },
  created(){
    Menu
    .on('new', () => this.$refs.newProjectModal.open())
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
